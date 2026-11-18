/**
 * Server-side Supabase client.
 *
 * Uses SUPABASE_SECRET_KEY, which acts as the database service role and
 * bypasses Row Level Security. Call this only from Express controllers,
 * models, and other backend code.
 *
 * persistSession is off so a user token can never replace the secret key.
 */
require('dotenv').config({ quiet: true });
const { createClient } = require('@supabase/supabase-js');

function requiredEnv(name) {
  const value = (process.env[name] || '').trim();

  if (!value) {
    throw new Error(`Missing ${name}. Add it to the local .env file.`);
  }

  return value;
}

const supabaseUrl = requiredEnv('SUPABASE_URL');
const supabaseSecretKey = requiredEnv('SUPABASE_SECRET_KEY');

const supabase = createClient(supabaseUrl, supabaseSecretKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false
  },
  db: {
    timeout: 8000
  }
});

module.exports = supabase;
