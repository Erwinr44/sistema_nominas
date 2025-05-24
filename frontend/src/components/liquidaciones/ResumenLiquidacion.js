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
  Card,
  CardContent,
  Divider,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Alert
} from '@mui/material';
import {
  Person,
  Business,
  CalendarToday,
  AttachMoney,
  GetApp
} from '@mui/icons-material';
import dayjs from '../../utils/dayjs';
import LiquidacionService from '../../services/liquidacion.service';

const ResumenLiquidacion = ({ open, onClose, liquidacion, onDescargarPDF }) => {
  const [resumen, setResumen] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open && liquidacion) {
      loadResumen();
    }
  }, [open, liquidacion]);

  const loadResumen = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await LiquidacionService.getResumen(liquidacion.id);
      setResumen(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return `Q${parseFloat(amount || 0).toLocaleString('es-GT', { minimumFractionDigits: 2 })}`;
  };

  const formatDate = (dateString) => {
    return dayjs(dateString).format('DD/MM/YYYY');
  };

  const getMotivoInfo = (motivo) => {
    const config = {
      renuncia: { color: 'primary', label: 'Renuncia Voluntaria' },
      despido: { color: 'warning', label: 'Despido sin Causa Justificada' },
      despido_justificado: { color: 'error', label: 'Despido con Causa Justificada' }
    };
    return config[motivo] || config.renuncia;
  };

  const getEstadoChip = (estado) => {
    const config = {
      pendiente: { color: 'warning', label: 'Pendiente de Pago' },
      pagada: { color: 'success', label: 'Pagada' }
    };
    
    const { color, label } = config[estado] || config.pendiente;
    return <Chip label={label} color={color} />;
  };

  const conceptosLiquidacion = [
    { key: 'indemnizacion', label: 'Indemnización', description: 'Compensación por finalización del contrato' },
    { key: 'aguinaldo_proporcional', label: 'Aguinaldo Proporcional', description: 'Proporcional al tiempo trabajado en el año' },
    { key: 'bono14_proporcional', label: 'Bono 14 Proporcional', description: 'Proporcional al tiempo trabajado en el año' },
    { key: 'vacaciones_pendientes', label: 'Vacaciones Pendientes', description: 'Días de vacaciones no tomados' },
    { key: 'otros_pagos', label: 'Otros Pagos', description: 'Conceptos adicionales' }
  ];

  const handleClose = () => {
    setResumen(null);
    setError('');
    onClose();
  };

  if (!liquidacion) return null;

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Typography variant="h6">
            Resumen de Liquidación - {liquidacion.empleado_nombre} {liquidacion.empleado_apellido}
          </Typography>
          {getEstadoChip(liquidacion.estado)}
        </Box>
      </DialogTitle>
      
      <DialogContent>
        {loading && (
          <Box display="flex" justifyContent="center" p={3}>
            <CircularProgress />
          </Box>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {resumen && (
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
                      Código
                    </Typography>
                    <Typography variant="body1">
                      {resumen.empleado.codigo}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Typography variant="subtitle2" color="textSecondary">
                      Nombre Completo
                    </Typography>
                    <Typography variant="body1">
                      {resumen.empleado.nombre} {resumen.empleado.apellido}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Typography variant="subtitle2" color="textSecondary">
                      Área
                    </Typography>
                    <Typography variant="body1">
                      {resumen.empleado.area_nombre || 'Sin área asignada'}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Typography variant="subtitle2" color="textSecondary">
                      Salario Base
                    </Typography>
                    <Typography variant="body1" fontWeight="bold">
                      {formatCurrency(resumen.empleado.salario)}
                    </Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            {/* Período de Servicio */}
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom display="flex" alignItems="center" gap={1}>
                  <CalendarToday color="primary" />
                  Período de Servicio
                </Typography>
                <Grid container spacing={3}>
                  <Grid item xs={12} sm={6} md={3}>
                    <Typography variant="subtitle2" color="textSecondary">
                      Fecha de Ingreso
                    </Typography>
                    <Typography variant="body1">
                      {formatDate(resumen.detalles.periodo_trabajado.fecha_inicio)}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Typography variant="subtitle2" color="textSecondary">
                      Fecha de Finalización
                    </Typography>
                    <Typography variant="body1">
                      {formatDate(resumen.detalles.periodo_trabajado.fecha_fin)}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Typography variant="subtitle2" color="textSecondary">
                      Años de Servicio
                    </Typography>
                    <Typography variant="h6" color="primary.main">
                      {resumen.detalles.periodo_trabajado.años} años
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Typography variant="subtitle2" color="textSecondary">
                      Días Totales
                    </Typography>
                    <Typography variant="body1">
                      {resumen.detalles.periodo_trabajado.dias_totales.toLocaleString()} días
                    </Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            {/* Motivo de Liquidación */}
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom display="flex" alignItems="center" gap={1}>
                  <Business color="primary" />
                  Motivo de Liquidación
                </Typography>
                <Box display="flex" alignItems="center" gap={2}>
                  <Chip 
                    label={getMotivoInfo(resumen.liquidacion.motivo).label}
                    color={getMotivoInfo(resumen.liquidacion.motivo).color}
                    size="large"
                  />
                  <Typography variant="body2" color="textSecondary">
                    Procesada el {formatDate(resumen.liquidacion.fecha_procesamiento)}
                  </Typography>
                </Box>
                {resumen.liquidacion.observaciones && (
                  <Box mt={2}>
                    <Typography variant="subtitle2" color="textSecondary">
                      Observaciones
                    </Typography>
                    <Typography variant="body2">
                      {resumen.liquidacion.observaciones}
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>

            {/* Desglose de Liquidación */}
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom display="flex" alignItems="center" gap={1}>
                  <AttachMoney color="primary" />
                  Desglose de Liquidación
                </Typography>
                <TableContainer component={Paper} variant="outlined">
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell><strong>Concepto</strong></TableCell>
                        <TableCell><strong>Descripción</strong></TableCell>
                        <TableCell align="right"><strong>Monto</strong></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {conceptosLiquidacion.map((concepto) => {
                        const monto = resumen.detalles.desglose[concepto.key];
                        if (!monto || parseFloat(monto) <= 0) return null;
                        
                        return (
                          <TableRow key={concepto.key}>
                            <TableCell>
                              <Typography variant="body2" fontWeight="medium">
                                {concepto.label}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" color="textSecondary">
                                {concepto.description}
                              </Typography>
                            </TableCell>
                            <TableCell align="right">
                              <Typography variant="body1" fontWeight="bold">
                                {formatCurrency(monto)}
                              </Typography>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                      <TableRow>
                        <TableCell colSpan={2}>
                          <Divider />
                        </TableCell>
                        <TableCell align="right">
                          <Divider />
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell colSpan={2}>
                          <Typography variant="h6" fontWeight="bold">
                            TOTAL A PAGAR
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="h5" fontWeight="bold" color="success.main">
                            {formatCurrency(resumen.detalles.total)}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Box>
        )}
      </DialogContent>
      
      <DialogActions>
        <Button onClick={handleClose}>
          Cerrar
        </Button>
        <Button
          onClick={() => onDescargarPDF(liquidacion.id)}
          variant="outlined"
          startIcon={<GetApp />}
        >
          Descargar PDF
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ResumenLiquidacion;