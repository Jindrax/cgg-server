/**
 * CompraInventario.js
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
    item: {
      type: 'string',
      required: true
    },
    unidades: {
      type: 'number',
      required: true
    },
    precio_compra: {
      type: 'number',
      required: true
    },
    comprador: {
      type: 'ref',
      required: true
    }
  },

};

