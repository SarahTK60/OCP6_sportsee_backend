/**
 * Utility functions for handling common response patterns
 */

/**
 * Check if user exists and send error response if not
 * @param {Object} res - Express response object
 * @param {Object} user - User object to check
 * @returns {boolean} - Returns true if user not found (response sent), false if user exists
 */
const handleNoUser = (res, user) => {
  if (!user) {
    res.statusCode = 404;
    return res.json({ message: "User not found" });
  }
  return false; // User exists, continue
};

/**
 * Check if user data exists and send error response if not
 * @param {Object} res - Express response object
 * @param {*} userData - Data to check
 * @returns {boolean} - Returns true if data not found (response sent), false if data exists
 */
const handleNoUserData = (res, userData) => {
  if (!userData) {
    res.statusCode = 404;
    return res.json({ message: "Can not get user data" });
  }
  return false; // Data exists, continue
};

module.exports = {
  handleNoUser,
  handleNoUserData,
};
