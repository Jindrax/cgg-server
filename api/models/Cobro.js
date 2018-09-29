/**
 * Configuracion.js
 *
 * @description :: A model definition.  Represents a database table/collection/etc.
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */

module.exports = {

  attributes: {
    fecha: {
      type: 'number',
      required: true
    },
    operario: {
      model: 'cliente',
      required: true
    },
    cliente: {
      model: 'cliente',
      required: true
    },
    valor: {
      type: 'number',
      required: true
    },
    valor_promocional: {
      type: 'number',
      defaultsTo: 0
    }
  },

};

