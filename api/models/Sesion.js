/**
 * Sesion.js
 *
 * @description :: A model definition.  Represents a database table/collection/etc.
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */

module.exports = {

  attributes: {
    cliente: {
      model: 'cliente',
      required: true 
    },
    equipo: {
      type: 'number',
      required: true
    },
    inicio: {
      type: 'number',
      required: true
    },
    fin: {
      type: 'number'
    },
    minutos_consumidos: {
      type: 'number',
      defaultsTo: 0
    },
    saldo_consumido: {
      type: 'number',
      defaultsTo: 0
    }
  },

};

