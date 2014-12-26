var mongoose = require('mongoose'),
    config = require('../config/host'),
    Schemas = require('../config/db/schemas.js');

mongoose.connect(config.connectionString());

module.exports = {
    Mongoose: mongoose,
    User: Schemas.User,
    Message: Schemas.Message
};