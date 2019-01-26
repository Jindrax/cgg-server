module.exports = {
  friendlyName: "Cerrar Dia",

  description: "Cierra todas las sesiones que puedan haber quedado abiertas durante el dia, se ejecuta a las 11:00 pm GMT-5",

  inputs: {
  },

  exits: {
  },

  fn: async function (inputs, exits) {
    await sails.helpers.closeDay();
    return exits.success('Se ha cerrado el dia correctamente');
  }
};
