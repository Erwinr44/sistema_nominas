// src/controllers/solicitud.controller.js
const SolicitudModel = require('../models/solicitud.model');

class SolicitudController {
  /**
   * Obtiene todas las solicitudes (filtradas para administradores o solo propias para empleados)
   * @param {Request} req - Objeto de solicitud Express
   * @param {Response} res - Objeto de respuesta Express
   */
  static async getAll(req, res) {
    try {
      let filtros = req.query;
      
      // Si el usuario no es admin, solo puede ver sus propias solicitudes
      if (req.usuario.rol_id === 3) {
        filtros.empleadoId = req.usuario.id;
      }
      
      const solicitudes = await SolicitudModel.getAll(filtros);
      
      res.json({
        error: false,
        data: solicitudes
      });
    } catch (error) {
      console.error('Error al obtener solicitudes:', error);
      res.status(500).json({
        error: true,
        message: 'Error al obtener solicitudes'
      });
    }
  }
  
  /**
   * Obtiene una solicitud específica por ID
   * @param {Request} req - Objeto de solicitud Express
   * @param {Response} res - Objeto de respuesta Express
   */
  static async getById(req, res) {
    try {
      const { id } = req.params;
      
      const solicitud = await SolicitudModel.getById(id);
      
      if (!solicitud) {
        return res.status(404).json({
          error: true,
          message: 'Solicitud no encontrada'
        });
      }
      
      // Verificar que el usuario tiene permiso para ver esta solicitud
      if (req.usuario.rol_id === 3 && req.usuario.id != solicitud.empleado_id) {
        return res.status(403).json({
          error: true,
          message: 'No tienes permiso para acceder a esta solicitud'
        });
      }
      
      res.json({
        error: false,
        data: solicitud
      });
    } catch (error) {
      console.error('Error al obtener solicitud:', error);
      res.status(500).json({
        error: true,
        message: 'Error al obtener solicitud'
      });
    }
  }
  
  /**
   * Crea una nueva solicitud
   * @param {Request} req - Objeto de solicitud Express
   * @param {Response} res - Objeto de respuesta Express
   */
  static async create(req, res) {
    try {
      const solicitudData = req.body;
      
      // Validaciones básicas
      if (!solicitudData.tipo || !['vacaciones', 'horas_extra'].includes(solicitudData.tipo)) {
        return res.status(400).json({
          error: true,
          message: 'El tipo de solicitud debe ser: vacaciones o horas_extra'
        });
      }
      
      if (!solicitudData.fecha_inicio) {
        return res.status(400).json({
          error: true,
          message: 'La fecha de inicio es obligatoria'
        });
      }
      
      // Establecer el empleado_id del usuario actual si no es administrador
      if (req.usuario.rol_id === 3) {
        solicitudData.empleado_id = req.usuario.id;
      } else if (!solicitudData.empleado_id) {
        // Si es admin, debe especificar el empleado_id
        return res.status(400).json({
          error: true,
          message: 'Debe especificar el ID del empleado'
        });
      }
      
      // Validaciones específicas para vacaciones
      if (solicitudData.tipo === 'vacaciones') {
        // Verificar que la fecha de fin es posterior a la fecha de inicio
        if (!solicitudData.fecha_fin) {
          return res.status(400).json({
            error: true,
            message: 'La fecha de fin es obligatoria para solicitudes de vacaciones'
          });
        }
        
        if (new Date(solicitudData.fecha_fin) < new Date(solicitudData.fecha_inicio)) {
          return res.status(400).json({
            error: true,
            message: 'La fecha de fin debe ser posterior a la fecha de inicio'
          });
        }
        
        // Verificar que el empleado tiene vacaciones disponibles
        const vacacionesDisponibles = await SolicitudModel.verificarVacacionesDisponibles(
          solicitudData.empleado_id
        );
        
        if (vacacionesDisponibles.dias_pendientes <= 0) {
          return res.status(400).json({
            error: true,
            message: 'No tienes días de vacaciones disponibles'
          });
        }
        
        // Verificar que no hay solapamiento con otras vacaciones
        const haySolapamiento = await SolicitudModel.verificarSolapamiento(
          solicitudData.empleado_id,
          solicitudData.fecha_inicio,
          solicitudData.fecha_fin
        );
        
        if (haySolapamiento) {
          return res.status(400).json({
            error: true,
            message: 'Las fechas solicitadas se solapan con otras vacaciones ya aprobadas o pendientes'
          });
        }
      }
      
      // Validaciones específicas para horas extra
      if (solicitudData.tipo === 'horas_extra') {
        if (!solicitudData.horas || solicitudData.horas <= 0) {
          return res.status(400).json({
            error: true,
            message: 'La cantidad de horas extra debe ser mayor a 0'
          });
        }
        
        // Establecer fecha_fin igual a fecha_inicio si no se proporciona
        if (!solicitudData.fecha_fin) {
          solicitudData.fecha_fin = solicitudData.fecha_inicio;
        }
      }
      
      // Crear la solicitud
      const idSolicitud = await SolicitudModel.create(solicitudData);
      
      res.status(201).json({
        error: false,
        message: `Solicitud de ${solicitudData.tipo} creada correctamente`,
        data: { id: idSolicitud }
      });
    } catch (error) {
      console.error('Error al crear solicitud:', error);
      res.status(500).json({
        error: true,
        message: error.message || 'Error al crear solicitud'
      });
    }
  }
  
