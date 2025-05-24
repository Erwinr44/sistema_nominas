// src/utils/pdf.utils.js
const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');

/**
 * Genera un PDF con el recibo de nómina
 * @param {Object} nomina - Datos de la nómina
 * @returns {Promise<Buffer>} - Buffer con el PDF generado
 */
async function generarPDF(nomina) {
  try {
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
    page.drawText('RECIBO DE NÓMINA', {
      x: width / 2 - 100,
      y: height - margin,
      size: 24,
      font: helveticaBold,
      color: rgb(0, 0, 0.8)
    });
    
    // Datos del empleado
    page.drawText(`Empleado: ${nomina.nombre} ${nomina.apellido}`, {
      x: margin,
      y: height - margin - 40,
      size: 12,
      font: helveticaFont
    });
    
    page.drawText(`Número de empleado: ${nomina.numero_empleado || 'N/A'}`, {
      x: margin,
      y: height - margin - 60,
      size: 12,
      font: helveticaFont
    });
    
    // Datos de la nómina
    page.drawText(`Período: ${nomina.fecha_inicio} al ${nomina.fecha_fin}`, {
      x: margin,
      y: height - margin - 100,
      size: 12,
      font: helveticaFont
    });
    
    page.drawText(`Tipo: ${nomina.tipo}`, {
      x: margin,
      y: height - margin - 120,
      size: 12,
      font: helveticaFont
    });
    
    // Conceptos
    let y = height - margin - 180;
    
    page.drawText('CONCEPTOS', {
      x: margin,
      y,
      size: 14,
      font: helveticaBold
    });
    
    y -= 30;
    
    // Percepciones
    page.drawText('Percepciones:', {
      x: margin,
      y,
      size: 12,
      font: helveticaBold
    });
    
    y -= 20;
    
    page.drawText(`Salario base: Q${nomina.salario_base.toFixed(2)}`, {
      x: margin + 20,
      y,
      size: 12,
      font: helveticaFont
    });
    
    y -= 20;
    
    page.drawText(`Bonificación incentivo: Q${nomina.bono_incentivo.toFixed(2)}`, {
      x: margin + 20,
      y,
      size: 12,
      font: helveticaFont
    });
    
    y -= 20;
    
    if (nomina.horas_extra > 0) {
      page.drawText(`Horas extra: Q${nomina.horas_extra.toFixed(2)}`, {
        x: margin + 20,
        y,
        size: 12,
        font: helveticaFont
      });
      y -= 20;
    }
    
    if (nomina.aguinaldo > 0) {
      page.drawText(`Aguinaldo: Q${nomina.aguinaldo.toFixed(2)}`, {
        x: margin + 20,
        y,
        size: 12,
        font: helveticaFont
      });
      y -= 20;
    }
    
    if (nomina.bono14 > 0) {
      page.drawText(`Bono 14: Q${nomina.bono14.toFixed(2)}`, {
        x: margin + 20,
        y,
        size: 12,
        font: helveticaFont
      });
      y -= 20;
    }
    
    // Deducciones
    y -= 20;
    
    page.drawText('Deducciones:', {
      x: margin,
      y,
      size: 12,
      font: helveticaBold
    });
    
    y -= 20;
    
    page.drawText(`IGSS: Q${nomina.igss.toFixed(2)}`, {
      x: margin + 20,
      y,
      size: 12,
      font: helveticaFont
    });
    
    y -= 20;
    
    if (nomina.isr > 0) {
      page.drawText(`ISR: Q${nomina.isr.toFixed(2)}`, {
        x: margin + 20,
        y,
        size: 12,
        font: helveticaFont
      });
      y -= 20;
    }
    
    // Total
    y -= 40;
    
    page.drawText(`Total bruto: Q${nomina.total_bruto.toFixed(2)}`, {
      x: margin,
      y,
      size: 14,
      font: helveticaFont
    });
    
    y -= 20;
    
    page.drawText(`Total deducciones: Q${nomina.total_deducciones.toFixed(2)}`, {
      x: margin,
      y,
      size: 14,
      font: helveticaFont
    });
    
    y -= 20;
    
    page.drawText(`TOTAL NETO: Q${nomina.total_neto.toFixed(2)}`, {
      x: margin,
      y,
      size: 16,
      font: helveticaBold
    });
    
    // Información adicional
    y -= 80;
    
    page.drawText(`Fecha de emisión: ${new Date().toLocaleDateString()}`, {
      x: margin,
      y,
      size: 10,
      font: helveticaFont,
      color: rgb(0.5, 0.5, 0.5)
    });
    
    page.drawText('Este documento es un comprobante de pago y no requiere firma.', {
      x: margin,
      y: margin,
      size: 10,
      font: helveticaFont,
      color: rgb(0.5, 0.5, 0.5)
    });
    
    // Serializar el PDF a un Buffer
    const pdfBytes = await pdfDoc.save();
    return Buffer.from(pdfBytes);
  } catch (error) {
    console.error('Error al generar PDF:', error);
    throw error;
  }
}

