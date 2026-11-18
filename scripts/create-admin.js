/**
 * One-time administrator setup.
 * Reads ADMIN_EMAIL and ADMIN_PASSWORD from the environment.
 * Does not run when the web server starts, and does not replace an existing admin.
 */
require('dotenv').config({ quiet: true });
const bcrypt = require('bcryptjs');
const adminModel = require('../models/adminModel');

const EMAIL_PATTERN = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

async function main() {
  const email = (process.env.ADMIN_EMAIL || '').trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD || '';

  if (!email || !password) {
    console.error('Set ADMIN_EMAIL and ADMIN_PASSWORD in the environment, then run this script again.');
    process.exitCode = 1;
    return;
  }

  if (!EMAIL_PATTERN.test(email) || email.length > 254) {
    console.error('ADMIN_EMAIL must be a valid email address.');
    process.exitCode = 1;
    return;
  }

  if (password.length < 12 || password.length > 200) {
    console.error('ADMIN_PASSWORD must be 12 to 200 characters.');
    process.exitCode = 1;
    return;
  }

  const existing = await adminModel.countAdmins();
  if (existing > 0) {
    console.error('An administrator already exists. This script does not overwrite it.');
    process.exitCode = 1;
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);
  await adminModel.create({ email, passwordHash });
  console.log('Administrator account created.');
}

main().catch(() => {
  console.error('The administrator account could not be created.');
  process.exitCode = 1;
});
