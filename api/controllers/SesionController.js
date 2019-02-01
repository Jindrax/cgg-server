/**
 * SesionController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

const moment = require("moment");

module.exports = {
  login: {
    friendlyName: 'Conectar usuario',
    description:
      'Asociar un inicio de sesion del usuario a una sesion iniciada o crear una nueva sesion si no se encuentra ninguna sesion activa',
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
        statusCode: 400
      },
      notEnoughMoney: {
        description:
          'No se pudo consumir el servicio porque el usuario no cuenta con suficiente saldo en su cuenta para comprar una fraccion',
        statusCode: 402,
        outputExample: 'No hay saldo suficiente para seguir'
      },
      alreadyLoggued: {
        description:
          'El usuario ya tiene una sesion activa en el sistema, debe terminarla antes de volver a ingresar',
        statusCode: 409
      },
      insufficientInfo: {
        description: 'El usuario no ha presentado informacion suficiente para su registro',
        statusCode: 206
      }
    },
    fn: async function (inputs, exits) {
      //Buscamos el nombre de usuario en la base de datos
      let usuario = {};
      try {
        usuario = await Cliente.findOne({
          username: inputs.username
        }).decrypt();
      } catch (e) {
        return exits.error(e);
      }
      //Si el nombre de usuario no existe devolvemos un error
      if (_.isNull(usuario) || _.isUndefined(usuario) || _.isEmpty(usuario)) {
        return exits.userNotFound('Nombre de usuario inexistente');
      }
      //Si el usuario tiene una sesion abierta primero tiene que cerrarla un operario
      if (!_.isNull(usuario.sesion_activa)) {
        return exits.alreadyLoggued('Tiene una sesion ya iniciada, primero debe terminarla para iniciar otra');
      }
      //Si el usuario ha solicitado un reestablecimiento de contraseña primero asignamos la nueva contraseña y seguimos
      if (usuario.restaurar_pass) {
        try {
          await Cliente.update({
            id: usuario.id
          }).set({
            password: inputs.password,
            restaurar_pass: false
          });
          usuario.password = inputs.password;
          usuario.restaurar_pass = false;
        } catch (e) {
          return exits.error(e);
        }
      }
      //Si el usuario es un operario o administrador
      if (usuario.operario || usuario.admin) {
        try {
          await AdminLog.create({
            fecha: Date.now(),
            anotacion: `${usuario.username} ha iniciado sesion en el equipo ${inputs.equipo}`
          });
          this.req.session.usuario = {
            id: usuario.id,
            username: usuario.username,
            operario: usuario.operario,
            admin: usuario.admin,
            equipo: inputs.equipo
          };
          //Se actualiza el monitor
          await sails.helpers.monitorLogin(inputs.equipo, usuario);
          return exits.success({ tipo: 'op', payload: 0 });
        } catch (e) {
          return exits.error(e);
        }
      }
      //Comparamos las contraseñas para comprobar la identidad del usuario
      if (usuario.password === inputs.password) {
        //Si la contraseña es correcta verificamos que la informacion del usuario este completa
        if (!usuario.info) {
          return exits.insufficientInfo(usuario.id);
        }
        //Si el usuario ha comprado una promocion verificamos si es valida y esta vigente
        if (usuario.ultima_promo !== null) {
          try {
            //Buscamos la promocion en la base de datos
            let promo = await Promo.findOne({
              id: usuario.ultima_promo
            });
            //Verificamos la existencia y validez de la promocion
            if (_.isNull(promo) || _.isUndefined(promo) || _.isEmpty(promo)) {
              //Si el id de la promocion no existe
              return exits.error('Promocion vinculada a la cuenta invalida');
            }else{
              //Si la promocion es valida
              let ahora = Date.now();
              if (promo.fecha_expiracion > ahora) {
                //Si la fecha de expiracion sigue vigente damos permiso de iniciar sesion como promocion
                //Se establece la sesion del socket
                this.req.session.usuario = {
                  id: usuario.id,
                  username: usuario.username,
                  operario: usuario.operario,
                  admin: usuario.admin,
                  equipo: inputs.equipo
                };
                //Se actualiza el monitor
                await sails.helpers.monitorLogin(inputs.equipo, usuario);
                return exits.success({ tipo: 'promo', payload: promo });
              }
            }
          } catch (e) {
            return exits.error('Ha ocurrido un error en la base de datos.');
          }
        }
        let config = await sails.helpers.solicitarConfiguraciones(["precio_fraccion", "precio_fraccion_miembro"]);
        //Determinamos la fraccion minima que debe tener el usuario para iniciar sesion
        let precio_fraccion = usuario.miembro ? Number(config.precio_fraccion_miembro) : Number(config.precio_fraccion);
        //Si no tiene saldo suficiente para una fraccion minima se devuelve un error
        if (usuario.saldo < precio_fraccion) {
          return exits.notEnoughMoney('No hay suficiente saldo para la minima fraccion');
        }
        //En este punto el usuario puede iniciar sesion normalmente
        let sesion = await Sesion.create({
          cliente: usuario.id,
          equipo: inputs.equipo,
          inicio: Date.now()
        }).fetch();
        //Se actualiza el usuario para reflejar la nueva sesion
        await Cliente.update({
          id: usuario.id
        }).set({
          sesion_activa: sesion.id
        });
        //Se establece la sesion del socket
        this.req.session.usuario = {
          id: usuario.id,
          username: usuario.username,
          operario: usuario.operario,
          admin: usuario.admin,
          equipo: inputs.equipo
        };
        //Se actualiza el monitor
        await sails.helpers.monitorLogin(inputs.equipo, usuario);
        return exits.success({ tipo: 'normal', payload: sesion.id });
      } else {
        return exits.wrongPassword('Contraseña incorrecta');
      }
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
        description:
          'Se ha podido consumir correctamente el servicio porque tenia saldo suficiente en dinero o tiempo'
      },
      notEnoughMoney: {
        description:
          'No se pudo consumir el servicio porque el usuario no cuenta con suficiente saldo en su cuenta para comprar una fraccion',
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
        return exits.sesionNotFound('No existe una sesion con ese codigo');
      }
      if (sesion.cliente.sesion_activa != inputs.sesion) {
        return exits.expiredSesion('La sesion en la que intenta consumir no esta activa');
      }
      if (sesion.cliente.admin || sesion.cliente.operario) {
        return exits.success({
          saldo: Infinity,
          restante: Infinity
        });
      }
      let config = await sails.helpers.solicitarConfiguraciones(["precio_fraccion", "precio_fraccion_miembro"]);
      let precio_fraccion = sesion.cliente.miembro ? Number(config.precio_fraccion_miembro) : Number(config.precio_fraccion);
      if (sesion.cliente.saldo >= precio_fraccion) {
        await Sesion.update({
          id: sesion.id
        }).set({
          minutos_consumidos: sesion.minutos_consumidos + 1,
          saldo_consumido: sesion.saldo_consumido + precio_fraccion
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
      return exits.notEnoughMoney('No hay suficiente saldo para la minima fraccion');
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
      },
      fromApp: {
        description: 'Flag para indicar que el retiro lo realiza un administrador',
        type: 'boolean'
      }
    },
    exits: {
      success: {
        description:
          'Se ha podido consumir correctamente el servicio porque tenia saldo suficiente en dinero o tiempo'
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
      if (this.req.session.usuario.operario || this.req.session.usuario.admin) {
        if (_.isNull(inputs.fromApp) || _.isUndefined(inputs.fromApp)) {
          await AdminLog.create({
            fecha: Date.now(),
            anotacion: `${this.req.session.usuario.username} ha cerrado sesion en el equipo ${this.req.session.usuario.equipo}`
          });
          return exits.success('Sesion cerrada correctamente');
        } else {
          let fin = Date.now();
          let sesion = await Sesion.findOne({
            id: inputs.sesion
          }).populate('cliente');
          if (!sesion) {
            return exits.sesionNotFound('No existe una sesion con ese codigo');
          }
          if (inputs.sesion != sesion.cliente.sesion_activa) {
            return exits.expiredSesion('La sesion que intenta cerrar ya ha sido cerrada');
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
          return exits.success('Sesion cerrada correctamente');
        }
      }
      let fin = Date.now();
      let sesion = await Sesion.findOne({
        id: inputs.sesion
      }).populate('cliente');
      if (!sesion) {
        return exits.sesionNotFound('No existe una sesion con ese codigo');
      }
      if (inputs.sesion != sesion.cliente.sesion_activa) {
        return exits.expiredSesion('La sesion que intenta cerrar ya ha sido cerrada');
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
      this.req.session = undefined;
      await sails.helpers.monitorLogout(sesion.equipo);
      return exits.success('Sesion cerrada correctamente');
    }
  }
};
