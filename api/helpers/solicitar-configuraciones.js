module.exports = {


  friendlyName: 'Solicitar Congifuraciones',


  description: 'recibe un arreglo de nombres de configuraciones y retorna un diccionario cuya llave es el nombre de la configuracion y valor el valor retornado de la busqueda en la base de datos.',


  inputs: {
    config_requeridas: {
      type: 'ref',
      required: true
    }
  },


  exits: {
    success: {
      description: 'Diccionario formado y retornado correctamente'
    }
  },


  fn: async function (inputs, exits) {
    let config_DB = await Configuracion.find({
      identificador: inputs.config_requeridas
    });
    let config = {};
    _.each(config_DB, (valor) => {
      config[valor.identificador] = Number(valor.valor);
    });
    if(_.isEmpty(config)){
      throw 'No se encontro ninguna configuracion pedida'
    }
    if(inputs.config_requeridas.length > Object.keys(config).length){
      throw 'No se encontraron todas las configuraciones pedidas'
    }
    return exits.success(config);
  }


};
