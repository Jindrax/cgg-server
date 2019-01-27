module.exports = {
  friendlyName: "Editar configuracion",

  description: "Endpoint para modificar el valor de una configuracion en el sistema",

  inputs: {
    /**
     * Id de la configuracion a modificar, no confundir con el identificador
     */
    id:{
      type: 'number',
      required: true
    },
    /**
     * Valor por el que se solicita modificar la configuracion
     */
    valor:{
      type: 'string',
      required: true
    }

  },

  exits: {
  },

  fn: async function (inputs, exits) {
    try{
      //Comprobamos la validez de la peticion
      await sails.helpers.comprobarPermisos(this.req, 'admin');
      //Obtenemos el resultado de la consulta
      let nuevaConfiguracion = await Configuracion.update({
        id: inputs.id
      }).set({
        valor: inputs.valor
      }).fetch();
      //En este punto la peticion ha sido resuelta correctamente y enviamos el resultado de la peticion
      return exits.success(nuevaConfiguracion[0]);
    }catch (e) {
      //En caso de que el usuario no tenga permisos suficientes u ocurra un error en la base de datos, notificamos el error a la aplicacion cliente
      return exits.error(e);
    }
  }
};
