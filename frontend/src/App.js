import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import { AuthProvider } from './contexts/AuthContext';

// AGREGADO: Importaciones para ToastContainer
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Componentes
import Login from './components/auth/Login';
import Layout from './components/common/Layout';
import ProtectedRoute from './components/common/ProtectedRoute';
// Páginas
import Dashboard from './pages/Dashboard';
import Empleados from './pages/Empleados';
import MiNomina from './pages/MiNomina';
import Nominas from './pages/Nominas';
import Solicitudes from './pages/Solicitudes';
import MisSolicitudes from './pages/MisSolicitudes';
import Liquidaciones from './pages/Liquidaciones';
import Organigrama from './pages/Organigrama';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <Router>
          <Routes>
            {/* Ruta de login */}
            <Route path="/login" element={<Login />} />
            {/* Rutas protegidas con layout */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Dashboard />
                  </Layout>
                </ProtectedRoute>
              }
            />
            {/* Rutas para empleados */}
            <Route
              path="/mi-nomina"
              element={
                <ProtectedRoute>
                  <Layout>
                    <MiNomina />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/mis-solicitudes"
              element={
                <ProtectedRoute>
                  <Layout>
                    <MisSolicitudes />
                  </Layout>
                </ProtectedRoute>
              }
            />
            {/* Rutas para administradores */}
            <Route
              path="/empleados"
              element={
                <ProtectedRoute requireAdmin={true}>
                  <Layout>
                    <Empleados />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/nominas"
              element={
                <ProtectedRoute requireAdmin={true}>
                  <Layout>
                    <Nominas />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/solicitudes"
              element={
                <ProtectedRoute requireAdmin={true}>
                  <Layout>
                    <Solicitudes />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/liquidaciones"
              element={
                <ProtectedRoute requireAdmin={true}>
                  <Layout>
                    <Liquidaciones />
                  </Layout>
                </ProtectedRoute>
              }
            />
            {/* Rutas accesibles para todos */}
            <Route
              path="/organigrama"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Organigrama />
                  </Layout>
                </ProtectedRoute>
              }
            />
            {/* Redirecciones */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </Router>

        {/* AGREGADO: ToastContainer para las notificaciones de PDF */}
        <ToastContainer 
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="light"
        />
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;