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
    if (_.isNull(inputs.registro.valor_promocional) || _.isUndefined(inputs.registro.valor_promocional)) {
      inputs.registro.valor_promocional = 0;
    }
    await Cobro.create({
      fecha: inputs.registro.fecha,
      operario: inputs.registro.operario,
      cliente: inputs.registro.cliente,
      valor: inputs.registro.valor,
      valor_promocional: inputs.registro.valor_promocional
    })
    await Cliente.update({
      id: inputs.registro.cliente
    }).set({
      saldo: inputs.registro.saldo + inputs.registro.valor + inputs.registro.valor_promocional
    });
    return exits.success();
  }


};
