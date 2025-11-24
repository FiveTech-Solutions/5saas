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

    // The query for subscriptions returns an array, so we find the active one.
    // In our schema, a tenant has only one subscription, so we can simplify this.
    const activeSubscription = user.tenant.subscription.find(sub => sub.status === 'active' || sub.status === 'trialing');

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
            .select('id, full_name, email, role'); // Specify fields to avoid over-fetching

        if (error) {
            console.error('Error listing users:', error);
            throw error;
        }
        return data;
    } catch (error) {
        throw new Error('Failed to list users.');
    }
};
