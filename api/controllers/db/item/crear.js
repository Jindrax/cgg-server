module.exports = {
  friendlyName: "Crear item",

  description: "Endpoint para solicitar la creacion de un nuevo item en el inventario",

  inputs: {
    /**
     * Objeto que contiene los valores iniciales del nuevo item
     */
    item:{
      type: 'ref',
      required: true
    }
  },

  exits: {
  },

  fn: async function (inputs, exits) {
    try{
      //Comprobamos la validez de la peticion
      await sails.helpers.comprobarPermisos(this.req, 'admin');
      //Creamos el cliente
      await Item.create(inputs.item);
      //Si el usuario se pudo crear correctamente, registramos el hecho para posterior auditoria
      await AdminLog.create({
        fecha: Date.now(),
        anotacion: `${this.req.session.usuario.username} creó el item ${
          inputs.item.description
          } con un inventario inicial de ${inputs.item.unidades}, comprados a un valor de ${inputs.item.precio_compra} cada uno`
      });
      //En este punto la peticion ha sido resuelta correctamente
      return exits.success();
    }catch (e) {
      //En caso de que el usuario no tenga permisos suficientes u ocurra un error en la base de datos, notificamos el error a la aplicacion cliente
      return exits.error(e);
    }
  }
};
