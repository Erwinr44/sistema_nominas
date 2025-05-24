// src/services/auth.service.js
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const config = require('../config');

class AuthService {
  /**
   * Genera un hash para una contraseña
   * @param {string} password - Contraseña en texto plano
   * @returns {Promise<string>} - Hash de la contraseña
   */
  static async hashPassword(password) {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(password, salt);
  }

  /**
   * Verifica si una contraseña coincide con su hash
   * @param {string} password - Contraseña en texto plano
   * @param {string} hash - Hash almacenado
   * @returns {Promise<boolean>} - True si la contraseña coincide
   */
  static async verifyPassword(password, hash) {
    return bcrypt.compare(password, hash);
  }

  /**
   * Genera un token JWT
   * @param {Object} payload - Datos a incluir en el token
   * @returns {string} - Token JWT
   */
  static generateToken(payload) {
    return jwt.sign(payload, config.jwt.secret, {
      expiresIn: config.jwt.expiresIn
    });
  }

  /**
   * Verifica un token JWT
   * @param {string} token - Token a verificar
   * @returns {Object} - Datos decodificados del token
   */
  static verifyToken(token) {
    return jwt.verify(token, config.jwt.secret);
  }
}

module.exports = AuthService;
