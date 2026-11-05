// Genera el hash bcrypt de un password para ponerlo en ADMIN_PASS_HASH del .env
// Uso: npm run hash -- miPassword
const bcrypt = require('bcryptjs');

const password = process.argv[2];
if (!password) {
  console.error('Uso: npm run hash -- <password>');
  process.exit(1);
}

console.log(bcrypt.hashSync(password, 10));
