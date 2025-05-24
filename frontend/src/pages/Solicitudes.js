// src/pages/Solicitudes.js
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import SolicitudService from '../services/solicitud.service';
import TablaSolicitudes from '../components/solicitudes/TablaSolicitudes';
import FormularioVacaciones from '../components/solicitudes/FormularioVacaciones';
import FormularioHorasExtra from '../components/solicitudes/FormularioHorasExtra';
import TablaAprobacion from '../components/solicitudes/TablaAprobacion';
import {
  Box,
  Typography,
  Button,
  Alert,
  CircularProgress,
  Paper,
  Grid,
  Card,
  CardContent,
  Tabs,
  Tab,
  Fab,
  Chip
} from '@mui/material';
import {
  Add,
  EventAvailable,
  Schedule,
  Pending,
  CheckCircle,
  Cancel
} from '@mui/icons-material';

const Solicitudes = () => {
  const { user, isAdmin } = useAuth();
  const [solicitudes, setSolicitudes] = useState([]);
  const [solicitudesPendientes, setSolicitudesPendientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Estados para formularios
  const [vacacionesDialogOpen, setVacacionesDialogOpen] = useState(false);
  const [horasExtraDialogOpen, setHorasExtraDialogOpen] = useState(false);
  
  // Estados para filtros y tabs
  const [tabValue, setTabValue] = useState(0);
  const [filtroEstado, setFiltroEstado] = useState('todas');

  // Estadísticas
  const [stats, setStats] = useState({
    totalSolicitudes: 0,
    pendientes: 0,
    aprobadas: 0,
    rechazadas: 0,
    vacacionesPendientes: 0,
    horasExtraPendientes: 0
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (solicitudes.length > 0 || solicitudesPendientes.length > 0) {
      calculateStats();
    }
  }, [solicitudes, solicitudesPendientes]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      
      if (isAdmin()) {
        // Admin ve todas las solicitudes pendientes
        const [todasSolicitudes, pendientes] = await Promise.all([
          SolicitudService.getAll(),
          SolicitudService.getPendientes()
        ]);
        setSolicitudes(todasSolicitudes);
        setSolicitudesPendientes(pendientes);
      } else {
        // Empleado solo ve sus propias solicitudes
        const misSolicitudes = await SolicitudService.getAll();
        setSolicitudes(misSolicitudes);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = () => {
    const allSolicitudes = isAdmin() ? [...solicitudes] : solicitudes;
    
    const totalSolicitudes = allSolicitudes.length;
    const pendientes = allSolicitudes.filter(s => s.estado === 'pendiente').length;
    const aprobadas = allSolicitudes.filter(s => s.estado === 'aprobada').length;
    const rechazadas = allSolicitudes.filter(s => s.estado === 'rechazada').length;
    
    const vacacionesPendientes = solicitudesPendientes.filter(s => s.tipo === 'vacaciones').length;
    const horasExtraPendientes = solicitudesPendientes.filter(s => s.tipo === 'horas_extra').length;

    setStats({
      totalSolicitudes,
      pendientes,
      aprobadas,
      rechazadas,
      vacacionesPendientes,
      horasExtraPendientes
    });
  };

  const handleCreateVacaciones = () => {
    setVacacionesDialogOpen(true);
  };

  const handleCreateHorasExtra = () => {
    setHorasExtraDialogOpen(true);
  };

  const handleFormSuccess = () => {
    loadData(); // Recargar datos después de crear solicitud
  };

  const handleDeleteSolicitud = async (id) => {
    try {
      await SolicitudService.delete(id);
      await loadData(); // Recargar datos
    } catch (err) {
      setError(err.message);
    }
  };

  const handleAprobacion = async (id, accion, comentario = '') => {
    try {
      if (accion === 'aprobar') {
        await SolicitudService.aprobar(id, comentario);
      } else {
        await SolicitudService.rechazar(id, comentario);
      }
      await loadData(); // Recargar datos
    } catch (err) {
      setError(err.message);
    }
  };

  const getSolicitudesFiltradas = () => {
    if (filtroEstado === 'todas') return solicitudes;
    return solicitudes.filter(s => s.estado === filtroEstado);
  };

  const StatCard = ({ title, value, icon, color = 'primary', chip = false }) => (
    <Card elevation={3}>
      <CardContent>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box>
            <Typography color="textSecondary" gutterBottom>
              {title}
            </Typography>
            {chip ? (
              <Chip label={value} color={color} size="large" />
            ) : (
              <Typography variant="h4" component="h2">
                {value}
              </Typography>
            )}
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
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" gutterBottom>
          {isAdmin() ? 'Gestión de Solicitudes' : 'Mis Solicitudes'}
        </Typography>
        {!isAdmin() && (
          <Box display="flex" gap={2}>
            <Button
              variant="contained"
              startIcon={<EventAvailable />}
              onClick={handleCreateVacaciones}
            >
              Solicitar Vacaciones
            </Button>
            <Button
              variant="outlined"
              startIcon={<Schedule />}
              onClick={handleCreateHorasExtra}
            >
              Reportar Horas Extra
            </Button>
          </Box>
        )}
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Estadísticas */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Solicitudes"
            value={stats.totalSolicitudes}
            icon={<Pending fontSize="large" />}
            color="primary"
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Pendientes"
            value={stats.pendientes}
            icon={<Pending fontSize="large" />}
            color="warning"
            chip={true}
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Aprobadas"
            value={stats.aprobadas}
            icon={<CheckCircle fontSize="large" />}
            color="success"
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Rechazadas"
            value={stats.rechazadas}
            icon={<Cancel fontSize="large" />}
            color="error"
          />
        </Grid>
      </Grid>

      {/* Estadísticas adicionales para admin */}
      {isAdmin() && (
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6}>
            <StatCard
              title="Vacaciones por Aprobar"
              value={stats.vacacionesPendientes}
              icon={<EventAvailable fontSize="large" />}
              color="info"
              chip={true}
            />
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <StatCard
              title="Horas Extra por Aprobar"
              value={stats.horasExtraPendientes}
              icon={<Schedule fontSize="large" />}
              color="secondary"
              chip={true}
            />
          </Grid>
        </Grid>
      )}

      {/* Alertas de solicitudes pendientes para admin */}
      {isAdmin() && stats.pendientes > 0 && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          Tienes {stats.pendientes} solicitud(es) pendiente(s) de aprobación.
        </Alert>
      )}

      <Paper elevation={1} sx={{ mb: 3 }}>
        {isAdmin() ? (
          // Vista de Administrador con tabs
          <Box>
            <Tabs 
              value={tabValue} 
              onChange={(e, newValue) => setTabValue(newValue)}
              sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}
            >
              <Tab label={`Pendientes (${stats.pendientes})`} />
              <Tab label="Todas las Solicitudes" />
            </Tabs>
            
            <Box sx={{ p: 2 }}>
              {tabValue === 0 ? (
                // Tab de solicitudes pendientes
                <TablaAprobacion
                  solicitudes={solicitudesPendientes}
                  onAprobar={(id, comentario) => handleAprobacion(id, 'aprobar', comentario)}
                  onRechazar={(id, comentario) => handleAprobacion(id, 'rechazar', comentario)}
                  loading={loading}
                />
              ) : (
                // Tab de todas las solicitudes
                <Box>
                  <Box display="flex" gap={1} mb={2}>
                    <Button
                      variant={filtroEstado === 'todas' ? 'contained' : 'outlined'}
                      size="small"
                      onClick={() => setFiltroEstado('todas')}
                    >
                      Todas
                    </Button>
                    <Button
                      variant={filtroEstado === 'pendiente' ? 'contained' : 'outlined'}
                      size="small"
                      color="warning"
                      onClick={() => setFiltroEstado('pendiente')}
                    >
                      Pendientes
                    </Button>
                    <Button
                      variant={filtroEstado === 'aprobada' ? 'contained' : 'outlined'}
                      size="small"
                      color="success"
                      onClick={() => setFiltroEstado('aprobada')}
                    >
                      Aprobadas
                    </Button>
                    <Button
                      variant={filtroEstado === 'rechazada' ? 'contained' : 'outlined'}
                      size="small"
                      color="error"
                      onClick={() => setFiltroEstado('rechazada')}
                    >
                      Rechazadas
                    </Button>
                  </Box>
                  
                  <TablaSolicitudes
                    solicitudes={getSolicitudesFiltradas()}
                    onDelete={handleDeleteSolicitud}
                    loading={loading}
                    isAdmin={true}
                  />
                </Box>
              )}
            </Box>
          </Box>
        ) : (
          // Vista de Empleado
          <Box sx={{ p: 2 }}>
            <TablaSolicitudes
              solicitudes={solicitudes}
              onDelete={handleDeleteSolicitud}
              loading={loading}
              isAdmin={false}
            />
          </Box>
        )}
      </Paper>

      {/* FABs para empleados */}
      {!isAdmin() && (
        <>
          <Fab
            color="primary"
            aria-label="vacaciones"
            sx={{ position: 'fixed', bottom: 80, right: 16 }}
            onClick={handleCreateVacaciones}
          >
            <EventAvailable />
          </Fab>
          
          <Fab
            color="secondary"
            aria-label="horas-extra"
            sx={{ position: 'fixed', bottom: 16, right: 16 }}
            onClick={handleCreateHorasExtra}
          >
            <Schedule />
          </Fab>
        </>
      )}

      {/* Dialogs para formularios */}
      <FormularioVacaciones
        open={vacacionesDialogOpen}
        onClose={() => setVacacionesDialogOpen(false)}
        onSuccess={handleFormSuccess}
      />

      <FormularioHorasExtra
        open={horasExtraDialogOpen}
        onClose={() => setHorasExtraDialogOpen(false)}
        onSuccess={handleFormSuccess}
      />
    </Box>
  );
};

export default Solicitudes;