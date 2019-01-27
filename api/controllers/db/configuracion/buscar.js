module.exports = {
  friendlyName: "Buscar configuracion(es)",

  description: "Endpoint para realizar una busqueda entre las configuraciones del sistema",

  inputs: {
    /**
     * Objeto que contiene los parametros de la busqueda, ver documentacion de Sails
     * https://sailsjs.com/documentation/concepts/models-and-orm/query-language
     */
    consulta:{
      type: 'ref',
      required: true
    },

  },

  exits: {
  },

  fn: async function (inputs, exits) {
    try{
      //Comprobamos la validez de la peticion
      await sails.helpers.comprobarPermisos(this.req, 'admin');
      //Obtenemos el resultado de la consulta
      let consulta = await Configuracion.find(inputs.consulta);
      //En este punto la peticion ha sido resuelta correctamente y enviamos el resultado de la consulta
      return exits.success(consulta);
    }catch (e) {
      //En caso de que el usuario no tenga permisos suficientes u ocurra un error en la base de datos, notificamos el error a la aplicacion cliente
      return exits.error(e);
    }
  }
};
