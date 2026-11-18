/**
 * Application configuration.
 * Secrets are not stored here. The Supabase secret key is read only by
 * config/supabase.js. The publishable key stays in this server config for a
 * future public client and must not be rendered in HTML, EJS, or JSON.
 */
require('dotenv').config({ quiet: true });

const config = {
  port: Number(process.env.PORT) || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  isProduction: process.env.NODE_ENV === 'production',
  supabaseUrl: process.env.SUPABASE_URL || '',
  supabasePublishableKey: process.env.SUPABASE_PUBLISHABLE_KEY || '',
  sessionSecret: process.env.SESSION_SECRET || ''
};

module.exports = config;
