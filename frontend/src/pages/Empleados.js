// src/pages/Empleados.js (reemplaza todo el contenido)
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import EmpleadoService from '../services/empleado.service';
import AreaService from '../services/area.service';
import TablaEmpleados from '../components/empleados/TablaEmpleados';
import FormularioEmpleado from '../components/empleados/FormularioEmpleado';
import DetalleEmpleado from '../components/empleados/DetalleEmpleado';
import HistorialSalario from '../components/empleados/HistorialSalario';
import CambiarPassword from '../components/empleados/CambiarPassword';
import FiltrosEmpleados from '../components/empleados/FiltrosEmpleados';
import {
  Box,
  Typography,
  Button,
  Fab,
  Alert,
  CircularProgress,
  Grid,
  Card,
  CardContent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  Add,
  People,
  Business,
  PersonAdd,
  TrendingUp
} from '@mui/icons-material';

const Empleados = () => {
  const { user, isAdmin, isSuperAdmin } = useAuth();
  const [empleados, setEmpleados] = useState([]);
  const [empleadosFiltrados, setEmpleadosFiltrados] = useState([]);
  const [areas, setAreas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Estados para modales
  const [modalFormulario, setModalFormulario] = useState(false);
  const [modalDetalle, setModalDetalle] = useState(false);
  const [modalHistorial, setModalHistorial] = useState(false);
  const [modalPassword, setModalPassword] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  
  // Estados para empleado seleccionado
  const [empleadoSeleccionado, setEmpleadoSeleccionado] = useState(null);
  const [empleadoIdDetalle, setEmpleadoIdDetalle] = useState(null);
  const [empleadoToDeactivate, setEmpleadoToDeactivate] = useState(null);

  // Estados para filtros
  const [filtros, setFiltros] = useState({
    busqueda: '',
    area: '',
    rol: '',
    activo: '',
    fechaInicio: null,
    fechaFin: null
  });

  // Estadísticas
  const [stats, setStats] = useState({
    total: 0,
    activos: 0,
    inactivos: 0,
    superadmins: 0,
    administradores: 0,
    empleadosRegulares: 0,
    sinArea: 0
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [empleados, filtros]);

  useEffect(() => {
    if (empleados.length > 0) {
      calculateStats();
    }
  }, [empleados]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      
      const [empleadosData, areasData] = await Promise.all([
        EmpleadoService.getAll({ incluirInactivos: true }),
        AreaService.getAll()
      ]);
      
      setEmpleados(empleadosData || []);
      setAreas(areasData || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = () => {
    const total = empleados.length;
    const activos = empleados.filter(emp => emp.activo).length;
    const inactivos = total - activos;
    const superadmins = empleados.filter(emp => emp.rol_id === 1).length;
    const administradores = empleados.filter(emp => emp.rol_id === 2).length;
    const empleadosRegulares = empleados.filter(emp => emp.rol_id === 3).length;
    const sinArea = empleados.filter(emp => !emp.area_id).length;

    setStats({
      total,
      activos,
      inactivos,
      superadmins,
      administradores,
      empleadosRegulares,
      sinArea
    });
  };

  const applyFilters = () => {
    let filtered = [...empleados];

    // Filtro por búsqueda
    if (filtros.busqueda) {
      const searchTerm = filtros.busqueda.toLowerCase();
      filtered = filtered.filter(emp => 
        emp.nombre.toLowerCase().includes(searchTerm) ||
        emp.apellido.toLowerCase().includes(searchTerm) ||
        emp.email.toLowerCase().includes(searchTerm) ||
        (emp.numero_empleado && emp.numero_empleado.toString().includes(searchTerm))
      );
    }

    // Filtro por área
    if (filtros.area) {
      filtered = filtered.filter(emp => emp.area_id === parseInt(filtros.area));
    }

    // Filtro por rol
    if (filtros.rol) {
      filtered = filtered.filter(emp => emp.rol_id === parseInt(filtros.rol));
    }

    // Filtro por estado
    if (filtros.activo !== '') {
      const isActive = filtros.activo === 'true';
      filtered = filtered.filter(emp => emp.activo === isActive);
    }

    // Filtro por fecha de contratación
    if (filtros.fechaInicio) {
      filtered = filtered.filter(emp => 
        new Date(emp.fecha_contratacion) >= new Date(filtros.fechaInicio)
      );
    }

    if (filtros.fechaFin) {
      filtered = filtered.filter(emp => 
        new Date(emp.fecha_contratacion) <= new Date(filtros.fechaFin)
      );
    }

    setEmpleadosFiltrados(filtered);
  };

  // Handlers para acciones de la tabla
  const handleViewDetail = (empleado) => {
    setEmpleadoIdDetalle(empleado.id);
    setModalDetalle(true);
  };

  const handleEdit = (empleado) => {
    setEmpleadoSeleccionado(empleado);
    setModalFormulario(true);
  };

  const handleChangePassword = (empleado) => {
    setEmpleadoSeleccionado(empleado);
    setModalPassword(true);
  };

  const handleViewHistory = (empleado) => {
    setEmpleadoSeleccionado(empleado);
    setModalHistorial(true);
  };

  const handleDeactivate = (empleado) => {
    setEmpleadoToDeactivate(empleado);
    setConfirmDialogOpen(true);
  };

  const handleConfirmDeactivate = async () => {
    if (!empleadoToDeactivate) return;

    try {
      await EmpleadoService.deactivate(empleadoToDeactivate.id);
      await loadData(); // Recargar datos
      setConfirmDialogOpen(false);
      setEmpleadoToDeactivate(null);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleCreateEmployee = () => {
    setEmpleadoSeleccionado(null);
    setModalFormulario(true);
  };

  // Handlers para cerrar modales
  const handleCloseModals = () => {
    setModalFormulario(false);
    setModalDetalle(false);
    setModalHistorial(false);
    setModalPassword(false);
    setEmpleadoSeleccionado(null);
    setEmpleadoIdDetalle(null);
  };

  const handleSuccess = () => {
    loadData(); // Recargar datos después de operaciones exitosas
    handleCloseModals();
  };

  const StatCard = ({ title, value, icon, color = 'primary' }) => (
    <Card elevation={3}>
      <CardContent>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box>
            <Typography color="textSecondary" gutterBottom>
              {title}
            </Typography>
            <Typography variant="h4" component="h2">
              {value}
            </Typography>
          </Box>
          <Box color={`${color}.main`}>
            {icon}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress size={50} />
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" gutterBottom>
          Gestión de Empleados
        </Typography>
        {(isAdmin() || isSuperAdmin()) && (
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={handleCreateEmployee}
            size="large"
          >
            Nuevo Empleado
          </Button>
        )}
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Estadísticas generales */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={2}>
          <StatCard
            title="Total Empleados"
            value={stats.total}
            icon={<People fontSize="large" />}
            color="primary"
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={2}>
          <StatCard
            title="Activos"
            value={stats.activos}
            icon={<PersonAdd fontSize="large" />}
            color="success"
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={2}>
          <StatCard
            title="Inactivos"
            value={stats.inactivos}
            icon={<People fontSize="large" />}
            color="error"
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={2}>
          <StatCard
            title="Administradores"
            value={stats.administradores + stats.superadmins}
            icon={<Business fontSize="large" />}
            color="warning"
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={2}>
          <StatCard
            title="Empleados"
            value={stats.empleadosRegulares}
            icon={<People fontSize="large" />}
            color="info"
          />
        </Grid>

        <Grid item xs={12} sm={6} md={2}>
          <StatCard
            title="Sin Área"
            value={stats.sinArea}
            icon={<TrendingUp fontSize="large" />}
            color="secondary"
          />
        </Grid>
      </Grid>

      {/* Advertencia para empleados sin área */}
      {stats.sinArea > 0 && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          Hay {stats.sinArea} empleado(s) sin área asignada. 
          {(isAdmin() || isSuperAdmin()) && ' Considera asignarlos a un área apropiada.'}
        </Alert>
      )}

      {/* Filtros */}
      <FiltrosEmpleados
        filters={filtros}
        onFiltersChange={setFiltros}
        areas={areas}
        stats={{ total: empleadosFiltrados.length }}
      />

      {/* Tabla */}
      <TablaEmpleados
        empleados={empleadosFiltrados}
        loading={loading}
        onViewDetail={handleViewDetail}
        onEdit={handleEdit}
        onChangePassword={handleChangePassword}
        onDeactivate={handleDeactivate}
        onViewHistory={handleViewHistory}
      />

      {/* FAB para crear empleado (solo admin/superadmin) */}
      {(isAdmin() || isSuperAdmin()) && (
        <Fab
          color="primary"
          aria-label="add"
          sx={{ position: 'fixed', bottom: 16, right: 16 }}
          onClick={handleCreateEmployee}
        >
          <Add />
        </Fab>
      )}

      {/* Modales */}
      <FormularioEmpleado
        open={modalFormulario}
        onClose={handleCloseModals}
        onSuccess={handleSuccess}
        empleado={empleadoSeleccionado}
        areas={areas}
      />

      <DetalleEmpleado
        open={modalDetalle}
        onClose={handleCloseModals}
        empleadoId={empleadoIdDetalle}
        onEdit={handleEdit}
        onChangePassword={handleChangePassword}
        onViewHistory={handleViewHistory}
        onDeactivate={handleDeactivate}
      />

      <HistorialSalario
        open={modalHistorial}
        onClose={handleCloseModals}
        empleado={empleadoSeleccionado}
      />

      <CambiarPassword
        open={modalPassword}
        onClose={handleCloseModals}
        onSuccess={handleSuccess}
        empleado={empleadoSeleccionado}
      />

      {/* Dialog de confirmación para desactivar */}
      <Dialog
        open={confirmDialogOpen}
        onClose={() => setConfirmDialogOpen(false)}
      >
        <DialogTitle>
          Desactivar Empleado
        </DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            ¿Estás seguro de que deseas desactivar este empleado?
          </Alert>
          {empleadoToDeactivate && (
            <Typography variant="body2">
              <strong>Empleado:</strong> {empleadoToDeactivate.nombre} {empleadoToDeactivate.apellido}<br />
              <strong>Email:</strong> {empleadoToDeactivate.email}<br />
              <strong>Área:</strong> {empleadoToDeactivate.area_nombre || 'Sin área'}
            </Typography>
          )}
          <Alert severity="info" sx={{ mt: 2 }}>
            El empleado no podrá acceder al sistema una vez desactivado, pero sus datos se conservarán.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialogOpen(false)}>
            Cancelar
          </Button>
          <Button onClick={handleConfirmDeactivate} color="error" variant="contained">
            Desactivar Empleado
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Empleados;