/**
 * Genera un PDF con el finiquito de liquidación
 * @param {Object} resumen - Datos del resumen de liquidación
 * @returns {Promise<Buffer>} - Buffer con el PDF generado
 */
async function generarPDFLiquidacion(resumen) {
  try {
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
    
    // Datos del empleado
    page.drawText(`Empleado: ${resumen.empleado.nombre} ${resumen.empleado.apellido}`, {
      x: margin,
      y: height - margin - 40,
      size: 12,
      font: helveticaFont
    });
    
    page.drawText(`DPI: ${resumen.empleado.dpi}`, {
      x: margin,
      y: height - margin - 60,
      size: 12,
      font: helveticaFont
    });
    
    page.drawText(`Puesto: ${resumen.empleado.area_nombre || 'No especificado'}`, {
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
    
    page.drawText(`Fecha de inicio: ${new Date(resumen.detalles.periodo_trabajado.fecha_inicio).toLocaleDateString()}`, {
      x: margin,
      y: height - margin - 140,
      size: 12,
      font: helveticaFont
    });
    
    page.drawText(`Fecha de finalización: ${new Date(resumen.detalles.periodo_trabajado.fecha_fin).toLocaleDateString()}`, {
      x: margin,
      y: height - margin - 160,
      size: 12,
      font: helveticaFont
    });
    
    page.drawText(`Tiempo de servicio: ${resumen.detalles.periodo_trabajado.años.toFixed(2)} años`, {
      x: margin,
      y: height - margin - 180,
      size: 12,
      font: helveticaFont
    });
    
    page.drawText(`Motivo de finalización: ${resumen.liquidacion.motivo}`, {
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
    
    // Indemnización
    page.drawText(`Indemnización:`, {
      x: margin,
      y,
      size: 12,
      font: helveticaFont
    });
    
    page.drawText(`Q${resumen.detalles.desglose.indemnizacion.toFixed(2)}`, {
      x: width - margin - 100,
      y,
      size: 12,
      font: helveticaFont
    });
    
    y -= 20;
    
    // Aguinaldo proporcional
    page.drawText(`Aguinaldo proporcional:`, {
      x: margin,
      y,
      size: 12,
      font: helveticaFont
    });
    
    page.drawText(`Q${resumen.detalles.desglose.aguinaldo_proporcional.toFixed(2)}`, {
      x: width - margin - 100,
      y,
      size: 12,
      font: helveticaFont
    });
    
    y -= 20;
    
    // Bono 14 proporcional
    page.drawText(`Bono 14 proporcional:`, {
      x: margin,
      y,
      size: 12,
      font: helveticaFont
    });
    
    page.drawText(`Q${resumen.detalles.desglose.bono14_proporcional.toFixed(2)}`, {
      x: width - margin - 100,
      y,
      size: 12,
      font: helveticaFont
    });
    
    y -= 20;
    
    // Vacaciones pendientes
    page.drawText(`Vacaciones pendientes:`, {
      x: margin,
      y,
      size: 12,
      font: helveticaFont
    });
    
    page.drawText(`Q${resumen.detalles.desglose.vacaciones_pendientes.toFixed(2)}`, {
      x: width - margin - 100,
      y,
      size: 12,
      font: helveticaFont
    });
    
    y -= 20;
    
    // Otros pagos
    if (resumen.detalles.desglose.otros_pagos > 0) {
      page.drawText(`Otros pagos:`, {
        x: margin,
        y,
        size: 12,
        font: helveticaFont
      });
      
      page.drawText(`Q${resumen.detalles.desglose.otros_pagos.toFixed(2)}`, {
        x: width - margin - 100,
        y,
        size: 12,
        font: helveticaFont
      });
      
      y -= 20;
    }
    
    // Línea separadora
    page.drawLine({
      start: { x: margin, y: y - 10 },
      end: { x: width - margin, y: y - 10 },
      thickness: 1,
      color: rgb(0, 0, 0)
    });
    
    y -= 30;
    
    // Total
    page.drawText(`TOTAL A PAGAR:`, {
      x: margin,
      y,
      size: 14,
      font: helveticaBold
    });
    
    page.drawText(`Q${resumen.detalles.total.toFixed(2)}`, {
      x: width - margin - 100,
      y,
      size: 14,
      font: helveticaBold
    });
    
    // Declaración legal
    y -= 80;
    
    const declaracion = `Por medio del presente documento, el empleado declara haber recibido a su entera satisfacción el pago total de sus prestaciones laborales y no tiene ningún reclamo pendiente contra la empresa.`;
    
    page.drawText(declaracion, {
      x: margin,
      y,
      size: 10,
      font: helveticaFont,
      lineHeight: 15,
      maxWidth: width - 2 * margin
    });
    
    // Espacios para firmas
    y -= 100;
    
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
    const pdfBytes = await pdfDoc.save();
    return Buffer.from(pdfBytes);
  } catch (error) {
    console.error('Error al generar PDF de liquidación:', error);
    throw error;
  }
}

module.exports = {
  generarPDF,
  generarPDFLiquidacion
};