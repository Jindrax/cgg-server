/**
 * SesionController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

module.exports = {
  login: {
    friendlyName: 'Conectar usuario',
    description: 'Asociar un inicio de sesion del usuario a una sesion iniciada o crear una nueva sesion si no se encuentra ninguna sesion activa',
    inputs: {
      username: {
        description: 'Nombre de usuario',
        type: 'string',
        required: true
      },
      password: {
        description: 'Contraseña del usuario',
        type: 'string',
        required: true
      },
      equipo: {
        description: 'Equipo en el que se encuentra iniciando la sesion',
        type: 'number',
        required: true
      }
    },
    exits: {
      success: {
        description: 'El usuario se encontro y se retorno la informacion requerida'

      },
      userNotFound: {
        description: 'El usuario solicitado no existe en la base de datos',
        statusCode: 404
      },
      wrongPassword: {
        description: 'La contraseña entregada no corresponde a la del usuario en el sistema',
        statusCode: 401
      },
      notEnoughMoney: {
        description: 'No se pudo consumir el servicio porque el usuario no cuenta con suficiente saldo en su cuenta para comprar una fraccion',
        statusCode: 402,
        outputExample: 'No hay saldo suficiente para seguir'
      }
    },
    fn: async function (inputs, exits) {
      let precio_fraccion = await Configuracion.findOne({
        identificador: 'precio_fraccion'
      });
      precio_fraccion = Number(precio_fraccion.valor);
      let user = await Cliente.findOne({
        username: inputs.username
      }).populate('sesion_activa').decrypt();
      if (!user) {
        return exits.userNotFound("El nombre de usuario no corresponde a un usuario inscrito");
      }
      if (user.password == inputs.password) {
        if (user.sesion_activa != null) {
          await Sesion.update({
            id: user.sesion_activa.id
          }).set({
            equipo: inputs.equipo
          });
          return exits.success(user.sesion_activa.id);
        }
        if(user.saldo < precio_fraccion){
          return exits.notEnoughMoney("No hay suficiente saldo para la minima fraccion");
        }
        let sesion = await Sesion.create({
          cliente: user.id,
          equipo: inputs.equipo,
          inicio: Date.now()
        }).fetch();
        await Cliente.update({
          id: user.id
        }).set({
          sesion_activa: sesion.id
        });
        return exits.success(sesion.id);
      }
      return exits.wrongPassword("La contraseña no corresponde a la inscrita por el usuario");
    }
  },

  consume: {
    friendlyName: 'Consumir servicio',
    description: 'Consume los minutos pagados y si estos se acaban genera un cobro por una nueva fraccion',
    inputs: {
      sesion: {
        description: 'Id de la sesion en la que se va a consumir el servicio',
        type: 'ref',
        required: true
      }
    },
    exits: {
      success: {
        description: 'Se ha podido consumir correctamente el servicio porque tenia saldo suficiente en dinero o tiempo'
      },
      notEnoughMoney: {
        description: 'No se pudo consumir el servicio porque el usuario no cuenta con suficiente saldo en su cuenta para comprar una fraccion',
        statusCode: 402,
        outputExample: 'No hay saldo suficiente para seguir'
      },
      expiredSesion: {
        description: 'No se pudo consumir el servicio porque la sesion no es la sesion activa del usuario',
        statusCode: 403,
        outputExample: 'Sesion incorrecta'
      },
      sesionNotFound: {
        description: 'La sesion no existe en la base de datos',
        statusCode: 404,
        outputExample: 'No se ha encontrado la sesion requerida'
      }
    },
    fn: async function (inputs, exits) {
      let sesion = await Sesion.findOne({
        id: inputs.sesion
      }).populate('cliente');
      if (!sesion) {
        return exits.sesionNotFound("No existe una sesion con ese codigo");
      }
      if (sesion.cliente.sesion_activa != inputs.sesion) {
        return exits.expiredSesion("La sesion en la que intenta consumir no esta activa");
      }
      if (sesion.cliente.admin || sesion.cliente.operario) {
        return exits.success({
          saldo: Infinity,
          restante: Infinity
        });
      }
      let precio_fraccion = await Configuracion.findOne({
        identificador: 'precio_fraccion'
      });
      precio_fraccion = Number(precio_fraccion.valor);
      if (sesion.cliente.saldo >= precio_fraccion) {
        await Sesion.update({
          id: sesion.id
        }).set({
          minutos_consumidos: sesion.minutos_consumidos + 1
        });
        let saldo = sesion.cliente.saldo - precio_fraccion;
        await Cliente.update({
          id: sesion.cliente.id
        }).set({
          saldo: saldo,
          minutos_consumidos: sesion.cliente.minutos_consumidos + 1,
          pagado: sesion.cliente.pagado + precio_fraccion
        });
        return exits.success({
          saldo: saldo,
          restante: _.floor(sesion.cliente.saldo / precio_fraccion, 0)
        });
      }
      return exits.notEnoughMoney("No hay suficiente saldo para la minima fraccion");
    }
  },

  logout: {
    friendlyName: 'Desconectar Usuario',
    description: 'Cerrar la sesion activa del usuario',
    inputs: {
      sesion: {
        description: 'Id de la sesion en la que se va a consumir el servicio',
        type: 'ref',
        required: true
      }
    },
    exits: {
      success: {
        description: 'Se ha podido consumir correctamente el servicio porque tenia saldo suficiente en dinero o tiempo'
      },
      expiredSesion: {
        description: 'No se pudo consumir el servicio porque la sesion no es la sesion activa del usuario',
        statusCode: 403,
        outputExample: 'Sesion incorrecta'
      },
      sesionNotFound: {
        description: 'La sesion no existe en la base de datos',
        statusCode: 404,
        outputExample: 'No se ha encontrado la sesion requerida'
      }
    },
    fn: async function (inputs, exits) {
      let fin = Date.now();
      let sesion = await Sesion.findOne({
        id: inputs.sesion
      }).populate('cliente');
      if (!sesion) {
        return exits.sesionNotFound("No existe una sesion con ese codigo");
      }
      if (inputs.sesion != sesion.cliente.sesion_activa) {
        return exits.expiredSesion("La sesion que intenta cerrar ya ha sido cerrada");
      }
      await Sesion.update({
        id: sesion.id
      }).set({
        fin: fin
      });
      await Cliente.update({
        id: sesion.cliente.id
      }).set({
        sesion_activa: null
      });
      return exits.success("Sesion cerrada correctamente");
    }
  }

};
