import argon2 from "argon2";

/**
 * Hash a password using Argon2id.
 * @param {string} password Plaintext password
 * @returns {Promise<string>} Hash string
 */
export async function hashPassword(password) {
  return argon2.hash(password, {
    type: argon2.argon2id,
    memoryCost: 65536,  // 64 MiB
    timeCost: 3,        // 3 iterations
    parallelism: 4,
  });
}

/**
 * Verify a plaintext password against a stored Argon2id hash.
 * @param {string} hash Stored hash
 * @param {string} password Plaintext password
 * @returns {Promise<boolean>}
 */
export async function verifyPassword(hash, password) {
  try {
    return await argon2.verify(hash, password);
  } catch {
    return false;
  }
}
