// Router para el modelo Sample

// ------------------- IMPORTS ------------------------

// necesitamos express para crear el objeto router
const express = require('express');

//Importamos los controladores que serán la función callback de cada ruta
const {
  createOneSample,
  getAllSamples,
  getSample,
  updateSample,
  deleteSample,
} = require('../controllers/sampleController');

const router = express.Router();

router.get('/', getAllSamples);
router.post('/createOne', createOneSample);
// prettier-ignore
router.route('/:id')
    .get(getSample)
    .patch(updateSample)
    .delete(deleteSample);

// exportarmos el router
module.exports = router;
