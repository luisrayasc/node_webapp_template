// ------------------- IMPORTS ------------------------

const mongoose = require('mongoose'); // Importamos el ODM para mongodb
const validator = require('validator'); // utils para validación

// ------------------- Esquema del Modelo ------------------------
const sampleSchema = new mongoose.Schema({
  texto: {
    type: String,
    required: [true, 'field is required'],
  },

  email: {
    type: String,
    required: [true, 'email is required'],
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, 'provide a valid email'],
  },

  enum: {
    type: String,
    enum: ['uno', 'dos', 'tres'],
  },
});

// ------------------- PRE MIDDLEWARES ------------------------

// ------------------- MÉTODOS DEL MODELO ------------------------

// Modelo User para DB
const Sample = mongoose.model('Sample', sampleSchema);
module.exports = Sample;
