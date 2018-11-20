module.exports.cron = {
  myFirstJob: {
    schedule: '0 22 * * *',
    onTick: async function () {
      await sails.helpers.closeDay();
    },
    timezone: 'America/Bogota'
  }
};