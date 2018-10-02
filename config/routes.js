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
  'POST /login': 'SesionController.login',
  'POST /consume': 'SesionController.consume',
  'POST /logout': 'SesionController.logout',
  'POST /addcredit': 'ClienteController.addcredit',
  'POST /register': 'AdminController.register',
  'GET /watchmonitor': 'AdminController.watchmonitor',
  'POST /newsale': 'InventarioController.newSale',
  'POST /checkstock': 'InventarioController.checkstock',
  'POST /restock': 'InventarioController.restock',
  'POST /restorepass': 'ClienteController.restorepass',
  'POST /loginop': 'AdminController.loginop',
  'POST /sesionreport': 'AdminController.sesionreport',
  'POST /replacesaldo': 'AdminController.replacesaldo',
  'POST /saveinfo': 'ClienteController.saveinfo'
};
