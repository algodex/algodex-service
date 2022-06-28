const schemaCheck = require('./with-schema-check');

const nameToSchema = {};

module.exports = (schemaName, obj) => {
  let schema;
  if (schemaName in nameToSchema) {
    schema = nameToSchema[schemaName];
  } else {
    schema = require(`./db/${schemaName}`)();
    nameToSchema[schemaName] = schema;
  }
  schemaCheck(schema, obj);
  return obj;
};
