/**
 * Configuracion.js
 *
 * @description :: A model definition.  Represents a database table/collection/etc.
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */

module.exports = {

  attributes: {
    /**
     * @desc fecha en formato unix time stamp en la que se realizo el hecho contable
     */
    fecha: {
      type: 'number',
      required: true
    },
    /**
     * @desc concepto por el que se realizo el hecho contable
     */
    concepto: {
      type: 'string',
      defaultsTo: 'Venta de saldo'
    },
    /**
     * @desc el operario o administrador que realizo el hecho contable
     */
    operario: {
      model: 'cliente',
      required: true
    },
    /**
     * @desc el cliente que solicito el hecho contable
     */
    cliente: {
      model: 'cliente',
      required: true
    },
    /**
     * @desc el valor por el que se registra el hecho contable
     */
    valor: {
      type: 'number',
      required: true
    },
    /**
     * @desc en algunos casos se ofrece un valor promocional el cual es usado en el sistema pero nunca entra como ingreso contable
     */
    valor_promocional: {
      type: 'number',
      defaultsTo: 0
    }
  },

};

