import { supabase } from './supabase';

/**
 * Fetches all necessary session data for a logged-in user in a single query.
 * This includes the user's profile, their tenant, and their active subscription details.
 *
 * @param {string} userId - The ID of the authenticated user.
 * @returns {Promise<Object|null>} An object containing user, tenant, and subscription data, or null if not found.
 */
export const getUserSessionData = async (userId) => {
  if (!userId) return null;

  try {
    // This query fetches the user's profile and, through a series of joins,
    // also retrieves their associated tenant and their tenant's active subscription,
    // including the list of features included in the subscription's plan.
    const { data: user, error } = await supabase
      .from('users')
      .select(`
        *,
        tenant:tenants (
          *,
          subscription:subscriptions (
            *,
            plan:plans (
              name,
              features
            )
          )
        )
      `)
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error fetching user session data:', error);
      throw error;
    }

    if (!user) return null;

    // Handle subscription - it can be either an array or a single object
    let activeSubscription = null;

    if (user.tenant?.subscription) {
      if (Array.isArray(user.tenant.subscription)) {
        // If it's an array, find the active one
        activeSubscription = user.tenant.subscription.find(sub => sub.status === 'active' || sub.status === 'trialing');
      } else {
        // If it's a single object, use it directly if it's active
        const sub = user.tenant.subscription;
        if (sub.status === 'active' || sub.status === 'trialing') {
          activeSubscription = sub;
        }
      }
    }

    // Structure the data for easy use in the AuthContext.
    const sessionData = {
      user: {
        id: user.id,
        fullName: user.full_name,
        email: user.email, // Note: email is from auth.users, might need to be passed separately
        role: user.role,
      },
      tenant: {
        id: user.tenant.id,
        name: user.tenant.name,
      },
      subscription: activeSubscription ? {
        status: activeSubscription.status,
        planName: activeSubscription.plan.name,
        features: activeSubscription.plan.features || [], // Ensure features is always an array
      } : null,
    };

    return sessionData;

  } catch (error) {
    console.error('Error in getUserSessionData:', error);
    return null; // Return null to handle gracefully in the UI
  }
};

/**
 * Signs up a new user and creates their tenant by invoking a Supabase Edge Function.
 *
 * @param {string} name - The user's full name.
 * @param {string} email - The user's email address.
 * @param {string} password - The user's chosen password.
 * @param {string} companyName - The name of the user's company (tenant).
 * @returns {Promise<Object>} The result from the edge function.
 */
export const signup = async (name, email, password, companyName) => {
  const { data, error } = await supabase.functions.invoke('signup', {
    body: {
      name,
      email,
      password,
      company_name: companyName,
    },
  });

  if (error) {
    throw new Error(`Signup failed: ${error.message}`);
  }

  // Automatically log the user in after successful signup
  if (data) {
    return login(email, password);
  }

  return data;
};

/**
 * Logs a user in using their email and password.
 *
 * @param {string} email - The user's email.
 * @param {string} password - The user's password.
 * @returns {Promise<Object>} The user session data upon successful login.
 */
export const login = async (email, password) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    throw new Error(`Login failed: ${error.message}`);
  }
  return data;
};

/**
 * Logs a user out by signing them out of Supabase.
 */
export const logout = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) {
    console.error('Error during logout:', error);
    // We don't throw an error here to ensure the logout flow on the client-side completes.
  }
};

/**
 * Fetches the public profile for a given user.
 * Note: For session management, prefer `getUserSessionData` for comprehensive data.
 *
 * @param {string} userId - The ID of the user.
 * @returns {Promise<Object|null>} The user's profile or null.
 */
export const getUserProfile = async (userId) => {
  if (!userId) return null;

  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }
    return data;
  } catch (error) {
    console.error('Error in getUserProfile:', error);
    return null;
  }
};

/**
 * Lists all users associated with the current user's tenant.
 * This depends on RLS being enabled and configured correctly.
 */
export const listUsersInTenant = async () => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, full_name, email, role, created_at'); // Specify fields to avoid over-fetching

    if (error) {
      console.error('Error listing users:', error);
      throw error;
    }
    return data;
  } catch (error) {
    throw new Error('Failed to list users.');
  }
};

/**
 * Alias for listUsersInTenant - used by UserManagement component
 */
export const getUsers = listUsersInTenant;

/**
 * Invites a new user to the tenant by creating them in the auth system
 * and associating them with the current tenant.
 * 
 * @param {string} email - The email of the user to invite
 * @param {string} role - The role to assign to the user ('admin', 'operador', 'auditor')
 * @returns {Promise<Object>} The created user data
 */
export const inviteUser = async (email, role = 'operador') => {
  try {
    // Note: In a real implementation, this would typically:
    // 1. Call a Supabase Edge Function to create the user in auth.users
    // 2. Create the user profile in user_profiles
    // 3. Associate the user with the current tenant in public.users
    // 4. Send an invitation email

    // For now, we'll use the signup function as a placeholder
    // In production, you'd want a separate invite flow
    const { data, error } = await supabase.functions.invoke('invite-user', {
      body: { email, role }
    });

    if (error) {
      console.error('Error inviting user:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error in inviteUser:', error);
    throw new Error('Failed to invite user. Please ensure the Edge Function is deployed.');
  }
};

/**
 * Updates the role of a user in the system.
 * 
 * @param {string} userId - The ID of the user to update
 * @param {string} newRole - The new role to assign ('admin', 'operador', 'auditor')
 * @returns {Promise<Object>} The updated user data
 */
export const updateUserRole = async (userId, newRole) => {
  try {
    // Update in public.users table
    const { data: userData, error: userError } = await supabase
      .from('users')
      .update({ role: newRole === 'administrador' ? 'admin' : 'member' })
      .eq('id', userId)
      .select()
      .single();

    if (userError) {
      console.error('Error updating user role:', userError);
      throw userError;
    }

    // Also update in user_profiles if it exists
    const roleMap = {
      'admin': 'administrador',
      'administrador': 'administrador',
      'operador': 'operador',
      'auditor': 'auditor',
      'member': 'operador'
    };

    const { error: profileError } = await supabase
      .from('user_profiles')
      .update({ user_role: roleMap[newRole] || 'operador' })
      .eq('id', userId);

    if (profileError) {
      console.warn('Error updating user profile role:', profileError);
      // Don't throw here, as the main update succeeded
    }

    return userData;
  } catch (error) {
    console.error('Error in updateUserRole:', error);
    throw new Error('Failed to update user role.');
  }
};
