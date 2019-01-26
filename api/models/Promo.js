/**
 * Promo.js
 *
 * @description :: A model definition.  Represents a database table/collection/etc.
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 * @class
 * @augments  :: ../../node_modules/waterline/lib/waterline/MetaModel
 */

module.exports = {

  attributes: {
    /**
     * @desc Codigo formateado '@MDDYYXX'
     * M Primera letra del mes
     * DD dia del mes
     * YY ultimos dos digitos del año
     * XX contador de promociones diarias
     */
    codigo: {
      type: 'string',
      required: true
    },
    /**
     * @desc Id del cliente que solicita ha comprado la promocion
     */
    cliente: {
      model: 'cliente',
      required: true 
    },
    /**
     * @desc Id del operario quien realizo la venta de la promocion
     */
    vendedor:{
      model: 'cliente',
      required: true
    },
    /**
     * @desc Fecha en unix time stamp en la que se compro la promocion
     */
    fecha_compra: {
      type: 'number',
      required: true
    },
    /**
     * @desc Fecha en unix time stamp en la que la promocion expira, cualquier intento de uso a partir de este momento sera negado
     */
    fecha_expiracion: {
      type: 'number',
      required: true
    },
    /**
     * @desc Precio con el que se compro la promocion
     */
    precio_compra: {
      type: 'number',
      required: true
    }
  },

};

