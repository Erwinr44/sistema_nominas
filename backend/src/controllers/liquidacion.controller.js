// src/controllers/liquidacion.controller.js
const LiquidacionModel = require('../models/liquidacion.model');
const { generarPDFLiquidacion } = require('../utils/pdf.utils'); // Implementaremos esto después

class LiquidacionController {
  /**
   * Obtiene todas las liquidaciones
   * @param {Request} req - Objeto de solicitud Express
   * @param {Response} res - Objeto de respuesta Express
   */
  static async getAll(req, res) {
    try {
      const liquidaciones = await LiquidacionModel.getAll(req.query);
      
      res.json({
        error: false,
        data: liquidaciones
      });
    } catch (error) {
      console.error('Error al obtener liquidaciones:', error);
      res.status(500).json({
        error: true,
        message: 'Error al obtener liquidaciones'
      });
    }
  }
  
  /**
   * Obtiene una liquidación específica por ID
   * @param {Request} req - Objeto de solicitud Express
   * @param {Response} res - Objeto de respuesta Express
   */
  static async getById(req, res) {
    try {
      const { id } = req.params;
      
      const liquidacion = await LiquidacionModel.getById(id);
      
      if (!liquidacion) {
        return res.status(404).json({
          error: true,
          message: 'Liquidación no encontrada'
        });
      }
      
      res.json({
        error: false,
        data: liquidacion
      });
    } catch (error) {
      console.error('Error al obtener liquidación:', error);
      res.status(500).json({
        error: true,
        message: 'Error al obtener liquidación'
      });
    }
  }
  
  /**
   * Calcula y crea una liquidación para un empleado
   * @param {Request} req - Objeto de solicitud Express
   * @param {Response} res - Objeto de respuesta Express
   */
  static async calcularLiquidacion(req, res) {
    try {
      const liquidacionData = req.body;
      
      // Validaciones básicas
      if (!liquidacionData.empleado_id) {
        return res.status(400).json({
          error: true,
          message: 'El ID del empleado es obligatorio'
        });
      }
      
      if (!liquidacionData.motivo) {
        return res.status(400).json({
          error: true,
          message: 'El motivo de la liquidación es obligatorio'
        });
      }
      
      // Validar motivo
      if (!['renuncia', 'despido', 'despido_justificado'].includes(liquidacionData.motivo)) {
        return res.status(400).json({
          error: true,
          message: 'Motivo de liquidación inválido. Debe ser: renuncia, despido o despido_justificado'
        });
      }
      
      // Verificar si ya existe una liquidación para este empleado
      const existeLiquidacion = await LiquidacionModel.verificarLiquidacionExistente(
        liquidacionData.empleado_id
      );
      
      if (existeLiquidacion) {
        return res.status(400).json({
          error: true,
          message: 'Ya existe una liquidación para este empleado'
        });
      }
      
      // Agregar el ID del usuario que procesa la liquidación
      liquidacionData.procesado_por = req.usuario.id;
      
      // Calcular la liquidación
      const idLiquidacion = await LiquidacionModel.calcularLiquidacion(liquidacionData);
      
      // Obtener el resumen de la liquidación
      const resumen = await LiquidacionModel.getResumenLiquidacion(idLiquidacion);
      
      res.status(201).json({
        error: false,
        message: 'Liquidación calculada correctamente',
        data: {
          id: idLiquidacion,
          resumen
        }
      });
    } catch (error) {
      console.error('Error al calcular liquidación:', error);
      res.status(500).json({
        error: true,
        message: error.message || 'Error al calcular liquidación'
      });
    }
  }
  
  /**
   * Marca una liquidación como pagada
   * @param {Request} req - Objeto de solicitud Express
   * @param {Response} res - Objeto de respuesta Express
   */
  static async marcarComoPagada(req, res) {
    try {
      const { id } = req.params;
      
      // Verificar que la liquidación existe
      const liquidacion = await LiquidacionModel.getById(id);
      if (!liquidacion) {
        return res.status(404).json({
          error: true,
          message: 'Liquidación no encontrada'
        });
      }
      
      // Verificar que la liquidación no está pagada
      if (liquidacion.estado === 'pagada') {
        return res.status(400).json({
          error: true,
          message: 'La liquidación ya ha sido pagada'
        });
      }
      
      // Marcar como pagada
      const actualizado = await LiquidacionModel.marcarComoPagada(id);
      
      res.json({
        error: false,
        message: 'Liquidación marcada como pagada',
        data: { actualizado }
      });
    } catch (error) {
      console.error('Error al marcar liquidación como pagada:', error);
      res.status(500).json({
        error: true,
        message: 'Error al marcar liquidación'
      });
    }
  }
  
  /**
   * Obtiene un resumen detallado de la liquidación
   * @param {Request} req - Objeto de solicitud Express
   * @param {Response} res - Objeto de respuesta Express
   */
  static async getResumen(req, res) {
    try {
      const { id } = req.params;
      
      const resumen = await LiquidacionModel.getResumenLiquidacion(id);
      
      res.json({
        error: false,
        data: resumen
      });
    } catch (error) {
      console.error('Error al obtener resumen de liquidación:', error);
      res.status(500).json({
        error: true,
        message: error.message || 'Error al obtener resumen'
      });
    }
  }
  
  /**
   * Genera un PDF con el finiquito de liquidación
   * @param {Request} req - Objeto de solicitud Express
   * @param {Response} res - Objeto de respuesta Express
   */
  static async generarFiniquitoPDF(req, res) {
    try {
      const { id } = req.params;
      
      // Obtener resumen de la liquidación
      const resumen = await LiquidacionModel.getResumenLiquidacion(id);
      
      // Generar PDF (implementaremos esta función después)
      const pdfBuffer = await generarPDFLiquidacion(resumen);
      
      // Enviar PDF como respuesta
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=liquidacion-${id}.pdf`);
      res.send(pdfBuffer);
    } catch (error) {
      console.error('Error al generar PDF de liquidación:', error);
      res.status(500).json({
        error: true,
        message: 'Error al generar PDF'
      });
    }
  }
}

module.exports = LiquidacionController;
