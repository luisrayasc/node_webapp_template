// server.js inicia el servidor de nuestra app, agregamos un script a package.json para iniciarlo con el comando 'nmp start'

// ------------------- IMPORTS ------------------------

const mongoose = require('mongoose'); // ODM para MongoDB
const dotenv = require('dotenv'); // Para cargar las variables env de config.evn
const chalk = require('chalk'); // colores en la terminal

const app = require('./app'); // Nuestra app

// CARGA DE VARIABLES ENV -----------------------------------
dotenv.config({ path: './config.env' }); // Definimos path de config.env

// ------------------- LOGS DE ERRORES -----------------------------

// Errores en procesos síncronos
process.on('uncaughtException', (error) => {
  console.log(
    chalk.red(
      `WE HAVE AN ERROR\nError name: ${error.name}, \nError Message: ${error.message}`
    )
  );
  console.log(error);
  process.exit(1);
});

// Errores asíncornos
process.on('unhandledRejection', (error) => {
  console.log(
    chalk.red(
      `WE HAVE AN ERROR\nError name: ${error.name}, \nError Message: ${error.message}`
    )
  );
  server.close(() => {
    process.exit(1);
  });
});

// ------------------- APAGAR EN SIGTERM -----------------------------
process.on('SIGTERM', () => {
  console.log('SIGTERM RECIVED, shutting down');
  server.close(() => {
    console.log('Process terminated');
  });
});

// ------------------- BASE DE DATOS -----------------------------------

// uri para base de datos
const database = process.env.DB.replace('<PASSWORD>', process.env.DB_PASSWORD);

// Usamos mongoose para establecer la conexión
mongoose
  .connect(database, {
    // Mensajes para notas de depreciación
    dbName: process.env.NODE_ENV,
    retryWrites: true,
    w: 'majority',
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  // La conexión entrega una promesa
  .then(() => {
    console.log(chalk.green('DB connection successful'));
  })
  // En caso de no cumplirse la promesa atrapamos el error
  .catch((error) => {
    console.log(chalk.red('DB connection failed!'));
    console.log(error);
  });

// ----------------- INCIAR SERVIDOR ------------------------------

const port = process.env.PORT || 3000;

const server = app.listen(port, () => {
  console.log(`Backend running on port ${port}`);
});
