var mongoose = require('mongoose');
var validators = require('mongoose-validators');
var bcrypt = require('bcrypt-nodejs');
var SALT_WORK_FACTOR = 10;
var findOrCreate = require('mongoose-findorcreate');

module.exports = function() {

    var schema = mongoose.Schema({
        username: {
            type: String,
            required: true,
            index: {
                unique: true
            }
        },
        password: {
            type: String,
            required: true,
            validate: [validators.isAlphanumeric({
                message: 'Apenas letras e números'
            })]
        }
    });

    schema.pre('save', function(next) {
        var admin = this;

        // only hash the password if it has been modified (or is new)
        if (!admin.isModified('password')) return next();

        // generate a salt
        bcrypt.genSalt(SALT_WORK_FACTOR, function(err, salt) {
            if (err) return next(err);

            // hash the password using our new salt
            bcrypt.hash(admin.password, salt, null, function(err, hash) {
                if (err) return next(err);

                // override the cleartext password with the hashed one
                admin.password = hash;
                next();
            });
        });
    });

    schema.methods.comparePassword = function(candidatePassword, cb) {

        bcrypt.compare(candidatePassword, this.password, function(err, isMatch) {

            if (err) return cb(err);
            cb(null, isMatch);
        });
    };

    schema.plugin(findOrCreate);

    return mongoose.model('Admin', schema);
};