import api from './api';

class AuthService {
  /**
   * Iniciar sesión
   * @param {string} email - Email del usuario
   * @param {string} password - Contraseña del usuario
   * @returns {Promise<Object>} - Datos del usuario y token
   */
  static async login(email, password) {
    try {
      const response = await api.post('/auth/login', { email, password });
      
      if (response.data && !response.data.error) {
        const { token, usuario } = response.data.data;
        
        // Guardar en localStorage
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(usuario));
        
        return { token, usuario };
      }
      
      throw new Error(response.data.message || 'Error en el login');
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Error de conexión');
    }
  }

  /**
   * Cerrar sesión
   */
  static logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }

  /**
   * Obtener usuario actual desde localStorage
   * @returns {Object|null} - Datos del usuario actual
   */
  static getCurrentUser() {
    try {
      const user = localStorage.getItem('user');
      return user ? JSON.parse(user) : null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Verificar si el usuario está autenticado
   * @returns {boolean} - True si está autenticado
   */
  static isAuthenticated() {
    const token = localStorage.getItem('token');
    const user = this.getCurrentUser();
    return !!(token && user);
  }

  /**
   * Verificar si el usuario es administrador
   * @returns {boolean} - True si es admin o superadmin
   */
  static isAdmin() {
    const user = this.getCurrentUser();
    return user && (user.rol_id === 1 || user.rol_id === 2);
  }

  /**
   * Verificar si el usuario es superadministrador
   * @returns {boolean} - True si es superadmin
   */
  static isSuperAdmin() {
    const user = this.getCurrentUser();
    return user && user.rol_id === 1;
  }
}

export default AuthService;
