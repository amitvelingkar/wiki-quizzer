const mongoose = require('mongoose');
const Schema = mongoose.Schema;
mongoose.Promise = global.Promise;

const md5 = require('md5');
const validator = require('validator');
const mongodbErrorHandler = require('mongoose-mongodb-errors');
const passportLocalMongoose = require('passport-local-mongoose');

const UserSchema = new Schema({
    email: {
        type: String,
        unique: true,
        lowercase: true,
        trim: true,
        validate: [validator.isEmail, 'Invalid Email address'],
        required: 'Please supply an email address'
    },
    name: {
        type: String,
        trim: true,
        required: 'Please supply a name'
    },
    resetPasswordToken: {
        type: String
    },
    resetPasswordExpires: {
        type: Date
    },
    hearts: {
        type: [
            {
                type: mongoose.Schema.ObjectId,
                ref: 'Store'
            }
        ]
    }

});

UserSchema.virtual('gravatar').get(function() {
    const hash = md5(this.email);
    return `https://gravatar.com/avatar/${hash}?s=200`;
})

UserSchema.plugin(passportLocalMongoose, {usernameField: 'email'});
UserSchema.plugin(mongodbErrorHandler);

module.exports = mongoose.model('User', UserSchema);
