
/**
 * Utility functions to handle auth state cleanup and prevent authentication limbo states
 */

/**
 * Thoroughly cleans up all Supabase auth-related items from storage
 * to prevent authentication limbo states
 */
export const cleanupAuthState = () => {
  console.log("Cleaning up auth state...");
  
  // Remove standard auth tokens
  localStorage.removeItem('supabase.auth.token');
  
  // Remove all Supabase auth keys from localStorage
  Object.keys(localStorage).forEach((key) => {
    if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
      console.log(`Removing localStorage item: ${key}`);
      localStorage.removeItem(key);
    }
  });
  
  // Remove from sessionStorage if in use
  try {
    Object.keys(sessionStorage || {}).forEach((key) => {
      if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
        console.log(`Removing sessionStorage item: ${key}`);
        sessionStorage.removeItem(key);
      }
    });
  } catch (error) {
    console.log("Error accessing sessionStorage:", error);
    // Continue even if sessionStorage is not available
  }
};
