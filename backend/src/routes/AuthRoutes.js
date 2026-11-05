const { Router } = require('express');
const AuthController = require('../controllers/AuthController');

/**
 * @openapi
 * /auth/login:
 *   post:
 *     tags: [Autenticacion]
 *     summary: Login de administrador con reCAPTCHA
 *     description: >
 *       El captcha se valida con Google ANTES de revisar usuario y password.
 *       Con la llave de prueba del .env.example cualquier `captchaToken` es aceptado.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [usuario, password, captchaToken]
 *             properties:
 *               usuario: { type: string, example: admin }
 *               password: { type: string, example: Admin123! }
 *               captchaToken: { type: string, example: token-del-widget }
 *     responses:
 *       200:
 *         description: Sesion iniciada. Copia el token y usalo en Authorize.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token: { type: string, description: 'JWT, expira en JWT_EXPIRES_IN (8h)' }
 *                 usuario:
 *                   type: object
 *                   properties:
 *                     id: { type: integer, example: 1 }
 *                     usuario: { type: string, example: admin }
 *                     nombre: { type: string, example: Administrador }
 *       400: { $ref: '#/components/responses/Error400' }
 *       401:
 *         description: Usuario o password incorrectos
 *         content:
 *           application/json:
 *             example: { error: Usuario o password incorrectos }
 */
class AuthRoutes {
  constructor(controller = new AuthController()) {
    this.router = Router();
    this.router.post('/login', controller.login);
  }
}

module.exports = AuthRoutes;
