// Con este script podemos hacer importaciones de datos desde un csv

// ------------------- IMPORTS ------------------------
const mongoose = require('mongoose'); // ODM para mongodb
const fs = require('fs'); // Interactuar con el filesystem
const dotenv = require('dotenv'); // Para variavles env
const chalk = require('chalk'); // colores en la terminal

// Modelos
const Sample = require('../models/sampleModel');

// Archivo CSV
const csv = fs.readFileSync(`${__dirname}/samples.csv`).toString();
console.log(csv);
const delimiter = ',';

// ------------------- Carga de ENV --------------------------------
dotenv.config({ path: './config.env' }); // Iniciamos las variables env para nuestra conexión con la BD

// ------------------- CONEXIÓN A BASE DE DATOS --------------------------------
// uri para base de datos
const database = process.env.DB.replace('<PASSWORD>', process.env.DB_PASSWORD);

// Usamos mongoose para establecer la conexión
mongoose
  .connect(database, {
    // Opciones
    dbName: 'development',
    retryWrites: true,
    w: 'majority',
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  // La conexión entrega una promesa
  .then(() => {
    console.log(
      chalk.green(`Conexión existosa a la BD ${process.env.NODE_ENV}`)
    );
  })
  // En caso de no cumplirse la promesa atrapamos el error
  .catch((error) => {
    console.log(chalk.red('DB connection failed!'));
    console.log(error);
  });

// ------------------- Crear objetos desde el CSV --------------------------------
// https://sebhastian.com/javascript-csv-to-array/
const csvToArray = function (str, delimiter) {
  // slice from start of text to the first \n index
  // use split to create an array from string by delimiter
  // const headers = str.slice(0, str.indexOf("\n")).split(delimiter);
  const headers = ['texto', 'email', 'enum'];

  // slice from \n index + 1 to the end of the text
  // use split to create an array of each csv value row
  const rows = str.slice(str.indexOf('\n') + 1).split('\n');

  // Map the rows
  // split values from each row into an array
  // use headers.reduce to create an object
  // object properties derived from headers:values
  // the object passed as an element of the array
  const arr = rows.map(function (row) {
    const values = row.split(delimiter);
    const el = headers.reduce(function (object, header, index) {
      object[header] = values[index].trim();
      return object;
    }, {});
    return el;
  });

  // return the array
  return arr;
};

const data = csvToArray(csv, delimiter);
console.log(data);

// Esta función importa los datos
const importData = async () => {
  try {
    await Sample.create(data);
    console.log('Data successfylly loaded!');
    process.exit();
  } catch (error) {
    console.log(error);
  }
};

// Y esta los elimina
const deleteData = async () => {
  try {
    await Sample.deleteMany();
    console.log('Data successfylly deleted!');
    process.exit();
  } catch (error) {
    console.log(error);
  }
};

// La variable process.argv es un array con los argumentos de la línea de comando, así indicamos desde el shell que función activar
if (process.argv[2] === '--import') {
  importData();
} else if (process.argv[2] === '--delete') {
  deleteData();
}

/* ¿Cómo correr el script? 

$ node ./dev-data/import-dev-data.js --delete
$ node ./dev-data/import-dev-data.js --import

*/
