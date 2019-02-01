/**
 * ClienteController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

const moment = require("moment");

module.exports = {
  addcredit: {
    friendlyName: 'Añadir saldo',
    description: 'Añade saldo al cliente',
    inputs: {
      //Nombre de usuario del cliente al que se desea cargar el saldo
      cliente: {
        type: 'string',
        required: true
      },
      //Valor recibido para cargar al cliente
      valor_recibido: {
        type: 'number',
        required: true
      }
    },
    exits: {
      success: {
        description: 'Se añadio el saldo correctamente al usuario.'
      },
      unauthorized: {
        description: 'El operario no cuenta con permisos para añadir saldo.',
        statusCode: 401
      },
      clienteNotFound: {
        description: 'El cliente no se encuentra en la base de datos.',
        statusCode: 404
      }
    },
    fn: async function (inputs, exits) {
      try {
        //Validamos permisos del usuario
        await sails.helpers.comprobarPermisos(this.req, 'operario');
        //Buscamos al cliente en la base de datos
        let cliente = await Cliente.findOne({
          username: inputs.cliente
        });
        //Si el cliente no existe devolvemos un error
        if (_.isNull(cliente) || _.isUndefined(cliente) || _.isEmpty(cliente)) {
          return exits.clienteNotFound('cliente no encontrado');
        }
        //En caso contrario actualizamos el saldo y lo registramos
        await Cliente.update({
          id: cliente.id
        }).set({
          saldo: cliente.saldo + inputs.valor_recibido
        });
        //Registramos el hecho contable
        await sails.helpers.registroContable({
          fecha: Date.now(),
          concepto: 'Venta de saldo',
          operario: this.req.session.usuario.id,
          cliente: cliente.id,
          valor: inputs.valor_recibido,
          saldo: cliente.saldo
        });
        return exits.success(`${inputs.valor_recibido} pesos cargados, nuevo saldo: ${cliente.saldo + inputs.valor_recibido}`);
      } catch (e) {
        //El usuario no cuenta con permisos suficientes para la operacion
        return exits.unauthorized(e);
      }
    }
  },
  restorepass: {
    friendlyName: 'Restaurar contraseña',
    description: 'Habilita al usuario para que en su siguiente inicio de sesion modifique la contraseña que usara en adelante',
    inputs: {
      //Nombre de usuario del cliente, se usa para no acceder innecesariamente a la base de datos
      cliente_user: {
        type: 'string',
        required: true
      },
      //Id del cliente que solicita el reinicio de su contraseña
      cliente: {
        type: 'ref',
        required: true
      }
    },
    exits: {
      success: {
        description: 'El usuario puede reiniciar su contraseña.'
      }
    },
    fn: async function (inputs, exits) {
      try {
        //Verificamos la validez del usuario que hace la peticion
        await sails.helpers.comprobarPermisos(this.req, 'admin');
        //Actualizamos el cliente para permitir que reinicie su contraseña
        await Cliente.update({
          id: inputs.cliente
        }).set({
          restaurar_pass: true
        });
        //Creamos un registro para la posterior auditoria
        await AdminLog.create({
          fecha: Date.now(),
          anotacion: `${this.req.session.usuario.username} avaló el cambio de contraseña del usuario ${inputs.cliente_user}.`
        });
        return exits.success(`${inputs.cliente_user} puede reiniciar su contraseña`);
      } catch (e) {
        return exits.error(e);
      }
    }
  },
  saveinfo: {
    friendlyName: 'Guardar informacion de un cliente',
    description: 'Guarda la informacion adicional de un cliente para su uso por la administracion',
    inputs: {
      info: {
        type: 'json',
        required: true
      }
    },
    exits: {
      success: {
        description: 'El usuario puede reiniciar su contraseña.'
      },
      notEnoughInfo: {
        description: 'El usuario no ha llenado la informacion necesaria correctamente',
        statusCode: 400
      },
      error: {
        description: 'Algo salio mal',
        statusCode: 500
      }
    },
    fn: async function (inputs, exits) {
      /*if(_.isNaN(inputs.info.id)){
        return exits.notEnoughInfo('Informacion erronea o insuficiente');
      }else if(!_.isString(inputs.info.nombres)){
        return exits.notEnoughInfo('Informacion erronea o insuficiente');
      }else if(!_.isString(inputs.info.apellidos)){
        return exits.notEnoughInfo('Informacion erronea o insuficiente');
      }else if(!_.isString(inputs.info.email)){
        return exits.notEnoughInfo('Informacion erronea o insuficiente');
      }else if(!_.isString(inputs.info.telefono)){
        return exits.notEnoughInfo('Informacion erronea o insuficiente');
      }else if(!_.isNaN(inputs.info.nacimiento)){
        return exits.notEnoughInfo('Informacion erronea o insuficiente');
      }*/
      await Cliente.update({
        id: inputs.info.id
      }).set({
        nombres: inputs.info.nombres,
        apellidos: inputs.info.apellidos,
        email: inputs.info.email,
        telefono: inputs.info.telefono,
        nacimiento: inputs.info.nacimiento,
        info: true
      });
      return exits.success();
    }
  },
  upgrademembership: {
    friendlyName: 'Mejorar cliente a miembro',
    description: 'Mejora la calidad de un cliente a membresia para acceder a precio especial y a promociones',
    inputs: {
      cliente: {
        type: 'ref',
        required: true
      }
    },
    exits: {
      success: {
        description: 'El usuario ahora es un miembro'
      },
      error: {
        description: 'Algo salio mal',
        statusCode: 500
      }
    },
    fn: async function (inputs, exits) {
      try {
        //Primero verificamos los permisos del operario
        let operario = await sails.helpers.comprobarPermisos(this.req, 'operario');
        //Buscamos el cliente solicitado
        let cliente = await Cliente.findOne({
          id: inputs.cliente
        });
        //Si no existe el cliente devolvemos un error
        if (_.isNull(cliente) || _.isUndefined(cliente) || _.isEmpty(cliente)) {
          return exits.error("cliente no encontrado en la base de datos");
        }
        try {
          //Obtenemos los parametros en tiempo real
          let config = await sails.helpers.solicitarConfiguraciones(["precio_membresia"]);
          try {
            let ahora = moment();
            ahora.add(1, 'y');
            //Se activa la bandera de miembro y se descuenta el valor de la membresia del saldo del cliente
            await Cliente.update({
              id: cliente.id
            }).set({
              miembro: true,
              miembro_hasta: ahora.valueOf()
            });
            //Se registra el hecho contable
            await sails.helpers.registroContable({
              fecha: Date.now(),
              concepto: 'Venta membresia',
              operario: operario.id,
              cliente: cliente.id,
              valor: Number(config.precio_membresia)
            });
            return exits.success("Membresia comprada correctamente");
          } catch (e) {
            //Posible error en la base de datos
            return exits.error(e);
          }
        } catch (e) {
          //Posible error con las configuraciones
          return exits.error(e);
        }
      } catch (e) {
        return exits.error('Permisos insuficientes para la operacion');
      }
    }
  }
};
