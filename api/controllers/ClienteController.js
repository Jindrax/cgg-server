/**
 * ClienteController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

module.exports = {
  addcredit: {
    friendlyName: 'Añadir saldo',
    description: 'Añade saldo al cliente',
    inputs: {
      cliente: {
        type: 'ref',
        required: true
      },
      valor_recibido: {
        type: 'number',
        required: true
      }
    },
    exits: {
      success: {
        description: 'Se añadio el saldo correctamente al usuario.'
      },
      operarioNotFound: {
        description: 'El operario no se encuentra en la base de datos.',
        statusCode: 404
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
      if (this.req.session == undefined) {
        return exits.unauthorized();
      }
      let operario = this.req.session.usuario;
      if (!operario.admin) {
        if (!operario.operario) {
          return exits.unauthorized('Operario no autorizado');
        }
      }
      let cliente = await Cliente.findOne({
        id: inputs.cliente
      });
      if (!cliente) {
        return exits.clienteNotFound('Cliente no encontrado');
      }
      if (!cliente.vip) {
        await sails.helpers.registroContable({
          fecha: Date.now(),
          operario: operario.id,
          cliente: cliente.id,
          valor: inputs.valor_recibido,
          saldo: cliente.saldo
        });
        return exits.success(`${inputs.valor_recibido} pesos cargados, nuevo saldo: ${cliente.saldo + inputs.valor_recibido}`);
      }
      let config_DB = await Configuracion.find({
        identificador: ['fracciones_minimas_descuento', 'precio_fraccion', 'precio_vip', 'precio_pionero']
      });
      let config = {};
      _.each(config_DB, (valor) => {
        config[valor.identificador] = Number(valor.valor);
      });
      //Significa que es un pionero
      console.log('No es un cliente normal');
      console.log('config', config);
      let fracciones_base = inputs.valor_recibido / config.precio_fraccion;
      let saldo_total = inputs.valor_recibido;
      console.log('fracciones_base: ', fracciones_base, ', fracciones_minimas: ', config.fracciones_minimas_descuento);
      if (fracciones_base >= config.fracciones_minimas_descuento) {
        console.log('Es una compra minima');
        if (cliente.meses_constante > 4) {
          console.log('Es un pionero');
          saldo_total = _.round((inputs.valor_recibido / config.precio_pionero) * config.precio_fraccion, -2);
        } else if (cliente.meses_constante >= 3) {
          console.log('Es un vip');
          saldo_total = _.round((inputs.valor_recibido / config.precio_vip) * config.precio_fraccion, -2);
        }
      }
      let saldo_promocional = saldo_total - inputs.valor_recibido;
      await sails.helpers.registroContable({
        fecha: Date.now(),
        operario: operario.id,
        cliente: cliente.id,
        valor: inputs.valor_recibido,
        valor_promocional: saldo_promocional,
        saldo: cliente.saldo
      })
      return exits.success(`${inputs.valor_recibido + saldo_promocional} pesos cargados, nuevo saldo: ${inputs.valor_recibido + saldo_promocional}`);
    }
  },
  restorepass: {
    friendlyName: 'Restaurar contraseña',
    description: 'Habilita al usuario para que en su siguiente inicio de sesion modifique la contraseña que usara en adelante',
    inputs: {
      cliente_user: {
        type: 'string',
        required: true
      },
      cliente: {
        type: 'ref',
        required: true
      }
    },
    exits: {
      success: {
        description: 'El usuario puede reiniciar su contraseña.'
      },
      error: {
        description: 'Algo salio mal',
        statusCode: 500
      },
      unauthorized: {
        description: 'El usuario no tiene permisos para realizar esta accion',
        statusCode: 401
      }
    },
    fn: async function (inputs, exits) {
        if (this.req.session == undefined) {
          return exits.unauthorized();
        }
        await Cliente.update({
          id: inputs.cliente
        }).set({
          restaurar_pass: true
        });
        await AdminLog.create({
          fecha: Date.now(),
          anotacion: `${this.req.session.usuario.username} avaló el cambio de contraseña del usuario ${inputs.cliente_user}.`
        });
        return exits.success(`${inputs.cliente_user} puede reiniciar su contraseña`);
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
      error: {
        description: 'Algo salio mal',
        statusCode: 500
      }
    },
    fn: async function (inputs, exits) {
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
  }
};
