// src/controllers/auth.controller.js
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const config = require('../config');
const EmpleadoModel = require('../models/empleado.model');

class AuthController {
  /**
   * Iniciar sesión
   * @param {Request} req - Objeto de solicitud Express
   * @param {Response} res - Objeto de respuesta Express
   */
  static async login(req, res) {
    try {
      const { email, password } = req.body;
      
      // Validar que se proporcionaron email y password
      if (!email || !password) {
        return res.status(400).json({ 
          error: true, 
          message: 'Email y contraseña son obligatorios' 
        });
      }
      
      // Buscar empleado por email
      const empleado = await EmpleadoModel.getByEmail(email);
      if (!empleado) {
        return res.status(401).json({ 
          error: true, 
          message: 'Credenciales inválidas' 
        });
      }
      
      // Verificar si el empleado está activo
      if (!empleado.activo) {
        return res.status(401).json({ 
          error: true, 
          message: 'Usuario inactivo' 
        });
      }
      
      // Verificar contraseña
      const passwordMatch = await bcrypt.compare(password, empleado.password);
      if (!passwordMatch) {
        return res.status(401).json({ 
          error: true, 
          message: 'Credenciales inválidas' 
        });
      }
      
      // Generar token JWT
      const token = jwt.sign(
        { 
          id: empleado.id, 
          rol_id: empleado.rol_id,
          nombre: empleado.nombre,
          apellido: empleado.apellido,
          email: empleado.email
        },
        config.jwt.secret,
        { expiresIn: config.jwt.expiresIn }
      );
      
      // Retornar datos y token
      res.json({
        error: false,
        message: 'Inicio de sesión exitoso',
        data: {
          token,
          usuario: {
            id: empleado.id,
            nombre: empleado.nombre,
            apellido: empleado.apellido,
            email: empleado.email,
            rol_id: empleado.rol_id
          }
        }
      });
    } catch (error) {
      console.error('Error en login:', error);
      res.status(500).json({ 
        error: true, 
        message: 'Error al iniciar sesión' 
      });
    }
  }
}

module.exports = AuthController;
