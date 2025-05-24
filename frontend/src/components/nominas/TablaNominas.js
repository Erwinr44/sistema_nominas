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
  Tooltip,
  Collapse
} from '@mui/material';
import {
  Visibility,
  GetApp,
  Payment,
  Person,
  ExpandMore,
  ExpandLess,
  CheckCircle,
  Schedule
} from '@mui/icons-material';
import dayjs from '../../utils/dayjs';
import NominaService from '../../services/nomina.service';

const TablaNominas = ({ nominas, onMarcarPagada, onVerDetalle, loading, groupByPeriod = false }) => {
  const [selectedNomina, setSelectedNomina] = useState(null);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [expandedPeriods, setExpandedPeriods] = useState({});
  const [downloadingPDF, setDownloadingPDF] = useState({});

  const formatDate = (dateString) => {
    return dayjs(dateString).format('DD/MM/YYYY');
  };

  const formatCurrency = (amount) => {
    return `Q${parseFloat(amount || 0).toLocaleString('es-GT', { minimumFractionDigits: 2 })}`;
  };

  const getEstadoChip = (estado) => {
    const config = {
      procesada: { color: 'warning', label: 'Procesada', icon: <Schedule /> },
      pagada: { color: 'success', label: 'Pagada', icon: <CheckCircle /> }
    };
    
    const { color, label, icon } = config[estado] || config.procesada;
    return <Chip label={label} color={color} size="small" icon={icon} />;
  };

  const getTipoChip = (tipo) => {
    const config = {
      semanal: { color: 'info', label: 'Semanal' },
      quincenal: { color: 'primary', label: 'Quincenal' },
      mensual: { color: 'secondary', label: 'Mensual' }
    };
    
    const { color, label } = config[tipo] || config.quincenal;
    return <Chip label={label} color={color} size="small" variant="outlined" />;
  };

  const handlePaymentClick = (nomina) => {
    setSelectedNomina(nomina);
    setPaymentDialogOpen(true);
  };

  const handleConfirmPayment = async () => {
    if (!selectedNomina) return;

    setProcessingPayment(true);
    try {
      await onMarcarPagada(selectedNomina.id);
      setPaymentDialogOpen(false);
      setSelectedNomina(null);
    } catch (error) {
      console.error('Error al marcar como pagada:', error);
    } finally {
      setProcessingPayment(false);
    }
  };


  const handleDescargarPDF = async (nomina) => {
    const nominaId = nomina.id;
    
    try {
      setDownloadingPDF(prev => ({ ...prev, [nominaId]: true }));

      await NominaService.descargarReciboPDF(
        nominaId,
        nomina.nombre,
        nomina.apellido,
        `${nomina.fecha_inicio}_${nomina.fecha_fin}`,
        false 
      );

    } catch (error) {
      console.error('Error en componente al descargar PDF:', error);
    } finally {
      setDownloadingPDF(prev => ({ ...prev, [nominaId]: false }));
    }
  };

  const togglePeriodExpansion = (periodKey) => {
    setExpandedPeriods(prev => ({
      ...prev,
      [periodKey]: !prev[periodKey]
    }));
  };

  const groupedNominas = groupByPeriod 
    ? nominas.reduce((groups, nomina) => {
        const periodKey = `${nomina.fecha_inicio}_${nomina.fecha_fin}_${nomina.tipo}`;
        if (!groups[periodKey]) {
          groups[periodKey] = {
            periodo: {
              fechaInicio: nomina.fecha_inicio,
              fechaFin: nomina.fecha_fin,
              tipo: nomina.tipo
            },
            nominas: []
          };
        }
        groups[periodKey].nominas.push(nomina);
        return groups;
      }, {})
    : null;

  const renderNominaRow = (nomina) => (
    <TableRow key={nomina.id} hover>
      <TableCell>
        <Box display="flex" alignItems="center" gap={1}>
          <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
            <Person />
          </Avatar>
          <Box>
            <Typography variant="body2">
              <strong>{nomina.nombre} {nomina.apellido}</strong>
            </Typography>
            <Typography variant="caption" color="textSecondary">
              #{nomina.numero_empleado || nomina.empleado_id}
            </Typography>
          </Box>
        </Box>
      </TableCell>
      <TableCell>
        <Typography variant="body2">
          {formatDate(nomina.fecha_inicio)} - {formatDate(nomina.fecha_fin)}
        </Typography>
        <Typography variant="caption" color="textSecondary">
          Procesada: {formatDate(nomina.fecha_procesamiento)}
        </Typography>
      </TableCell>
      <TableCell>
        {getTipoChip(nomina.tipo)}
      </TableCell>
      <TableCell align="right">
        <Typography variant="body2">
          {formatCurrency(nomina.salario_base)}
        </Typography>
      </TableCell>
      <TableCell align="right">
        <Typography variant="body2" color="success.main">
          {formatCurrency(nomina.total_bruto)}
        </Typography>
      </TableCell>
      <TableCell align="right">
        <Typography variant="body2" color="error.main">
          {formatCurrency(nomina.total_deducciones)}
        </Typography>
      </TableCell>
      <TableCell align="right">
        <Typography variant="body1" fontWeight="bold" color="primary.main">
          {formatCurrency(nomina.total_neto)}
        </Typography>
      </TableCell>
      <TableCell>
        {getEstadoChip(nomina.estado)}
      </TableCell>
      <TableCell>
        <Box display="flex" gap={0.5}>
          <Tooltip title="Ver detalle">
            <IconButton
              color="primary"
              onClick={() => onVerDetalle(nomina)}
              size="small"
            >
              <Visibility />
            </IconButton>
          </Tooltip>
          
          {/* Botón de descarga PDF con estado de carga */}
          <Tooltip title="Descargar recibo PDF">
            <span>
              <IconButton
                color="secondary"
                onClick={() => handleDescargarPDF(nomina)}
                size="small"
                disabled={downloadingPDF[nomina.id]}
              >
                {downloadingPDF[nomina.id] ? (
                  <CircularProgress size={20} />
                ) : (
                  <GetApp />
                )}
              </IconButton>
            </span>
          </Tooltip>
          
          {nomina.estado === 'procesada' && (
            <Tooltip title="Marcar como pagada">
              <IconButton
                color="success"
                onClick={() => handlePaymentClick(nomina)}
                size="small"
              >
                <Payment />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      </TableCell>
    </TableRow>
  );

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
                <TableCell colSpan={9} align="center">
                  <Typography variant="body2" color="textSecondary">
                    No hay nóminas registradas
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              // Renderizar agrupado o normal
              groupByPeriod && groupedNominas ? (
                Object.entries(groupedNominas).map(([periodKey, group]) => (
                  <React.Fragment key={periodKey}>
                    {/* Header del grupo */}
                    <TableRow sx={{ bgcolor: 'action.hover' }}>
                      <TableCell colSpan={9}>
                        <Box display="flex" alignItems="center" gap={1}>
                          <IconButton
                            size="small"
                            onClick={() => togglePeriodExpansion(periodKey)}
                          >
                            {expandedPeriods[periodKey] ? <ExpandLess /> : <ExpandMore />}
                          </IconButton>
                          <Typography variant="subtitle2">
                            {getTipoChip(group.periodo.tipo)} - {' '}
                            {formatDate(group.periodo.fechaInicio)} al {formatDate(group.periodo.fechaFin)}
                          </Typography>
                          <Chip 
                            label={`${group.nominas.length} empleados`} 
                            size="small" 
                            variant="outlined" 
                          />
                          <Typography variant="body2" color="primary">
                            Total: {formatCurrency(group.nominas.reduce((sum, n) => sum + parseFloat(n.total_neto), 0))}
                          </Typography>
                        </Box>
                      </TableCell>
                    </TableRow>
                    
                    {/* Nóminas del grupo */}
                    <TableRow>
                      <TableCell colSpan={9} sx={{ p: 0 }}>
                        <Collapse in={expandedPeriods[periodKey]} timeout="auto" unmountOnExit>
                          <Table size="small">
                            <TableBody>
                              {group.nominas.map(renderNominaRow)}
                            </TableBody>
                          </Table>
                        </Collapse>
                      </TableCell>
                    </TableRow>
                  </React.Fragment>
                ))
              ) : (
                nominas.map(renderNominaRow)
              )
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
          Confirmar Pago de Nómina
        </DialogTitle>
        <DialogContent>
          {selectedNomina && (
            <>
              <Alert severity="info" sx={{ mb: 2 }}>
                ¿Confirmas que se ha realizado el pago de esta nómina?
              </Alert>
              
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Empleado
                  </Typography>
                  <Typography variant="body1">
                    {selectedNomina.nombre} {selectedNomina.apellido}
                  </Typography>
                </Grid>

                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Período
                  </Typography>
                  <Typography variant="body1">
                    {formatDate(selectedNomina.fecha_inicio)} - {formatDate(selectedNomina.fecha_fin)}
                  </Typography>
                </Grid>

                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Tipo
                  </Typography>
                  <Typography variant="body1">
                    {getTipoChip(selectedNomina.tipo)}
                  </Typography>
                </Grid>

                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Total Bruto
                  </Typography>
                  <Typography variant="body1" color="success.main">
                    {formatCurrency(selectedNomina.total_bruto)}
                  </Typography>
                </Grid>

                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Total Neto
                  </Typography>
                  <Typography variant="h6" color="primary.main" fontWeight="bold">
                    {formatCurrency(selectedNomina.total_neto)}
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

export default TablaNominas;