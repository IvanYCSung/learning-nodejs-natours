const crypto = require('crypto');
const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please tell us your name'],
  },
  email: {
    type: String,
    required: [true, 'Please provide your name'],
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, 'Please provide a valid email'],
  },
  photo: {
    type: String,
    default: 'default.jpg',
  },
  role: {
    type: String,
    enum: ['user', 'guide', 'lead-guide', 'admin'],
    default: 'user',
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: 8,
    select: false, // it will not show in output
  },
  passwordConfirm: {
    type: String,
    required: [true, 'Please confirm your password'],
    validate: {
      // this only works on .save() or .create() calls
      validator: function (el) {
        return el === this.password;
      },
      message: 'Passwords are not the same!',
    },
  },
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
  active: {
    type: Boolean,
    default: true,
    select: false,
  },
});

// "this" in middlewares points to the query
// middleware - encrypt password between receving data and saving data
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next(); // check if password is created or updated, we dont want to encrypt encrypted password

  this.password = await bcrypt.hash(this.password, 12); // bcrypt methods returns promises, we need to do async / await, hash the password with cost of 12

  this.passwordConfirm = undefined; // delete passwordConfirm field as we dont need to save passwordConfirm into database, we set this field for checking purpose

  next();
});

// middleware - update password change time
userSchema.pre('save', function (next) {
  if (!this.isModified('password') || this.isNew) return next(); // check if the password is reset and not new user
  this.passwordChangedAt = Date.now() - 1000; // set a new timestamp, -1000ms in case the timestamp created after the new token generated, it happens sometimes but also amending the timestamp could be a small hack
  next();
});

userSchema.pre(/^find/, function (next) {
  // all the queries start with "find"

  this.find({ active: { $ne: false } });
  next();
});

// "this" in instance methods points to the document
// instance method - use .methods to create our own method in schema
userSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword
) {
  return await bcrypt.compare(candidatePassword, userPassword);
}; // bcrypt methods returns promises, we need to do async / await

userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );
    return JWTTimestamp < changedTimestamp; // true means password has been changed and the old token becomes invalid. false means login after password was changed
  }
  return false; // false means password not changed
};

userSchema.methods.createPasswordResetToken = function () {
  // we are creating a token in two versions in order to secure the token in database, hasencrypted token saved in database and non-encrypted token sent to the user. we will compare them when we receive reset password request.

  const resetToken = crypto.randomBytes(32).toString('hex'); // non-encrypted token

  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex'); // encrypted token

  console.log(resetToken, this.passwordResetToken);

  this.passwordResetExpires = Date.now() + 10 * 60 * 1000; // add extra 10 mins on the current time

  return resetToken;
};

const User = mongoose.model('User', userSchema);

module.exports = User;
