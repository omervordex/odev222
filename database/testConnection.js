/**
 * Development-only check that the server can reach Supabase.
 * The response never includes URL values or API keys.
 */
const config = require('../config');
const supabase = require('../config/supabase');

function isMissingSchema(error) {
  const code = error.code || '';
  const message = error.message || '';

  return code === 'PGRST205'
    || code === '42P01'
    || /schema cache/i.test(message)
    || /could not find the table/i.test(message);
}

async function testDatabaseConnection() {
  if (config.isProduction) {
    return {
      httpStatus: 404,
      body: {
        status: 'error',
        message: 'The requested page does not exist.'
      }
    };
  }

  const { error } = await supabase.from('categories').select('id').limit(1);

  if (!error) {
    return {
      httpStatus: 200,
      body: {
        status: 'ok',
        message: 'Supabase connection succeeded and the categories table is reachable.'
      }
    };
  }

  if (isMissingSchema(error)) {
    return {
      httpStatus: 200,
      body: {
        status: 'schema_missing',
        message: 'Supabase accepted the server credentials. Run database/schema.sql in the Supabase SQL Editor, then test again.'
      }
    };
  }

  console.error(`Supabase connection test failed (code: ${error.code || 'none'}).`);

  return {
    httpStatus: 503,
    body: {
      status: 'error',
      message: 'Supabase connection failed. Check the server environment variables and try again.'
    }
  };
}

async function runFromCommandLine() {
  try {
    const result = await testDatabaseConnection();
    console.log(result.body.status);
    console.log(result.body.message);
    process.exitCode = result.body.status === 'error' ? 1 : 0;
  } catch {
    console.error('Supabase connection test could not run.');
    process.exitCode = 1;
  }
}

if (require.main === module) {
  runFromCommandLine();
}

module.exports = testDatabaseConnection;
