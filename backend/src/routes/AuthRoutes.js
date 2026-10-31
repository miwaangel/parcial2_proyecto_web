const { Router } = require('express');
const AuthController = require('../controllers/AuthController');

class AuthRoutes {
  constructor(controller = new AuthController()) {
    this.router = Router();
    this.router.post('/login', controller.login);
  }
}

module.exports = AuthRoutes;
