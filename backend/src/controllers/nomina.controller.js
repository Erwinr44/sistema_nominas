const NominaModel = require('../models/nomina.model');
const { generarPDF } = require('../utils/pdf.utils');

class NominaController {

  /**obtener nomina */
  static async getAllNominas(req, res) {
    try {
      const { fechaInicio, fechaFin, tipo, empleadoId, limite } = req.query;
      
      const nominas = await NominaModel.getAllNominas({
        fechaInicio,
        fechaFin,
        tipo,
        empleadoId,
        limite
      });
      
      res.json({
        error: false,
        data: nominas
      });
    } catch (error) {
      console.error('Error al obtener todas las nóminas:', error);
      res.status(500).json({
        error: true,
        message: 'Error al obtener nóminas'
      });
    }
  }

  /**calcular nomina */
  static async calcularNomina(req, res) {
    try {
      const { fechaInicio, fechaFin, tipo } = req.body;
      
      if (!fechaInicio || !fechaFin || !tipo) {
        return res.status(400).json({
          error: true,
          message: 'Los campos fechaInicio, fechaFin y tipo son obligatorios'
        });
      }
      
      if (!['quincenal', 'semanal', 'mensual'].includes(tipo)) {
        return res.status(400).json({
          error: true,
          message: 'El tipo de nómina debe ser: quincenal, semanal o mensual'
        });
      }
      
      let resultado;
      
      switch (tipo) {
        case 'quincenal':
          resultado = await NominaModel.calcularNominaQuincenal(fechaInicio, fechaFin, req.usuario.id);
          break;
        case 'semanal':
          resultado = await NominaModel.calcularNominaSemanal(fechaInicio, fechaFin, req.usuario.id);
          break;
        case 'mensual':
          resultado = await NominaModel.calcularNominaMensual(fechaInicio, fechaFin, req.usuario.id);
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
  

  static async getNominasByEmpleado(req, res) {
    try {
      const { id } = req.params;
      const { fechaInicio, fechaFin, tipo, limite } = req.query;
      
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
  
  /**nómina pagada*/
  static async marcarComoPagada(req, res) {
    try {
      const { id } = req.params;
      
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
  

  static async getNominasByPeriodo(req, res) {
    try {
      const { fechaInicio, fechaFin, tipo } = req.query;
      
      if (!fechaInicio || !fechaFin) {
        return res.status(400).json({
          error: true,
          message: 'Los parámetros fechaInicio y fechaFin son obligatorios'
        });
      }
      
      const nominas = await NominaModel.getNominasByPeriodo(fechaInicio, fechaFin, tipo);
      
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
  
  /*** PDF */
  static async generarReciboPDF(req, res) {
    try {
      const { id } = req.params;
      
      console.log('=== DEBUG RECIBO PDF ===');
      console.log('1. ID de nómina:', id);
      console.log('2. Usuario:', req.usuario?.id, 'Rol:', req.usuario?.rol_id);
      
      const nomina = await NominaModel.getNominaById(id);
      if (!nomina) {
        console.log('3. ERROR: Nómina no encontrada');
        return res.status(404).json({
          error: true,
          message: 'Nómina no encontrada'
        });
      }
      
      console.log('3. Nómina encontrada:', {
        id: nomina.id,
        empleado_id: nomina.empleado_id,
        estado: nomina.estado,
        tipo: nomina.tipo,
        empleado: `${nomina.nombre} ${nomina.apellido}`
      });
      
      // Validar permisos
      if (req.usuario.rol_id === 3 && req.usuario.id != nomina.empleado_id) {
        console.log('4. ERROR: Sin permisos');
        return res.status(403).json({
          error: true,
          message: 'No tienes permiso para acceder a esta información'
        });
      }
      
      console.log('4. Permisos validados correctamente');
      
      // Obtener datos
      console.log('5. Obteniendo datos completos...');
      const nominaCompleta = await NominaModel.getNominaConDatos(id);
      
      if (!nominaCompleta) {
        console.log('6. ERROR: No se pudieron obtener datos completos');
        return res.status(500).json({
          error: true,
          message: 'Error al obtener datos completos de la nómina'
        });
      }
      
      console.log('6. Datos completos obtenidos:', {
        tieneNombre: !!nominaCompleta.nombre,
        tieneApellido: !!nominaCompleta.apellido,
        tieneSalario: !!nominaCompleta.salario_base,
        tieneTotal: !!nominaCompleta.total_neto,
        fechaInicio: nominaCompleta.fecha_inicio,
        fechaFin: nominaCompleta.fecha_fin,
        tipo: nominaCompleta.tipo
      });
      
      console.log('7. Generando PDF...');
      
      // Generar PDF
      const pdfBuffer = await generarPDF(nominaCompleta);
      
      console.log('8. PDF generado exitosamente, tamaño:', pdfBuffer.length, 'bytes');
      
      // Enviar PDF
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=recibo-nomina-${id}.pdf`);
      res.setHeader('Content-Length', pdfBuffer.length);
      
      res.send(pdfBuffer);
      
      console.log('9. PDF enviado al cliente');
      console.log('=== FIN DEBUG RECIBO PDF ===');
      
    } catch (error) {
      console.error('=== ERROR EN RECIBO PDF ===');
      console.error('Error completo:', error);
      console.error('Stack trace:', error.stack);
      console.error('Mensaje:', error.message);
      console.error('=== FIN ERROR RECIBO PDF ===');
      
      if (res.headersSent) {
        return res.end();
      }
      
      res.status(500).json({
        error: true,
        message: 'Error al generar recibo PDF',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
}

module.exports = NominaController;