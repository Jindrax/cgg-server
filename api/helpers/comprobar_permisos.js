module.exports = {

  friendlyName: 'Comprobar Permisos',

  description: 'La funcion recibe un nivel de permisos requerido para una peticion y prueba si el usuario que realiza la peticion tiene permisos suficientes',

  inputs: {
    /**
     * @desc Objeto que contiene la peticion (request) que se quiere probar
     */
    req: {
      type: 'ref',
      required: true
    },
    /**
     * @desc String que representa el nivel de permisos necesario para pasar la prueba
     * los valores pueden ser 'operario' o 'admin'
     */
    permisos_requeridos: {
      type: 'string',
      required: true
    }
  },

  exits: {
    success: {
      description: 'Diccionario formado y retornado correctamente'
    }
  },

  /**
   * @returns {Promise<*>} La promesa se realiza si el usuario tiene permisos suficientes, en cualquier otro caso lanza un error y la promesa no se realiza
   */
  fn: async function (inputs, exits) {
    //Se valida la existencia de una sesion de la que poder obtener la informacion para probar
    if(_.isNull(inputs.req.session) || _.isUndefined(inputs.req.session) || _.isEmpty(inputs.req.session)){
      throw 'Sesion inexistente';
    }
    if(inputs.permisos_requeridos === 'operario'){
      if(inputs.req.session.usuario.operario || inputs.req.session.usuario.admin){
        return exits.success(inputs.req.session.usuario);
      }else{
        throw 'Permisos insuficientes';
      }
    }else if(inputs.permisos_requeridos === 'admin'){
      if(inputs.req.session.usuario.admin){
        return exits.success(inputs.req.session.usuario);
      }else{
        throw 'Permisos insuficientes';
      }
    }else{
      throw 'Nivel de permisos invalido';
    }
  }
};
