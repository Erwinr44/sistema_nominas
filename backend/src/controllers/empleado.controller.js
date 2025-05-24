// src/controllers/empleado.controller.js
const EmpleadoModel = require('../models/empleado.model');

class EmpleadoController {
  /**
   * Obtiene todos los empleados
   * @param {Request} req - Objeto de solicitud Express
   * @param {Response} res - Objeto de respuesta Express
   */
  static async getAll(req, res) {
    try {
      // Por defecto solo obtiene activos, pero puede incluir inactivos si se especifica
      const incluirInactivos = req.query.incluirInactivos === 'true';
      const empleados = await EmpleadoModel.getAll(!incluirInactivos);
      
      // Remover el campo password por seguridad
      const empleadosSinPassword = empleados.map(emp => {
        const { password, ...empleadoSinPassword } = emp;
        return empleadoSinPassword;
      });
      
      res.json({
        error: false,
        data: empleadosSinPassword
      });
    } catch (error) {
      console.error('Error al obtener empleados:', error);
      res.status(500).json({
        error: true,
        message: 'Error al obtener empleados'
      });
    }
  }

  /**
   * Obtiene un empleado por su ID
   * @param {Request} req - Objeto de solicitud Express
   * @param {Response} res - Objeto de respuesta Express
   */
  static async getById(req, res) {
    try {
      const { id } = req.params;
      const empleado = await EmpleadoModel.getById(id);
      
      if (!empleado) {
        return res.status(404).json({
          error: true,
          message: 'Empleado no encontrado'
        });
      }
      
      // Remover el campo password por seguridad
      const { password, ...empleadoSinPassword } = empleado;
      
      res.json({
        error: false,
        data: empleadoSinPassword
      });
    } catch (error) {
      console.error('Error al obtener empleado:', error);
      res.status(500).json({
        error: true,
        message: 'Error al obtener empleado'
      });
    }
  }

  /**
   * Crea un nuevo empleado
   * @param {Request} req - Objeto de solicitud Express
   * @param {Response} res - Objeto de respuesta Express
   */
  static async create(req, res) {
    try {
      const empleadoData = req.body;
      
      // Validaciones básicas
      if (!empleadoData.nombre || !empleadoData.apellido || !empleadoData.email) {
        return res.status(400).json({
          error: true,
          message: 'Los campos nombre, apellido y email son obligatorios'
        });
      }
      
      // Verificar si el email ya existe
      const existeEmail = await EmpleadoModel.getByEmail(empleadoData.email);
      if (existeEmail) {
        return res.status(400).json({
          error: true,
          message: 'El email ya está registrado'
        });
      }
      
      // Agregar el ID del usuario que crea el empleado
      empleadoData.registrado_por = req.usuario ? req.usuario.id : null;
      
      // Si no se proporciona una contraseña, generar una
      if (!empleadoData.password) {
        empleadoData.password = '123456'; // Contraseña por defecto
      }
      
      const idEmpleado = await EmpleadoModel.create(empleadoData);
      
      res.status(201).json({
        error: false,
        message: 'Empleado creado correctamente',
        data: { id: idEmpleado }
      });
    } catch (error) {
      console.error('Error al crear empleado:', error);
      res.status(500).json({
        error: true,
        message: 'Error al crear empleado'
      });
    }
  }

  /**
   * Actualiza un empleado existente
   * @param {Request} req - Objeto de solicitud Express
   * @param {Response} res - Objeto de respuesta Express
   */
  static async update(req, res) {
    try {
      const { id } = req.params;
      const empleadoData = req.body;
      
      // Verificar que el empleado existe
      const empleado = await EmpleadoModel.getById(id);
      if (!empleado) {
        return res.status(404).json({
          error: true,
          message: 'Empleado no encontrado'
        });
      }
      
      // Agregar el ID del usuario que actualiza el empleado
      empleadoData.registrado_por = req.usuario ? req.usuario.id : null;
      
      const actualizado = await EmpleadoModel.update(id, empleadoData);
      
      res.json({
        error: false,
        message: 'Empleado actualizado correctamente',
        data: { actualizado }
      });
    } catch (error) {
      console.error('Error al actualizar empleado:', error);
      res.status(500).json({
        error: true,
        message: 'Error al actualizar empleado'
      });
    }
  }

  /**
   * Actualiza la contraseña de un empleado
   * @param {Request} req - Objeto de solicitud Express
   * @param {Response} res - Objeto de respuesta Express
   */
  static async updatePassword(req, res) {
    try {
      const { id } = req.params;
      const { password } = req.body;
      
      // Validar que se proporcionó una contraseña
      if (!password) {
        return res.status(400).json({
          error: true,
          message: 'La contraseña es obligatoria'
        });
      }
      
      // Verificar que el empleado existe
      const empleado = await EmpleadoModel.getById(id);
      if (!empleado) {
        return res.status(404).json({
          error: true,
          message: 'Empleado no encontrado'
        });
      }
      
      const actualizado = await EmpleadoModel.updatePassword(id, password);
      
      res.json({
        error: false,
        message: 'Contraseña actualizada correctamente',
        data: { actualizado }
      });
    } catch (error) {
      console.error('Error al actualizar contraseña:', error);
      res.status(500).json({
        error: true,
        message: 'Error al actualizar contraseña'
      });
    }
  }

  /**
   * Desactiva un empleado (baja)
   * @param {Request} req - Objeto de solicitud Express
   * @param {Response} res - Objeto de respuesta Express
   */
  static async deactivate(req, res) {
    try {
      const { id } = req.params;
      
      // Verificar que el empleado existe
      const empleado = await EmpleadoModel.getById(id);
      if (!empleado) {
        return res.status(404).json({
          error: true,
          message: 'Empleado no encontrado'
        });
      }
      
      const desactivado = await EmpleadoModel.deactivate(id);
      
      res.json({
        error: false,
        message: 'Empleado desactivado correctamente',
        data: { desactivado }
      });
    } catch (error) {
      console.error('Error al desactivar empleado:', error);
      res.status(500).json({
        error: true,
        message: 'Error al desactivar empleado'
      });
    }
  }

  /**
   * Obtiene el organigrama de la empresa
   * @param {Request} req - Objeto de solicitud Express
   * @param {Response} res - Objeto de respuesta Express
   */
  static async getOrganigrama(req, res) {
    try {
      const organigrama = await EmpleadoModel.getOrganigrama();
      
      res.json({
        error: false,
        data: organigrama
      });
    } catch (error) {
      console.error('Error al obtener organigrama:', error);
      res.status(500).json({
        error: true,
        message: 'Error al obtener organigrama'
      });
    }
  }
// AGREGAR este método al final de tu EmpleadoController (antes del cierre de la clase)

/**
 * Obtiene el historial salarial de un empleado
 * @param {Request} req - Objeto de solicitud Express
 * @param {Response} res - Objeto de respuesta Express
 */
static async getHistorialSalario(req, res) {
  try {
    const { id } = req.params;
    
    // Verificar que el empleado existe
    const empleado = await EmpleadoModel.getById(id);
    if (!empleado) {
      return res.status(404).json({
        error: true,
        message: 'Empleado no encontrado'
      });
    }
    
    const historial = await EmpleadoModel.getHistorialSalario(id);
    
    res.json({
      error: false,
      data: historial
    });
  } catch (error) {
    console.error('Error al obtener historial salarial:', error);
    res.status(500).json({
      error: true,
      message: 'Error al obtener historial salarial'
    });
  }
}
}

module.exports = EmpleadoController;
