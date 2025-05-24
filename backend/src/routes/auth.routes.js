// src/routes/auth.routes.js
const express = require('express');
const AuthController = require('../controllers/auth.controller');
const router = express.Router();

// Ruta de login
router.post('/login', AuthController.login);

module.exports = router;
