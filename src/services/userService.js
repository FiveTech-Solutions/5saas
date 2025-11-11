import { supabase } from './supabase';

/**
 * Service for User Management, interacting with Supabase Edge Functions.
 */

/**
 * Fetches all users with their profiles by calling the 'list-users' function.
 * @returns {Promise<Array>} A list of users.
 */
export const getUsers = async () => {
  const { data, error } = await supabase.functions.invoke('list-users');

  if (error) {
    console.error('Error fetching users:', error);
    throw error;
  }

  return data;
};

/**
 * Invites a new user by email with a specific role.
 * @param {string} email The email of the user to invite.
 * @param {string} role The role to assign to the new user.
 * @returns {Promise<object>} The result of the invitation.
 */
export const inviteUser = async (email, role) => {
  const { data, error } = await supabase.functions.invoke('invite-user', {
    body: { email, role },
  });

  if (error) {
    console.error('Error inviting user:', error);
    throw error;
  }

  return data;
};

/**
 * Updates the role of a specific user.
 * @param {string} userId The ID of the user to update.
 * @param {string} role The new role to assign.
 * @returns {Promise<object>} The updated profile data.
 */
export const updateUserRole = async (userId, role) => {
  const { data, error } = await supabase.functions.invoke('update-user-role', {
    body: { userId, role },
  });

  if (error) {
    console.error('Error updating user role:', error);
    throw error;
  }

  return data;
};
