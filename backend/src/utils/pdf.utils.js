// src/utils/pdf.utils.js
const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');

/**
 * Genera un PDF con el recibo de nómina (VERSION ROBUSTA)
 * @param {Object} nomina - Datos de la nómina
 * @returns {Promise<Buffer>} - Buffer con el PDF generado
 */
async function generarPDF(nomina) {
  try {
    console.log('Iniciando generación de PDF de nómina...');
    console.log('Datos recibidos:', JSON.stringify(nomina, null, 2));
    
    // Validar datos de entrada
    if (!nomina) {
      throw new Error('No se proporcionaron datos de nómina');
    }
    
    console.log('Datos procesados:', {
      empleado: (nomina.nombre || 'Sin nombre') + ' ' + (nomina.apellido || ''),
      periodo: `${nomina.fecha_inicio || 'N/A'} - ${nomina.fecha_fin || 'N/A'}`,
      totalNeto: nomina.total_neto || 0
    });
    
    // Crear un nuevo documento PDF
    const pdfDoc = await PDFDocument.create();
    
    // Agregar una página
    const page = pdfDoc.addPage([595.28, 841.89]); // A4
    
    // Obtener fuentes
    const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    
    // Configurar página
    const { width, height } = page.getSize();
    const margin = 50;
    
    // Función helper para texto seguro
    const safeText = (text, defaultText = 'N/A') => {
      return text ? String(text) : defaultText;
    };
    
    // Función helper para números seguros
    const safeNumber = (num, defaultNum = 0) => {
      const parsed = parseFloat(num);
      return isNaN(parsed) ? defaultNum : parsed;
    };
    
    // Función helper para fechas
    const safeDate = (dateString) => {
      if (!dateString) return 'N/A';
      try {
        return new Date(dateString).toLocaleDateString('es-GT');
      } catch {
        return dateString;
      }
    };
    
    // TÍTULO
    page.drawText('RECIBO DE NÓMINA', {
      x: width / 2 - 80,
      y: height - margin - 60,
      size: 20,
      font: helveticaBold,
      color: rgb(0.8, 0, 0)
    });
    
    // DATOS DEL EMPLEADO
    page.drawText('DATOS DEL EMPLEADO', {
      x: margin,
      y: height - margin - 110,
      size: 14,
      font: helveticaBold,
      color: rgb(0, 0, 0.8)
    });
    
    // Línea debajo del título
    page.drawLine({
      start: { x: margin, y: height - margin - 115 },
      end: { x: width - margin, y: height - margin - 115 },
      thickness: 1,
      color: rgb(0, 0, 0.8)
    });
    
    let currentY = height - margin - 135;
    
    page.drawText(`Nombre: ${safeText(nomina.nombre)} ${safeText(nomina.apellido)}`, {
      x: margin,
      y: currentY,
      size: 12,
      font: helveticaFont
    });
    
    currentY -= 20;
    
    page.drawText(`No. Empleado: ${safeText(nomina.numero_empleado)}`, {
      x: margin,
      y: currentY,
      size: 12,
      font: helveticaFont
    });
    
    page.drawText(`DPI: ${safeText(nomina.dpi)}`, {
      x: width - margin - 150,
      y: currentY,
      size: 12,
      font: helveticaFont
    });
    
    currentY -= 20;
    
    // DATOS DE LA NÓMINA
    currentY -= 40;
    
    page.drawText('DATOS DE LA NÓMINA', {
      x: margin,
      y: currentY,
      size: 14,
      font: helveticaBold,
      color: rgb(0, 0, 0.8)
    });
    
    page.drawLine({
      start: { x: margin, y: currentY - 5 },
      end: { x: width - margin, y: currentY - 5 },
      thickness: 1,
      color: rgb(0, 0, 0.8)
    });
    
    currentY -= 25;
    
    page.drawText(`Período: ${safeDate(nomina.fecha_inicio)} al ${safeDate(nomina.fecha_fin)}`, {
      x: margin,
      y: currentY,
      size: 12,
      font: helveticaFont
    });
    
    page.drawText(`Tipo: ${safeText(nomina.tipo).toUpperCase()}`, {
      x: width - margin - 150,
      y: currentY,
      size: 12,
      font: helveticaFont
    });
    
    currentY -= 20;
    
    page.drawText(`Fecha de proceso: ${safeDate(nomina.fecha_procesamiento)}`, {
      x: margin,
      y: currentY,
      size: 12,
      font: helveticaFont
    });
    
    page.drawText(`Estado: ${safeText(nomina.estado).toUpperCase()}`, {
      x: width - margin - 150,
      y: currentY,
      size: 12,
      font: helveticaFont
    });
    
    // TABLA DE CONCEPTOS
    currentY -= 50;
    
    page.drawText('DETALLE DE CONCEPTOS', {
      x: margin,
      y: currentY,
      size: 14,
      font: helveticaBold,
      color: rgb(0, 0, 0.8)
    });
    
    currentY -= 30;
    
    // Encabezados de tabla
    const tableHeaders = ['CONCEPTO', 'MONTO'];
    const col1X = margin;
    const col2X = width - margin - 100;
    
    // Fondo del encabezado
    page.drawRectangle({
      x: margin - 5,
      y: currentY - 5,
      width: width - 2 * margin + 10,
      height: 25,
      color: rgb(0.9, 0.9, 0.9)
    });
    
    page.drawText('CONCEPTO', {
      x: col1X,
      y: currentY + 5,
      size: 12,
      font: helveticaBold
    });
    
    page.drawText('MONTO', {
      x: col2X,
      y: currentY + 5,
      size: 12,
      font: helveticaBold
    });
    
    currentY -= 30;
    
    // PERCEPCIONES
    page.drawText('PERCEPCIONES:', {
      x: col1X,
      y: currentY,
      size: 12,
      font: helveticaBold,
      color: rgb(0, 0.6, 0)
    });
    
    currentY -= 20;
    
    // Lista de percepciones
    const percepciones = [
      { label: 'Salario Base', campo: 'salario_base' },
      { label: 'Bonificación Incentivo', campo: 'bono_incentivo' },
      { label: 'Horas Extra', campo: 'horas_extra' },
      { label: 'Aguinaldo', campo: 'aguinaldo' },
      { label: 'Bono 14', campo: 'bono14' },
      { label: 'Comisiones', campo: 'comisiones' },
      { label: 'Otros Ingresos', campo: 'otros_ingresos' }
    ];
    
    let totalPercepciones = 0;
    
    percepciones.forEach(percepcion => {
      const valor = safeNumber(nomina[percepcion.campo]);
      if (valor > 0) {
        page.drawText(`  ${percepcion.label}`, {
          x: col1X,
          y: currentY,
          size: 11,
          font: helveticaFont
        });
        
        page.drawText(`Q${valor.toFixed(2)}`, {
          x: col2X,
          y: currentY,
          size: 11,
          font: helveticaFont
        });
        
        totalPercepciones += valor;
        currentY -= 18;
      }
    });
    
    // DEDUCCIONES
    currentY -= 10;
    
    page.drawText('DEDUCCIONES:', {
      x: col1X,
      y: currentY,
      size: 12,
      font: helveticaBold,
      color: rgb(0.8, 0, 0)
    });
    
    currentY -= 20;
    
    // Lista de deducciones
    const deducciones = [
      { label: 'IGSS Laboral', campo: 'igss' },
      { label: 'ISR', campo: 'isr' },
      { label: 'Anticipo', campo: 'anticipo' },
      { label: 'Préstamos', campo: 'prestamos' },
      { label: 'Otras Deducciones', campo: 'otras_deducciones' }
    ];
    
    let totalDeducciones = 0;
    
    deducciones.forEach(deduccion => {
      const valor = safeNumber(nomina[deduccion.campo]);
      if (valor > 0) {
        page.drawText(`  ${deduccion.label}`, {
          x: col1X,
          y: currentY,
          size: 11,
          font: helveticaFont
        });
        
        page.drawText(`Q${valor.toFixed(2)}`, {
          x: col2X,
          y: currentY,
          size: 11,
          font: helveticaFont
        });
        
        totalDeducciones += valor;
        currentY -= 18;
      }
    });
    
    // TOTALES
    currentY -= 20;
    
    // Línea separadora
    page.drawLine({
      start: { x: margin, y: currentY },
      end: { x: width - margin, y: currentY },
      thickness: 2,
      color: rgb(0, 0, 0)
    });
    
    currentY -= 25;
    
    // Total bruto
    const totalBruto = safeNumber(nomina.total_bruto) || totalPercepciones;
    page.drawText('TOTAL BRUTO:', {
      x: col1X,
      y: currentY,
      size: 13,
      font: helveticaBold
    });
    
    page.drawText(`Q${totalBruto.toFixed(2)}`, {
      x: col2X,
      y: currentY,
      size: 13,
      font: helveticaBold
    });
    
    currentY -= 20;
    
    // Total deducciones
    const totalDeduccionesNomina = safeNumber(nomina.total_deducciones) || totalDeducciones;
    page.drawText('TOTAL DEDUCCIONES:', {
      x: col1X,
      y: currentY,
      size: 13,
      font: helveticaBold
    });
    
    page.drawText(`Q${totalDeduccionesNomina.toFixed(2)}`, {
      x: col2X,
      y: currentY,
      size: 13,
      font: helveticaBold,
      color: rgb(0.8, 0, 0)
    });
    
    currentY -= 30;
    
    // Total neto (destacado)
    const totalNeto = safeNumber(nomina.total_neto) || (totalBruto - totalDeduccionesNomina);
    
    // Fondo para total neto
    page.drawRectangle({
      x: margin - 5,
      y: currentY - 5,
      width: width - 2 * margin + 10,
      height: 30,
      color: rgb(0.9, 1, 0.9)
    });
    
    page.drawText('TOTAL NETO A PAGAR:', {
      x: col1X,
      y: currentY + 5,
      size: 16,
      font: helveticaBold,
      color: rgb(0, 0.6, 0)
    });
    
    page.drawText(`Q${totalNeto.toFixed(2)}`, {
      x: col2X,
      y: currentY + 5,
      size: 16,
      font: helveticaBold,
      color: rgb(0, 0.6, 0)
    });
    
    // PIE DE PÁGINA
    currentY -= 80;
    
    page.drawText('INFORMACIÓN ADICIONAL', {
      x: margin,
      y: currentY,
      size: 12,
      font: helveticaBold
    });
    
    currentY -= 20;
    
    page.drawText(`Fecha de emisión: ${new Date().toLocaleDateString('es-GT')}`, {
      x: margin,
      y: currentY,
      size: 10,
      font: helveticaFont,
      color: rgb(0.5, 0.5, 0.5)
    });
    
    page.drawText(`Hora de emisión: ${new Date().toLocaleTimeString('es-GT')}`, {
      x: width - margin - 150,
      y: currentY,
      size: 10,
      font: helveticaFont,
      color: rgb(0.5, 0.5, 0.5)
    });
    
    currentY -= 20;
    
    page.drawText('Este documento es un comprobante de pago y no requiere firma.', {
      x: margin,
      y: currentY,
      size: 10,
      font: helveticaFont,
      color: rgb(0.5, 0.5, 0.5)
    });
    
    // Serializar el PDF a un Buffer
    console.log('Serializando PDF de nómina...');
    const pdfBytes = await pdfDoc.save();
    const buffer = Buffer.from(pdfBytes);
    
    console.log('PDF de nómina generado exitosamente, tamaño:', buffer.length, 'bytes');
    return buffer;
    
  } catch (error) {
    console.error('Error detallado en generarPDF:', error);
    console.error('Stack trace:', error.stack);
    throw new Error(`Error al generar PDF de nómina: ${error.message}`);
  }
}

