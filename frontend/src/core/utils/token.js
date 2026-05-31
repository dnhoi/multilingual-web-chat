/**
 * Token Service
 * Abstracts the storage of authentication tokens.
 * Currently uses localStorage, but structured to easily swap to HttpOnly cookies
 * once the Backend API Gateway is configured to issue and accept cookies.
 */

const TOKEN_KEY = 'authToken';

const tokenService = {
  /**
   * Retrieves the current authentication token.
   * @returns {string|null} The token if it exists.
   */
  getToken: () => {
    return localStorage.getItem(TOKEN_KEY);
  },

  /**
   * Saves the authentication token.
   * @param {string} token 
   */
  setToken: (token) => {
    localStorage.setItem(TOKEN_KEY, token);
  },

  /**
   * Removes the authentication token (e.g. on logout).
   */
  removeToken: () => {
    localStorage.removeItem(TOKEN_KEY);
  }
};

export default tokenService;
