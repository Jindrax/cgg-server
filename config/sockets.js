/**
 * WebSocket Server Settings
 * (sails.config.sockets)
 *
 * Use the settings below to configure realtime functionality in your app.
 * (for additional recommended settings, see `config/env/production.js`)
 *
 * For all available options, see:
 * https://sailsjs.com/config/sockets
 */

module.exports.sockets = {

  adapter: '@sailshq/socket.io-redis',
  url: 'redis://:cehXZ35E62wfMoEKDEnecA2W0oinT7Nz@redis-18828.c98.us-east-1-4.ec2.cloud.redislabs.com:18828/0',

    /***************************************************************************
     *                                                                          *
     * `transports`                                                             *
     *                                                                          *
     * The protocols or "transports" that socket clients are permitted to       *
     * use when connecting and communicating with this Sails application.       *
     *                                                                          *
     * > Never change this here without also configuring `io.sails.transports`  *
     * > in your client-side code.  If the client and the server are not using  *
     * > the same array of transports, sockets will not work properly.          *
     * >                                                                        *
     * > For more info, see:                                                    *
     * > https://sailsjs.com/docs/reference/web-sockets/socket-client           *
     *                                                                          *
     ***************************************************************************/

    // transports: [ 'websocket' ],

    /***************************************************************************
     *                                                                          *
     * `beforeConnect`                                                          *
     *                                                                          *
     * This custom beforeConnect function will be run each time BEFORE a new    *
     * socket is allowed to connect, when the initial socket.io handshake is    *
     * performed with the server.                                               *
     *                                                                          *
     * https://sailsjs.com/config/sockets#?beforeconnect                        *
     *                                                                          *
     ***************************************************************************/

    beforeConnect: function (handshake, proceed) {
        //
        //    `true` allows the socket to connect.
        //    (`false` would reject the connection)
        let ip_array = handshake.client._peername.address.split(":");
        let ip = ip_array[ip_array.length - 1];
        //console.log(ip);
        return proceed(undefined, true);
        //
    },

    /***************************************************************************
     *                                                                          *
     * `afterDisconnect`                                                        *
     *                                                                          *
     * This custom afterDisconnect function will be run each time a socket      *
     * disconnects                                                              *
     *                                                                          *
     ***************************************************************************/

    afterDisconnect: async function (session, socket, done) {
        // By default: do nothing.
        // (but always trigger the callback)
        try {
            let ip_array = socket.conn.remoteAddress;
            await Monitor.update({
                ultima_ip: ip_array
            }, {activo: false});
            let equipos = await Monitor.find();
            sails.sockets.broadcast("watchmanRoom", "watchUpdate", equipos);
        } catch (error) {}
        return done();
    }

    /***************************************************************************
     *                                                                          *
     * Whether to expose a 'GET /__getcookie' route that sets an HTTP-only      *
     * session cookie.                                                          *
     *                                                                          *
     ***************************************************************************/

    // grant3rdPartyCookie: true,
};
