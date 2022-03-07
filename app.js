// Configuración global de la APP

// ------------------- IMPORTS ------------------------
const express = require('express'); // Framework para backend
const morgan = require('morgan'); // Logger middleware
const chalk = require('chalk'); // colores en la terminal

// Manejo de Errores
const AppError = require('./utils/AppError'); // Clase que extiende la variable global 'Error'
const errorController = require('./controllers/errorController'); // Controlador de errores

// Routers
const sampleRouter = require('./routes/sampleRoutes');
const userRouter = require('./routes/userRoutes');

// ------------------- Creamos la app -------------------
const app = express();

// ------------------- app.use -------------------------

// Usar morgan logger cuando estamos en dev
if (process.env.NODE_ENV === 'development') {
  console.log(chalk.blue('--- DEVELOPMENT MODE ---'));
  app.use(morgan('dev')); // NODE_ENV viene de config.env
}

// Parseamos el body de cada request a json para estructurarlo en req.body
// Los Headers del request deben incluir Content-Type: aplication/json
app.use(
  express.json({
    limit: '10kb',
  })
);

// ------------------- Asignación de rutas -------------------
app.use('/api/v1/sample', sampleRouter);
app.use('/users', userRouter);
// Route handlers for undefined paths ( los middleware se ejecutan en orden! )
app.all('*', (req, res, next) => {
  next(new AppError(`Can't find path ${req.originalUrl}`, 404));
});

// ------------------- Errores -------------------
app.use(errorController);

module.exports = app;
