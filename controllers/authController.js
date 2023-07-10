const crypto = require('crypto'); // Express JS built in library
const { promisify } = require('util');
const jwt = require('jsonwebtoken'); // json web token
const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const Email = require('../utils/email');

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
}; // create an token with .sign(payload(id), secret, expired time)

const createSendToken = (user, statusCode, res) => {
  const token = signToken(user.id);

  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    // secure: true, for security reason, send the cookie with HTTPS
    httpOnly: true, // for security reason, the cookie can only be received and sent by browser, not access or modify
  };

  if (process.env.NODE_ENV === 'production') cookieOptions.secure = true; // we are not using HTTPS in development mode, so we set secure to true in production mode

  res.cookie('jwt', token, cookieOptions); // .cookie(cookie name, token(or other data), options)

  user.password = undefined; // remove the password from the output, it does not remove the password from the database as we are not saving here

  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user,
    },
  });
};

exports.signup = catchAsync(async (req, res, next) => {
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
    passwordChangedAt: req.body.passwordChangedAt,
    role: req.body.role,
  }); // .creat() returns a promise. we cannot just do .create(req.body) because it will cause security issues, we only allow users to create an account with this data
  const url = `${req.protocol}://${req.get('host')}/me`;
  await new Email(newUser, url).sendWelcome();

  createSendToken(newUser, 201, res);
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  // 1. Check if email and password
  if (!email || !password) {
    return next(new AppError('Please provide email and password', 400));
  }
  // 2. Check if user exists && password is correct
  const user = await User.findOne({ email }).select('+password'); // because password field is not queriable per the schema setting, we need to use "+" to select

  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError('Incorrect email or password', 401));
  } // 401 - unauthorized

  // 3. If everthing is ok, send token to the user
  createSendToken(user, 200, res);
});

// Only for rendering pages, no errors
exports.IsLoggedIn = async (req, res, next) => {
  if (req.cookies.jwt) {
    try {
      // 1. verify token
      const decoded = await promisify(jwt.verify)(
        req.cookies.jwt,
        process.env.JWT_SECRET
      );

      // 2. check if user still exists
      const currentUser = await User.findById(decoded.id);
      if (!currentUser) {
        return next();
      }

      // 3. Check if user changed password after the token was issued
      if (currentUser.changedPasswordAfter(decoded.iat)) {
        return next();
      }

      // There is a logged in user
      res.locals.user = currentUser; // pass data to pug template by using res.locals...
      return next();
    } catch (err) {
      return next();
    }
  }

  next();
};

exports.logout = (req, res) => {
  res.cookie('jwt', 'loggedout', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });
  res.status(200).json({ status: 'success' });
}; // we logout by sending a cookie with an empty token to replace the current logged in token in the browser and the new empty cookie expires in 10 sec

exports.protect = catchAsync(async (req, res, next) => {
  // 1. Getting token and check if it is there
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }

  if (!token) {
    return next(
      new AppError('You are not logged in! please log in to access', 401)
    );
  }

  // 2. Verication token
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
  // jwt.verify(token, secret, callback) take three parameters and returns payload. we dont want to set step 3 and 4 in the callback as it could end up with callback hell. we can promisify jwt.verify() and takes only two parameters, token and secret then return payload

  // 3. Check if user still exists, user gets deleted after the token was issued
  const currentUser = await User.findById(decoded.id);
  if (!currentUser) {
    return next(
      new AppError('The user belonging to this token does no longer exist', 401)
    );
  }

  // 4. Check if user changed password after the token was issued
  if (currentUser.changedPasswordAfter(decoded.iat)) {
    return next(
      new AppError('User recently changed password! Please log in again.', 401)
    );
  }

  // Grant access to protected route
  req.user = currentUser; // add user's data from database into the request body in case we need it in later middlewares
  res.locals.user = currentUser; // pass data to pug template by using res.locals...
  next();
});

exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    // roles = ['admin','lead-user'] we pass 'admin' and 'lead-user' in tourRoute
    // if role = 'user'
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError('You do not have permission to perform this action', 403)
      );
      // 403 - not forbidden
    }

    next();
  };
}; // we do not want the function to be triggered straight away as .restrictTo() is called in tourRoutes.js. instead, we return a function as a call back

exports.forgotPassword = catchAsync(async (req, res, next) => {
  // 1. Get user based on POSTed email
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(new AppError('There is no user with this email address', 404));
  }

  // 2. Generate the random reset token
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false }); // otherwise validators will prevent us from saving it

  // 3. Send it to user's email
  const resetURL = `${req.protocol}://${req.get(
    'host'
  )}/api/v1/users/resetPassword/${resetToken}`; // req.protocol is HTTP

  const message = `Forgot your password? Submit a PATCH request with your new password and passwordConfirm to ${resetURL}.\nIf you didn't forget your password, please ignore this email!`;

  try {
    await new Email(user, resetURL).sendPasswordReset();

    res.status(200).json({
      status: 'success',
      message: 'Token sent to eamil!',
    });
  } catch (err) {
    // if sending a reset password email fails, we want to reset the token and its expire time in database first before the throw an error to the global error handler, so we use try / catch here and then throw an error.
    user.createPasswordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false }); // use .save() to save the amendment in database

    return next(
      new AppError(
        'There was an error sending the email. Try again later!',
        500
      )
    );
  }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  // 1. Get user based on token
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex'); // encrypted the token in URL we sent out in the reset password email

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  }); // check if the encrypted token from the URL param matches the encrypted token in the database and if still within the expire time

  // 2. If the token has not expired and there is the user, set the new password
  if (!user) {
    return next(new AppError('Token is invalid or has expired', 400));
  }
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.createPasswordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save(); // use .save() to save the amendment in database. .save() also runs all the validators and middlwares, that's why we dont use .update()

  // 3. Update changedPasswordAt property for the user in userModel.js

  // 4. Log the user in, send new JWT to the user
  createSendToken(user, 200, res);
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  // 1. Get the user from the collection
  const user = await User.findById(req.user.id).select('+password');

  // 2. Check if POSTed current password is correct
  if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
    return next(new AppError('Your current password is wrong', 401));
  }

  // 3. If so, update password
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  await user.save();
  // user.findByIdAndUpdate will not work as model validation and pre / post middlewares will not run again

  // 4. Log user in, send JWT
  createSendToken(user, 200, res);
});
