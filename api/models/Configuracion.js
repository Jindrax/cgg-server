/**
 * Configuracion.js
 *
 * @description :: A model definition.  Represents a database table/collection/etc.
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */

module.exports = {

  attributes: {
    identificador: {
      type: 'string',
      required: true,
      unique: true
    },
    valor: {
      type: 'string',
      required: true
    }
  },

};

