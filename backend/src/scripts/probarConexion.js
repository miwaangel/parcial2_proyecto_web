const Database = require('../config/Database');

(async () => {
  try {
    await Database.probarConexion();
    const a = Database.getInstance();
    const b = Database.getInstance();
    console.log('Conexión exitosa a MySQL');
    console.log('¿Misma instancia (Singleton)?', a === b);
  } catch (error) {
    console.error('Error de conexión:', error.message);
    process.exitCode = 1;
  } finally {
    await Database.cerrar();
  }
})();