/**
 * Genera un PDF con el finiquito de liquidación (VERSION ROBUSTA)
 * @param {Object} resumen - Datos del resumen de liquidación
 * @returns {Promise<Buffer>} - Buffer con el PDF generado
 */
async function generarPDFLiquidacion(resumen) {
  try {
    console.log('Iniciando generación de PDF...');
    console.log('Datos recibidos:', JSON.stringify(resumen, null, 2));
    
    // Validar datos de entrada
    if (!resumen) {
      throw new Error('No se proporcionaron datos de resumen');
    }
    
    // Crear estructura por defecto si faltan datos
    const empleado = resumen.empleado || {};
    const detalles = resumen.detalles || {};
    const liquidacion = resumen.liquidacion || resumen;
    
    console.log('Datos procesados:', {
      empleado: empleado.nombre || 'Sin nombre',
      totalLiquidacion: liquidacion.total_neto || detalles.total || 0
    });
    
    // Crear un nuevo documento PDF
    const pdfDoc = await PDFDocument.create();
    
    // Agregar una página
    const page = pdfDoc.addPage([595.28, 841.89]); // A4
    
    // Obtener fuentes
    const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    
    // Configurar página
    const { width, height } = page.getSize();
    const margin = 50;
    
    // Título
    page.drawText('FINIQUITO DE LIQUIDACIÓN LABORAL', {
      x: width / 2 - 150,
      y: height - margin,
      size: 18,
      font: helveticaBold,
      color: rgb(0, 0, 0.8)
    });
    
    // Función helper para texto seguro
    const safeText = (text, defaultText = 'N/A') => {
      return text ? String(text) : defaultText;
    };
    
    // Función helper para números seguros
    const safeNumber = (num, defaultNum = 0) => {
      const parsed = parseFloat(num);
      return isNaN(parsed) ? defaultNum : parsed;
    };
    
    // Datos del empleado
    page.drawText(`Empleado: ${safeText(empleado.nombre)} ${safeText(empleado.apellido)}`, {
      x: margin,
      y: height - margin - 40,
      size: 12,
      font: helveticaFont
    });
    
    page.drawText(`DPI: ${safeText(empleado.dpi)}`, {
      x: margin,
      y: height - margin - 60,
      size: 12,
      font: helveticaFont
    });
    
    page.drawText(`Puesto: ${safeText(empleado.area_nombre || empleado.puesto)}`, {
      x: margin,
      y: height - margin - 80,
      size: 12,
      font: helveticaFont
    });
    
    // Datos de la relación laboral
    page.drawText('PERÍODO LABORAL', {
      x: margin,
      y: height - margin - 120,
      size: 14,
      font: helveticaBold
    });
    
    // Manejo seguro de fechas
    const fechaInicio = liquidacion.fecha_inicio || detalles?.periodo_trabajado?.fecha_inicio;
    const fechaFin = liquidacion.fecha_fin || detalles?.periodo_trabajado?.fecha_fin;
    
    page.drawText(`Fecha de inicio: ${fechaInicio ? new Date(fechaInicio).toLocaleDateString() : 'N/A'}`, {
      x: margin,
      y: height - margin - 140,
      size: 12,
      font: helveticaFont
    });
    
    page.drawText(`Fecha de finalización: ${fechaFin ? new Date(fechaFin).toLocaleDateString() : 'N/A'}`, {
      x: margin,
      y: height - margin - 160,
      size: 12,
      font: helveticaFont
    });
    
    // Tiempo de servicio (calculado o proporcionado)
    let tiempoServicio = 'N/A';
    if (fechaInicio && fechaFin) {
      const inicio = new Date(fechaInicio);
      const fin = new Date(fechaFin);
      const diffTime = Math.abs(fin - inicio);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      const años = (diffDays / 365).toFixed(2);
      tiempoServicio = `${años} años`;
    } else if (detalles?.periodo_trabajado?.años) {
      tiempoServicio = `${detalles.periodo_trabajado.años.toFixed(2)} años`;
    }
    
    page.drawText(`Tiempo de servicio: ${tiempoServicio}`, {
      x: margin,
      y: height - margin - 180,
      size: 12,
      font: helveticaFont
    });
    
    page.drawText(`Motivo de finalización: ${safeText(liquidacion.motivo_terminacion || liquidacion.motivo)}`, {
      x: margin,
      y: height - margin - 200,
      size: 12,
      font: helveticaFont
    });
    
    // Desglose de la liquidación
    page.drawText('DESGLOSE DE LIQUIDACIÓN', {
      x: margin,
      y: height - margin - 240,
      size: 14,
      font: helveticaBold
    });
    
    let y = height - margin - 270;
    
    // Obtener valores de liquidación (con múltiples fuentes posibles)
    const obtenerValor = (campo) => {
      return safeNumber(
        liquidacion[campo] || 
        detalles?.desglose?.[campo] || 
        detalles?.[campo] ||
        resumen[campo]
      );
    };
    
    // Conceptos de liquidación
    const conceptos = [
      { label: 'Indemnización:', campo: 'indemnizacion' },
      { label: 'Aguinaldo proporcional:', campo: 'aguinaldo_proporcional' },
      { label: 'Bono 14 proporcional:', campo: 'bono14_proporcional' },
      { label: 'Vacaciones pendientes:', campo: 'vacaciones_pendientes' },
      { label: 'Salario pendiente:', campo: 'salario_pendiente' },
      { label: 'Otros pagos:', campo: 'otros_pagos' }
    ];
    
    let totalCalculado = 0;
    
    conceptos.forEach(concepto => {
      const valor = obtenerValor(concepto.campo);
      if (valor > 0) {
        page.drawText(concepto.label, {
          x: margin,
          y,
          size: 12,
          font: helveticaFont
        });
        
        page.drawText(`Q${valor.toFixed(2)}`, {
          x: width - margin - 100,
          y,
          size: 12,
          font: helveticaFont
        });
        
        totalCalculado += valor;
        y -= 20;
      }
    });
    
    // Línea separadora
    page.drawLine({
      start: { x: margin, y: y - 10 },
      end: { x: width - margin, y: y - 10 },
      thickness: 1,
      color: rgb(0, 0, 0)
    });
    
    y -= 30;
    
    // Total (usar el total proporcionado o el calculado)
    const totalFinal = obtenerValor('total_neto') || obtenerValor('total') || totalCalculado;
    
    page.drawText(`TOTAL A PAGAR:`, {
      x: margin,
      y,
      size: 14,
      font: helveticaBold
    });
    
    page.drawText(`Q${totalFinal.toFixed(2)}`, {
      x: width - margin - 100,
      y,
      size: 14,
      font: helveticaBold
    });
    
    // Declaración legal
    y -= 80;
    
    const declaracion = `Por medio del presente documento, el empleado declara haber recibido a su entera satisfacción el pago total de sus prestaciones laborales y no tiene ningún reclamo pendiente contra la empresa.`;
    
    // Dividir texto largo en líneas
    const palabras = declaracion.split(' ');
    const lineas = [];
    let lineaActual = '';
    
    palabras.forEach(palabra => {
      if ((lineaActual + palabra).length < 80) {
        lineaActual += (lineaActual ? ' ' : '') + palabra;
      } else {
        lineas.push(lineaActual);
        lineaActual = palabra;
      }
    });
    if (lineaActual) lineas.push(lineaActual);
    
    lineas.forEach(linea => {
      page.drawText(linea, {
        x: margin,
        y,
        size: 10,
        font: helveticaFont
      });
      y -= 15;
    });
    
    // Espacios para firmas
    y -= 60;
    
    page.drawLine({
      start: { x: margin + 50, y },
      end: { x: margin + 200, y },
      thickness: 1,
      color: rgb(0, 0, 0)
    });
    
    page.drawText('Firma del Empleado', {
      x: margin + 70,
      y: y - 20,
      size: 10,
      font: helveticaFont
    });
    
    page.drawLine({
      start: { x: width - margin - 200, y },
      end: { x: width - margin - 50, y },
      thickness: 1,
      color: rgb(0, 0, 0)
    });
    
    page.drawText('Firma Autorizada', {
      x: width - margin - 160,
      y: y - 20,
      size: 10,
      font: helveticaFont
    });
    
    // Información adicional
    page.drawText(`Fecha de emisión: ${new Date().toLocaleDateString()}`, {
      x: margin,
      y: margin,
      size: 10,
      font: helveticaFont,
      color: rgb(0.5, 0.5, 0.5)
    });
    
    // Serializar el PDF a un Buffer
    console.log('Serializando PDF...');
    const pdfBytes = await pdfDoc.save();
    const buffer = Buffer.from(pdfBytes);
    
    console.log('PDF generado exitosamente, tamaño:', buffer.length, 'bytes');
    return buffer;
    
  } catch (error) {
    console.error('Error detallado en generarPDFLiquidacion:', error);
    console.error('Stack trace:', error.stack);
    throw new Error(`Error al generar PDF: ${error.message}`);
  }
}

module.exports = {
  generarPDF,
  generarPDFLiquidacion
};