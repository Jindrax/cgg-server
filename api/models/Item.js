/**
 * Sesion.js
 *
 * @description :: A model definition.  Represents a database table/collection/etc.
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */

module.exports = {

  attributes: {
    descripcion: {
      type: 'string',
      required: true 
    },
    unidades: {
      type: 'number',
      required: true
    },
    precio_venta: {
      type: 'number',
      required: true
    },
    precio_compra: {
      type: 'number',
      required: true
    }
  },

};

