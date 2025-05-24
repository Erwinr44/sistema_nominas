const LiquidacionModel = require('../models/liquidacion.model');
const { generarPDFLiquidacion } = require('../utils/pdf.utils');

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
    
    console.log('=== DEBUG PDF ===');
    console.log('1. ID de liquidación:', id);
    console.log('2. Usuario:', req.usuario?.id);
    
    // Verificar que la liquidación existe
    const liquidacion = await LiquidacionModel.getById(id);
    if (!liquidacion) {
      console.log('3. ERROR: Liquidación no encontrada');
      return res.status(404).json({
        error: true,
        message: 'Liquidación no encontrada'
      });
    }
    
    console.log('3. Liquidación encontrada:', {
      id: liquidacion.id,
      empleado_id: liquidacion.empleado_id,
      estado: liquidacion.estado
    });
    
    // Obtener resumen de la liquidación
    console.log('4. Obteniendo resumen...');
    const resumen = await LiquidacionModel.getResumenLiquidacion(id);
    
    console.log('5. Resumen obtenido:', {
      tieneEmpleado: !!resumen?.empleado,
      tieneDetalles: !!resumen?.detalles,
      tieneLiquidacion: !!resumen?.liquidacion
    });
    
    // Verificar estructura del resumen
    if (!resumen || !resumen.empleado) {
      console.log('6. ERROR: Estructura de resumen inválida');
      return res.status(500).json({
        error: true,
        message: 'Error en la estructura de datos de liquidación'
      });
    }
    
    console.log('6. Generando PDF...');
    
    // Generar PDF
    const pdfBuffer = await generarPDFLiquidacion(resumen);
    
    console.log('7. PDF generado exitosamente, tamaño:', pdfBuffer.length, 'bytes');
    
    // Enviar PDF como respuesta
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=liquidacion-${id}.pdf`);
    res.setHeader('Content-Length', pdfBuffer.length);
    
    res.send(pdfBuffer);
    
    console.log('8. PDF enviado al cliente');
    console.log('=== FIN DEBUG PDF ===');
    
  } catch (error) {
    console.error('=== ERROR EN PDF ===');
    console.error('Error completo:', error);
    console.error('Stack trace:', error.stack);
    console.error('Mensaje:', error.message);
    console.error('=== FIN ERROR PDF ===');
    
    // Si ya se enviaron headers, no podemos enviar JSON
    if (res.headersSent) {
      return res.end();
    }
    
    res.status(500).json({
      error: true,
      message: 'Error al generar PDF',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}
}

module.exports = LiquidacionController;
