// src/components/nominas/DetalleNomina.js
import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  Paper
} from '@mui/material';
import {
  Person,
  CalendarToday,
  AttachMoney,
  GetApp,
  AccountBalance,
  MonetizationOn,
  TrendingUp,
  Payment,
  RemoveCircle
} from '@mui/icons-material';
import dayjs from '../../utils/dayjs';

const DetalleNomina = ({ open, onClose, nomina, onDescargarPDF }) => {
  const formatCurrency = (amount) => {
    return `Q${parseFloat(amount || 0).toLocaleString('es-GT', { minimumFractionDigits: 2 })}`;
  };

  const formatDate = (dateString) => {
    return dayjs(dateString).format('DD/MM/YYYY');
  };

  const getTipoInfo = (tipo) => {
    const config = {
      semanal: { color: 'info', label: 'Nómina Semanal' },
      quincenal: { color: 'primary', label: 'Nómina Quincenal' },
      mensual: { color: 'secondary', label: 'Nómina Mensual' }
    };
    return config[tipo] || config.quincenal;
  };

  const getEstadoChip = (estado) => {
    const config = {
      procesada: { color: 'warning', label: 'Procesada' },
      pagada: { color: 'success', label: 'Pagada' }
    };
    
    const { color, label } = config[estado] || config.procesada;
    return <Chip label={label} color={color} />;
  };

  // Conceptos de percepciones
  const percepciones = [
    { key: 'salario_base', label: 'Salario Base', icon: <AccountBalance /> },
    { key: 'bono_incentivo', label: 'Bonificación Incentivo', icon: <MonetizationOn /> },
    { key: 'horas_extra', label: 'Horas Extra', icon: <TrendingUp /> },
    { key: 'aguinaldo', label: 'Aguinaldo', icon: <Payment /> },
    { key: 'bono14', label: 'Bono 14', icon: <Payment /> },
    { key: 'otras_percepciones', label: 'Otras Percepciones', icon: <AttachMoney /> }
  ];

  // Conceptos de deducciones
  const deducciones = [
    { key: 'igss', label: 'IGSS (4.83%)', icon: <RemoveCircle /> },
    { key: 'isr', label: 'ISR', icon: <RemoveCircle /> },
    { key: 'otras_deducciones', label: 'Otras Deducciones', icon: <RemoveCircle /> }
  ];

  const handleClose = () => {
    onClose();
  };

  if (!nomina) return null;

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Typography variant="h6">
            Detalle de Nómina - {nomina.nombre} {nomina.apellido}
          </Typography>
          {getEstadoChip(nomina.estado)}
        </Box>
      </DialogTitle>
      
      <DialogContent>
        <Box>
          {/* Información del Empleado */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom display="flex" alignItems="center" gap={1}>
                <Person color="primary" />
                Información del Empleado
              </Typography>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6} md={3}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Número de Empleado
                  </Typography>
                  <Typography variant="body1">
                    {nomina.numero_empleado || nomina.empleado_id}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Nombre Completo
                  </Typography>
                  <Typography variant="body1">
                    {nomina.nombre} {nomina.apellido}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Área
                  </Typography>
                  <Typography variant="body1">
                    {nomina.area_nombre || 'Sin área asignada'}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Salario Base
                  </Typography>
                  <Typography variant="body1" fontWeight="bold">
                    {formatCurrency(nomina.salario_base)}
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Información del Período */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom display="flex" alignItems="center" gap={1}>
                <CalendarToday color="primary" />
                Período de Nómina
              </Typography>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6} md={3}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Tipo de Nómina
                  </Typography>
                  <Chip 
                    label={getTipoInfo(nomina.tipo).label}
                    color={getTipoInfo(nomina.tipo).color}
                    size="medium"
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Fecha de Inicio
                  </Typography>
                  <Typography variant="body1">
                    {formatDate(nomina.fecha_inicio)}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Fecha de Fin
                  </Typography>
                  <Typography variant="body1">
                    {formatDate(nomina.fecha_fin)}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Fecha de Procesamiento
                  </Typography>
                  <Typography variant="body1">
                    {formatDate(nomina.fecha_procesamiento)}
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Desglose Detallado */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom display="flex" alignItems="center" gap={1}>
                <AttachMoney color="primary" />
                Desglose de Nómina
              </Typography>
              
              <Grid container spacing={3}>
                {/* Percepciones */}
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle1" color="success.main" gutterBottom>
                    Percepciones
                  </Typography>
                  <List dense>
                    {percepciones.map((concepto) => {
                      const monto = nomina[concepto.key];
                      if (!monto || parseFloat(monto) <= 0) return null;
                      
                      return (
                        <ListItem key={concepto.key}>
                          <ListItemIcon>
                            {concepto.icon}
                          </ListItemIcon>
                          <ListItemText
                            primary={concepto.label}
                            secondary={formatCurrency(monto)}
                          />
                        </ListItem>
                      );
                    })}
                  </List>
                </Grid>

                {/* Deducciones */}
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle1" color="error.main" gutterBottom>
                    Deducciones
                  </Typography>
                  <List dense>
                    {deducciones.map((concepto) => {
                      const monto = nomina[concepto.key];
                      if (!monto || parseFloat(monto) <= 0) return null;
                      
                      return (
                        <ListItem key={concepto.key}>
                          <ListItemIcon>
                            {concepto.icon}
                          </ListItemIcon>
                          <ListItemText
                            primary={concepto.label}
                            secondary={`-${formatCurrency(monto)}`}
                          />
                        </ListItem>
                      );
                    })}
                  </List>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Resumen Final */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Resumen Final
              </Typography>
              <TableContainer component={Paper} variant="outlined">
                <Table>
                  <TableBody>
                    <TableRow>
                      <TableCell>
                        <Typography variant="body1" fontWeight="medium">
                          Total Bruto
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="h6" color="success.main">
                          {formatCurrency(nomina.total_bruto)}
                        </Typography>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>
                        <Typography variant="body1" fontWeight="medium">
                          Total Deducciones
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="h6" color="error.main">
                          -{formatCurrency(nomina.total_deducciones)}
                        </Typography>
                      </TableCell>
                    </TableRow>
                    <TableRow sx={{ bgcolor: 'action.hover' }}>
                      <TableCell>
                        <Typography variant="h6" fontWeight="bold">
                          TOTAL NETO A PAGAR
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="h5" fontWeight="bold" color="primary.main">
                          {formatCurrency(nomina.total_neto)}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Box>
      </DialogContent>
      
      <DialogActions>
        <Button onClick={handleClose}>
          Cerrar
        </Button>
        <Button
          onClick={() => onDescargarPDF(nomina.id, `${nomina.nombre}-${nomina.apellido}`)}
          variant="contained"
          startIcon={<GetApp />}
        >
          Descargar PDF
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DetalleNomina;