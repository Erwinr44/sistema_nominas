// src/controllers/nomina.controller.js
const NominaModel = require('../models/nomina.model');
const { generarPDF } = require('../utils/pdf.utils'); // Implementaremos esto después

class NominaController {
  /**
   * Calcula la nómina para el período indicado según el tipo
   * @param {Request} req - Objeto de solicitud Express
   * @param {Response} res - Objeto de respuesta Express
   */
  static async calcularNomina(req, res) {
    try {
      const { fechaInicio, fechaFin, tipo } = req.body;
      
      // Validar parámetros
      if (!fechaInicio || !fechaFin || !tipo) {
        return res.status(400).json({
          error: true,
          message: 'Los campos fechaInicio, fechaFin y tipo son obligatorios'
        });
      }
      
      // Validar tipo de nómina
      if (!['quincenal', 'semanal', 'mensual'].includes(tipo)) {
        return res.status(400).json({
          error: true,
          message: 'El tipo de nómina debe ser: quincenal, semanal o mensual'
        });
      }
      
      let resultado;
      
      // Calcular según el tipo
      switch (tipo) {
        case 'quincenal':
          resultado = await NominaModel.calcularNominaQuincenal(
            fechaInicio, 
            fechaFin, 
            req.usuario.id
          );
          break;
        case 'semanal':
          resultado = await NominaModel.calcularNominaSemanal(
            fechaInicio, 
            fechaFin, 
            req.usuario.id
          );
          break;
        case 'mensual':
          resultado = await NominaModel.calcularNominaMensual(
            fechaInicio, 
            fechaFin, 
            req.usuario.id
          );
          break;
      }
      
      res.json({
        error: false,
        message: `Nómina ${tipo} calculada correctamente`,
        data: {
          cantidad: resultado.length,
          periodo: { fechaInicio, fechaFin },
          nominas: resultado
        }
      });
    } catch (error) {
      console.error('Error al calcular nómina:', error);
      res.status(500).json({
        error: true,
        message: error.message || 'Error al calcular nómina'
      });
    }
  }
  
  /**
   * Obtiene las nóminas de un empleado
   * @param {Request} req - Objeto de solicitud Express
   * @param {Response} res - Objeto de respuesta Express
   */
  static async getNominasByEmpleado(req, res) {
    try {
      const { id } = req.params;
      const { fechaInicio, fechaFin, tipo, limite } = req.query;
      
      // Validar que el usuario tiene permiso para ver esta información
      // Un administrador puede ver cualquier nómina, pero un empleado solo las suyas
      if (req.usuario.rol_id === 3 && req.usuario.id != id) {
        return res.status(403).json({
          error: true,
          message: 'No tienes permiso para acceder a esta información'
        });
      }
      
      const nominas = await NominaModel.getNominasByEmpleado(id, {
        fechaInicio,
        fechaFin,
        tipo,
        limite
      });
      
      res.json({
        error: false,
        data: nominas
      });
    } catch (error) {
      console.error('Error al obtener nóminas del empleado:', error);
      res.status(500).json({
        error: true,
        message: 'Error al obtener nóminas'
      });
    }
  }
  
  /**
   * Obtiene una nómina específica por su ID
   * @param {Request} req - Objeto de solicitud Express
   * @param {Response} res - Objeto de respuesta Express
   */
  static async getNominaById(req, res) {
    try {
      const { id } = req.params;
      
      const nomina = await NominaModel.getNominaById(id);
      
      if (!nomina) {
        return res.status(404).json({
          error: true,
          message: 'Nómina no encontrada'
        });
      }
      
      // Validar que el usuario tiene permiso para ver esta información
      if (req.usuario.rol_id === 3 && req.usuario.id != nomina.empleado_id) {
        return res.status(403).json({
          error: true,
          message: 'No tienes permiso para acceder a esta información'
        });
      }
      
      res.json({
        error: false,
        data: nomina
      });
    } catch (error) {
      console.error('Error al obtener nómina por ID:', error);
      res.status(500).json({
        error: true,
        message: 'Error al obtener nómina'
      });
    }
  }
  
  /**
   * Marca una nómina como pagada
   * @param {Request} req - Objeto de solicitud Express
   * @param {Response} res - Objeto de respuesta Express
   */
  static async marcarComoPagada(req, res) {
    try {
      const { id } = req.params;
      
      // Verificar que la nómina existe
      const nomina = await NominaModel.getNominaById(id);
      if (!nomina) {
        return res.status(404).json({
          error: true,
          message: 'Nómina no encontrada'
        });
      }
      
      const actualizado = await NominaModel.marcarComoPagada(id);
      
      res.json({
        error: false,
        message: 'Nómina marcada como pagada',
        data: { actualizado }
      });
    } catch (error) {
      console.error('Error al marcar nómina como pagada:', error);
      res.status(500).json({
        error: true,
        message: 'Error al marcar nómina'
      });
    }
  }
  
  /**
   * Obtiene las nóminas de un período específico
   * @param {Request} req - Objeto de solicitud Express
   * @param {Response} res - Objeto de respuesta Express
   */
  static async getNominasByPeriodo(req, res) {
    try {
      const { fechaInicio, fechaFin, tipo } = req.query;
      
      // Validar parámetros
      if (!fechaInicio || !fechaFin) {
        return res.status(400).json({
          error: true,
          message: 'Los parámetros fechaInicio y fechaFin son obligatorios'
        });
      }
      
      const nominas = await NominaModel.getNominasByPeriodo(
        fechaInicio,
        fechaFin,
        tipo
      );
      
      res.json({
        error: false,
        data: {
          cantidad: nominas.length,
          periodo: { fechaInicio, fechaFin, tipo },
          nominas
        }
      });
    } catch (error) {
      console.error('Error al obtener nóminas por período:', error);
      res.status(500).json({
        error: true,
        message: 'Error al obtener nóminas'
      });
    }
  }
  
  /**
   * Obtiene los períodos de nómina sugeridos (actuales y siguientes)
   * @param {Request} req - Objeto de solicitud Express
   * @param {Response} res - Objeto de respuesta Express
   */
  static async getPeriodosSugeridos(req, res) {
    try {
      const periodos = await NominaModel.getPeriodosSugeridos();
      
      res.json({
        error: false,
        data: periodos
      });
    } catch (error) {
      console.error('Error al obtener períodos sugeridos:', error);
      res.status(500).json({
        error: true,
        message: 'Error al obtener períodos'
      });
    }
  }
  
  /**
   * Genera un PDF con el recibo de nómina
   * @param {Request} req - Objeto de solicitud Express
   * @param {Response} res - Objeto de respuesta Express
   */
  static async generarReciboPDF(req, res) {
    try {
      const { id } = req.params;
      
      // Verificar que la nómina existe
      const nomina = await NominaModel.getNominaById(id);
      if (!nomina) {
        return res.status(404).json({
          error: true,
          message: 'Nómina no encontrada'
        });
      }
      
      // Validar que el usuario tiene permiso para ver esta información
      if (req.usuario.rol_id === 3 && req.usuario.id != nomina.empleado_id) {
        return res.status(403).json({
          error: true,
          message: 'No tienes permiso para acceder a esta información'
        });
      }
      
      // Generar PDF (implementaremos esta función después)
      const pdfBuffer = await generarPDF(nomina);
      
      // Enviar PDF como respuesta
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=recibo-${nomina.id}.pdf`);
      res.send(pdfBuffer);
    } catch (error) {
      console.error('Error al generar recibo PDF:', error);
      res.status(500).json({
        error: true,
        message: 'Error al generar recibo'
      });
    }
  }
}

module.exports = NominaController;
