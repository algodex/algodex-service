const schemaCheck = require('./with-schema-check');

const nameToSchema = {};

module.exports = (schemaName, obj) => {
  let schema;
  if (schemaName in nameToSchema) {
    schema = nameToSchema[schemaName];
  } else {
    const schemaReq = require(`./db/${schemaName}`);
    schema = typeof schemaReq === 'function' ? schemaReq() : schemaReq.schema;
    nameToSchema[schemaName] = schema;
  }
  schemaCheck(schema, obj);
  return obj;
};
