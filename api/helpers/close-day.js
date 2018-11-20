module.exports = {
    friendlyName: "Cerrar Dia",

    description: "Cierra todas las sesiones que puedan haber quedado abiertas durante el dia, se ejecuta a las 11:00 pm GMT-5",

    inputs: {
    },

    exits: {
    },

    fn: async function (inputs, exits) {
        let clientes = Cliente.find({
            sesion_activa: {
                '!=': null
            }
        });
        _.map(clientes, async function(cliente){
            let fin = Date.now();
            let sesion = await Sesion.findOne({
                id: cliente.sesion_activa
            }).populate('cliente');
            await Sesion.update({id: sesion.id}).set({fin: fin});
            await Cliente.update({id: sesion.cliente.id}).set({sesion_activa: null});
            await sails.helpers.monitorLogout(sesion.equipo);
        });
        console.log("Se cerraron exitosamente todas las sesiones abiertas");
        return exits.succes();
    }
};
