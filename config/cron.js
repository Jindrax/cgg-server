module.exports.cron = {
  myFirstJob: {
    schedule: '0 22 * * *',
    onTick: async function () {
      await sails.helpers.cerrarDia();
    },
    timezone: 'America/Bogota'
  }
};
