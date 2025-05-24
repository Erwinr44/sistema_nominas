import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import SolicitudService from '../services/solicitud.service';
import FormularioVacaciones from '../components/solicitudes/FormularioVacaciones';
import FormularioHorasExtra from '../components/solicitudes/FormularioHorasExtra';
import TablaSolicitudes from '../components/solicitudes/TablaSolicitudes';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  Alert,
  Fab,
  SpeedDial,
  SpeedDialAction,
  SpeedDialIcon,
  Divider,
  CircularProgress,
  Paper
} from '@mui/material';
import {
  Add,
  EventAvailable,
  Schedule,
  Pending,
  CheckCircle,
  Cancel,
  CalendarToday
} from '@mui/icons-material';

const MisSolicitudes = () => {
  const { user } = useAuth();
  const [solicitudes, setSolicitudes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [vacacionesDialogOpen, setVacacionesDialogOpen] = useState(false);
  const [horasExtraDialogOpen, setHorasExtraDialogOpen] = useState(false);
  const [vacacionesInfo, setVacacionesInfo] = useState(null);
  
  // Estadísticas
  const [stats, setStats] = useState({
    total: 0,
    pendientes: 0,
    aprobadas: 0,
    rechazadas: 0,
    vacacionesPendientes: 0,
    horasExtraPendientes: 0
  });

  useEffect(() => {
    loadSolicitudes();
    loadVacacionesInfo();
  }, []);

  useEffect(() => {
    if (solicitudes.length > 0) {
      calculateStats();
    }
  }, [solicitudes]);

  const loadSolicitudes = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await SolicitudService.getAll();
      setSolicitudes(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadVacacionesInfo = async () => {
    try {
      const data = await SolicitudService.getVacacionesDisponibles(user.id);
      setVacacionesInfo(data);
    } catch (err) {
      console.error('Error al cargar información de vacaciones:', err);
    }
  };

  const calculateStats = () => {
    const total = solicitudes.length;
    const pendientes = solicitudes.filter(s => s.estado === 'pendiente').length;
    const aprobadas = solicitudes.filter(s => s.estado === 'aprobada').length;
    const rechazadas = solicitudes.filter(s => s.estado === 'rechazada').length;
    const vacacionesPendientes = solicitudes.filter(s => s.tipo === 'vacaciones' && s.estado === 'pendiente').length;
    const horasExtraPendientes = solicitudes.filter(s => s.tipo === 'horas_extra' && s.estado === 'pendiente').length;

    setStats({
      total,
      pendientes,
      aprobadas,
      rechazadas,
      vacacionesPendientes,
      horasExtraPendientes
    });
  };

  const handleSolicitudCreated = () => {
    loadSolicitudes();
    loadVacacionesInfo();
  };

  const handleDeleteSolicitud = async (solicitudId) => {
    try {
      await loadSolicitudes();
    } catch (err) {
      setError(err.message);
    }
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

  const speedDialActions = [
    {
      icon: <EventAvailable />,
      name: 'Solicitar Vacaciones',
      onClick: () => setVacacionesDialogOpen(true)
    },
    {
      icon: <Schedule />,
      name: 'Reportar Horas Extra',
      onClick: () => setHorasExtraDialogOpen(true)
    }
  ];

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" gutterBottom>
          Mis Solicitudes
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Información de Vacaciones */}
      {vacacionesInfo && (
        <Paper elevation={2} sx={{ p: 3, mb: 3, bgcolor: 'primary.50' }}>
          <Box display="flex" alignItems="center" gap={2} mb={2}>
            <CalendarToday color="primary" />
            <Typography variant="h6" color="primary">
              Estado de mis Vacaciones
            </Typography>
          </Box>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="body2" color="textSecondary">
                Años de Servicio
              </Typography>
              <Typography variant="h5">
                {vacacionesInfo.anios_servicio} años
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="body2" color="textSecondary">
                Días Acumulados
              </Typography>
              <Typography variant="h5">
                {vacacionesInfo.dias_disponibles} días
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="body2" color="textSecondary">
                Días Tomados
              </Typography>
              <Typography variant="h5">
                {vacacionesInfo.dias_tomados} días
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="body2" color="textSecondary">
                Días Disponibles
              </Typography>
              <Typography variant="h4" color="success.main" fontWeight="bold">
                {vacacionesInfo.dias_pendientes} días
              </Typography>
            </Grid>
          </Grid>
        </Paper>
      )}

      {/* Estadísticas de Solicitudes */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Solicitudes"
            value={stats.total}
            icon={<Add fontSize="large" />}
            color="primary"
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Pendientes"
            value={stats.pendientes}
            icon={<Pending fontSize="large" />}
            color="warning"
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

      {/* Botones de Acción Rápida */}
      <Box display="flex" gap={2} mb={3}>
        <Button
          variant="contained"
          startIcon={<EventAvailable />}
          onClick={() => setVacacionesDialogOpen(true)}
          disabled={!vacacionesInfo || vacacionesInfo.dias_pendientes <= 0}
        >
          Solicitar Vacaciones
        </Button>
        <Button
          variant="outlined"
          startIcon={<Schedule />}
          onClick={() => setHorasExtraDialogOpen(true)}
        >
          Reportar Horas Extra
        </Button>
      </Box>

      {vacacionesInfo && vacacionesInfo.dias_pendientes <= 0 && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          No tienes días de vacaciones disponibles. Los días se acumulan según tu tiempo de servicio.
        </Alert>
      )}

      {/* Tabla de Solicitudes */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Historial de Solicitudes
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <TablaSolicitudes
            solicitudes={solicitudes}
            onDelete={handleDeleteSolicitud}
            loading={loading}
          />
        </CardContent>
      </Card>

      {/* Speed Dial para acciones rápidas */}
      <SpeedDial
        ariaLabel="Crear solicitud"
        sx={{ position: 'fixed', bottom: 16, right: 16 }}
        icon={<SpeedDialIcon />}
      >
        {speedDialActions.map((action) => (
          <SpeedDialAction
            key={action.name}
            icon={action.icon}
            tooltipTitle={action.name}
            onClick={action.onClick}
          />
        ))}
      </SpeedDial>

      {/* Dialogs */}
      <FormularioVacaciones
        open={vacacionesDialogOpen}
        onClose={() => setVacacionesDialogOpen(false)}
        onSuccess={handleSolicitudCreated}
      />

      <FormularioHorasExtra
        open={horasExtraDialogOpen}
        onClose={() => setHorasExtraDialogOpen(false)}
        onSuccess={handleSolicitudCreated}
      />
    </Box>
  );
};

export default MisSolicitudes;