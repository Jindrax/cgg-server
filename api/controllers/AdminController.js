/**
 * AdminController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

module.exports = {
  register:{
    friendlyName: 'Registrar equipo',
    description: 'Registrar el inicio de la actividad de un equipo para su monitoreo',
    inputs: {
      equipo: {
        type: 'number',
        requiredd: true
      }
    },
    exits:{
      success: {
        description: 'El equipo se registro correctamente en el sistema'
      },
      error:{
        description: 'Ocurrio un error',
        statusCode: 404
      }
    },
    fn: async function(inputs, exits){
      await Monitor.findOrCreate({equipo: inputs.equipo},{
        equipo: inputs.equipo,
        ultima_ip: this.req.ip,
        activo: true
      }).exec(async (err, record, wasCreated)=>{
        if(err){
          return exits.error();
        }
        if(!wasCreated){
          await Monitor.update({equipo: inputs.equipo}, {
            ultima_ip: this.req.ip,
            activo: true
          });
        }
        let equipos = await Monitor.find();
        sails.sockets.broadcast('watchmanRoom', 'watchUpdate', equipos);
        return exits.success();
      });
    }
  },
  watchmonitor:{
    friendlyName: 'Observar equipos',
    description: 'Obtener y observar los equipos del local',
    inputs: {

    },
    exits: {
      success: {
        description: 'Se entregaron y registraron todos los equipos'
      },
      error: {
        description: 'Ocurrio un error',
        statusCode: 404
      }
    },
    fn: async function(inputs, exits){
      let equipos = await Monitor.find();
      sails.sockets.join(this.req, 'watchmanRoom');
      return exits.success(equipos);
    }
  }

};

