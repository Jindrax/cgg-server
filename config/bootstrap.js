/**
 * Bootstrap
 * (sails.config.bootstrap)
 *
 * An asynchronous bootstrap function that runs just before your Sails app gets lifted.
 * > Need more flexibility?  You can also do this by creating a hook.
 *
 * For more information on bootstrapping your app, check out:
 * https://sailsjs.com/config/bootstrap
 */

module.exports.bootstrap = async function(done) {

  // By convention, this is a good place to set up fake data during development.
  //
  // For example:
  // ```
  // // Set up fake development data (or if we already have some, avast)
  // if (await User.count() > 0) {
  //   return done();
  // }
  //
  // await User.createEach([
  //   { emailAddress: 'ry@example.com', fullName: 'Ryan Dahl', },
  //   { emailAddress: 'rachael@example.com', fullName: 'Rachael Shaw', },
  //   // etc.
  // ]);
  // ```

  // Don't forget to trigger `done()` when this bootstrap function's logic is finished.
  // (otherwise your server will never lift, since it's waiting on the bootstrap)
  try{
    await sails.helpers.solicitarConfiguraciones(["precio_fraccion", "precio_fraccion_miembro",
      'contador_promo', 'precio_promo_semana', 'precio_promo_fin_semana', 'hora_cierre',
      'dias_fin_semana', 'precio_membresia']);
  }catch (e) {
    try{
      console.log(e);
      await Configuracion.createEach([
        {
          identificador: 'precio_fraccion',
          valor: '50'
        },
        {
          identificador: 'precio_fraccion_miembro',
          valor: '42'
        },
        {
          identificador: 'contador_promo',
          valor: '0'
        },
        {
          identificador: 'precio_promo_semana',
          valor: '16000'
        },
        {
          identificador: 'precio_promo_fin_semana',
          valor: '18000'
        },
        {
          identificador: 'hora_cierre',
          valor: '21'
        },
        {
          identificador: 'dias_fin_semana',
          valor: '0,5,6'
        },
        {
          identificador: 'precio_membresia',
          valor: '10000'
        }
      ]);
    }catch (e) {
      console.log(e);
    }
  }
  return done();

};
