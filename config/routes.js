/**
 * Route Mappings
 * (sails.config.routes)
 *
 * Your routes tell Sails what to do each time it receives a request.
 *
 * For more information on configuring custom routes, check out:
 * https://sailsjs.com/anatomy/config/routes-js
 */

module.exports.routes = {
  '/': {
    view: 'pages/homepage'
  },
  /**
   * Rutas encargadas de la sesion en el cliente
   */
  //Ruta para el inicio de sesion
  'POST /login': 'SesionController.login',
  //Ruta para el consumo de saldo por concepto de servicio
  'POST /consume': 'SesionController.consume',
  //Ruta para la finalizacion de sesion
  'POST /logout': 'SesionController.logout',
  //Ruta usada por el cliente para guardar informacion del mismo
  'POST /saveinfo': 'ClienteController.saveinfo',
  //Ruta usada por el cliente para comprar una membresia, tambien puede ser usada por el cliente administrador
  'POST /upgrademembership': 'ClienteController.upgrademembership',

  /**
   * Rutas encargadas del monitoreo de los clientes
   */
  //Ruta para registrar un equipo cliente
  'POST /register': 'AdminController.register',
  //Ruta para instaurar un monitor
  'GET /watchmonitor': 'AdminController.watchmonitor',
  //Ruta para actualizar un monitor
  'GET /refreshmonitor': 'AdminController.refreshmonitor',

  /**
   * Rutas encargadas del inventario
   */
  //Ruta para ventas de inventario
  'POST /newsale': 'InventarioController.newSale',
  //Ruta para comprobacion de inventario
  'POST /checkstock': 'InventarioController.checkstock',
  //Ruta para reabastecer el inventario
  'POST /restock': 'InventarioController.restock',

  /**
   * Rutas del cliente administrador
   */
  //Ruta para solicitar un reestablecimiento de contraseña
  'POST /restorepass': 'ClienteController.restorepass',
  //Ruta para el inicio de sesion en el cliente administrador
  'POST /loginop': 'AdminController.loginop',
  //Ruta para solicitar un reporte de sesiones
  'POST /sesionreport': 'AdminController.sesionreport',
  //Ruta para solicitar un reporte de ventas
  'POST /inventoryreport': 'AdminController.inventoryreport',
  //Ruta para ajustar el saldo de un cliente
  'POST /replacesaldo': 'AdminController.replacesaldo',
  //Ruta encargada de añadir credito, usada en el cliente administrador
  'POST /addcredit': 'ClienteController.addcredit',
  //Ruta para vender promociones a los clientes
  'POST /sell_promo': 'AdminController.sell_promo',

  /**
   * Rutas CRUD
   */
  //Cliente
  'POST /db/cliente/crear': {
    action: 'db/cliente/crear'
  },
  'GET /db/cliente/buscar': {
    action: 'db/cliente/buscar'
  },
  //Cobro
  'GET /db/cobro/buscar': {
    action: 'db/cobro/buscar'
  },
  //Item
  'POST /db/item/crear': {
    action: 'db/item/crear'
  },
  'GET /db/item/buscar': {
    action: 'db/item/buscar'
  },
  //Configuracion
  'GET /db/configuracion/buscar': {
    action: 'db/configuracion/buscar'
  },
  'POST /db/configuracion/editar': {
    action: 'db/configuracion/editar'
  },

  /**
   * Rutas para funcionalidad diversa
   */
  //Ruta usada para corregir fechas erroneas provocadas por un bug
  //'GET /corregirfechas': 'AdminController.corregirfechas',
  //Ruta para solicitar un informe de asistencia
  'GET /informeasistencia': 'AdminController.informeasistencia',
  //Ruta para solicitar un grafico de un informe de asistencia
  'GET /horarioChart': {
    view: 'chart'
  },
  //Ruta para probar el helper de cerrar el dia
  /*'GET /close-day': {
    action: 'actions/close-day'
  }*/
};
