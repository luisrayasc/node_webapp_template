// Manejador global de errores (esperados e inesperados)

// ------------------- IMPORTS ------------------------
const AppError = require('../utils/appError');

// ------------------- FUNCIONES PARA MANEJAR EN PROD ------------------------

const handleJWTError = () => new AppError('Invalid token, please log in', 401);

const handleTokenExpired = () => new AppError('Your token has expired', 401);

const handleCastErrorDB = (error) => {
  const message = `Invalid ${error.path}: ${error.value}`;
  return new AppError(message, 400);
};

const handleDuplicateFieldsDB = (error) => {
  const message = `Duplicate field value '${
    error.keyValue.name
  }' in field '${Object.keys(error.keyValue)}'. `;
  return new AppError(message, 400);
};

const handleValidationErrorDB = (error) => {
  const message = `${error.message}`;
  return new AppError(message, 400);
};

// ------------------- Desplegar Errores en Development ------------------
const sendErrorDev = (error, res) => {
  res.status(error.statusCode).json({
    status: error.status,
    error: error,
    message: error.message,
    stack: error.stack,
  });
};

// ------------------- Desplegar Errores en Producción ------------------
const sendErrorProd = (error, res) => {
  // Operational trust to client in prod
  if (error.isOperational) {
    res.status(error.statusCode).json({
      status: error.status,
      message: error.message,
    });
  } // Unexpected programming or unkown error
  else {
    // Log error
    console.error('Error!!!!!!');
    // Send generic message
    res.status(500).json({
      status: 'error',
      message: 'So sad!',
    });
  }
};

// Global error handler
// Al especificar 4 parámetros indicamos a express que esta funcion es un error handler
module.exports = (error, req, res, next) => {
  error.statusCode = error.statusCode || 500;
  error.status = error.status || 'error';
  // Dev/Prod routing
  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(error, res);
    // Production error handling
  } else if (process.env.NODE_ENV === 'production') {
    console.log('We are in prod!');
    let errorProd;

    if (error.name === 'JsonWebTokenError') {
      errorProd = handleJWTError();
    } else if (error.name === 'TokenExpiredError') {
      errorProd = handleTokenExpired();
    } else if (error.name === 'CastError') {
      errorProd = handleCastErrorDB(error);
    } else if (error.code === 11000) {
      errorProd = handleDuplicateFieldsDB(error);
    } else if (error.name === 'ValidationError') {
      errorProd = handleValidationErrorDB(error);
    } else {
      errorProd = error;
    }

    sendErrorProd(errorProd, res);
  }
};
