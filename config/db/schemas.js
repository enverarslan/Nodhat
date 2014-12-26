var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var messageSchema = new Schema({
    user: String,
    message: String,
    date: {
        type: Date,
        default: Date.now
    }
});


var userSchema = new Schema({
    name: String,
    lastLogin: {
        type: Date,
        default: Date.now
    }
});


module.exports.Message = mongoose.model('Message', messageSchema);
module.exports.User = mongoose.model('User', userSchema);