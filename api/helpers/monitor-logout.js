module.exports = {


  friendlyName: 'Registrar cliente en monitor',


  description: 'Registrar el cierre de sesion de un cliente en el sistema de monitoreo',


  inputs: {
    equipo: {
      type: 'number',
      required: true
    }
  },


  exits: {
    success: {
      description: 'Se registro el hecho correctamente'
    }
  },


  fn: async function (inputs, exits) {
    await Monitor.update({equipo: inputs.equipo}, {
      cliente: null
    });
    let equipos = await Monitor.find().populate("cliente");
    sails.sockets.broadcast('watchmanRoom', 'watchUpdate', equipos);
    return exits.success();
  }


};