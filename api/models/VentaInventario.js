/**
 * VentaInventario.js
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
    items: {
      type: 'json',
      required: true
    },
    total: {
      type: 'number',
      required: true
    },
    utilidad:{
      type: 'number',
      required: true
    },
    vendedor:{
      model: 'cliente',
      required: true
    }
  },

};

