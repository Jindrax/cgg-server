module.exports.cron = {
  myFirstJob: {
    schedule: '0 23 * * *',
    onTick: async function () {
      await sails.helpers.closeDay();
    },
    timezone: 'America/Bogota'
  }
};