// src/components/solicitudes/TablaAprobacion.js
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
  TextField,
  Alert,
  CircularProgress,
  Avatar
} from '@mui/material';
import {
  CheckCircle,
  Cancel,
  Visibility,
  EventAvailable,
  Schedule,
  Person
} from '@mui/icons-material';
import dayjs from 'dayjs';

const TablaAprobacion = ({ solicitudes, onAprobar, onRechazar, loading }) => {
  const [selectedSolicitud, setSelectedSolicitud] = useState(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [actionType, setActionType] = useState(''); // 'aprobar' o 'rechazar'
  const [comentario, setComentario] = useState('');
  const [processingAction, setProcessingAction] = useState(false);

  const formatDate = (dateString) => {
    return dayjs(dateString).format('DD/MM/YYYY');
  };

  const getTipoChip = (tipo) => {
    const config = {
      vacaciones: { color: 'primary', label: 'Vacaciones', icon: <EventAvailable /> },
      horas_extra: { color: 'secondary', label: 'Horas Extra', icon: <Schedule /> }
    };
    
    const { color, label, icon } = config[tipo] || config.vacaciones;
    return <Chip label={label} color={color} size="small" icon={icon} variant="outlined" />;
  };

  const handleViewDetail = (solicitud) => {
    setSelectedSolicitud(solicitud);
    setDetailDialogOpen(true);
  };

  const handleActionClick = (solicitud, action) => {
    setSelectedSolicitud(solicitud);
    setActionType(action);
    setComentario('');
    setActionDialogOpen(true);
  };

  const handleConfirmAction = async () => {
    if (!selectedSolicitud) return;

    setProcessingAction(true);
    try {
      if (actionType === 'aprobar') {
        await onAprobar(selectedSolicitud.id, comentario);
      } else {
        await onRechazar(selectedSolicitud.id, comentario);
      }
      setActionDialogOpen(false);
      setSelectedSolicitud(null);
      setActionType('');
      setComentario('');
    } catch (error) {
      console.error('Error al procesar acción:', error);
    } finally {
      setProcessingAction(false);
    }
  };

  const calculateDays = (fechaInicio, fechaFin) => {
    const inicio = dayjs(fechaInicio);
    const fin = dayjs(fechaFin);
    return fin.diff(inicio, 'day') + 1;
  };

  // FUNCIÓN CORREGIDA - Sin usar isSameOrBefore
  const calculateWorkingDays = (fechaInicio, fechaFin) => {
    const inicio = dayjs(fechaInicio);
    const fin = dayjs(fechaFin);
    let dias = 0;
    
    // Calcular el número total de días
    const totalDays = fin.diff(inicio, 'day') + 1;
    
    // Iterar día por día
    for (let i = 0; i < totalDays; i++) {
      const current = inicio.add(i, 'day');
      const dayOfWeek = current.day(); // 0 = domingo, 6 = sábado
      
      // Si no es sábado (6) ni domingo (0)
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        dias++;
      }
    }
    
    return dias;
  };

  const getPriorityColor = (solicitud) => {
    const fechaCreacion = dayjs(solicitud.creado_en);
    const diasDesdeCreacion = dayjs().diff(fechaCreacion, 'day');
    
    if (diasDesdeCreacion >= 7) return 'error'; // Más de 7 días - alta prioridad
    if (diasDesdeCreacion >= 3) return 'warning'; // 3-7 días - media prioridad
    return 'success'; // Menos de 3 días - normal
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
              <TableCell>Tipo</TableCell>
              <TableCell>Fecha(s)</TableCell>
              <TableCell>Detalles</TableCell>
              <TableCell>Fecha Solicitud</TableCell>
              <TableCell>Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {solicitudes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  <Typography variant="body2" color="textSecondary">
                    No hay solicitudes pendientes de aprobación
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              solicitudes.map((solicitud) => (
                <TableRow key={solicitud.id} hover>
                  <TableCell>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
                        <Person />
                      </Avatar>
                      <Box>
                        <Typography variant="body2">
                          {solicitud.empleado_nombre} {solicitud.empleado_apellido}
                        </Typography>
                        <Chip
                          size="small"
                          label={`${dayjs().diff(dayjs(solicitud.creado_en), 'day')} días`}
                          color={getPriorityColor(solicitud)}
                          variant="outlined"
                        />
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    {getTipoChip(solicitud.tipo)}
                  </TableCell>
                  <TableCell>
                    {solicitud.tipo === 'vacaciones' ? (
                      <>
                        <Typography variant="body2">
                          {formatDate(solicitud.fecha_inicio)} - {formatDate(solicitud.fecha_fin)}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          ({calculateWorkingDays(solicitud.fecha_inicio, solicitud.fecha_fin)} días hábiles)
                        </Typography>
                      </>
                    ) : (
                      <Typography variant="body2">
                        {formatDate(solicitud.fecha_inicio)}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    {solicitud.tipo === 'horas_extra' ? (
                      <Typography variant="body2">
                        <strong>{solicitud.horas} horas</strong>
                      </Typography>
                    ) : (
                      <Typography variant="body2" color="textSecondary">
                        {calculateDays(solicitud.fecha_inicio, solicitud.fecha_fin)} días totales
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {formatDate(solicitud.creado_en)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box display="flex" gap={1}>
                      <IconButton
                        color="primary"
                        onClick={() => handleViewDetail(solicitud)}
                        title="Ver detalles"
                        size="small"
                      >
                        <Visibility />
                      </IconButton>
                      <IconButton
                        color="success"
                        onClick={() => handleActionClick(solicitud, 'aprobar')}
                        title="Aprobar"
                        size="small"
                      >
                        <CheckCircle />
                      </IconButton>
                      <IconButton
                        color="error"
                        onClick={() => handleActionClick(solicitud, 'rechazar')}
                        title="Rechazar"
                        size="small"
                      >
                        <Cancel />
                      </IconButton>
                    </Box>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Dialog de Detalles */}
      <Dialog
        open={detailDialogOpen}
        onClose={() => setDetailDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Detalle de Solicitud
        </DialogTitle>
        <DialogContent>
          {selectedSolicitud && (
            <Box>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Box display="flex" gap={1} mb={2}>
                    {getTipoChip(selectedSolicitud.tipo)}
                    <Chip label="Pendiente" color="warning" size="small" />
                  </Box>
                </Grid>

                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Empleado
                  </Typography>
                  <Typography variant="body1">
                    {selectedSolicitud.empleado_nombre} {selectedSolicitud.empleado_apellido}
                  </Typography>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Fecha de Inicio
                  </Typography>
                  <Typography variant="body1">
                    {formatDate(selectedSolicitud.fecha_inicio)}
                  </Typography>
                </Grid>

                {selectedSolicitud.tipo === 'vacaciones' && (
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="textSecondary">
                      Fecha de Fin
                    </Typography>
                    <Typography variant="body1">
                      {formatDate(selectedSolicitud.fecha_fin)}
                    </Typography>
                  </Grid>
                )}

                {selectedSolicitud.tipo === 'horas_extra' && (
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="textSecondary">
                      Cantidad de Horas
                    </Typography>
                    <Typography variant="body1">
                      {selectedSolicitud.horas} horas
                    </Typography>
                  </Grid>
                )}

                {selectedSolicitud.tipo === 'vacaciones' && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="textSecondary">
                      Días Solicitados
                    </Typography>
                    <Typography variant="body1">
                      {calculateWorkingDays(selectedSolicitud.fecha_inicio, selectedSolicitud.fecha_fin)} días hábiles
                      ({calculateDays(selectedSolicitud.fecha_inicio, selectedSolicitud.fecha_fin)} días naturales)
                    </Typography>
                  </Grid>
                )}

                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Fecha de Solicitud
                  </Typography>
                  <Typography variant="body1">
                    {formatDate(selectedSolicitud.creado_en)}
                  </Typography>
                </Grid>

                {selectedSolicitud.comentario && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="textSecondary">
                      Comentario del Empleado
                    </Typography>
                    <Typography variant="body1">
                      {selectedSolicitud.comentario}
                    </Typography>
                  </Grid>
                )}
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailDialogOpen(false)}>
            Cerrar
          </Button>
          <Button
            onClick={() => {
              setDetailDialogOpen(false);
              handleActionClick(selectedSolicitud, 'rechazar');
            }}
            color="error"
            variant="outlined"
          >
            Rechazar
          </Button>
          <Button
            onClick={() => {
              setDetailDialogOpen(false);
              handleActionClick(selectedSolicitud, 'aprobar');
            }}
            color="success"
            variant="contained"
          >
            Aprobar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog de Acción (Aprobar/Rechazar) */}
      <Dialog
        open={actionDialogOpen}
        onClose={() => setActionDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {actionType === 'aprobar' ? 'Aprobar Solicitud' : 'Rechazar Solicitud'}
        </DialogTitle>
        <DialogContent>
          {selectedSolicitud && (
            <>
              <Alert 
                severity={actionType === 'aprobar' ? 'success' : 'warning'} 
                sx={{ mb: 2 }}
              >
                ¿Estás seguro de que deseas {actionType === 'aprobar' ? 'aprobar' : 'rechazar'} esta solicitud?
              </Alert>
              
              <Typography variant="body2" sx={{ mb: 2 }}>
                <strong>Empleado:</strong> {selectedSolicitud.empleado_nombre} {selectedSolicitud.empleado_apellido}<br />
                <strong>Tipo:</strong> {selectedSolicitud.tipo === 'vacaciones' ? 'Vacaciones' : 'Horas Extra'}<br />
                <strong>Fecha:</strong> {formatDate(selectedSolicitud.fecha_inicio)}
                {selectedSolicitud.tipo === 'vacaciones' && ` - ${formatDate(selectedSolicitud.fecha_fin)}`}
              </Typography>

              <TextField
                fullWidth
                label={actionType === 'aprobar' ? 'Comentario (opcional)' : 'Motivo del rechazo'}
                multiline
                rows={3}
                value={comentario}
                onChange={(e) => setComentario(e.target.value)}
                placeholder={
                  actionType === 'aprobar' 
                    ? 'Comentarios adicionales sobre la aprobación...'
                    : 'Explica el motivo del rechazo...'
                }
                required={actionType === 'rechazar'}
              />
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setActionDialogOpen(false)}
            disabled={processingAction}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleConfirmAction}
            color={actionType === 'aprobar' ? 'success' : 'error'}
            variant="contained"
            disabled={processingAction || (actionType === 'rechazar' && !comentario.trim())}
          >
            {processingAction ? (
              <CircularProgress size={20} />
            ) : (
              actionType === 'aprobar' ? 'Aprobar' : 'Rechazar'
            )}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default TablaAprobacion;