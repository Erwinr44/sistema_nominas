// src/middlewares/auth.middleware.js
const jwt = require('jsonwebtoken');
const config = require('../config');

/**
 * Middleware para verificar token JWT
 */
const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: true, message: 'No hay token proporcionado' });
  }

  const token = authHeader.split(' ')[1];
  
  try {
    const decoded = jwt.verify(token, config.jwt.secret);
    req.usuario = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: true, message: 'Token inválido o expirado' });
  }
};

/**
 * Middleware para verificar rol de administrador
 */
const isAdmin = (req, res, next) => {
  // Verificar que req.usuario existe (el middleware verifyToken debe ejecutarse antes)
  if (!req.usuario) {
    return res.status(401).json({ error: true, message: 'Usuario no autenticado' });
  }
  
  // Verificar si el usuario es admin (rol_id 2) o superadmin (rol_id 1)
  if (req.usuario.rol_id !== 1 && req.usuario.rol_id !== 2) {
    return res.status(403).json({ error: true, message: 'Acceso denegado. Se requiere rol de administrador' });
  }
  
  next();
};

/**
 * Middleware para verificar rol de superadministrador
 */
const isSuperAdmin = (req, res, next) => {
  // Verificar que req.usuario existe (el middleware verifyToken debe ejecutarse antes)
  if (!req.usuario) {
    return res.status(401).json({ error: true, message: 'Usuario no autenticado' });
  }
  
  // Verificar si el usuario es superadmin (rol_id 1)
  if (req.usuario.rol_id !== 1) {
    return res.status(403).json({ error: true, message: 'Acceso denegado. Se requiere rol de superadministrador' });
  }
  
  next();
};

module.exports = {
  verifyToken,
  isAdmin,
  isSuperAdmin
};
