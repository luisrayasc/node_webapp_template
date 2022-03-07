// ------------------- IMPORTS ------------------------
const Sample = require('../models/sampleModel'); // Objeto que contiene todos los documentos de clase user
const factory = require('./handlerFactory'); // Controllers genéricos

// ------------------- Controladores ------------------------

// Genéricos
exports.createOneSample = factory.createOne(Sample);
exports.getAllSamples = factory.getMany(Sample);
exports.getSample = factory.getOne(Sample);
exports.updateSample = factory.updateOne(Sample);
exports.deleteSample = factory.deleteOne(Sample);
