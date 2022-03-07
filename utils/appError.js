// Con esta función extendemos el objeto Error para poder manejarlo con errorController y enviar por nuestra API información referente al mismo

// Se aceptan dos parametros
// 1. Un string con el mensajes que describe el error
// 2. Un código de estatus
class AppError extends Error {
  constructor(message, statusCode) {
    super(message); // Llamamos al constructor de la clase padre
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
