// ------------------- IMPORTS ------------------------
const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');
const sendEmail = require('../utils/sendEmail');

// ------------------- TOKEN ------------------------
// Crear JSON WEB TOKEN ( Son tipo Bearer Token )
const signToken = function (id) {
  // jwt.sign( payload, secret, options )
  return jwt.sign({ id: id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

// Enviar JSON WEB TOKEN
const createSendToken = (user, statusCode, res) => {
  // Se crea un JSON Web Token para hacer el login del usuario
  const token = signToken(user._id);
  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
  };
  if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;

  // Envio del JWT en una HttpOnlyCookie
  res.cookie('jwt', token, cookieOptions);

  // Remove password from the output
  user.password = undefined;

  res.status(statusCode).json({
    status: 'success',
    token: token,
    data: {
      user: user,
    },
  });
};

// ------------------- FUNCIONES AUTH ------------------------
// Registar nueva cuenta
exports.signup = catchAsync(async (req, res, next) => {
  // Pasamos un objeto a create() para registar unicamente los datos que requerimos
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    role: 'user', // Protección
    passwordConfirm: req.body.passwordConfirm,
    passwordChangedAt: req.body.passwordChangedAt,
  });

  // Enviamos un token como respuesta y los datos del nuevo usuario
  createSendToken(newUser, 201, res);
});

// Log-in for existing users
exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  // Check if email and password are in req.body
  if (!email || !password) {
    // return terminates function, next with params is always an Error
    return next(new AppError('please provide email and password', 400));
  }

  // Check if user exsist && password is correct
  const user = await User.findOne({ email: email }).select('+password'); // select() agrega al query los campos que tienen 'select: false' como opción

  // verifyPassword() es un método de las instancias User, regresa true o false
  if (!user || !(await user.verifyPassword(password, user.password)))
    return next(new AppError('incorrect email or password', 401));

  // If everything ok, send token to client
  createSendToken(user, 200, res);
});

// Show routes for logged in users
exports.protect = catchAsync(async (req, res, next) => {
  // Get user token, check if exist
  let token;

  // La convención es enviar los JWT en un header llamado 'authorization' con un valor 'Bearer <token>'
  // Asi que primero revisaos si está el header en el request
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  // En caso de no estar el token dentro de los headers, hay error
  if (!token) {
    return next(
      new AppError('You are not logged in! Please log in to get access', 401)
    );
  }

  // con jwt.verify() decodificamos el payload del token, promisify convierte el código syncrono en una promesa
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  // If token is valid, check if user still exists
  const currentUser = await User.findOne({ _id: decoded.id });
  if (!currentUser) next(new AppError('The user not longer exists', 401));

  // Check if user changed password after the token was issued
  // Es un método de las instancias de User, regresa true o false
  if (currentUser.changedPasswordAfter(decoded.iat))
    return next(new AppError('Please log in again', 401));

  // Guardamos el currentUser en la variable req para usar en el próximo middleware
  req.user = currentUser;
  next();
});

// Para poder usar el array de usuarios que pasa tourRoutes envolvemos la función middelware en otra función que los acepta mediante destructuración (...roles) === ['admin','user']
exports.restrictTo = function (...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role))
      return next(
        new AppError('You dont have permission to perform that action', 403)
      );
    next();
  };
};

// Generates and sends reset links to email
exports.forgotPassword = catchAsync(async (req, res, next) => {
  // Get user based on Posted Email
  const user = await User.findOne({ email: req.body.email });
  if (!user)
    return next(new AppError('There is no user with that email address', 404));

  // Generate the random reset token
  const resetToken = user.createPasswordResetToken();

  // Hace que el token encriptado y su expiración persistan en la base de datos
  await user.save({
    validateBeforeSave: false,
  });

  // Send it to the user's email
  const resetURL = `${req.protocol}://${req.get(
    'host'
  )}/api/users/resetPassword/${resetToken}}`;

  const message = `Forgot your password? submit a PATCH request with your new password and passwordConfirm to ${resetURL} .\nIf you didn't forget your password, please ignore this email `;

  try {
    await sendEmail({
      email: user.email,
      subject: 'Your password reset link valid for 10 minutes',
      message,
    });

    res.status(200).json({
      status: 'success',
      message: `Token sent to email ${user.email}`,
    });
  } catch (error) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({
      validateBeforeSave: false,
    });
    console.log(error);
    return next(
      new AppError(
        'There was an error sending the email. Try again later.',
        500
      )
    );
  }
});

// Validates url reset links and resets password
exports.resetPassword = catchAsync(async (req, res, next) => {
  // Get user based on the token
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  if (!user) return next(new AppError('We are sorry, invalid token', 400));

  // If token is valid and has not expired
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  // passwordChangedAt runs in pre 'save' middleware (models/userModel.js)
  await user.save();

  // Log the user in (send JWT to client)
  createSendToken(user, 200, res);
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  // Get user from the collection
  // select() agrega al query los campos que tienen 'select: false' como opción
  const user = await User.findById(req.user._id).select('+password');

  // Check if posted password is ok
  if (!(await user.verifyPassword(req.body.currentPassword, user.password)))
    return next(new AppError('current password is incorrect', 401));

  // If correct, update password
  user.password = req.body.newPassword;
  user.passwordConfirm = req.body.confirmNewPassword;
  await user.save();

  // Log the user in, send JWT
  createSendToken(user, 200, res);
});
