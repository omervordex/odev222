const serverless = require('serverless-http');
const app = require('../../app');

const handler = serverless(app, {
  binary: [
    'image/*',
    'font/*',
    'application/octet-stream',
    'multipart/form-data'
  ]
});

function normalizeEvent(event) {
  const normalized = { ...event, headers: { ...(event.headers || {}) } };

  if (normalized.rawUrl) {
    try {
      const url = new URL(normalized.rawUrl);
      normalized.path = url.pathname;

      if (!normalized.queryStringParameters) {
        const query = {};
        url.searchParams.forEach((value, key) => {
          query[key] = value;
        });
        normalized.queryStringParameters = query;
      }
    } catch {
      // Keep the original path when rawUrl cannot be parsed.
    }
  }

  if (!normalized.httpMethod && normalized.requestContext && normalized.requestContext.http) {
    normalized.httpMethod = normalized.requestContext.http.method;
  }

  const sourceIp = normalized.headers['x-forwarded-for']
    || (normalized.requestContext && normalized.requestContext.http && normalized.requestContext.http.sourceIp)
    || '127.0.0.1';

  const ip = String(sourceIp).split(',')[0].trim() || '127.0.0.1';
  normalized.requestContext = {
    ...(normalized.requestContext || {}),
    identity: {
      ...((normalized.requestContext && normalized.requestContext.identity) || {}),
      sourceIp: (normalized.requestContext && normalized.requestContext.identity && normalized.requestContext.identity.sourceIp) || ip
    }
  };

  if (normalized.version === '2.0') {
    const http = normalized.requestContext.http || {};
    normalized.requestContext.http = {
      ...http,
      method: http.method || normalized.httpMethod || 'GET',
      sourceIp: http.sourceIp || ip
    };
  }

  if (!normalized.multiValueHeaders) {
    normalized.multiValueHeaders = {};
  }

  if (normalized.body == null) {
    normalized.body = '';
  }

  return normalized;
}

async function netlifyHandler(event, context) {
  if (context) {
    context.callbackWaitsForEmptyEventLoop = false;
  }

  return handler(normalizeEvent(event || {}), context);
}

module.exports.handler = netlifyHandler;
