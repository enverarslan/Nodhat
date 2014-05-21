var mongoose = require('mongoose'),
    config = require('../config/config')(),
    Schemas = require('../config/db/schemas.js');

mongoose.connect(config.connectionString());

module.exports = {
    User: Schemas.User,
    Message: Schemas.Message
};