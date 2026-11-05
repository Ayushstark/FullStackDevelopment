/**
 * Strips the password field from a user object before sending to the client.
 */
export function sanitizeUser(user) {
  const obj = user.toObject ? user.toObject() : { ...user };
  delete obj.password;
  return obj;
}
