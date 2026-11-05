const PDFDocument = require('pdfkit');
const QRCode = require('qrcode');
const GeneradorDocumento = require('./GeneradorDocumento');

const COLORES = {
  moradoClaro: '#b9a0d6',
  moradoOscuro: '#7a5a9e',
  azul: '#3d7cc9',
  azulOscuro: '#1d4f8f',
  texto: '#212529',
  gris: '#6c757d',
  fondo: '#f1f3f5',
  linea: '#dee2e6',
};

const ZONA_HORARIA = 'America/Monterrey'; // Coahuila

/**
 * Comprobante de turno en PDF con codigo QR de la CURP (issue #15).
 * Diseno basado en la pantalla "Ticket de Turno": logo SE, titulo y numero de turno.
 */
class ComprobantePdf extends GeneradorDocumento {
  get contentType() {
    return 'application/pdf';
  }

  nombreArchivo(solicitud) {
    return `comprobante-turno-${solicitud.turno}.pdf`;
  }

  /** QR que contiene SOLO la CURP (asi lo pide la rubrica). */
  async generarQr(curp) {
    return QRCode.toBuffer(curp, { errorCorrectionLevel: 'M', margin: 1, width: 360 });
  }

  /**
   * @param {object} solicitud  con la forma del contrato (incluye municipio, nivel y asunto)
   * @returns {Promise<Buffer>}
   */
  async generar(solicitud) {
    const qr = await this.generarQr(solicitud.curp);

    const doc = new PDFDocument({
      size: 'LETTER',
      margin: 50,
      info: {
        Title: `Ticket de Turno ${solicitud.turno} - ${this.texto(solicitud.municipio?.nombre)}`,
        Author: 'Secretaría de Educación',
        Subject: 'Comprobante de turno',
      },
    });

    const partes = [];
    doc.on('data', (parte) => partes.push(parte));
    const terminado = new Promise((resolve, reject) => {
      doc.on('end', () => resolve(Buffer.concat(partes)));
      doc.on('error', reject);
    });

    this.dibujarEncabezado(doc, solicitud);
    this.dibujarTurno(doc, solicitud);
    const finDatos = this.dibujarDatos(doc, solicitud, qr);
    this.dibujarPie(doc, finDatos + 24);

    doc.end();
    return terminado;
  }

  // ---------------------------------------------------------------- secciones

  dibujarEncabezado(doc, s) {
    const x = 50;
    const y = 50;
    const derecha = doc.page.width - 50;

    // Logo de la Secretaria (dos franjas moradas)
    doc.rect(x, y, 50, 31).fill(COLORES.moradoClaro);
    doc.rect(x, y + 31, 50, 19).fill(COLORES.moradoOscuro);
    doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(14)
      .text('SE', x, y + 7, { width: 50, align: 'center' });
    doc.font('Helvetica').fontSize(5)
      .text('SECRETARÍA\nDE EDUCACIÓN', x, y + 35, { width: 50, align: 'center', lineGap: -1 });

    // Titulo
    doc.fillColor(COLORES.texto).font('Helvetica').fontSize(26)
      .text('Ticket de Turno', x + 60, y + 10, { width: derecha - x - 130, align: 'center' });

    // Circulo con el numero de turno
    const cx = derecha - 26;
    const cy = y + 25;
    doc.ellipse(cx, cy, 26, 28).lineWidth(2).fillAndStroke(COLORES.azul, COLORES.azulOscuro);
    doc.fillColor('#ffffff').font('Helvetica-BoldOblique').fontSize(this.tamanoTurno(s.turno, 22))
      .text(String(s.turno), cx - 26, cy - 9, { width: 52, align: 'center' });

    doc.moveTo(x, y + 68).lineTo(derecha, y + 68).lineWidth(1).strokeColor(COLORES.linea).stroke();
  }

  dibujarTurno(doc, s) {
    const x = 50;
    const y = 135;
    const ancho = doc.page.width - 100;

    doc.roundedRect(x, y, ancho, 80, 8).fill(COLORES.fondo);

    doc.fillColor(COLORES.gris).font('Helvetica').fontSize(10)
      .text('TURNO', x + 20, y + 14);
    doc.fillColor(COLORES.azulOscuro).font('Helvetica-Bold').fontSize(this.tamanoTurno(s.turno, 40))
      .text(String(s.turno), x + 20, y + 28);

    doc.fillColor(COLORES.gris).font('Helvetica').fontSize(10)
      .text('MUNICIPIO', x + 170, y + 14);
    doc.fillColor(COLORES.texto).font('Helvetica-Bold').fontSize(18)
      .text(this.texto(s.municipio?.nombre), x + 170, y + 30, { width: ancho - 190 });
    doc.fillColor(COLORES.gris).font('Helvetica').fontSize(10)
      .text(`Registrado el ${this.fecha(s.createdAt)}`, x + 170, y + 55, { width: ancho - 190 });
  }

