const Ajv = require("ajv");
const ajv = new Ajv();

// eslint-disable-next-line require-jsdoc
class ValidationError extends Error {
  // eslint-disable-next-line require-jsdoc
  constructor(message) {
    super(message);
    this.name = 'ValidationError';
  }
};

module.exports = (schema, obj) => {
  console.log({schema});
  const valid = ajv.validate(schema, obj);
  if (!valid) {
    const msg = JSON.stringify(obj) +
        ' VALIDATION ERROR: ' + JSON.stringify(ajv.errors);
    console.error(msg);
    throw new ValidationError(msg);
  }

  return valid;
};

