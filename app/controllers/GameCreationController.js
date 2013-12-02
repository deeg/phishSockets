
module.exports = function (app, Game) {
    var controller = {};

    var makeId = function (){
        var text = "";
        var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

        for( var i=0; i < 4; i++ )
            text += possible.charAt(Math.floor(Math.random() * possible.length));

        return text;
    }

    /*
     * REST endpoint to create a game.
     */
    controller.create = [
        function (req, res, next) {
            //If request does not signify number of players use 2
            req.body.numPlayers = req.body.numPlayers ? req.body.numPlayers : 2;

            var room = makeId(),
                pid = makeId(),
                num = req.body.numPlayers,
                players = [{
                    id: pid,
                    name: req.body.name || pid,
                    status: 'joined',
                    statusDate: Date.now()
                }];

            // Create placeholders for the other players to join
            // the game.
            for ( var i=1;i<num;i++ ) {
                players.push({
                    id: pid+'-'+i,
                    name: 'Open',
                    status: 'open',
                    statusDate: Date.now()
                });

            }

            Game.create({
                    room: room,
                    status: 'waiting',
                    numPlayers: num,
                    players: players
                },
                function( err, game ) {
                    if(err) return next(err);
                    var data = game.toJSON();

                    // Respond with game record and
                    // add the player's ID so it can be recorded locally
                    data.action = 'start';
                    data.player = pid;

                    res.send( data );
                });
        }
    ]
    controller.join = [
        function (req, res, next) {
            var pid = makeId(),
                player, pidx;

            // First find the room and validate it exists.  The returned game document
            // will not be modified.  That will be done later using findOneAndUpdate()
            // I just want to be able to differentiate between error conditions -
            // room not found vs room full.
            Game.findByRoom( req.params.room, function( err, game ) {
                if ( err || game.length < 1 ) {
                    res.send( 400, { code: 'roomNotFound', message: 'Failed to find the expected game room' } );
                } else {
                    game = game[0]
                    player = {
                        id: pid,
                        name: req.body.name,
                        status: 'joined',
                        statusDate: Date.now()
                    };

                    // In the unlikely event that two or more players attempt to join the same
                    // game at the exact same time, we need to grab an open spot in one operation
                    Game.findOneAndUpdate(
                        { '_id': game._id,  'players.status': { $in: [ 'left', 'open' ] } },
                        { $set: { 'players.$': player } },
                        function( err, game ) {
                            var data;

                            if ( game ) {
                                data = game.toJSON();
                                data.action = 'join';
                                data.player = pid;

                                res.send( data );
                            } else {
                                res.send( 400, { code: 'gameFull', message: 'All available player slots have been filled' } );
                            }
                        }
                    );
                }
            });
        }
    ]

    return controller;
}