  dibujarDatos(doc, s, qr) {
    const x = 50;
    let y = 240;
    const anchoEtiqueta = 120;
    const anchoValor = 210;

    const alumno = [s.nombre, s.paterno, s.materno].filter(Boolean).join(' ');
    const filas = [
      ['Realiza el trámite', s.nombreCompleto],
      ['CURP', s.curp],
      ['Alumno', alumno],
      ['Teléfono', s.telefono],
      ['Celular', s.celular],
      ['Correo', s.correo],
      ['Nivel', s.nivel?.nombre],
      ['Municipio', s.municipio?.nombre],
      ['Asunto', s.asunto?.nombre],
      ['Estatus', s.estatus],
    ];

    doc.fillColor(COLORES.texto).font('Helvetica-Bold').fontSize(13)
      .text('Datos de la solicitud', x, y);
    y += 24;

    for (const [etiqueta, valor] of filas) {
      const texto = this.texto(valor);
      doc.font('Helvetica').fontSize(11);
      const alto = Math.max(doc.heightOfString(texto, { width: anchoValor }), 14);

      doc.fillColor(COLORES.gris).font('Helvetica').fontSize(10)
        .text(etiqueta, x, y + 1, { width: anchoEtiqueta });
      doc.fillColor(COLORES.texto).font('Helvetica').fontSize(11)
        .text(texto, x + anchoEtiqueta, y, { width: anchoValor });

      y += alto + 8;
      doc.moveTo(x, y - 4).lineTo(x + anchoEtiqueta + anchoValor, y - 4)
        .lineWidth(0.5).strokeColor(COLORES.linea).stroke();
    }

    // QR con la CURP
    const qrX = doc.page.width - 50 - 160;
    const qrY = 264;
    doc.roundedRect(qrX - 6, qrY - 6, 172, 200, 6).lineWidth(1).strokeColor(COLORES.linea).stroke();
    doc.image(qr, qrX, qrY, { width: 160, height: 160 });
    doc.fillColor(COLORES.gris).font('Helvetica').fontSize(8)
      .text('Código QR con la CURP', qrX, qrY + 164, { width: 160, align: 'center' });
    doc.fillColor(COLORES.texto).font('Courier-Bold').fontSize(10)
      .text(s.curp, qrX, qrY + 176, { width: 160, align: 'center' });

    // Regresa donde termina la seccion (lo mas bajo entre la tabla y el QR)
    return Math.max(y, qrY + 194);
  }

  dibujarPie(doc, y) {
    const x = 50;
    const ancho = doc.page.width - 100;

    doc.roundedRect(x, y, ancho, 62, 6).fill('#e7f1ff');
    doc.fillColor(COLORES.azulOscuro).font('Helvetica-Bold').fontSize(10)
      .text('Indicaciones', x + 14, y + 10);
    doc.fillColor(COLORES.texto).font('Helvetica').fontSize(9)
      .text(
        'Presente este comprobante en la oficina de su municipio con una identificación oficial. '
        + 'Para consultar o modificar su solicitud ingrese con su CURP y número de turno.',
        x + 14, y + 25, { width: ancho - 28 },
      );

    doc.fillColor(COLORES.gris).fontSize(8)
      .text(`Generado el ${this.fecha(new Date())}`, x, y + 80, { width: ancho, align: 'center' });
  }

  // ---------------------------------------------------------------- utilidades

  texto(valor) {
    return valor === undefined || valor === null || String(valor).trim() === '' ? '—' : String(valor);
  }

  fecha(valor) {
    const d = new Date(valor);
    if (Number.isNaN(d.getTime())) return '—';
    return d.toLocaleString('es-MX', { dateStyle: 'long', timeStyle: 'short', timeZone: ZONA_HORARIA });
  }

  /** Reduce la letra si el turno tiene muchos digitos para que quepa en el circulo. */
  tamanoTurno(turno, base) {
    const digitos = String(turno).length;
    return digitos <= 2 ? base : Math.max(base - (digitos - 2) * 5, 10);
  }
}

module.exports = ComprobantePdf;
