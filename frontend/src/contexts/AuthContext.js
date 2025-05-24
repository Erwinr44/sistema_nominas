import React, { createContext, useContext, useState, useEffect } from 'react';
import AuthService from '../services/auth.service';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Verificar si hay una sesión activa al cargar la aplicación
    const currentUser = AuthService.getCurrentUser();
    const token = localStorage.getItem('token');
    
    if (currentUser && token) {
      setUser(currentUser);
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      const { usuario } = await AuthService.login(email, password);
      setUser(usuario);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const logout = () => {
    AuthService.logout();
    setUser(null);
  };

  const isAuthenticated = () => {
    return !!user && AuthService.isAuthenticated();
  };

  // 🔧 MÉTODOS CORREGIDOS - Trabajando directamente con el usuario del contexto
  const isAdmin = () => {
    return user && (user.rol_id === 2 || user.rol_id === 1); // Admin o SuperAdmin
  };

  const isSuperAdmin = () => {
    return user && user.rol_id === 1; // Solo SuperAdmin
  };

  // 🆕 MÉTODOS ADICIONALES ÚTILES
  const isEmployee = () => {
    return user && user.rol_id === 3; // Solo Empleado
  };

  const getUserRole = () => {
    if (!user) return null;
    
    const roles = {
      1: 'Superadministrador',
      2: 'Administrador', 
      3: 'Empleado'
    };
    
    return roles[user.rol_id] || 'Desconocido';
  };

  const canEditEmployees = () => {
    return isAdmin() || isSuperAdmin();
  };

  const canDeleteEmployees = () => {
    return isSuperAdmin(); // Solo superadmin puede eliminar
  };

  // 🐛 MÉTODO DE DEBUG
  const debugUser = () => {
    console.log('🔍 Debug User:', {
      user,
      isAuthenticated: isAuthenticated(),
      isAdmin: isAdmin(),
      isSuperAdmin: isSuperAdmin(),
      rol_id: user?.rol_id,
      role: getUserRole()
    });
  };

  const value = {
    user,
    login,
    logout,
    isAuthenticated,
    isAdmin,
    isSuperAdmin,
    isEmployee,
    getUserRole,
    canEditEmployees,
    canDeleteEmployees,
    debugUser, // 🐛 Para debugging
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};