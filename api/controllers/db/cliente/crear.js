module.exports = {
  friendlyName: "Crear cliente",

  description: "Endpoint para solicitar la creacion de un nuevo cliente",

  inputs: {
    /**
     * Objeto que contiene los valores iniciales del nuevo cliente
     */
    cliente: {
      type: 'ref',
      required: true
    }
  },

  exits: {},

  fn: async function (inputs, exits) {
    try {
      //Comprobamos la validez de la peticion
      await sails.helpers.comprobarPermisos(this.req, 'operario');
      //Creamos el cliente
      await Cliente.create(inputs.cliente);
      //Si el usuario se pudo crear correctamente, registramos el hecho para posterior auditoria
      await AdminLog.create({
        fecha: Date.now(),
        anotacion: `${this.req.session.usuario.username} creó al usuario ${
          inputs.cliente.username
          } con los modificadores: ${inputs.cliente.operario ? ", operario" : ""}${
          inputs.cliente.admin ? ", admin" : ""
          }`
      });
      //En este punto la peticion ha sido resuelta correctamente
      return exits.success();
    } catch (e) {
      //En caso de que el usuario no tenga permisos suficientes u ocurra un error en la base de datos, notificamos el error a la aplicacion cliente
      return exits.error(e);
    }
  }
};
