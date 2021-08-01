const User = require('../models/userModel'); // Objeto que contiene todos los documentos de clase user
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const factory = require('./handlerFactory'); // Controllers genéricos

// Función para filtrar campos permitidos para modificar
const filterFields = (reqBody, ...allowedFields) => {
    const filteredBody = {};
    Object.keys(reqBody).forEach((field) => {
        if (allowedFields.includes(field)) filteredBody[field] = reqBody[field];
    });
    return filteredBody;
};

// Obtener todos los usuarios
exports.getAllUsers = factory.getMany(User);

// Obtener información del usuario actual
exports.getMe = (req, res, next) => {
    // Pasamos el id del usuario actual a req.params.id
    req.params.id = req.user._id;
    next();
};

// Función para actualizar información de la cuenta
exports.updateMe = catchAsync(async (req, res, next) => {
    // Create error if user POSTs password data
    if (req.body.password || req.body.passwordConfirm)
        return next(new AppError('This route is not for password update', 400));

    // Update user document
    const filteredBody = filterFields(req.body, 'name', 'email');

    // Use findByIdAndUpdate for non-sensitive data
    const updatedUser = await User.findByIdAndUpdate(
        req.user._id,
        filteredBody,
        {
            new: true,
            runValidators: true,
        }
    );

    res.status(200).json({
        status: 'succes',
        data: { user: updatedUser },
    });
});

exports.getUser = factory.getOne(User);

exports.updateUser = factory.updateOne(User); // Do not change passwords with this one!

exports.deleteUser = factory.deleteOne(User);

exports.deleteMe = catchAsync(async (req, res, next) => {
    await User.findByIdAndUpdate(req.user._id, { active: false });
    res.status(204).json({
        status: 'success',
        data: null,
    });
});

exports.createUser = (request, response) => {
    response.status(500).json({
        status: 'error',
        message: 'not implemented and never will be, please use signup',
    });
};
