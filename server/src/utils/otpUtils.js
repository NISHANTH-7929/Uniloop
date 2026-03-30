import bcrypt from "bcryptjs";

/**
 * Generates a random 4-digit OTP.
 * @returns {string} 4-digit OTP
 */
export const generateOTP = () => {
  return Math.floor(1000 + Math.random() * 9000).toString();
};

/**
 * Hashes an OTP string using bcrypt.
 * @param {string} otp 
 * @returns {Promise<string>} hashed OTP
 */
export const hashOTP = async (otp) => {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(otp, salt);
};

/**
 * Compares a plain OTP with a hashed OTP.
 * @param {string} otp 
 * @param {string} hashedOTP 
 * @returns {Promise<boolean>} true if match
 */
export const verifyOTP = async (otp, hashedOTP) => {
  return await bcrypt.compare(otp, hashedOTP);
};
