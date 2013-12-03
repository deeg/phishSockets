var _ = require('underscore');

module.exports = function(app, config, Game, Question) {
    console.log(app)
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
        var _room, _id, _playerId, _playerName, _game;

        //A object to tell when to proceed.
        var _proceed = {};

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

                    socket.set('playerId', _playerId, function () {
                    });

                    _playerName = data.playerName
                    _game = game;

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
                            _game = game;
                            io.sockets.in( _room ).emit( 'game:ready' );
                        });
                    }
                }
            });
        });

        socket.on('proceed:accept', function(data){
            data.player.proceed = true;
            Game.findOneAndUpdate(
                {'_id': data.game._id, 'players.id': data.player.id},
                {$set: {'players.$': data.player}},
                function(err, game){
                    console.log(game);
                    if(!game){
                        //TODO: Handle no game found here
                    }
                    //Check to see if all players have proceeded, if so emit event
                    var proceed = true;
                    _.each(game.players, function(player, i){
                        if(!player.proceed){
                            proceed = false;
                        }
                    });
                    console.log(proceed);
                    if(proceed){
                        //Clear out proceeded booleans and save game
                        _.each(game.players, function(player, i){
                            player.proceed = false;
                        });
                        game.status = 'question'
                        game.questionNumber = 1;
                        game.save(function(err, game){
                            if(game.status == 'question' && game.questionNumber == 1){
                            /*
                             * We are ready to ask the first question, get the three questions to be asked put
                             * them in the game array.
                             * Save and send first question to players
                             * */
                                //TODO: Get random three questions here, for now hard coding
                                Question.find(function(err, questions){
                                    game.questions = questions;

                                    //TODO: Change this
                                    _.each(game.questions, function(e, i){
                                        e.answeredCorrectly = false;
                                    })

                                    game.save(function(err, game){
                                        //Hide the later questions for the players
                                        game.questions = game.questions[0];
                                        io.sockets.in( _room ).emit('question:ask', {game: game});
                                    })
                                })



                             }
                        })
                    }
                }
            )
        });

        socket.on('question:answer', function(data){
            socket.get('playerId', function (err, playerId) {
                if(err) console.log(err);
                var answeredCorrectly = data.answeredCorrectly;
                var game = data.game;
                var question = data.question;

                //If the question was answered correctly, update the game object
                if(answeredCorrectly){
                    question.answeredCorrectly = true;
                    question.winningUser = playerId;
                    //Answered correctly
                    Game.findOneAndUpdate(
                        {'_id': data.game._id, status: 'question', 'questions._id': question._id},
                        {$set: {'status': 'waiting', 'questions.$': question}},
                        function(err, game){
                            if(game){
                                //Player successfully got the answer correct first.

                                //Tell the player they got the question right
                                socket.emit('question:correct');

                                //Tell everyone else in the room who got the question right
                                socket.broadcast.to(game.room).emit('question:answered', {playerId: playerId})
                            }else{
                                //Player did not answer first, they did not win the question.
                                //We do not have to do anything here because the client will get the question:answered call
                            }
                        }
                    );
                }else{
                    //Answered incorrectly
                    socket.emit('question:incorrect');
                    //Check if both players have answered incorrectly, if so announce and move on.
                }
            });
        })
    });

    return {server: server, io: io};
}