  /**
   * Aprueba una solicitud
   * @param {Request} req - Objeto de solicitud Express
   * @param {Response} res - Objeto de respuesta Express
   */
  static async aprobar(req, res) {
    try {
      const { id } = req.params;
      const { comentario } = req.body;
      
      // Verificar que la solicitud existe
      const solicitud = await SolicitudModel.getById(id);
      if (!solicitud) {
        return res.status(404).json({
          error: true,
          message: 'Solicitud no encontrada'
        });
      }
      
      // Verificar que la solicitud está en estado pendiente
      if (solicitud.estado !== 'pendiente') {
        return res.status(400).json({
          error: true,
          message: `La solicitud ya ha sido ${solicitud.estado}`
        });
      }
      
      // Aprobar la solicitud
      const actualizado = await SolicitudModel.updateEstado(
        id, 
        'aprobada', 
        req.usuario.id, 
        comentario
      );
      
      res.json({
        error: false,
        message: 'Solicitud aprobada correctamente',
        data: { actualizado }
      });
    } catch (error) {
      console.error('Error al aprobar solicitud:', error);
      res.status(500).json({
        error: true,
        message: error.message || 'Error al aprobar solicitud'
      });
    }
  }
  
  /**
   * Rechaza una solicitud
   * @param {Request} req - Objeto de solicitud Express
   * @param {Response} res - Objeto de respuesta Express
   */
  static async rechazar(req, res) {
    try {
      const { id } = req.params;
      const { comentario } = req.body;
      
      // Verificar que la solicitud existe
      const solicitud = await SolicitudModel.getById(id);
      if (!solicitud) {
        return res.status(404).json({
          error: true,
          message: 'Solicitud no encontrada'
        });
      }
      
      // Verificar que la solicitud está en estado pendiente
      if (solicitud.estado !== 'pendiente') {
        return res.status(400).json({
          error: true,
          message: `La solicitud ya ha sido ${solicitud.estado}`
        });
      }
      
      // Rechazar la solicitud
      const actualizado = await SolicitudModel.updateEstado(
        id, 
        'rechazada', 
        req.usuario.id, 
        comentario
      );
      
      res.json({
        error: false,
        message: 'Solicitud rechazada correctamente',
        data: { actualizado }
      });
    } catch (error) {
      console.error('Error al rechazar solicitud:', error);
      res.status(500).json({
        error: true,
        message: error.message || 'Error al rechazar solicitud'
      });
    }
  }
  
