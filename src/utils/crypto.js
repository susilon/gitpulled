const crypto = require('crypto');

const ALGORITHM = 'scrypt';
const SALT_LENGTH = 16;
const KEY_LENGTH = 64;

function hashPassword(password) {
  const salt = crypto.randomBytes(SALT_LENGTH).toString('hex');
  const derivedKey = crypto.scryptSync(password, salt, KEY_LENGTH);
  return salt + ':' + derivedKey.toString('hex');
}

function verifyPassword(password, stored) {
  const [salt, hash] = stored.split(':');
  const derivedKey = crypto.scryptSync(password, salt, KEY_LENGTH);
  return derivedKey.toString('hex') === hash;
}

module.exports = { hashPassword, verifyPassword };
