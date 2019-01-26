/**
 * cliente.js
 *
 * @description :: A model definition.  Represents a database table/collection/etc.
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */

module.exports = {

  attributes: {
    /**
     * @desc Nombre de usuario, actualmente no cuenta con ninguna restriccion.
     */
    username: {
      type: 'string',
      required: true,
      unique: true
    },
    /**
     * @desc Contraseña encriptada del usuario, actualmente no cuenta con ninguna restriccion.
     */
    password: {
      type: 'string',
      required: true,
      encrypt: true
    },
    /**
     * @desc Saldo a favor que el establecimiento guarda para el usuario. Determina si el usuario puede acceder a los servicios.
     */
    saldo: {
      type: 'number',
      defaultsTo: 0
    },
    /**
     * @desc Cifra estadistica del numero de minutos que el usuario a consumido en el establecimiento.
     */
    minutos_consumidos: {
      type: 'number',
      defaultsTo: 0
    },
    /**
     * @desc Cifra estadistica del saldo que ha consumido el usuario en el establecimiento.
     */
    pagado: {
      type: 'number',
      defaultsTo: 0
    },
    /**
     * @desc Bandera que eleva el estado de usuario a miembro, determina el acceso especial a servicios.
     */
    miembro: {
      type: 'boolean',
      defaultsTo: false
    },
    /**
     * @desc Fecha en formato unix time stamp que determina hasta que fecha el usuario tiene una membresia valida.
     */
    miembro_hasta: {
      type: 'number'
    },
    /**
     * @desc Bandera que identifica al usuario como operario del establecimiento.
     */
    //TODO: Optimizar el sistema unificando el nivel de permisos, se propone un sistema decimal 0 = admin, 1 = operario
    operario: {
      type: 'boolean',
      defaultsTo: false
    },
    /**
     * @desc Bandera que identifica al usuario como administrador del sistema.
     */
    admin: {
      type: 'boolean',
      defaultsTo: false
    },
    /**
     * @desc Coleccion de sesiones pertenecientes al usuario
     * @deprecated No se ha implementado correctamente y tampoco se ha llegado a necesitar, por lo que puede ser removido en futuras iteraciones.
     */
    sesiones: {
      collection: 'sesion',
      via: 'cliente'
    },
    /**
     * @desc Id de la sesion que se encuentra activa para el usuario, un usuario solo puede tener una sesion activa a la vez.
     */
    sesion_activa: {
      model: 'sesion'
    },
    /**
     * @desc Bandera que determina si un administrador ha solicitado el reestablecimiento de la contraseña del usuario.
     */
    restaurar_pass:{
      type: 'boolean',
      defaultsTo: false
    },
    /**
     * @desc  Nombres del usuario, informacion estadistica sensible.
     */
    nombres:{
      type: 'string',
      defaultsTo: 'n.n'
    },
    /**
     * @desc Apellidos del usuario, informacion estadistica sensible.
     */
    apellidos:{
      type: 'string',
      defaultsTo: 'n.n'
    },
    /**
     * @desc Email del usuario, informacion estadistica sensible.
     */
    email:{
      type: 'string',
      defaultsTo: 'none'
    },
    /**
     * @desc Telefono de contacto del usuario, informacion estadistica sensible.
     */
    telefono:{
      type: 'string',
      defaultsTo: 'none'
    },
    /**
     * @desc Fecha de nacimiento en formato unix time stamp del usuario, informacion estadistica sensible.
     */
    nacimiento:{
      type: 'number',
      defaultsTo: 0
    },
    /**
     * @desc Bandera que determina la necesidad de solicitar informacion al usuario.
     */
    info:{
      type: 'boolean',
      defaultsTo: false
    },
    /**
     * @desc Id de la ultima promocion que el usuario compró.
     */
    ultima_promo: {
      model: 'promo'
    }
  },

};

