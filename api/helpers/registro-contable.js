module.exports = {

  friendlyName: 'Registro contable',

  description: 'Registro de un hecho contable',

  inputs: {
    registro: {
      type: 'ref',
      required: true
    }
  },

  exits: {
    success: {
      description: 'Se registro el hecho correctamente'
    }
  },

  fn: async function (inputs, exits) {
    //Si no se provee un valor promocional se fija en 0
    if (_.isNull(inputs.registro.valor_promocional) || _.isUndefined(inputs.registro.valor_promocional)) {
      inputs.registro.valor_promocional = 0;
    }
    //Si no se provee un operario en especifico se usa el operario por defecto
    if (_.isNull(inputs.registro.operario) || _.isUndefined(inputs.registro.operario)) {
      inputs.registro.operario = 1;
    }
    try{
      await Cobro.create({
        fecha: inputs.registro.fecha,
        concepto: inputs.registro.concepto,
        operario: inputs.registro.operario,
        cliente: inputs.registro.cliente,
        valor: inputs.registro.valor,
        valor_promocional: inputs.registro.valor_promocional
      });
    }catch (e) {
      throw e;
    }
    return exits.success();
  }

};
