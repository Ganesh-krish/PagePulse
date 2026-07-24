const { body } = require('express-validator');
const dns = require('dns');
const { promisify } = require('util');

const lookup = promisify(dns.lookup);

const isPrivateIP = (ip) => {
  const parts = ip.split('.').map(Number);
  if (parts.length !== 4) return false;
  if (parts[0] === 127) return true;
  if (parts[0] === 10) return true;
  if (parts[0] === 192 && parts[1] === 168) return true;
  if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true;
  if (parts[0] === 169 && parts[1] === 254) return true;
  if (parts[0] === 0) return true;
  return false;
};

const auditValidator = [
  body('url')
    .isString().withMessage('URL must be a string')
    .notEmpty().withMessage('URL is required')
    .isURL({ protocols: ['http', 'https'], require_tld: true, reject_private: true })
      .withMessage('Invalid URL format')
    .isLength({ max: 2048 }).withMessage('URL must not exceed 2048 characters')
    .custom(async (value) => {
      try {
        const url = new URL(value);
        const { address } = await lookup(url.hostname);
        if (isPrivateIP(address)) {
          throw new Error('URL must not point to a private or internal address');
        }
      } catch (err) {
        if (err.message.includes('private')) {
          throw err;
        }
        throw new Error('URL hostname could not be resolved');
      }
    }),

  body('options.timeout')
    .optional()
    .isInt({ min: 1000, max: 30000 }).withMessage('Timeout must be between 1000 and 30000 ms'),

  body('options.maxRedirects')
    .optional()
    .isInt({ min: 0, max: 10 }).withMessage('Max redirects must be between 0 and 10'),
];

module.exports = { auditValidator };
