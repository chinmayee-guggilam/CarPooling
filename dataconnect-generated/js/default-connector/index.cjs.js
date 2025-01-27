const { getDataConnect, validateArgs } = require('firebase/data-connect');

const connectorConfig = {
  connector: 'default',
  service: 'carpooling',
  location: 'us-central1'
};
exports.connectorConfig = connectorConfig;

