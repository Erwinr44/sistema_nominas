import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import NominaService from '../services/nomina.service';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,

  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Alert,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon
} from '@mui/material';
import {
  Download,
  Visibility,
  FilterList,
  Payment,
  AccountBalance,
  TrendingUp,
  MonetizationOn,
  Receipt
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from '../utils/dayjs';
import 'dayjs/locale/es';

dayjs.locale('es');

const MiNomina = () => {
  const { user } = useAuth();
  const [nominas, setNominas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedNomina, setSelectedNomina] = useState(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [downloadingPDF, setDownloadingPDF] = useState(null);
  
  // Filtros
  const [filters, setFilters] = useState({
    tipo: '',
    fechaInicio: null,
    fechaFin: null,
    limite: 10
  });
  const [showFilters, setShowFilters] = useState(false);

  // Estadísticas
  const [stats, setStats] = useState({
    totalNominas: 0,
    totalPagado: 0,
    promedioMensual: 0,
    ultimoPago: 0
  });

  useEffect(() => {
    loadNominas();
  }, [filters]);

  useEffect(() => {
    if (nominas.length > 0) {
      calculateStats();
    }
  }, [nominas]);

  const loadNominas = async () => {
    try {
      setLoading(true);
      setError('');
      
      const params = {};
      if (filters.tipo) params.tipo = filters.tipo;
      if (filters.fechaInicio) params.fechaInicio = filters.fechaInicio.format('YYYY-MM-DD');
      if (filters.fechaFin) params.fechaFin = filters.fechaFin.format('YYYY-MM-DD');
      if (filters.limite) params.limite = filters.limite;

      const data = await NominaService.getByEmpleado(user.id, params);
      setNominas(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = () => {
    const totalNominas = nominas.length;
    const totalPagado = nominas.reduce((sum, nomina) => sum + parseFloat(nomina.total_neto), 0);
    const promedioMensual = totalNominas > 0 ? totalPagado / totalNominas : 0;
    const ultimoPago = nominas.length > 0 ? parseFloat(nominas[0].total_neto) : 0;

    setStats({
      totalNominas,
      totalPagado,
      promedioMensual,
      ultimoPago
    });
  };

  const handleViewDetail = async (nominaId) => {
    try {
      const nomina = await NominaService.getById(nominaId);
      setSelectedNomina(nomina);
      setDetailDialogOpen(true);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDownloadPDF = async (nominaId, empleadoNombre) => {
    try {
      setDownloadingPDF(nominaId);
      const pdfBlob = await NominaService.descargarReciboPDF(nominaId);
      
      // Crear URL del blob y descargar
      const url = window.URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `recibo-nomina-${empleadoNombre}-${nominaId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(err.message);
    } finally {
      setDownloadingPDF(null);
    }
  };

  const clearFilters = () => {
    setFilters({
      tipo: '',
      fechaInicio: null,
      fechaFin: null,
      limite: 10
    });
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

  const getEstadoChip = (estado) => {
    const color = estado === 'pagada' ? 'success' : 'warning';
    const label = estado === 'pagada' ? 'Pagada' : 'Procesada';
    return <Chip label={label} color={color} size="small" />;
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="es">
      <Box>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h4" gutterBottom>
            Mi Nómina
          </Typography>
          <Button
            variant="outlined"
            startIcon={<FilterList />}
            onClick={() => setShowFilters(!showFilters)}
          >
            Filtros
          </Button>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>       
        )}

        {/* Estadísticas */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card elevation={3}>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography color="textSecondary" gutterBottom>
                      Total Nóminas
                    </Typography>
                    <Typography variant="h4">
                      {stats.totalNominas}
                    </Typography>
                  </Box>
                  <Receipt color="primary" fontSize="large" />
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card elevation={3}>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography color="textSecondary" gutterBottom>
                      Total Pagado
                    </Typography>
                    <Typography variant="h5">
                      {formatCurrency(stats.totalPagado)}
                    </Typography>
                  </Box>
                  <MonetizationOn color="success" fontSize="large" />
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card elevation={3}>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography color="textSecondary" gutterBottom>
                      Promedio
                    </Typography>
                    <Typography variant="h5">
                      {formatCurrency(stats.promedioMensual)}
                    </Typography>
                  </Box>
                  <TrendingUp color="info" fontSize="large" />
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card elevation={3}>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography color="textSecondary" gutterBottom>
                      Último Pago
                    </Typography>
                    <Typography variant="h5">
                      {formatCurrency(stats.ultimoPago)}
                    </Typography>
                  </Box>
                  <Payment color="secondary" fontSize="large" />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Filtros */}
        {showFilters && (
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Filtros de Búsqueda
              </Typography>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} sm={6} md={2}>
                  <FormControl fullWidth>
                    <InputLabel>Tipo</InputLabel>
                    <Select
                      value={filters.tipo}
                      label="Tipo"
                      onChange={(e) => setFilters({...filters, tipo: e.target.value})}
                    >
                      <MenuItem value="">Todos</MenuItem>
                      <MenuItem value="semanal">Semanal</MenuItem>
                      <MenuItem value="quincenal">Quincenal</MenuItem>
                      <MenuItem value="mensual">Mensual</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12} sm={6} md={3}>
                  <DatePicker
                    label="Fecha Inicio"
                    value={filters.fechaInicio}
                    onChange={(date) => setFilters({...filters, fechaInicio: date})}
                    renderInput={(params) => <TextField {...params} fullWidth />}
                  />
                </Grid>
                
                <Grid item xs={12} sm={6} md={3}>
                  <DatePicker
                    label="Fecha Fin"
                    value={filters.fechaFin}
                    onChange={(date) => setFilters({...filters, fechaFin: date})}
                    renderInput={(params) => <TextField {...params} fullWidth />}
                  />
                </Grid>
                
                <Grid item xs={12} sm={6} md={2}>
                  <TextField
                    fullWidth
                    label="Límite"
                    type="number"
                    value={filters.limite}
                    onChange={(e) => setFilters({...filters, limite: e.target.value})}
                    inputProps={{ min: 1, max: 100 }}
                  />
                </Grid>
                
                <Grid item xs={12} sm={6} md={2}>
                  <Button
                    variant="outlined"
                    fullWidth
                    onClick={clearFilters}
                  >
                    Limpiar
                  </Button>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        )}

        {/* Tabla de Nóminas */}
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Historial de Nóminas
            </Typography>
            
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Período</TableCell>
                    <TableCell>Tipo</TableCell>
                    <TableCell align="right">Salario Base</TableCell>
                    <TableCell align="right">Total Bruto</TableCell>
                    <TableCell align="right">Deducciones</TableCell>
                    <TableCell align="right">Total Neto</TableCell>
                    <TableCell>Estado</TableCell>
                    <TableCell>Acciones</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {nominas.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} align="center">
                        <Typography variant="body2" color="textSecondary">
                          No se encontraron nóminas
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    nominas.map((nomina) => (
                      <TableRow key={nomina.id} hover>
                        <TableCell>
                          {formatDate(nomina.fecha_inicio)} - {formatDate(nomina.fecha_fin)}
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={nomina.tipo} 
                            variant="outlined" 
                            size="small"
                          />
                        </TableCell>
                        <TableCell align="right">
                          {formatCurrency(nomina.salario_base)}
                        </TableCell>
                        <TableCell align="right">
                          {formatCurrency(nomina.total_bruto)}
                        </TableCell>
                        <TableCell align="right">
                          {formatCurrency(nomina.total_deducciones)}
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" fontWeight="bold">
                            {formatCurrency(nomina.total_neto)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          {getEstadoChip(nomina.estado)}
                        </TableCell>
                        <TableCell>
                          <IconButton
                            color="primary"
                            onClick={() => handleViewDetail(nomina.id)}
                            title="Ver detalles"
                          >
                            <Visibility />
                          </IconButton>
                          <IconButton
                            color="secondary"
                            onClick={() => handleDownloadPDF(nomina.id, `${user.nombre}-${user.apellido}`)}
                            disabled={downloadingPDF === nomina.id}
                            title="Descargar PDF"
                          >
                            {downloadingPDF === nomina.id ? (
                              <CircularProgress size={20} />
                            ) : (
                              <Download />
                            )}
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>

        {/* Dialog de Detalles */}
        <Dialog
          open={detailDialogOpen}
          onClose={() => setDetailDialogOpen(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            Detalle de Nómina
          </DialogTitle>
          <DialogContent>
            {selectedNomina && (
              <Box>
                <Grid container spacing={2} sx={{ mb: 3 }}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="textSecondary">
                      Período
                    </Typography>
                    <Typography variant="body1">
                      {formatDate(selectedNomina.fecha_inicio)} - {formatDate(selectedNomina.fecha_fin)}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="textSecondary">
                      Tipo de Nómina
                    </Typography>
                    <Typography variant="body1" textTransform="capitalize">
                      {selectedNomina.tipo}
                    </Typography>
                  </Grid>
                </Grid>

                <Divider sx={{ my: 2 }} />

                <Typography variant="h6" gutterBottom>
                  Percepciones
                </Typography>
                <List dense>
                  <ListItem>
                    <ListItemIcon>
                      <AccountBalance />
                    </ListItemIcon>
                    <ListItemText
                      primary="Salario Base"
                      secondary={formatCurrency(selectedNomina.salario_base)}
                    />
                  </ListItem>
                  
                  <ListItem>
                    <ListItemIcon>
                      <MonetizationOn />
                    </ListItemIcon>
                    <ListItemText
                      primary="Bonificación Incentivo"
                      secondary={formatCurrency(selectedNomina.bono_incentivo)}
                    />
                  </ListItem>

                  {selectedNomina.horas_extra > 0 && (
                    <ListItem>
                      <ListItemIcon>
                        <TrendingUp />
                      </ListItemIcon>
                      <ListItemText
                        primary="Horas Extra"
                        secondary={formatCurrency(selectedNomina.horas_extra)}
                      />
                    </ListItem>
                  )}

                  {selectedNomina.aguinaldo > 0 && (
                    <ListItem>
                      <ListItemIcon>
                        <Payment />
                      </ListItemIcon>
                      <ListItemText
                        primary="Aguinaldo"
                        secondary={formatCurrency(selectedNomina.aguinaldo)}
                      />
                    </ListItem>
                  )}

                  {selectedNomina.bono14 > 0 && (
                    <ListItem>
                      <ListItemIcon>
                        <Payment />
                      </ListItemIcon>
                      <ListItemText
                        primary="Bono 14"
                        secondary={formatCurrency(selectedNomina.bono14)}
                      />
                    </ListItem>
                  )}
                </List>

                <Divider sx={{ my: 2 }} />

                <Typography variant="h6" gutterBottom>
                  Deducciones
                </Typography>
                <List dense>
                  <ListItem>
                    <ListItemText
                      primary="IGSS (4.83%)"
                      secondary={formatCurrency(selectedNomina.igss)}
                    />
                  </ListItem>
                  
                  {selectedNomina.isr > 0 && (
                    <ListItem>
                      <ListItemText
                        primary="ISR"
                        secondary={formatCurrency(selectedNomina.isr)}
                      />
                    </ListItem>
                  )}

                  {selectedNomina.otras_deducciones > 0 && (
                    <ListItem>
                      <ListItemText
                        primary="Otras Deducciones"
                        secondary={formatCurrency(selectedNomina.otras_deducciones)}
                      />
                    </ListItem>
                  )}
                </List>

                <Divider sx={{ my: 2 }} />

                <Grid container spacing={2}>
                  <Grid item xs={12} sm={4}>
                    <Typography variant="subtitle2" color="textSecondary">
                      Total Bruto
                    </Typography>
                    <Typography variant="h6">
                      {formatCurrency(selectedNomina.total_bruto)}
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={12} sm={4}>
                    <Typography variant="subtitle2" color="textSecondary">
                      Total Deducciones
                    </Typography>
                    <Typography variant="h6" color="error">
                      -{formatCurrency(selectedNomina.total_deducciones)}
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={12} sm={4}>
                    <Typography variant="subtitle2" color="textSecondary">
                      Total Neto
                    </Typography>
                    <Typography variant="h5" color="success.main" fontWeight="bold">
                      {formatCurrency(selectedNomina.total_neto)}
                    </Typography>
                  </Grid>
                </Grid>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDetailDialogOpen(false)}>
              Cerrar
            </Button>
            {selectedNomina && (
              <Button
                variant="contained"
                startIcon={<Download />}
                onClick={() => handleDownloadPDF(selectedNomina.id, `${user.nombre}-${user.apellido}`)}
              >
                Descargar PDF
              </Button>
            )}
          </DialogActions>
        </Dialog>
      </Box>
    </LocalizationProvider>
  );
};

export default MiNomina;
