var {
    DateTime
} = require("luxon");
module.exports = {
    friendlyName: "Informe de asistencia",

    description: "Genera un informe para identificar las horas de menor asistencia",

    inputs: {
    },

    exits: {
    },

    fn: async function (inputs, exits) {
        let response = [];
        let ahora = Date.now();
        for (let day = 0; day<14; day++) {
            let fecha = ahora - day * 86400000;
            let inicioMillis = DateTime.fromMillis(fecha).startOf("day").toMillis();
            let finMillis = DateTime.fromMillis(fecha).endOf("day").toMillis();
            let retorno = [];
            let sesiones = await Sesion.find({
                inicio: {
                    ">=": inicioMillis
                },
                fin: {
                    "<": finMillis
                }
            });
            for (let i = inicioMillis; i <= finMillis; i += 1800000) {
                let asistencia_hora = 0;
                _.map(sesiones, function (sesion) {
                    if (i >= sesion.inicio && i <= sesion.fin) {
                        asistencia_hora++;
                    }
                });
                //DateTime.fromMillis(i).toLocaleString(DateTime.DATETIME_SHORT)
                retorno.push({
                    date: i,
                    units: asistencia_hora
                });
            }
            response.push(retorno);
        }
        return exits.success(response);
    }
};
