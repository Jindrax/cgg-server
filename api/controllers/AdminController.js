/**
 * AdminController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

var {
    DateTime
} = require("luxon");

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
            let usuario = await Cliente.findOne({username: inputs.username}).decrypt();
            if (usuario.password != inputs.password) {
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
            if (this.req.session) {
                if (this.req.session.usuario.admin) {
                    let cliente = await Cliente.findOne({id: inputs.cliente});
                    await sails.helpers.registroContable({
                        fecha: Date.now(),
                        operario: this.req.session.usuario.id,
                        cliente: inputs.cliente,
                        valor: inputs.valor - cliente.saldo,
                        valor_promocional: 0,
                        saldo: cliente.saldo
                    });
                    await AdminLog.create({fecha: Date.now(), anotacion: `${this.req.session.usuario.username} ha cambiado el saldo del cliente ${cliente.username}, tenia un saldo de $${cliente.saldo} y ahora tiene un saldo de $${inputs.valor}`});
                    return exits.success("El saldo ha sido cambiado correctamente");
                } else {
                    return exits.unauthorized();
                }
            }
            return exits.unauthorized();
        }
    },
    sesionreport: {
        friendlyName: "Reporte de sesiones",
        description: "Reporte generado de consumo y cobros durante el ejercicio dentro de los margenes temporales solicitados",
        inputs: {
            inicio: {
                type: "number",
                required: true
            },
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
                        username: "Cliente no encontrado"
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
                        username: "Cliente no encontrado"
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
            if (this.req.session) {
                if (this.req.session.usuario.admin) {
                    return exits.success(retorno);
                } else {
                    return exits.unauthorized("Permisos insuficientes");
                }
            } else {
                return exits.unauthorized("Sesion invalida");
            }
        }
    },
    inventoryreport: {
        friendlyName: "Reporte de inventario",
        description: "Reporte generado de ventas",
        inputs: {
            inicio: {
                type: "number",
                required: true
            },
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
                    comprador: sesion.equipo,
                    item: compra.item,
                    unidades: compra.unidades,
                    precio: compra.precio_compra,
                    total: compra.unidades * compra.precio_compra
                };
            });
            if (this.req.session) {
                if (this.req.session.usuario.admin) {
                    return exits.success(retorno);
                } else {
                    return exits.unauthorized("Permisos insuficientes");
                }
            } else {
                return exits.unauthorized("Sesion invalida");
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
                    fin: sesion.fin == 0
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
        inputs: {
        },
        exits: {},
        fn: async function (inputs, exits) {
            let retorno = await sails.helpers.informeAsistencia();
            return exits.success(retorno);
        }
    }
};
