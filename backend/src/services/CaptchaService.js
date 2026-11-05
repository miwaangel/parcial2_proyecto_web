const Config = require('../app/Config');
const HttpError = require('../app/HttpError');

/**
 * Verifica el token de Google reCAPTCHA v2 en el servidor (issue #11).
 * El front manda el token que genera el componente "No soy un robot";
 * aqui se confirma con Google usando la llave SECRETA (nunca va en el front).
 */
class CaptchaService {
  static VERIFY_URL = 'https://www.google.com/recaptcha/api/siteverify';

  /**
   * @param {string} token  valor que devuelve el componente reCAPTCHA del front
   * @param {string} [ip]   IP del cliente (opcional, Google la usa como dato extra)
   * @throws {HttpError} 400 si falta o es invalido, 502 si Google no responde
   */
  async verificar(token, ip) {
    if (!token) {
      throw HttpError.badRequest('Completa el captcha');
    }
    if (!Config.recaptchaSecret) {
      throw new Error('RECAPTCHA_SECRET no esta configurado en el .env');
    }

    const params = new URLSearchParams({ secret: Config.recaptchaSecret, response: token });
    if (ip) params.append('remoteip', ip);

    let respuesta;
    try {
      const res = await fetch(CaptchaService.VERIFY_URL, { method: 'POST', body: params });
      respuesta = await res.json();
    } catch {
      throw new HttpError(502, 'No se pudo verificar el captcha, intenta de nuevo');
    }

    if (!respuesta.success) {
      throw HttpError.badRequest('Captcha invalido, intentalo de nuevo');
    }
  }
}

module.exports = CaptchaService;
