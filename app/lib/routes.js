module.exports = function (app, ApiController, HomeController, GameCreationController, Game, models, socket) {

    // Home
    //app.resource(app.controllers.home);
    app.get('/', HomeController.index);

    /*
    * Create / Join Game Endpoints
    *
    * These REST endpoints will be used to create / join games.
    * CREATE: Create the game object and save it to DB. While creating game object, create Player objects also.
    * JOIN: Check for free space, create player object and add it to the game.
    * */

    app.post('/api/Game', GameCreationController.create);
    app.post('/api/Game/:room', GameCreationController.join);

    //Generic restful api for all models - if previous routes are not matched, will fall back to these
    //See libs/params.js, which adds param middleware to load & set req.Model based on :model argument
    app.get('/api/:model', ApiController.search);
    app.post('/api/:model', ApiController.create);
    app.get('/api/:model/:id', ApiController.read);
    app.post('/api/:model/:id', ApiController.update);
    app.del('/api/:model/:id', ApiController.destroy);


    //whenever a router parameter :model is matched, this is run
    app.param('model', function(req, res, next, model) {
        //TODO: what instead?
        var Model = models[model];
        if(Model === undefined) {
            //if the request is for a model that does not exist, 404
            return res.send(404);
        }

        req.Model = Model;
        return next();
    });

    /*
     * Socket Logic
     * */
    socket.io.sockets.on('connection', function (soc) {
        console.log('connected')
        // Globals set in join that will be available to
        // the other handlers defined on this connection
        var _room, _id, _player;

        soc.on( 'join', function ( data ) {
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
                    soc.join( _room );

                    // Now emit messages to everyone else in this room.  If other
                    // players in this game are connected, only those clients
                    // will receive the message
                    socket.io.sockets.in( _room ).emit( 'joined' );

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
};