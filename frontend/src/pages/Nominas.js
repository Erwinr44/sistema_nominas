import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import NominaService from '../services/nomina.service';
import FormularioCalcularNomina from '../components/nominas/FormularioCalcularNomina';
import TablaNominas from '../components/nominas/TablaNominas';
import DetalleNomina from '../components/nominas/DetalleNomina';
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
  Select,
  Switch,
  FormControlLabel
} from '@mui/material';
import {
  Add,
  Business,
  Payment,
  Schedule,
  CheckCircle,
  TrendingUp,
  Groups,
  AccountBalance
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from '../utils/dayjs';

const Nominas = () => {
  const { isAdmin } = useAuth();
  const [nominas, setNominas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Estados para formularios y dialogs
  const [formularioOpen, setFormularioOpen] = useState(false);
  const [detalleOpen, setDetalleOpen] = useState(false);
  const [selectedNomina, setSelectedNomina] = useState(null);
  
  // Estados para filtros
  const [filtros, setFiltros] = useState({
    tipo: '',
    estado: '',
    fechaInicio: null,
    fechaFin: null,
    empleadoId: '',
    groupByPeriod: false
  });
  
  // Estados para tabs
  const [tabValue, setTabValue] = useState(0);

  // Estadísticas
  const [stats, setStats] = useState({
    totalNominas: 0,
    empleadosActivos: 0,
    procesadas: 0,
    pagadas: 0,
    totalPendiente: 0,
    totalPagado: 0,
    nominasSemanales: 0,
    nominasQuincenales: 0,
    nominasMensuales: 0,
    promedioNomina: 0
  });

  // Períodos sugeridos
  const [periodosSugeridos, setPeriodosSugeridos] = useState(null);
  const [loadingPeriodos, setLoadingPeriodos] = useState(false);

  // carga de datos
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      
      // filtros
      const params = {};
      if (filtros.tipo) params.tipo = filtros.tipo;
      if (filtros.fechaInicio) params.fechaInicio = filtros.fechaInicio.format('YYYY-MM-DD');
      if (filtros.fechaFin) params.fechaFin = filtros.fechaFin.format('YYYY-MM-DD');
      
      // endpoint
      const data = (filtros.fechaInicio || filtros.fechaFin) 
        ? await NominaService.getByPeriodo(params)
        : await NominaService.getAll(params);
      
      setNominas(data.nominas || data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [filtros]);

  const loadPeriodosSugeridos = async () => {
    try {
      setLoadingPeriodos(true);
      const data = await NominaService.getPeriodosSugeridos();
      setPeriodosSugeridos(data);
    } catch (err) {
      console.error('Error al cargar períodos sugeridos:', err);
    } finally {
      setLoadingPeriodos(false);
    }
  };

  const calculateStats = useCallback(() => {
    const totalNominas = nominas.length;
    const empleadosUnicos = new Set(nominas.map(n => n.empleado_id)).size;
    const procesadas = nominas.filter(n => n.estado === 'procesada').length;
    const pagadas = nominas.filter(n => n.estado === 'pagada').length;
    
    const totalPendiente = nominas
      .filter(n => n.estado === 'procesada')
      .reduce((sum, n) => sum + parseFloat(n.total_neto || 0), 0);
    
    const totalPagado = nominas
      .filter(n => n.estado === 'pagada')
      .reduce((sum, n) => sum + parseFloat(n.total_neto || 0), 0);
    
    const nominasSemanales = nominas.filter(n => n.tipo === 'semanal').length;
    const nominasQuincenales = nominas.filter(n => n.tipo === 'quincenal').length;
    const nominasMensuales = nominas.filter(n => n.tipo === 'mensual').length;
    
    const promedioNomina = totalNominas > 0 
      ? (totalPendiente + totalPagado) / totalNominas 
      : 0;

    setStats({
      totalNominas,
      empleadosActivos: empleadosUnicos,
      procesadas,
      pagadas,
      totalPendiente,
      totalPagado,
      nominasSemanales,
      nominasQuincenales,
      nominasMensuales,
      promedioNomina
    });
  }, [nominas]);

  // useEffect corregidos
  useEffect(() => {
    loadData();
    loadPeriodosSugeridos();
  }, [loadData]);

  useEffect(() => {
    if (nominas.length > 0) {
      calculateStats();
    }
  }, [nominas, calculateStats]);

  const handleCreateNomina = () => {
    setFormularioOpen(true);
  };

  const handleFormSuccess = () => {
    loadData(); // Recargar datos después de crear nómina
  };

  const handleMarcarPagada = async (id) => {
    try {
      await NominaService.marcarComoPagada(id);
      await loadData(); // Recargar datos
    } catch (err) {
      setError(err.message);
    }
  };

  const handleVerDetalle = (nomina) => {
    setSelectedNomina(nomina);
    setDetalleOpen(true);
  };

  const handleDescargarPDF = async (id, empleadoNombre) => {
    try {
      const pdfBlob = await NominaService.descargarReciboPDF(id);
      
      // Crear URL del blob y descargar
      const url = window.URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `recibo-nomina-${empleadoNombre}-${id}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(err.message);
    }
  };

  const getNominasFiltradas = () => {
    let filtered = nominas;
    
    if (tabValue === 0) {
      filtered = nominas.filter(n => n.estado === 'procesada');
    } else if (tabValue === 1) {
      filtered = nominas.filter(n => n.estado === 'pagada');
    }
    
    // Filtros adicionales
    if (filtros.estado && tabValue === 2) {
      filtered = filtered.filter(n => n.estado === filtros.estado);
    }
    
    return filtered;
  };

  const clearFiltros = () => {
    setFiltros({
      tipo: '',
      estado: '',
      fechaInicio: null,
      fechaFin: null,
      empleadoId: '',
      groupByPeriod: false
    });
  };

  const usarPeriodoSugerido = (tipo) => {
    if (!periodosSugeridos || !periodosSugeridos[tipo]) return;
    
    const periodo = periodosSugeridos[tipo];
    setFiltros({
      ...filtros,
      tipo,
      fechaInicio: dayjs(periodo.fechaInicio),
      fechaFin: dayjs(periodo.fechaFin)
    });
  };

  const formatCurrency = (amount) => {
    return `Q${parseFloat(amount || 0).toLocaleString('es-GT', { minimumFractionDigits: 2 })}`;
  };

  const StatCard = ({ title, value, icon, color = 'primary', isCurrency = false, subtitle = '' }) => (
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
            {subtitle && (
              <Typography variant="caption" color="textSecondary">
                {subtitle}
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

  if (loading && nominas.length === 0) {
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
            Gestión de Nóminas
          </Typography>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={handleCreateNomina}
            color="primary"
          >
            Calcular Nómina
          </Button>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* Períodos Sugeridos */}
        {periodosSugeridos && !loadingPeriodos && (
          <Paper elevation={1} sx={{ p: 2, mb: 3, bgcolor: 'info.50' }}>
            <Typography variant="h6" gutterBottom color="info.main">
              Períodos Sugeridos para Calcular
            </Typography>
            <Grid container spacing={1}>
              {Object.entries(periodosSugeridos).map(([tipo, periodo]) => (
                <Grid item key={tipo}>
                  <Chip
                    label={`${tipo.charAt(0).toUpperCase() + tipo.slice(1)}: ${dayjs(periodo.fechaInicio).format('DD/MM')} - ${dayjs(periodo.fechaFin).format('DD/MM')}`}
                    onClick={() => usarPeriodoSugerido(tipo)}
                    color="info"
                    variant="outlined"
                    clickable
                  />
                </Grid>
              ))}
            </Grid>
          </Paper>
        )}

        {/* Estadísticas principales */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Total Nóminas"
              value={stats.totalNominas}
              icon={<Business fontSize="large" />}
              color="primary"
              subtitle={`${stats.empleadosActivos} empleados únicos`}
            />
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Pendientes de Pago"
              value={stats.procesadas}
              icon={<Schedule fontSize="large" />}
              color="warning"
              subtitle={formatCurrency(stats.totalPendiente)}
            />
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Pagadas"
              value={stats.pagadas}
              icon={<CheckCircle fontSize="large" />}
              color="success"
              subtitle={formatCurrency(stats.totalPagado)}
            />
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Promedio por Nómina"
              value={stats.promedioNomina}
              icon={<TrendingUp fontSize="large" />}
              color="info"
              isCurrency={true}
            />
          </Grid>
        </Grid>

        {/* Estadísticas por tipo */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={4}>
            <StatCard
              title="Nóminas Semanales"
              value={stats.nominasSemanales}
              icon={<Groups fontSize="large" />}
              color="info"
            />
          </Grid>
          
          <Grid item xs={12} sm={4}>
            <StatCard
              title="Nóminas Quincenales"
              value={stats.nominasQuincenales}
              icon={<AccountBalance fontSize="large" />}
              color="primary"
            />
          </Grid>
          
          <Grid item xs={12} sm={4}>
            <StatCard
              title="Nóminas Mensuales"
              value={stats.nominasMensuales}
              icon={<Payment fontSize="large" />}
              color="secondary"
            />
          </Grid>
        </Grid>

        {/* Alertas */}
        {stats.procesadas > 0 && (
          <Alert severity="warning" sx={{ mb: 3 }}>
            Tienes {stats.procesadas} nómina(s) pendiente(s) de pago por un total de {formatCurrency(stats.totalPendiente)}.
          </Alert>
        )}

        {/* Filtros */}
        <Paper elevation={1} sx={{ p: 2, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Filtros de Búsqueda
          </Typography>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={6} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Tipo</InputLabel>
                <Select
                  value={filtros.tipo}
                  onChange={(e) => setFiltros({...filtros, tipo: e.target.value})}
                  label="Tipo"
                >
                  <MenuItem value="">Todos</MenuItem>
                  <MenuItem value="semanal">Semanal</MenuItem>
                  <MenuItem value="quincenal">Quincenal</MenuItem>
                  <MenuItem value="mensual">Mensual</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6} md={2}>
              <DatePicker
                label="Fecha Desde"
                value={filtros.fechaInicio}
                onChange={(date) => setFiltros({...filtros, fechaInicio: date})}
                renderInput={(params) => <TextField {...params} size="small" fullWidth />}
              />
            </Grid>
            
            <Grid item xs={12} sm={6} md={2}>
              <DatePicker
                label="Fecha Hasta"
                value={filtros.fechaFin}
                onChange={(date) => setFiltros({...filtros, fechaFin: date})}
                renderInput={(params) => <TextField {...params} size="small" fullWidth />}
              />
            </Grid>
            
            <Grid item xs={12} sm={6} md={2}>
              <FormControlLabel
                control={
                  <Switch
                    checked={filtros.groupByPeriod}
                    onChange={(e) => setFiltros({...filtros, groupByPeriod: e.target.checked})}
                  />
                }
                label="Agrupar por período"
              />
            </Grid>
            
            <Grid item xs={12} sm={6} md={2}>
              <Button onClick={clearFiltros} size="small" fullWidth>
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
            <Tab label={`Pendientes (${stats.procesadas})`} />
            <Tab label={`Pagadas (${stats.pagadas})`} />
            <Tab label={`Todas (${stats.totalNominas})`} />
          </Tabs>
          
          <Box sx={{ p: 2 }}>
            <TablaNominas
              nominas={nominas}
              onMarcarPagada={handleMarcarPagada}
              onVerDetalle={handleVerDetalle}
              loading={loading}
          />
          </Box>
        </Paper>

        {/* FAB para calcular nómina */}
        <Fab
          color="primary"
          aria-label="add"
          sx={{ position: 'fixed', bottom: 16, right: 16 }}
          onClick={handleCreateNomina}
        >
          <Add />
        </Fab>

        {/* Dialogs */}
        <FormularioCalcularNomina
          open={formularioOpen}
          onClose={() => setFormularioOpen(false)}
          onSuccess={handleFormSuccess}
        />

        <DetalleNomina
          open={detalleOpen}
          onClose={() => setDetalleOpen(false)}
          nomina={selectedNomina}
          onDescargarPDF={handleDescargarPDF}
        />
      </Box>
    </LocalizationProvider>
  );
};

export default Nominas;