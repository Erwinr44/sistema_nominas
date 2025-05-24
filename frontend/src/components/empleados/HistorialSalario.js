import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  CircularProgress,
  Alert,
  Avatar,
  Divider,
  Card,
  CardContent,
  Grid,
  Tooltip
} from '@mui/material';
import {
  History,
  Close,
  TrendingUp,
  TrendingDown,
  AttachMoney,
  Person,
  CalendarToday,
  Info
} from '@mui/icons-material';
import dayjs from 'dayjs';
import EmpleadoService from '../../services/empleado.service';

const HistorialSalario = ({ 
  open, 
  onClose, 
  empleado = null 
}) => {
  const [historial, setHistorial] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open && empleado?.id) {
      loadHistorial();
    }
  }, [open, empleado]);

  const loadHistorial = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await EmpleadoService.getHistorialSalario(empleado.id);
      setHistorial(data);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setHistorial([]);
    setError('');
    onClose();
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
    return dayjs(dateString).format('DD [de] MMMM [de] YYYY [a las] HH:mm');
  };

  const generateInitials = (nombre, apellido) => {
    return `${nombre?.charAt(0) || ''}${apellido?.charAt(0) || ''}`.toUpperCase();
  };

  const getSalaryChangeIcon = (salarioAnterior, salarioNuevo) => {
    if (salarioAnterior === 0) return <Info color="info" />;
    if (salarioNuevo > salarioAnterior) return <TrendingUp color="success" />;
    if (salarioNuevo < salarioAnterior) return <TrendingDown color="error" />;
    return <AttachMoney color="primary" />;
  };

  const getSalaryChangeChip = (salarioAnterior, salarioNuevo) => {
    if (salarioAnterior === 0) {
      return <Chip label="Salario Inicial" color="info" size="small" />;
    }
    
    const diferencia = salarioNuevo - salarioAnterior;
    const porcentaje = ((diferencia / salarioAnterior) * 100).toFixed(1);
    
    if (diferencia > 0) {
      return (
        <Chip 
          label={`+${formatCurrency(diferencia)} (+${porcentaje}%)`} 
          color="success" 
          size="small" 
        />
      );
    } else if (diferencia < 0) {
      return (
        <Chip 
          label={`${formatCurrency(diferencia)} (${porcentaje}%)`} 
          color="error" 
          size="small" 
        />
      );
    }
    
    return <Chip label="Sin cambio" color="default" size="small" />;
  };

  const calcularEstadisticas = () => {
    if (historial.length === 0) return null;

    const salarioInicial = historial[historial.length - 1]?.salario_nuevo || 0;
    const salarioActual = historial[0]?.salario_nuevo || 0;
    const totalCambios = historial.length - 1; // -1 porque el primero es el salario inicial
    
    const incrementoTotal = salarioActual - salarioInicial;
    const porcentajeIncremento = salarioInicial > 0 ? ((incrementoTotal / salarioInicial) * 100).toFixed(1) : 0;

    return {
      salarioInicial,
      salarioActual,
      totalCambios,
      incrementoTotal,
      porcentajeIncremento
    };
  };

  const stats = calcularEstadisticas();

  if (!empleado) {
    return null;
  }

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box display="flex" alignItems="center" gap={2}>
            <History color="primary" />
            <Typography variant="h6">Historial Salarial</Typography>
          </Box>
          <IconButton onClick={handleClose} size="small">
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ pb: 1 }}>
        {/* Header con información del empleado */}
        <Card elevation={2} sx={{ mb: 3 }}>
          <CardContent>
            <Box display="flex" alignItems="center" gap={3}>
              <Avatar 
                sx={{ 
                  width: 60, 
                  height: 60, 
                  bgcolor: 'primary.main',
                  fontSize: '1.5rem'
                }}
              >
                {generateInitials(empleado.nombre, empleado.apellido)}
              </Avatar>
              
              <Box flex={1}>
                <Typography variant="h5" fontWeight="bold">
                  {empleado.nombre} {empleado.apellido}
                </Typography>
                <Typography variant="body1" color="textSecondary">
                  {empleado.email} • #{empleado.numero_empleado || empleado.id}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  {empleado.area_nombre || 'Sin área'} • {empleado.rol_nombre}
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>

        {/* Estadísticas */}
        {stats && (
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Card elevation={1} sx={{ textAlign: 'center', py: 2 }}>
                <Typography variant="h6" color="primary" fontWeight="bold">
                  {formatCurrency(stats.salarioActual)}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Salario Actual
                </Typography>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card elevation={1} sx={{ textAlign: 'center', py: 2 }}>
                <Typography variant="h6" color="textSecondary" fontWeight="bold">
                  {formatCurrency(stats.salarioInicial)}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Salario Inicial
                </Typography>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card elevation={1} sx={{ textAlign: 'center', py: 2 }}>
                <Typography 
                  variant="h6" 
                  color={stats.incrementoTotal >= 0 ? 'success.main' : 'error.main'}
                  fontWeight="bold"
                >
                  {stats.incrementoTotal >= 0 ? '+' : ''}{formatCurrency(stats.incrementoTotal)}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Incremento Total ({stats.porcentajeIncremento}%)
                </Typography>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card elevation={1} sx={{ textAlign: 'center', py: 2 }}>
                <Typography variant="h6" color="info.main" fontWeight="bold">
                  {stats.totalCambios}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Cambios Realizados
                </Typography>
              </Card>
            </Grid>
          </Grid>
        )}

        {/* Contenido principal */}
        {loading ? (
          <Box display="flex" justifyContent="center" p={4}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        ) : historial.length === 0 ? (
          <Alert severity="info">
            No se encontró historial salarial para este empleado.
          </Alert>
        ) : (
          <TableContainer component={Paper} elevation={1}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell></TableCell>
                  <TableCell>Fecha</TableCell>
                  <TableCell align="right">Salario Anterior</TableCell>
                  <TableCell align="right">Salario Nuevo</TableCell>
                  <TableCell>Cambio</TableCell>
                  <TableCell>Motivo</TableCell>
                  <TableCell>Registrado Por</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {historial.map((registro, index) => (
                  <TableRow key={registro.id} hover>
                    <TableCell>
                      <Tooltip title={
                        registro.salario_anterior === 0 
                          ? "Salario inicial" 
                          : registro.salario_nuevo > registro.salario_anterior 
                            ? "Incremento salarial" 
                            : "Reducción salarial"
                      }>
                        {getSalaryChangeIcon(registro.salario_anterior, registro.salario_nuevo)}
                      </Tooltip>
                    </TableCell>
                    
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">
                        {formatDate(registro.fecha_cambio)}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        {dayjs(registro.fecha_cambio).format('HH:mm')}
                      </Typography>
                    </TableCell>
                    
                    <TableCell align="right">
                      <Typography 
                        variant="body2" 
                        color={registro.salario_anterior === 0 ? "textSecondary" : "textPrimary"}
                      >
                        {registro.salario_anterior === 0 
                          ? '—' 
                          : formatCurrency(registro.salario_anterior)
                        }
                      </Typography>
                    </TableCell>
                    
                    <TableCell align="right">
                      <Typography variant="body2" fontWeight="medium">
                        {formatCurrency(registro.salario_nuevo)}
                      </Typography>
                    </TableCell>
                    
                    <TableCell>
                      {getSalaryChangeChip(registro.salario_anterior, registro.salario_nuevo)}
                    </TableCell>
                    
                    <TableCell>
                      <Typography variant="body2">
                        {registro.motivo || 'Sin motivo especificado'}
                      </Typography>
                    </TableCell>
                    
                    <TableCell>
                      <Typography variant="body2" color="textSecondary">
                        {registro.registrado_por_nombre || 'Sistema'}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3, justifyContent: 'space-between' }}>
        <Typography variant="body2" color="textSecondary">
          {historial.length > 0 && (
            <>Mostrando {historial.length} registro{historial.length > 1 ? 's' : ''}</>
          )}
        </Typography>
        
        <Box>
          <Button onClick={handleClose} size="large">
            Cerrar
          </Button>
        </Box>
      </DialogActions>
    </Dialog>
  );
};

export default HistorialSalario;