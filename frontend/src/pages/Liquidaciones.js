import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import LiquidacionService from '../services/liquidacion.service';
import FormularioLiquidacion from '../components/liquidaciones/FormularioLiquidacion';
import TablaLiquidaciones from '../components/liquidaciones/TablaLiquidaciones';
import ResumenLiquidacion from '../components/liquidaciones/ResumenLiquidacion';
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
  Chip,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select
} from '@mui/material';
import {
  Add,
  Business,
  Payment,
  AttachMoney,
  Schedule,
  CheckCircle,
  Warning
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from '../utils/dayjs';

const Liquidaciones = () => {
  const { isAdmin } = useAuth();
  const [liquidaciones, setLiquidaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Estados para formularios y dialogs
  const [formularioOpen, setFormularioOpen] = useState(false);
  const [resumenOpen, setResumenOpen] = useState(false);
  const [selectedLiquidacion, setSelectedLiquidacion] = useState(null);
  
  // Estados para filtros
  const [filtros, setFiltros] = useState({
    motivo: '',
    estado: '',
    fechaInicio: null,
    fechaFin: null
  });
  
  // Estados para tabs
  const [tabValue, setTabValue] = useState(0);

  // Estadísticas
  const [stats, setStats] = useState({
    total: 0,
    pendientes: 0,
    pagadas: 0,
    totalPendiente: 0,
    totalPagado: 0,
    renuncias: 0,
    despidos: 0
  });

  useEffect(() => {
    loadData();
  }, [filtros]);

  useEffect(() => {
    if (liquidaciones.length > 0) {
      calculateStats();
    }
  }, [liquidaciones]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Preparar parámetros de filtro
      const params = {};
      if (filtros.motivo) params.motivo = filtros.motivo;
      if (filtros.estado) params.estado = filtros.estado;
      if (filtros.fechaInicio) params.fechaInicio = filtros.fechaInicio.format('YYYY-MM-DD');
      if (filtros.fechaFin) params.fechaFin = filtros.fechaFin.format('YYYY-MM-DD');
      
      const data = await LiquidacionService.getAll(params);
      setLiquidaciones(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = () => {
    const total = liquidaciones.length;
    const pendientes = liquidaciones.filter(l => l.estado === 'pendiente').length;
    const pagadas = liquidaciones.filter(l => l.estado === 'pagada').length;
    
    const totalPendiente = liquidaciones
      .filter(l => l.estado === 'pendiente')
      .reduce((sum, l) => sum + parseFloat(l.total_liquidacion || 0), 0);
    
    const totalPagado = liquidaciones
      .filter(l => l.estado === 'pagada')
      .reduce((sum, l) => sum + parseFloat(l.total_liquidacion || 0), 0);
    
    const renuncias = liquidaciones.filter(l => l.motivo === 'renuncia').length;
    const despidos = liquidaciones.filter(l => 
      l.motivo === 'despido' || l.motivo === 'despido_justificado'
    ).length;

    setStats({
      total,
      pendientes,
      pagadas,
      totalPendiente,
      totalPagado,
      renuncias,
      despidos
    });
  };

  const handleCreateLiquidacion = () => {
    setFormularioOpen(true);
  };

  const handleFormSuccess = () => {
    loadData(); // Recargar datos después de crear liquidación
  };

  const handleMarcarPagada = async (id) => {
    try {
      await LiquidacionService.marcarComoPagada(id);
      await loadData(); // Recargar datos
    } catch (err) {
      setError(err.message);
    }
  };

  const handleVerResumen = (liquidacion) => {
    setSelectedLiquidacion(liquidacion);
    setResumenOpen(true);
  };

  const handleDescargarPDF = async (id) => {
    try {
      await LiquidacionService.descargarPDF(id);
    } catch (err) {
      setError(err.message);
    }
  };

  const getLiquidacionesFiltradas = () => {
    if (tabValue === 0) {
      return liquidaciones.filter(l => l.estado === 'pendiente');
    } else if (tabValue === 1) {
      return liquidaciones.filter(l => l.estado === 'pagada');
    }
    return liquidaciones;
  };

  const clearFiltros = () => {
    setFiltros({
      motivo: '',
      estado: '',
      fechaInicio: null,
      fechaFin: null
    });
  };

  const formatCurrency = (amount) => {
    return `Q${parseFloat(amount || 0).toLocaleString('es-GT', { minimumFractionDigits: 2 })}`;
  };

  const StatCard = ({ title, value, icon, color = 'primary', isCurrency = false }) => (
    <Card elevation={3}>
      <CardContent>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box>
            <Typography color="textSecondary" gutterBottom>
              {title}
            </Typography>
            <Typography variant="h4" component="h2">
              {isCurrency ? formatCurrency(value) : value}
            </Typography>
          </Box>
          <Box color={`${color}.main`}>
            {icon}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );

  // Solo administradores pueden acceder
  if (!isAdmin()) {
    return (
      <Box>
        <Alert severity="error">
          No tienes permisos para acceder a este módulo.
        </Alert>
      </Box>
    );
  }

  if (loading && liquidaciones.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress size={50} />
      </Box>
    );
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="es">
      <Box>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h4" gutterBottom>
            Gestión de Liquidaciones
          </Typography>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={handleCreateLiquidacion}
            color="warning"
          >
            Calcular Liquidación
          </Button>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* Estadísticas principales */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Total Liquidaciones"
              value={stats.total}
              icon={<Business fontSize="large" />}
              color="primary"
            />
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Pendientes de Pago"
              value={stats.pendientes}
              icon={<Schedule fontSize="large" />}
              color="warning"
            />
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Pagadas"
              value={stats.pagadas}
              icon={<CheckCircle fontSize="large" />}
              color="success"
            />
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Total Pendiente"
              value={stats.totalPendiente}
              icon={<Warning fontSize="large" />}
              color="error"
              isCurrency={true}
            />
          </Grid>
        </Grid>

        {/* Estadísticas adicionales */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={4}>
            <StatCard
              title="Total Pagado"
              value={stats.totalPagado}
              icon={<Payment fontSize="large" />}
              color="success"
              isCurrency={true}
            />
          </Grid>
          
          <Grid item xs={12} sm={4}>
            <StatCard
              title="Renuncias"
              value={stats.renuncias}
              icon={<Business fontSize="large" />}
              color="info"
            />
          </Grid>
          
          <Grid item xs={12} sm={4}>
            <StatCard
              title="Despidos"
              value={stats.despidos}
              icon={<Warning fontSize="large" />}
              color="secondary"
            />
          </Grid>
        </Grid>

        {/* Alertas */}
        {stats.pendientes > 0 && (
          <Alert severity="warning" sx={{ mb: 3 }}>
            Tienes {stats.pendientes} liquidación(es) pendiente(s) de pago por un total de {formatCurrency(stats.totalPendiente)}.
          </Alert>
        )}

        {/* Filtros */}
        <Paper elevation={1} sx={{ p: 2, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Filtros de Búsqueda
          </Typography>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Motivo</InputLabel>
                <Select
                  value={filtros.motivo}
                  onChange={(e) => setFiltros({...filtros, motivo: e.target.value})}
                  label="Motivo"
                >
                  <MenuItem value="">Todos</MenuItem>
                  <MenuItem value="renuncia">Renuncia</MenuItem>
                  <MenuItem value="despido">Despido</MenuItem>
                  <MenuItem value="despido_justificado">Despido Justificado</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Estado</InputLabel>
                <Select
                  value={filtros.estado}
                  onChange={(e) => setFiltros({...filtros, estado: e.target.value})}
                  label="Estado"
                >
                  <MenuItem value="">Todos</MenuItem>
                  <MenuItem value="pendiente">Pendiente</MenuItem>
                  <MenuItem value="pagada">Pagada</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={3}>
              <DatePicker
                label="Fecha Desde"
                value={filtros.fechaInicio}
                onChange={(date) => setFiltros({...filtros, fechaInicio: date})}
                renderInput={(params) => <TextField {...params} size="small" fullWidth />}
              />
            </Grid>
            
            <Grid item xs={12} sm={3}>
              <DatePicker
                label="Fecha Hasta"
                value={filtros.fechaFin}
                onChange={(date) => setFiltros({...filtros, fechaFin: date})}
                renderInput={(params) => <TextField {...params} size="small" fullWidth />}
              />
            </Grid>
            
            <Grid item xs={12}>
              <Button onClick={clearFiltros} size="small">
                Limpiar Filtros
              </Button>
            </Grid>
          </Grid>
        </Paper>

        {/* Tabla con tabs */}
        <Paper elevation={1} sx={{ mb: 3 }}>
          <Tabs 
            value={tabValue} 
            onChange={(e, newValue) => setTabValue(newValue)}
            sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}
          >
            <Tab label={`Pendientes (${stats.pendientes})`} />
            <Tab label={`Pagadas (${stats.pagadas})`} />
            <Tab label={`Todas (${stats.total})`} />
          </Tabs>
          
          <Box sx={{ p: 2 }}>
            <TablaLiquidaciones
              liquidaciones={getLiquidacionesFiltradas()}
              onMarcarPagada={handleMarcarPagada}
              onVerResumen={handleVerResumen}
              onDescargarPDF={handleDescargarPDF}
              loading={loading}
            />
          </Box>
        </Paper>

        {/* FAB para crear liquidación */}
        <Fab
          color="warning"
          aria-label="add"
          sx={{ position: 'fixed', bottom: 16, right: 16 }}
          onClick={handleCreateLiquidacion}
        >
          <Add />
        </Fab>

        {/* Dialogs */}
        <FormularioLiquidacion
          open={formularioOpen}
          onClose={() => setFormularioOpen(false)}
          onSuccess={handleFormSuccess}
        />

        <ResumenLiquidacion
          open={resumenOpen}
          onClose={() => setResumenOpen(false)}
          liquidacion={selectedLiquidacion}
          onDescargarPDF={handleDescargarPDF}
        />
      </Box>
    </LocalizationProvider>
  );
};

export default Liquidaciones;