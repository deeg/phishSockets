
module.exports = function(app, config, Game) {
    var server = require('http').createServer(app),
        io = require('socket.io').listen(server);

    /*
     * Socket Logic
     *
     * The logic in this section is as if you were interacting with one person, who we will refer to as the client.
     *  -send to current request socket client
     *  socket.emit('message', "this is a test");
     *
     * -sending to all clients, include client
     * io.sockets.emit('message', "this is a test");
     *
     * -sending to all clients except client
     * socket.broadcast.emit('message', "this is a test");
     *
     * -sending to all clients in 'game' room(channel) except client
     * socket.broadcast.to('game').emit('message', 'nice game');
     *
     * -sending to all clients in 'game' room(channel), include client
     * io.sockets.in('game').emit('message', 'cool game');
     *
     * -sending to individual socketid
     * io.sockets.socket(socketid).emit('message', 'for your eyes only');
     *
     * */
    io.sockets.on('connection', function (socket) {
        // Globals set in join that will be available to
        // the other handlers defined on this connection
        var _room, _id, _playerId, _playerName;

        /*
        * This gets fired when a client emits the join call.
        * data.room = roomId
        * data.player = client playedId
        * data.playerName = client playerName
        * */

        socket.on('join', function ( data ) {
            // Static helper to lookup of a game based on the room
            Game.findByRoom( data.room, function( err, game ) {
                var pcnt = 0, pidx;

                if ( game.length> 0 ) {
                    game = game[0];

                    // Remember this for later
                    _id = game._id;
                    _room = game.room;
                    _playerId = data.player;
                    _playerName = data.playerName

                    // Join the room.
                    socket.join( _room );

                    /*
                     * Emit message to everyone except sender that a new player has joined.
                     * This will signify to fill in their opponent name bubble
                     * */
                    socket.broadcast.to( _room ).emit( 'player:joined', {game: game} );
                    /*
                     * Tell the player they have joined the room. This will tell them to fill in the user bubble
                     * with their name.
                     * */
                    socket.emit( 'you:joined', {game: game, playerId: _playerId});

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