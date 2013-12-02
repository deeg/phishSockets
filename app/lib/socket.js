
module.exports = function(app, config, Game) {
    var server = require('http').createServer(app),
        io = require('socket.io').listen(server);

    /*
     * Socket Logic
     * */
    io.sockets.on('connection', function (socket) {
        // Globals set in join that will be available to
        // the other handlers defined on this connection
        var _room, _id, _player;

        socket.on( 'join', function ( data ) {
            // Static helper to lookup of a game based on the room
            Game.findByRoom( data.room, function( err, game ) {
                var pcnt = 0, pidx;

                if ( game.length> 0 ) {
                    game = game[0];

                    // Remember this for later
                    _id = game._id;
                    _room = game.room;
                    _player = data.player;

                    // Join the room.
                    socket.join( _room );

                    // Now emit messages to everyone else in this room.  If other
                    // players in this game are connected, only those clients
                    // will receive the message
                    io.sockets.in( _room ).emit( 'joined' );

                    // Now, check if everyone is here
                    game.players.forEach(function( p ) {
                        if ( p.status == 'joined' )
                            pcnt++;
                    });

                    // If so, update statuses, initialize
                    // and notify everyone the game can begin
                    if ( pcnt == game.numPlayers ) {
                        game.save(function( err, game ) {
                            io.sockets.in( _room ).emit( 'ready' );
                        });
                    }
                }
            });
        });
    });

    return {server: server, io: io};
}