const bcrypt = require('bcrypt');

async function validateAdminPass(inputPass) {
  const storedHash = process.env.ADMIN_PASS;
  if (!inputPass || !storedHash) return false;
  try {
    return await bcrypt.compare(inputPass, storedHash);
  } catch {
    return false;
  }
}

module.exports = { validateAdminPass };