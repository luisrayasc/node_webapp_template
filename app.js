// app.js contiene la configuración de nuestra app para middleware y rutas

// Iniciamos cargando las librerias necesarias
const express = require('express'); // Framework para aplicaciones
const morgan = require('morgan'); // Logger middleware
const rateLimit = require('express-rate-limit'); // Limit requests, prevents DOS attacks
const helmet = require('helmet'); // Send secure http headers
const mongoSanitize = require('express-mongo-sanitize'); // Prevents NO SQL query injection
const xss = require('xss-clean'); // Protection agains XSS attacks
// const hpp = require('hpp'); // Prevent parameter pollution

// Error handler
const AppError = require('./utils/appError'); // Módulo que modifica la variable global 'error'
const globalErrorHandler = require('./controllers/errorController'); // Controlador de 'error'

// Módulos de rutas
const userRouter = require('./routes/userRoutes'); // Rutas para 'usuarios'

// creamos nuestro objeto app
const app = express();

///////////////////////////
// Global Middleware -> todas las funciones que corren entre el req<=>res
// Set secure HTTP headers
app.use(helmet());

// Usar morgan logger cuando estamos en dev
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev')); // NODE_ENV viene de config.env
}

// Limita la cantidad de requests que pueden venir de una IP
const limiter = rateLimit({
    max: 100,
    windowMs: 60 * 60 * 1000,
    message: 'Too many requests from this IP, please try again in an hour',
});
app.use('/api/', limiter);

// Body parser, reading data from the body into req.body
app.use(
    express.json({
        limit: '10kb',
    })
);

// Data sanitization against NoSQL query injection
app.use(mongoSanitize());

// Data sanitization against XSS
app.use(xss());

// Prevent parameter pollution (like )
// app.use(
//     hpp({
//         whitelist: [
//             'duration',
//             'ratingsQuantity',
//             'average',
//             'maxGroupSize',
//             'difficulty',
//             'price',
//         ],
//     })
// );

// Serving Static files
app.use(express.static(`${__dirname}/public`));

// Custom Middleware -> mediante el método use y se pasan tres parámetros request, response y next (function)
// El middleware se ejecuta en cada req-res cycle y debe estar antes de el route handler para que se ejecute, de lo contrario el ciclo req-res ya habría terminado
app.use((req, res, next) => {
    req.requestTime = new Date().toISOString();
    next();
});

// Route handlers
app.use('/api/users', userRouter);

// Route handlers for undefined paths ( los middleware se ejecutan en orden! )
app.all('*', (req, res, next) => {
    next(new AppError(`Can't find path ${req.originalUrl}`, 404));
});
// Middleware para manejar errores
app.use(globalErrorHandler);

// Exportamos la app para que la consuma server.js
module.exports = app;