  /**
   * Elimina una solicitud pendiente
   * @param {Request} req - Objeto de solicitud Express
   * @param {Response} res - Objeto de respuesta Express
   */
  static async delete(req, res) {
    try {
      const { id } = req.params;
      
      // Verificar que la solicitud existe
      const solicitud = await SolicitudModel.getById(id);
      if (!solicitud) {
        return res.status(404).json({
          error: true,
          message: 'Solicitud no encontrada'
        });
      }
      
      // Verificar que la solicitud está en estado pendiente
      if (solicitud.estado !== 'pendiente') {
        return res.status(400).json({
          error: true,
          message: 'Solo se pueden eliminar solicitudes pendientes'
        });
      }
      
      // Verificar que el usuario tiene permiso para eliminar esta solicitud
      if (req.usuario.rol_id === 3 && req.usuario.id != solicitud.empleado_id) {
        return res.status(403).json({
          error: true,
          message: 'No tienes permiso para eliminar esta solicitud'
        });
      }
      
      // Eliminar la solicitud
      const eliminado = await SolicitudModel.delete(id);
      
      res.json({
        error: false,
        message: 'Solicitud eliminada correctamente',
        data: { eliminado }
      });
    } catch (error) {
      console.error('Error al eliminar solicitud:', error);
      res.status(500).json({
        error: true,
        message: 'Error al eliminar solicitud'
      });
    }
  }
  
  /**
   * Obtiene las solicitudes pendientes para aprobación
   * @param {Request} req - Objeto de solicitud Express
   * @param {Response} res - Objeto de respuesta Express
   */
  static async getPendientes(req, res) {
    try {
      const solicitudes = await SolicitudModel.getPendientes();
      
      res.json({
        error: false,
        data: solicitudes
      });
    } catch (error) {
      console.error('Error al obtener solicitudes pendientes:', error);
      res.status(500).json({
        error: true,
        message: 'Error al obtener solicitudes pendientes'
      });
    }
  }
  
  /**
   * Obtiene información sobre las vacaciones disponibles de un empleado
   * @param {Request} req - Objeto de solicitud Express
   * @param {Response} res - Objeto de respuesta Express
   */
  static async getVacacionesDisponibles(req, res) {
    try {
      const { id } = req.params;
      
      // Verificar que el usuario tiene permiso para ver esta información
      if (req.usuario.rol_id === 3 && req.usuario.id != id) {
        return res.status(403).json({
          error: true,
          message: 'No tienes permiso para acceder a esta información'
        });
      }
      
      const vacacionesDisponibles = await SolicitudModel.verificarVacacionesDisponibles(id);
      
      res.json({
        error: false,
        data: vacacionesDisponibles
      });
    } catch (error) {
      console.error('Error al obtener vacaciones disponibles:', error);
      res.status(500).json({
        error: true,
        message: 'Error al obtener vacaciones disponibles'
      });
    }
  }
  
  /**
   * Obtiene las vacaciones tomadas por un empleado
   * @param {Request} req - Objeto de solicitud Express
   * @param {Response} res - Objeto de respuesta Express
   */
  static async getVacacionesTomadas(req, res) {
    try {
      const { id } = req.params;
      
      // Verificar que el usuario tiene permiso para ver esta información
      if (req.usuario.rol_id === 3 && req.usuario.id != id) {
        return res.status(403).json({
          error: true,
          message: 'No tienes permiso para acceder a esta información'
        });
      }
      
      const vacacionesTomadas = await SolicitudModel.getVacacionesTomadas(id);
      
      res.json({
        error: false,
        data: vacacionesTomadas
      });
    } catch (error) {
      console.error('Error al obtener vacaciones tomadas:', error);
      res.status(500).json({
        error: true,
        message: 'Error al obtener vacaciones tomadas'
      });
    }
  }
}

module.exports = SolicitudController;
