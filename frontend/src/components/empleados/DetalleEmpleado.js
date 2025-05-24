// src/components/empleados/DetalleEmpleado.js
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Grid,
  Chip,
  Avatar,
  Divider,
  Card,
  CardContent,
  IconButton,
  Tooltip,
  CircularProgress,
  Alert
} from '@mui/material';
import {
  Person,
  Email,
  Badge,
  CalendarToday,
  AttachMoney,
  Business,
  Security,
  Phone,
  Edit,
  Lock,
  History,
  Close,
  PersonOff,
  Work
} from '@mui/icons-material';
import dayjs from 'dayjs';
import EmpleadoService from '../../services/empleado.service';

const DetalleEmpleado = ({ 
  open, 
  onClose, 
  empleadoId, 
  onEdit, 
  onChangePassword, 
  onViewHistory,
  onDeactivate 
}) => {
  const [empleado, setEmpleado] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open && empleadoId) {
      loadEmpleado();
    }
  }, [open, empleadoId]);

  const loadEmpleado = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await EmpleadoService.getById(empleadoId);
      setEmpleado(data);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setEmpleado(null);
    setError('');
    onClose();
  };

  const generateInitials = (nombre, apellido) => {
    return `${nombre?.charAt(0) || ''}${apellido?.charAt(0) || ''}`.toUpperCase();
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-GT', {
      style: 'currency',
      currency: 'GTQ'
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return dayjs(dateString).format('DD/MM/YYYY');
  };

  const formatDateLong = (dateString) => {
    return dayjs(dateString).format('DD [de] MMMM [de] YYYY');
  };

  const calculateAntiquity = (fechaContratacion) => {
    const inicio = dayjs(fechaContratacion);
    const ahora = dayjs();
    const years = ahora.diff(inicio, 'year');
    const months = ahora.diff(inicio.add(years, 'year'), 'month');
    
    if (years > 0) {
      return `${years} año${years > 1 ? 's' : ''} ${months > 0 ? `y ${months} mes${months > 1 ? 'es' : ''}` : ''}`;
    }
    return `${months} mes${months > 1 ? 'es' : ''}`;
  };

  const getRolChip = (rolId, rolNombre) => {
    const config = {
      1: { color: 'error', label: 'Superadministrador' },
      2: { color: 'warning', label: 'Administrador' },
      3: { color: 'primary', label: 'Empleado' }
    };
    const { color, label } = config[rolId] || { color: 'primary', label: rolNombre };
    return <Chip label={label} color={color} size="small" />;
  };

  const getEstadoChip = (activo) => {
    return (
      <Chip
        label={activo ? 'Activo' : 'Inactivo'}
        color={activo ? 'success' : 'default'}
        size="small"
        variant={activo ? 'filled' : 'outlined'}
      />
    );
  };

  const getTipoNominaLabel = (tipo) => {
    const tipos = {
      'semanal': 'Semanal',
      'quincenal': 'Quincenal',
      'mensual': 'Mensual'
    };
    return tipos[tipo] || tipo;
  };

  if (loading) {
    return (
      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogContent>
          <Box display="flex" justifyContent="center" p={4}>
            <CircularProgress />
          </Box>
        </DialogContent>
      </Dialog>
    );
  }

  if (error) {
    return (
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>Error</DialogTitle>
        <DialogContent>
          <Alert severity="error">{error}</Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cerrar</Button>
        </DialogActions>
      </Dialog>
    );
  }

  if (!empleado) {
    return null;
  }

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box display="flex" alignItems="center" gap={2}>
            <Person color="primary" />
            <Typography variant="h6">Detalle del Empleado</Typography>
          </Box>
          <IconButton onClick={handleClose} size="small">
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ pb: 1 }}>
        <Grid container spacing={3}>
          {/* Header con información principal */}
          <Grid item xs={12}>
            <Card elevation={2} sx={{ mb: 2 }}>
              <CardContent>
                <Box display="flex" alignItems="center" gap={3}>
                  <Avatar 
                    sx={{ 
                      width: 80, 
                      height: 80, 
                      bgcolor: 'primary.main',
                      fontSize: '2rem'
                    }}
                  >
                    {generateInitials(empleado.nombre, empleado.apellido)}
                  </Avatar>
                  
                  <Box flex={1}>
                    <Typography variant="h4" fontWeight="bold" gutterBottom>
                      {empleado.nombre} {empleado.apellido}
                    </Typography>
                    
                    <Box display="flex" alignItems="center" gap={2} mb={1}>
                      <Typography variant="body1" color="textSecondary">
                        #{empleado.numero_empleado || empleado.id}
                      </Typography>
                      {getRolChip(empleado.rol_id, empleado.rol_nombre)}
                      {getEstadoChip(empleado.activo)}
                    </Box>
                    
                    <Typography variant="body1" color="primary" fontWeight="medium">
                      {empleado.email}
                    </Typography>
                  </Box>

                  <Box display="flex" flexDirection="column" gap={1}>
                    <Tooltip title="Editar empleado">
                      <IconButton 
                        onClick={() => onEdit && onEdit(empleado)}
                        color="primary"
                      >
                        <Edit />
                      </IconButton>
                    </Tooltip>
                    
                    <Tooltip title="Cambiar contraseña">
                      <IconButton 
                        onClick={() => onChangePassword && onChangePassword(empleado)}
                        color="secondary"
                      >
                        <Lock />
                      </IconButton>
                    </Tooltip>
                    
                    <Tooltip title="Ver historial salarial">
                      <IconButton 
                        onClick={() => onViewHistory && onViewHistory(empleado)}
                        color="info"
                      >
                        <History />
                      </IconButton>
                    </Tooltip>

                    {empleado.activo && (
                      <Tooltip title="Desactivar empleado">
                        <IconButton 
                          onClick={() => onDeactivate && onDeactivate(empleado)}
                          color="error"
                        >
                          <PersonOff />
                        </IconButton>
                      </Tooltip>
                    )}
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Información Personal */}
          <Grid item xs={12} md={6}>
            <Card elevation={1}>
              <CardContent>
                <Typography variant="h6" color="primary" gutterBottom>
                  <Box display="flex" alignItems="center" gap={1}>
                    <Badge />
                    Información Personal
                  </Box>
                </Typography>
                <Divider sx={{ mb: 2 }} />

                <Box display="flex" flexDirection="column" gap={2}>
                  <Box display="flex" alignItems="center" gap={2}>
                    <Person fontSize="small" color="action" />
                    <Box>
                      <Typography variant="body2" color="textSecondary">
                        Nombre Completo
                      </Typography>
                      <Typography variant="body1">
                        {empleado.nombre} {empleado.apellido}
                      </Typography>
                    </Box>
                  </Box>

                  <Box display="flex" alignItems="center" gap={2}>
                    <Email fontSize="small" color="action" />
                    <Box>
                      <Typography variant="body2" color="textSecondary">
                        Email
                      </Typography>
                      <Typography variant="body1">
                        {empleado.email}
                      </Typography>
                    </Box>
                  </Box>

                  <Box display="flex" alignItems="center" gap={2}>
                    <Badge fontSize="small" color="action" />
                    <Box>
                      <Typography variant="body2" color="textSecondary">
                        DPI
                      </Typography>
                      <Typography variant="body1">
                        {empleado.dpi}
                      </Typography>
                    </Box>
                  </Box>

                  <Box display="flex" alignItems="center" gap={2}>
                    <CalendarToday fontSize="small" color="action" />
                    <Box>
                      <Typography variant="body2" color="textSecondary">
                        Fecha de Nacimiento
                      </Typography>
                      <Typography variant="body1">
                        {formatDateLong(empleado.fecha_nacimiento)}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Información Laboral */}
          <Grid item xs={12} md={6}>
            <Card elevation={1}>
              <CardContent>
                <Typography variant="h6" color="primary" gutterBottom>
                  <Box display="flex" alignItems="center" gap={1}>
                    <Work />
                    Información Laboral
                  </Box>
                </Typography>
                <Divider sx={{ mb: 2 }} />

                <Box display="flex" flexDirection="column" gap={2}>
                  <Box display="flex" alignItems="center" gap={2}>
                    <Business fontSize="small" color="action" />
                    <Box>
                      <Typography variant="body2" color="textSecondary">
                        Área
                      </Typography>
                      <Typography variant="body1">
                        {empleado.area_nombre || 'Sin área asignada'}
                      </Typography>
                    </Box>
                  </Box>

                  <Box display="flex" alignItems="center" gap={2}>
                    <Security fontSize="small" color="action" />
                    <Box>
                      <Typography variant="body2" color="textSecondary">
                        Rol
                      </Typography>
                      <Typography variant="body1">
                        {empleado.rol_nombre}
                      </Typography>
                    </Box>
                  </Box>

                  <Box display="flex" alignItems="center" gap={2}>
                    <AttachMoney fontSize="small" color="action" />
                    <Box>
                      <Typography variant="body2" color="textSecondary">
                        Salario Base
                      </Typography>
                      <Typography variant="body1" fontWeight="medium">
                        {formatCurrency(empleado.salario_base)} ({getTipoNominaLabel(empleado.tipo_nomina)})
                      </Typography>
                    </Box>
                  </Box>

                  <Box display="flex" alignItems="center" gap={2}>
                    <CalendarToday fontSize="small" color="action" />
                    <Box>
                      <Typography variant="body2" color="textSecondary">
                        Fecha de Contratación
                      </Typography>
                      <Typography variant="body1">
                        {formatDateLong(empleado.fecha_contratacion)}
                      </Typography>
                    </Box>
                  </Box>

                  <Box display="flex" alignItems="center" gap={2}>
                    <Work fontSize="small" color="action" />
                    <Box>
                      <Typography variant="body2" color="textSecondary">
                        Antigüedad
                      </Typography>
                      <Typography variant="body1">
                        {calculateAntiquity(empleado.fecha_contratacion)}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Información Adicional */}
          <Grid item xs={12}>
            <Card elevation={1}>
              <CardContent>
                <Typography variant="h6" color="primary" gutterBottom>
                  Información Adicional
                </Typography>
                <Divider sx={{ mb: 2 }} />

                <Grid container spacing={3}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="textSecondary">
                      Número de Empleado
                    </Typography>
                    <Typography variant="body1">
                      {empleado.numero_empleado || 'No asignado'}
                    </Typography>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="textSecondary">
                      Estado
                    </Typography>
                    <Box mt={0.5}>
                      {getEstadoChip(empleado.activo)}
                    </Box>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="textSecondary">
                      Fecha de Registro
                    </Typography>
                    <Typography variant="body1">
                      {formatDateLong(empleado.created_at)}
                    </Typography>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="textSecondary">
                      Última Actualización
                    </Typography>
                    <Typography variant="body1">
                      {formatDateLong(empleado.updated_at)}
                    </Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={handleClose} size="large">
          Cerrar
        </Button>
        <Button 
          onClick={() => onEdit && onEdit(empleado)}
          variant="contained"
          startIcon={<Edit />}
          size="large"
        >
          Editar Empleado
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DetalleEmpleado;