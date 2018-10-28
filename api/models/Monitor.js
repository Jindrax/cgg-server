/**
 * Sesion.js
 *
 * @description :: A model definition.  Represents a database table/collection/etc.
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */

module.exports = {

  attributes: {
    equipo: {
      type: 'number',
      required: true 
    },
    ultima_ip: {
      type: 'string',
      defaultsTo: 'localhost'
    },
    activo: {
      type: 'boolean',
      defaultsTo: false
    },
    cliente: {
      model: 'cliente'
    }
  }

};

