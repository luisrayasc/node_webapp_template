// ------------------- IMPORTS ------------------------

const mongoose = require('mongoose'); // Importamos el ODM para mongodb
const validator = require('validator'); // utils para validación

// ------------------- Esquema del Modelo ------------------------
const sampleSchema = new mongoose.Schema({
  texto: {
    type: String,
    required: [true, 'user must have a name'],
  },

  email: {
    type: String,
    required: [true, 'user must have an email'],
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, 'Please provide a valid email'],
  },

  array: {
    type: String,
    enum: ['uno', 'dos', 'tres'],
  },

  booleano: {
    type: Boolean,
    default: true,
    select: false,
  },
});

// ------------------- PRE MIDDLEWARES ------------------------

// ------------------- MÉTODOS DEL MODELO ------------------------

// Modelo User para DB
const Sample = mongoose.model('Sample', sampleSchema);
module.exports = Sample;
