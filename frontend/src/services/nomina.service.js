import api from './api';

class NominaService {
  /**Calcular nómina*/
  static async calcular(params) {
    try {
      const response = await api.post('/nominas/calcular', params);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Error al calcular nómina');
    }
  }


  static async getAll(params = {}) {
    try {
      const response = await api.get('/nominas', { params });
      return response.data.data || response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Error al obtener nóminas');
    }
  }

  /**nomina por periodo*/
  static async getByPeriodo(params) {
    try {
      const response = await api.get('/nominas/periodo', { params });
      return response.data.data || response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Error al obtener nóminas del período');
    }
  }

  /** nomina de un empleado */
  static async getByEmpleado(empleadoId, params = {}) {
    try {
      const response = await api.get(`/nominas/empleado/${empleadoId}`, { params });
      return response.data.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Error al obtener nóminas');
    }
  }

  /** Obtener nómina por ID*/
  static async getById(id) {
    try {
      const response = await api.get(`/nominas/${id}`);
      return response.data.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Error al obtener nómina');
    }
  }

  /**períodos sugeridos*/
  static async getPeriodosSugeridos() {
    try {
      const response = await api.get('/nominas/periodos-sugeridos');
      return response.data.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Error al obtener períodos');
    }
  }

  /**METODO PARA PDF*/
  static async descargarReciboPDF(id, empleadoNombre = '', empleadoApellido = '', periodo = '', openInNewTab = false) {
    try {
      const response = await api.get(`/nominas/${id}/pdf`, {
        responseType: 'blob',
        timeout: 30000
      });

      // Verificar que recibimos un blob válido
      if (!response.data || response.data.size === 0) {
        throw new Error('El archivo PDF está vacío');
      }

      // Crear un blob con el tipo correcto
      const blob = new Blob([response.data], { 
        type: 'application/pdf' 
      });

      // Generar nombre de archivo
      const nombreCompleto = empleadoNombre && empleadoApellido 
        ? `${empleadoNombre}_${empleadoApellido}`.replace(/\s+/g, '_')
        : 'empleado';
      
      const periodoLimpio = periodo ? periodo.replace(/\s+/g, '_').replace(/\//g, '-') : 'periodo';
      const filename = `recibo_nomina_${nombreCompleto}_${periodoLimpio}_${id}.pdf`;

      if (openInNewTab) {
        const url = window.URL.createObjectURL(blob);
        const newWindow = window.open(url, '_blank');
        
        if (newWindow) {
          setTimeout(() => {
            window.URL.revokeObjectURL(url);
          }, 1000);
        } else {
          this.downloadBlob(blob, filename);
        }
      } else {
        // Descargar archivo
        this.downloadBlob(blob, filename);
      }

    } catch (error) {
      console.error('Error detallado al descargar recibo PDF:', error);
      if (error.response?.status === 401) {
        console.error('Sesión expirada');
      } else if (error.response?.status === 403) {
        console.error('Sin permisos para descargar');
      } else if (error.response?.status === 404) {
        console.error('Nómina no encontrada');
      } else if (error.response?.status === 500) {
        console.error('Error del servidor al generar PDF');
      } else if (error.code === 'ECONNABORTED') {
        console.error('Timeout al generar PDF');
      } else {
        console.error('Error al descargar PDF:', error.message);
      }

      throw error;
    }
  }


  static downloadBlob(blob, filename) {
    try {
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.style.display = 'none';

 
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error al descargar blob:', error);
    }
  }


  static async abrirReciboPDFEnNuevaPestana(id, empleadoNombre = '', empleadoApellido = '', periodo = '') {
    try {
      return await this.descargarReciboPDF(id, empleadoNombre, empleadoApellido, periodo, true);
    } catch (error) {
      console.error('Error al abrir recibo PDF:', error);
      throw error;
    }
  }

  static async marcarComoPagada(id) {
    try {
      const response = await api.patch(`/nominas/${id}/pagar`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Error al marcar como pagada');
    }
  }
}

export default NominaService;