const moment = require("moment");
const {DateTime} = require("luxon");

/**
 * AdminController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */


module.exports = {
  register: {
    friendlyName: "Registrar equipo",
    description: "Registrar el inicio de la actividad de un equipo para su monitoreo",
    inputs: {
      equipo: {
        type: "number",
        requiredd: true
      }
    },
    exits: {
      success: {
        description: "El equipo se registro correctamente en el sistema"
      },
      error: {
        description: "Ocurrio un error",
        statusCode: 404
      }
    },
    fn: async function (inputs, exits) {
      await Monitor.findOrCreate({
        equipo: inputs.equipo
      }, {
        equipo: inputs.equipo,
        ultima_ip: this.req.ip,
        activo: true
      }).exec(async (err, record, wasCreated) => {
        if (err) {
          return exits.error();
        }
        if (!wasCreated) {
          await Monitor.update({
            equipo: inputs.equipo
          }, {
            ultima_ip: this.req.ip,
            activo: true
          });
        }
        let equipos = await Monitor.find();
        sails.sockets.broadcast("watchmanRoom", "watchUpdate", equipos);
        return exits.success();
      });
    }
  },
  watchmonitor: {
    friendlyName: "Observar equipos",
    description: "Obtener y observar los equipos del local",
    inputs: {},
    exits: {
      success: {
        description: "Se entregaron y registraron todos los equipos"
      },
      error: {
        description: "Ocurrio un error",
        statusCode: 500
      }
    },
    fn: async function (inputs, exits) {
      let equipos = await Monitor.find();
      sails.sockets.join(this.req, "watchmanRoom");
      return exits.success(equipos);
    }
  },
  refreshmonitor: {
    friendlyName: "Observar equipos",
    description: "Obtener y observar los equipos del local",
    inputs: {},
    exits: {
      success: {
        description: "Se entregaron y registraron todos los equipos"
      },
      error: {
        description: "Ocurrio un error",
        statusCode: 500
      }
    },
    fn: async function (inputs, exits) {
      let equipos = await Monitor.find().populate("cliente");
      return exits.success(equipos);
    }
  },
  loginop: {
    friendlyName: "Loguear un administrador u operario",
    description: "Funcion para iniciar sesion de un usuario del sistema con privilegios",
    inputs: {
      username: {
        type: "string",
        required: true
      },
      password: {
        type: "string",
        required: true
      }
    },
    exits: {
      success: {
        description: "El usuario tiene permisos suficientes"
      },
      unauthorized: {
        description: "El usuario no presenta permisos necesarios",
        statusCode: 401
      },
      wrongPassword: {
        description: "La contraseña entregada no corresponde a la del usuario en el sistema",
        statusCode: 400
      }
    },
    fn: async function (inputs, exits) {
      //En caso de que no hayan usuarios en el sistema creamos el usuario del sistema
      try {
        let n_clientes = await Cliente.count({});
        if (n_clientes === 0) {
          await Cliente.create({
            username: inputs.username,
            password: inputs.password,
            admin: true
          });
        }
        let usuario = await Cliente.findOne({username: inputs.username}).decrypt();
        if (usuario.password !== inputs.password) {
          return exits.wrongPassword("Contraseña incorrecta");
        }
        if (usuario.admin || usuario.operario) {
          this.req.session.usuario = {
            id: usuario.id,
            username: usuario.username,
            operario: usuario.operario,
            admin: usuario.admin
          };
          return exits.success(usuario);
        }
        return exits.unauthorized("Usuario no autorizado para esta aplicacion");
      } catch (e) {
        return exits.error(e);
      }
    }
  },
  replacesaldo: {
    friendlyName: "Reemplazar saldo",
    description: "Un administrador ha decidido reemplazar el saldo actual de un cliente",
    inputs: {
      cliente: {
        type: "ref",
        required: true
      },
      valor: {
        type: "number",
        required: true
      }
    },
    exits: {
      success: {
        description: "El saldo fue corregido correctamente"
      },
      unauthorized: {
        description: "El usuario no presenta permisos necesarios",
        statusCode: 401
      }
    },
    fn: async function (inputs, exits) {
      try {
        await sails.helpers.comprobarPermisos(this.req, 'admin');
        let cliente = await Cliente.findOne({id: inputs.cliente});
        await sails.helpers.registroContable({
          fecha: Date.now(),
          concepto: 'Correccion de saldo',
          operario: this.req.session.usuario.id,
          cliente: inputs.cliente,
          valor: inputs.valor - cliente.saldo,
          valor_promocional: 0,
          saldo: cliente.saldo
        });
        await AdminLog.create({
          fecha: Date.now(),
          anotacion: `${this.req.session.usuario.username} ha cambiado el saldo del cliente ${cliente.username}, tenia un saldo de $${cliente.saldo} y ahora tiene un saldo de $${inputs.valor}`
        });
        return exits.success("El saldo ha sido cambiado correctamente");
      } catch (e) {
        return exits.unauthorized(e);
      }
    }
  },
  sesionreport: {
    friendlyName: "Reporte de sesiones",
    description: "Reporte generado de consumo y cobros durante el ejercicio dentro de los margenes temporales solicitados",
    inputs: {
      /**
       * Fecha en formato unix time stamp que representa desde que momento se solicita el informe
       */
      inicio: {
        type: "number",
        required: true
      },
      /**
       * Fecha en formato unix time stamp que representa hasta que momento se solicita el informe
       */
      fin: {
        type: "number",
        required: true
      }
    },
    exits: {
      success: {
        description: "El usuario tiene permisos suficientes"
      },
      unauthorized: {
        description: "El usuario no presenta permisos necesarios",
        statusCode: 401
      }
    },
    fn: async function (inputs, exits) {
      try {
        await sails.helpers.comprobarPermisos(this.req, 'admin');
        let inicioMillis = DateTime.fromMillis(inputs.inicio).startOf("day").toMillis();
        let finMillis = DateTime.fromMillis(inputs.fin).endOf("day").toMillis();
        let cobros = await Cobro.find({
          fecha: {
            ">=": inicioMillis,
            "<": finMillis
          }
        }).populate("operario").populate("cliente");
        let sesiones = await Sesion.find({
          inicio: {
            ">=": inicioMillis
          },
          fin: {
            "<": finMillis
          }
        }).populate("cliente");
        let retorno = {
          total_cobrado: 0,
          total_promocional: 0,
          total_consumido: 0
        };
        retorno.cobros = _.map(cobros, cobro => {
          retorno.total_cobrado += cobro.valor;
          retorno.total_promocional += cobro.valor_promocional;
          let operario = cobro.operario
            ? cobro.operario
            : {
              username: "Operario no encontrado"
            };
          let cliente = cobro.cliente
            ? cobro.cliente
            : {
              username: "cliente no encontrado"
            };
          return {
            fecha: DateTime.fromMillis(cobro.fecha).toLocaleString(DateTime.DATETIME_SHORT_WITH_SECONDS),
            operario: operario.username,
            cliente: cliente.username,
            valor: cobro.valor,
            valor_promocional: cobro.valor_promocional
          };
        });
        retorno.sesiones = _.map(sesiones, sesion => {
          retorno.total_consumido += sesion.saldo_consumido;
          let cliente = sesion.cliente
            ? sesion.cliente
            : {
              username: "cliente no encontrado"
            };
          return {
            inicio: DateTime.fromMillis(sesion.inicio).toLocaleString(DateTime.DATETIME_SHORT_WITH_SECONDS),
            fin: DateTime.fromMillis(sesion.fin).toLocaleString(DateTime.DATETIME_SHORT_WITH_SECONDS),
            equipo: sesion.equipo,
            cliente: cliente.username,
            minutos_consumidos: sesion.minutos_consumidos,
            saldo_consumido: sesion.saldo_consumido
          };
        });
        return exits.success(retorno);
      } catch (e) {
        return exits.unauthorized(e);
      }
    }
  },
  inventoryreport: {
    friendlyName: "Reporte de inventario",
    description: "Reporte generado de ventas",
    inputs: {
      /**
       * Fecha en formato unix time stamp que representa desde que momento se solicita el informe
       */
      inicio: {
        type: "number",
        required: true
      },
      /**
       * Fecha en formato unix time stamp que representa hasta que momento se solicita el informe
       */
      fin: {
        type: "number",
        required: true
      }
    },
    exits: {
      success: {
        description: "Se genera el reporte y se envia al usuario"
      },
      unauthorized: {
        description: "El usuario no presenta permisos necesarios",
        statusCode: 401
      }
    },
    fn: async function (inputs, exits) {
      try {
        //Validar los permisos para la operacion
        await sails.helpers.comprobarPermisos(this.req, 'admin');
        let inicioMillis = DateTime.fromMillis(inputs.inicio).startOf("day").toMillis();
        let finMillis = DateTime.fromMillis(inputs.fin).endOf("day").toMillis();
        let ventas = await VentaInventario.find({
          fecha: {
            ">=": inicioMillis,
            "<": finMillis
          }
        }).populate("vendedor");
        let compras = await CompraInventario.find({
          fecha: {
            ">=": inicioMillis,
            "<": finMillis
          }
        }).populate("comprador");
        let retorno = {
          total_vendido: 0,
          total_comprado: 0,
          total_utilidad: 0
        };
        retorno.ventas = _.map(ventas, venta => {
          retorno.total_vendido += venta.total;
          retorno.total_utilidad += venta.utilidad;
          return {
            fecha: DateTime.fromMillis(venta.fecha).toLocaleString(DateTime.DATETIME_SHORT_WITH_SECONDS),
            vendedor: venta.vendedor.username,
            venta: venta.items,
            total: venta.total,
            utilidad: venta.utilidad
          };
        });
        retorno.compras = _.map(compras, compra => {
          retorno.total_comprado += compra.unidades * compra.precio_compra;
          return {
            fecha: DateTime.fromMillis(compra.fecha).toLocaleString(DateTime.DATETIME_SHORT_WITH_SECONDS),
            comprador: compra.comprador.username,
            item: compra.item,
            unidades: compra.unidades,
            precio: compra.precio_compra,
            total: compra.unidades * compra.precio_compra
          };
        });
        return exits.success(retorno);
      } catch (e) {
        //El usuario no tiene permisos suficientes para la operacion
        return exits.unauthorized(e);
      }
    }
  },
  corregirfechas: {
    friendlyName: "Corregir Fechas",
    description: "Corrige las fechas que se adelantaron por problemas con el GMT",
    inputs: {},
    exits: {},
    fn: async function (inputs, exits) {
      let cobros = await Cobro.find({
        fecha: {
          ">=": 1541091600000,
          "<=": 1541156400000
        }
      });
      _.forEach(cobros, async cobro => {
        await Cobro.update({id: cobro.id}).set({
          createdAt: cobro.createdAt - 18000000,
          fecha: cobro.fecha - 18000000
        });
      });
      let sesiones = await Sesion.find({
        inicio: {
          ">=": 1541091600000,
          "<=": 1541156400000
        }
      });
      _.forEach(sesiones, async sesion => {
        await Sesion.update({id: sesion.id}).set({
          createdAt: sesion.createdAt - 18000000,
          inicio: sesion.inicio - 18000000,
          fin: sesion.fin === 0
            ? 0
            : sesion.fin - 18000000,
          saldo_consumido: sesion.minutos_consumidos * 42
        });
      });
      return exits.success({mensaje: "Actualizacion de los registros", cobros: cobros, sesiones: sesiones});
    }
  },
  informeasistencia: {
    friendlyName: "Informe de asistencia",
    description: "Genera un informe para identificar las horas de menor asistencia",
    inputs: {},
    exits: {},
    fn: async function (inputs, exits) {
      let retorno = await sails.helpers.informeAsistencia();
      return exits.success(retorno);
    }
  },
  sell_promo: {
    friendlyName: 'Vender promocion',
    description: 'El operario intenta vender una promocion al cliente que lo solicita, el cliente debe ser miembro',
    inputs: {
      /**
       * Id del cliente que solicita comprar la promocion
       */
      cliente: {
        type: 'ref',
        required: true
      }
    },
    exits: {
      unauthorized: {
        description: 'El operario no posee permisos para realizar la accion',
        statusCode: 401
      },
      notMember: {
        description: 'El cliente no es un miembro activo del club',
        statusCode: 403
      }
    },
    fn: async function (inputs, exits) {
      try {
        //Verificamos la validez de la peticion
        await sails.helpers.comprobarPermisos(this.req, 'operario');
        let cliente = await Cliente.findOne({
          id: inputs.cliente
        });
        //Se comprueba la existencia del usuario
        if (_.isNull(cliente) || _.isUndefined(cliente) || _.isEmpty(cliente)) {
          return exits.error('El cliente no existe en el sistema');
        }
        //Si el cliente no es miembro no puede acceder a la promocion
        if (!cliente.miembro) {
          return exits.notMember('El cliente no es miembro del club');
        }
        //Parametros para la compra
        let config = await sails.helpers.solicitarConfiguraciones(['contador_promo', 'precio_promo_semana', 'precio_promo_fin_semana', 'hora_cierre', 'dias_fin_semana']);
        //Se identifica si aplica la promocion de fin de semana o de semana
        let precio_promo = _.contains(config.dias_fin_semana.split(','), String(moment().getDay())) ? Number(config.precio_promo_fin_semana) : Number(config.precio_promo_semana);
        let ahora = moment();
        let codigo = ahora.format('YYWWE') + config.contador_promo;
        try {
          //Se procede a crear la promocion
          let promo = await Promo.create({
            codigo: codigo,
            cliente: inputs.cliente,
            vendedor: this.req.session.usuario.id,
            fecha_compra: ahora.valueOf(),
            fecha_expiracion: ahora.hour(config.hora_cierre).minute(0).second(0).millisecond(0).valueOf(),
            precio_compra: precio_promo
          }).fetch();
          //Se aumenta el contador una vez se ha creado la promocion
          await Configuracion.update({
            identificador: 'contador_promo'
          }).set({
            valor: String(Number(config.contador_promo) + 1)
          });
          //Se registra el cobro contablemente
          await sails.helpers.registroContable({
            fecha: ahora.valueOf(),
            concepto: 'Venta promocion',
            operario: this.req.session.usuario.id,
            cliente: inputs.cliente,
            valor: precio_promo
          });
          //Se actualiza el cliente para reflejar la compra de la promocion y poder acceder a ella posteriormente
          await Cliente.update({
            id: inputs.cliente
          }).set({
            ultima_promo: promo.codigo
          });
          //Se envia la promocion al cliente
          return exits.success(promo);
        } catch (e) {
          //Ocurrio algun error en alguna de las transacciones de la base de datos.
          return exits.error(e);
        }
      } catch (e) {
        //El operario no tiene permisos suficientes para realizar la operacion
        return exits.unauthorized(e);
      }
    }
  }
};
