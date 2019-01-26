module.exports = {
  friendlyName: "Buscar item(s)",

  description: "Endpoint para realizar una busqueda entre los items del inventario",

  inputs: {
    /**
     * Objeto que contiene los parametros de la busqueda, ver documentacion de Sails
     * https://sailsjs.com/documentation/concepts/models-and-orm/query-language
     */
    consulta:{
      type: 'ref',
      required: true
    }
  },

  exits: {
  },

  fn: async function (inputs, exits) {
    try{
      //Comprobamos la validez de la peticion
      await sails.helpers.comprobarPermisos(this.req, 'operario');
      //Obtenemos el resultado de la consulta
      let consulta = await Item.find(inputs.consulta);
      //En este punto la peticion ha sido resuelta correctamente y enviamos el resultado de la consulta
      return exits.success(consulta);
    }catch (e) {
      //En caso de que el usuario no tenga permisos suficientes u ocurra un error en la base de datos, notificamos el error a la aplicacion cliente
      return exits.error(e);
    }
  }
};
