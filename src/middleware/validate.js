const { validationResult } = require('express-validator');
const { ValidationError } = require('../utils/errors');

function validate(validations) {
  return async (req, res, next) => {
    await Promise.all(validations.map(validation => validation.run(req)));
    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }
    const details = errors.array().map(err => ({
      field: err.param || err.path,
      message: err.msg,
    }));
    next(new ValidationError('Invalid input', details));
  };
}

module.exports = { validate };
