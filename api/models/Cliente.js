/**
 * Cliente.js
 *
 * @description :: A model definition.  Represents a database table/collection/etc.
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */

module.exports = {

  attributes: {
    username: {
      type: 'string',
      required: true,
      unique: true
    },
    password: {
      type: 'string',
      required: true,
      encrypt: true
    },
    saldo: {
      type: 'number',
      defaultsTo: 0
    },
    minutos_consumidos: {
      type: 'number',
      defaultsTo: 0
    },
    pagado: {
      type: 'number',
      defaultsTo: 0
    }, 
    meses_constante: {
      type: 'number',
      defaultsTo: 4
    },
    vip: {
      type: 'boolean',
      defaultsTo: false
    },
    ultima_mensualidad: {
      type: 'number',
      defaultsTo: 0
    },
    operario: {
      type: 'boolean',
      defaultsTo: false
    },
    admin: {
      type: 'boolean',
      defaultsTo: false
    },
    sesiones: {
      collection: 'sesion',
      via: 'cliente'
    },
    sesion_activa: {
      model: 'sesion'
    },
    restaurar_pass:{
      type: 'boolean',
      defaultsTo: false
    },
    nombres:{
      type: 'string',
      defaultsTo: 'n.n'
    },
    apellidos:{
      type: 'string',
      defaultsTo: 'n.n'
    },
    email:{
      type: 'string',
      defaultsTo: 'none'
    },
    telefono:{
      type: 'string',
      defaultsTo: 'none'
    },
    nacimiento:{
      type: 'number',
      defaultsTo: 0
    },
    info:{
      type: 'boolean',
      defaultsTo: false
    }
  },

};

