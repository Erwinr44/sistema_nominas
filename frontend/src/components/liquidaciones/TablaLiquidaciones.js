// src/components/liquidaciones/TablaLiquidaciones.js
import React, { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Grid,
  Alert,
  CircularProgress,
  Avatar,
  Tooltip
} from '@mui/material';
import {
  Visibility,
  GetApp,
  Payment,
  Person,
  Business,
  CalendarToday
} from '@mui/icons-material';
import dayjs from '../../utils/dayjs';

const TablaLiquidaciones = ({ liquidaciones, onMarcarPagada, onVerResumen, onDescargarPDF, loading }) => {
  const [selectedLiquidacion, setSelectedLiquidacion] = useState(null);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);

  const formatDate = (dateString) => {
    return dayjs(dateString).format('DD/MM/YYYY');
  };

  const formatCurrency = (amount) => {
    return `Q${parseFloat(amount || 0).toLocaleString('es-GT', { minimumFractionDigits: 2 })}`;
  };

  const getEstadoChip = (estado) => {
    const config = {
      pendiente: { color: 'warning', label: 'Pendiente de Pago' },
      pagada: { color: 'success', label: 'Pagada' }
    };
    
    const { color, label } = config[estado] || config.pendiente;
    return <Chip label={label} color={color} size="small" />;
  };

  const getMotivoChip = (motivo) => {
    const config = {
      renuncia: { color: 'primary', label: 'Renuncia' },
      despido: { color: 'warning', label: 'Despido' },
      despido_justificado: { color: 'error', label: 'Despido Justificado' }
    };
    
    const { color, label } = config[motivo] || config.renuncia;
    return <Chip label={label} color={color} size="small" variant="outlined" />;
  };

  const handlePaymentClick = (liquidacion) => {
    setSelectedLiquidacion(liquidacion);
    setPaymentDialogOpen(true);
  };

  const handleConfirmPayment = async () => {
    if (!selectedLiquidacion) return;

    setProcessingPayment(true);
    try {
      await onMarcarPagada(selectedLiquidacion.id);
      setPaymentDialogOpen(false);
      setSelectedLiquidacion(null);
    } catch (error) {
      console.error('Error al marcar como pagada:', error);
    } finally {
      setProcessingPayment(false);
    }
  };

  const getDiasPendientes = (fechaProcesamiento) => {
    return dayjs().diff(dayjs(fechaProcesamiento), 'day');
  };

  const getPriorityColor = (liquidacion) => {
    if (liquidacion.estado === 'pagada') return 'success';
    
    const dias = getDiasPendientes(liquidacion.fecha_procesamiento);
    if (dias >= 30) return 'error'; // Más de 30 días - urgente
    if (dias >= 15) return 'warning'; // 15-30 días - importante
    return 'info'; // Menos de 15 días - normal
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={3}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Empleado</TableCell>
              <TableCell>Motivo</TableCell>
              <TableCell>Período</TableCell>
              <TableCell>Total Liquidación</TableCell>
              <TableCell>Estado</TableCell>
              <TableCell>Procesada</TableCell>
              <TableCell>Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {liquidaciones.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  <Typography variant="body2" color="textSecondary">
                    No hay liquidaciones registradas
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              liquidaciones.map((liquidacion) => (
                <TableRow key={liquidacion.id} hover>
                  <TableCell>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
                        <Person />
                      </Avatar>
                      <Box>
                        <Typography variant="body2">
                          <strong>{liquidacion.empleado_nombre} {liquidacion.empleado_apellido}</strong>
                        </Typography>
                        <Chip
                          size="small"
                          label={liquidacion.estado === 'pagada' ? 'Pagada' : `${getDiasPendientes(liquidacion.fecha_procesamiento)} días`}
                          color={getPriorityColor(liquidacion)}
                          variant="outlined"
                        />
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    {getMotivoChip(liquidacion.motivo)}
                  </TableCell>
                  <TableCell>
                    <Box>
                      <Typography variant="body2" display="flex" alignItems="center" gap={0.5}>
                        <CalendarToday fontSize="small" />
                        <strong>{liquidacion.años_servicio}</strong> años
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        {formatDate(liquidacion.fecha_inicio)} - {formatDate(liquidacion.fecha_fin)}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body1" fontWeight="bold" color="success.main">
                      {formatCurrency(liquidacion.total_liquidacion)}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      Total a pagar
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {getEstadoChip(liquidacion.estado)}
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {formatDate(liquidacion.fecha_procesamiento)}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      por {liquidacion.procesado_por_nombre}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box display="flex" gap={0.5}>
                      <Tooltip title="Ver resumen detallado">
                        <IconButton
                          color="primary"
                          onClick={() => onVerResumen(liquidacion)}
                          size="small"
                        >
                          <Visibility />
                        </IconButton>
                      </Tooltip>
                      
                      <Tooltip title="Descargar finiquito PDF">
                        <IconButton
                          color="secondary"
                          onClick={() => onDescargarPDF(liquidacion.id)}
                          size="small"
                        >
                          <GetApp />
                        </IconButton>
                      </Tooltip>
                      
                      {liquidacion.estado === 'pendiente' && (
                        <Tooltip title="Marcar como pagada">
                          <IconButton
                            color="success"
                            onClick={() => handlePaymentClick(liquidacion)}
                            size="small"
                          >
                            <Payment />
                          </IconButton>
                        </Tooltip>
                      )}
                    </Box>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Dialog de Confirmación de Pago */}
      <Dialog
        open={paymentDialogOpen}
        onClose={() => setPaymentDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Confirmar Pago de Liquidación
        </DialogTitle>
        <DialogContent>
          {selectedLiquidacion && (
            <>
              <Alert severity="info" sx={{ mb: 2 }}>
                ¿Confirmas que se ha realizado el pago de esta liquidación?
              </Alert>
              
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Empleado
                  </Typography>
                  <Typography variant="body1">
                    {selectedLiquidacion.empleado_nombre} {selectedLiquidacion.empleado_apellido}
                  </Typography>
                </Grid>

                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Motivo
                  </Typography>
                  <Typography variant="body1">
                    {getMotivoChip(selectedLiquidacion.motivo)}
                  </Typography>
                </Grid>

                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Total a Pagar
                  </Typography>
                  <Typography variant="h6" color="success.main" fontWeight="bold">
                    {formatCurrency(selectedLiquidacion.total_liquidacion)}
                  </Typography>
                </Grid>

                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Período de Servicio
                  </Typography>
                  <Typography variant="body1">
                    {formatDate(selectedLiquidacion.fecha_inicio)} - {formatDate(selectedLiquidacion.fecha_fin)}
                    ({selectedLiquidacion.años_servicio} años)
                  </Typography>
                </Grid>
              </Grid>

              <Alert severity="warning" sx={{ mt: 2 }}>
                <Typography variant="body2">
                  <strong>Importante:</strong> Una vez marcada como pagada, esta acción no se puede revertir.
                </Typography>
              </Alert>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setPaymentDialogOpen(false)}
            disabled={processingPayment}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleConfirmPayment}
            color="success"
            variant="contained"
            disabled={processingPayment}
          >
            {processingPayment ? (
              <CircularProgress size={20} />
            ) : (
              'Confirmar Pago'
            )}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default TablaLiquidaciones;