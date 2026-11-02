const HttpError = require('../app/HttpError');

const REGEX_CURP = /^[A-Z]{4}\d{6}[HM][A-Z]{5}[A-Z0-9]\d$/;
const REGEX_NOMBRE = /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ' .-]+$/;
const REGEX_CORREO = /^[^\s@]+@[^\s@]+\.[A-Za-z]{2,}$/;
const REGEX_TELEFONO = /^\d{10}$/;
const ENTIDADES_CURP = new Set('AS BC BS CC CS CH CL CM CT DF DG GT GR HG JC MC MN MS NT NL OC PL QT QR SP SL SR TC TL VZ YN ZS NE'.split(' '));

/**
 * Valida y normaliza los datos de una Solicitud (issues #13 y #14).
 * Reglas tomadas de docs/contrato-api.md (seccion 1, tabla solicitudes).
 *
 * Normaliza: quita espacios sobrantes, CURP en mayusculas, correo en minusculas,
 * telefonos solo con digitos, opcionales vacios -> null.
 */
class SolicitudValidator {
  /** campo -> { etiqueta, obligatorio, tipo, maximo } */
  static CAMPOS = {
    curp: { etiqueta: 'La CURP', obligatorio: true, tipo: 'curp', femenino: true },
    nombreCompleto: { etiqueta: 'El nombre de quien realiza el tramite', obligatorio: true, tipo: 'nombre', maximo: 150 },
    nombre: { etiqueta: 'El nombre', obligatorio: true, tipo: 'nombre', maximo: 80 },
    paterno: { etiqueta: 'El apellido paterno', obligatorio: true, tipo: 'nombre', maximo: 80 },
    materno: { etiqueta: 'El apellido materno', obligatorio: false, tipo: 'nombre', maximo: 80 },
    telefono: { etiqueta: 'El telefono', obligatorio: false, tipo: 'telefono' },
    celular: { etiqueta: 'El celular', obligatorio: true, tipo: 'telefono' },
    correo: { etiqueta: 'El correo', obligatorio: true, tipo: 'correo', maximo: 120 },
    nivelId: { etiqueta: 'El nivel', obligatorio: true, tipo: 'id' },
    municipioId: { etiqueta: 'El municipio', obligatorio: true, tipo: 'id' },
    asuntoId: { etiqueta: 'El asunto', obligatorio: true, tipo: 'id' },
  };

  static ESTATUS = ['Pendiente', 'Resuelto'];

  /**
   * @param {object} datos           lo que llega en el body
   * @param {object} opciones
   * @param {string[]} opciones.permitidos  campos que se aceptan (los demas se ignoran)
   * @param {boolean} [opciones.parcial]    true en actualizaciones: solo valida lo que venga
   * @returns {object} datos limpios, solo con campos permitidos
   * @throws {HttpError} 400 con el primer error encontrado
   */
  validar(datos, { permitidos, parcial = false }) {
    if (!datos || typeof datos !== 'object' || Array.isArray(datos)) {
      throw HttpError.badRequest('El cuerpo de la peticion debe ser un objeto JSON');
    }

    const limpio = {};
    for (const campo of permitidos) {
      const regla = SolicitudValidator.CAMPOS[campo];
      const viene = Object.prototype.hasOwnProperty.call(datos, campo);
      if (parcial && !viene) continue;

      const valor = this.normalizar(datos[campo], regla.tipo);
      if (valor === null) {
        if (regla.obligatorio) {
          throw HttpError.badRequest(`${regla.etiqueta} es ${regla.femenino ? 'obligatoria' : 'obligatorio'}`);
        }
        limpio[campo] = null;
        continue;
      }
      this.revisar(valor, regla);
      limpio[campo] = valor;
    }

    if (parcial && Object.keys(limpio).length === 0) {
      throw HttpError.badRequest('No se mando ningun campo para actualizar');
    }
    return limpio;
  }

  validarEstatus(estatus) {
    if (!SolicitudValidator.ESTATUS.includes(estatus)) {
      throw HttpError.badRequest('El estatus debe ser Pendiente o Resuelto');
    }
    return estatus;
  }

  validarCurp(curp) {
    const valor = this.normalizar(curp, 'curp');
    if (!valor) throw HttpError.badRequest('La CURP es obligatoria');
    this.revisar(valor, SolicitudValidator.CAMPOS.curp);
    return valor;
  }

  validarTurno(turno) {
    const numero = Number(turno);
    if (turno === undefined || turno === null || turno === '' || !Number.isInteger(numero) || numero < 1) {
      throw HttpError.badRequest('El turno debe ser un numero entero mayor a 0');
    }
    return numero;
  }

  validarId(id, etiqueta = 'El id') {
    const numero = Number(id);
    if (!Number.isInteger(numero) || numero < 1) throw HttpError.badRequest(`${etiqueta} no es valido`);
    return numero;
  }

  // ------------------------------------------------------------ internos

  /** Regresa el valor limpio, o null si viene vacio. */
  normalizar(valor, tipo) {
    if (valor === undefined || valor === null) return null;
    if (tipo === 'id') return valor === '' ? null : Number(valor);

    let texto = String(valor).trim().replace(/\s+/g, ' ');
    if (texto === '') return null;
    if (tipo === 'curp') texto = texto.toUpperCase();
    if (tipo === 'correo') texto = texto.toLowerCase();
    if (tipo === 'telefono') texto = texto.replace(/[\s()-]/g, '');
    return texto;
  }

  revisar(valor, { etiqueta, tipo, maximo }) {
    const error = (mensaje) => { throw HttpError.badRequest(`${etiqueta} ${mensaje}`); };

    if (maximo && valor.length > maximo) error(`admite maximo ${maximo} caracteres`);
    switch (tipo) {
      case 'curp':
        if (!REGEX_CURP.test(valor) || !SolicitudValidator.curpConsistente(valor)) {
          error('no tiene un formato valido: usa 18 caracteres, fecha, sexo y entidad validos');
        }
        break;
      case 'nombre':
        if (valor.length < 2) error('debe tener al menos 2 letras');
        if (!REGEX_NOMBRE.test(valor)) error('solo admite letras y espacios');
        break;
      case 'telefono':
        if (!REGEX_TELEFONO.test(valor)) error('debe tener 10 digitos');
        break;
      case 'correo':
        if (!REGEX_CORREO.test(valor)) error('no es valido (ej. nombre@correo.com)');
        break;
      case 'id':
        if (!Number.isInteger(valor) || valor < 1) error('no es valido');
        break;
      default:
    }
  }

  static curpConsistente(curp) {
      const mes = Number(curp.slice(6, 8));
      const dia = Number(curp.slice(8, 10));
      const anio = Number(curp.slice(4, 6));
      const siglo = /[A-Z]/.test(curp[16]) ? 2000 : 1900;
      const fecha = new Date(Date.UTC(siglo + anio, mes - 1, dia));
      const fechaValida = mes >= 1 && mes <= 12 && dia >= 1 && dia <= 31
        && fecha.getUTCFullYear() === siglo + anio
        && fecha.getUTCMonth() === mes - 1
        && fecha.getUTCDate() === dia;
      const consonantes = /^[BCDFGHJKLMNÑPQRSTVWXYZ]{3}$/.test(`${curp[13]}${curp[14]}${curp[15]}`);
      return fechaValida && ENTIDADES_CURP.has(curp.slice(11, 13)) && consonantes;
  }
}

module.exports = SolicitudValidator;
