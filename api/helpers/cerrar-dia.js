const moment = require('moment');

module.exports = {
  friendlyName: "Cerrar Dia",

  description: "Cierra todas las sesiones que puedan haber quedado abiertas durante el dia, se ejecuta a las 11:00 pm GMT-5",

  inputs: {},

  exits: {},

  fn: async function (inputs, exits) {
    try {
      //Buscamos los clientes que aun tengan una sesion abierta
      let clientes = await Cliente.find({
        sesion_activa: {
          '!=': null
        }
      });
      //Para cada uno de esos clientes procedemos a cerrar la sesion
      for (let i = 0; i < clientes.length; i++) {
        console.log('cliente:', clientes[i]);
        let fin = Date.now();
        try {
          await Sesion.update({id: clientes[i].sesion_activa}).set({fin: fin});
          await Cliente.update({id: clientes[i].id}).set({sesion_activa: null});
        } catch (e) {
          console.log(e);
        }
      }
      console.log('Se cerraron exitosamente todas las sesiones abiertas');
      //Liberamos todos los monitores
      await Monitor.update({}, {
        cliente: null
      });
      let equipos = await Monitor.find().populate("cliente");
      sails.sockets.broadcast('watchmanRoom', 'watchUpdate', equipos);
      console.log('Se liberaron todos los monitores de los equipos');
      //Expiramos membresias
      let ahora = moment();
      await Cliente.update({
        miembro: true,
        miembro_hasta: {
          '<': ahora.valueOf()
        }
      }).set({
        miembro: false,
        miembro_hasta: 0
      });
      console.log('Membresias expiradas correctamente');
      return exits.success();
    } catch (e) {
      return exits.error(e);
    }
  }
};
