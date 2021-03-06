function GameCtrl($scope,$rootScope, $http, $location, Game) {
    // Open socket
    var socket = io.connect();

    //Opponent object
    $scope.opponent = {}
    //Player object
    $scope.player = {};
    //Score object
    $scope.score = {};
    //Main status message to display to the user.
    $scope.statusMessage = '';
    //A variable to show when you want the user to accept moving on to the next stage.
    $scope.showReady = false;
    $scope.disableReady = false;
    $scope.showQuestionAnswers = false;
    $scope.answeredQuestion = false;

    //Sets the player and opponent objects.
    $scope.setPlayerAndOpponent = function(pid){
        _.each($scope.game.players, function(player, i){
            if(pid == player.id){
                //Set Player Object
                $scope.player = player;
                console.log('Player: ' + $scope.player.name);
                console.log($scope.player);
            }else{
                //Set Opponent Object
                $scope.opponent = player;
                console.log('Opponent: ' + $scope.opponent.name);
                console.log($scope.opponent);
            }
        })
    }

    //A function which gets called when you hit the ready button
    //This signifies the user is ready to proceed to the next step.
    $scope.ready = function(){
        $scope.disableReady = true;
        $scope.statusMessage = 'Waiting for other player to hit ready...'
        socket.emit('proceed:accept', {player: $scope.player, game: $scope.game});
    }

    $scope.answerQuestion = function(answer){
        //Disable buttons so you cannot answer again
        $scope.answeredQuestion = true;
        //Check if the answer is correct, send to the server if the client got it correct or not.
        socket.emit('question:answer', {answeredCorrectly: answer == $scope.question.answer,
            game: $scope.game, question: $scope.question});
    }

    //A helper function to reset the question, and show the ready button to proceed to the next question.
    $scope.resetQuestion = function(){
        $scope.question = {};
        $scope.showQuestionAnswers = false;
        $scope.disableReady = false;
        $scope.showReady = true;
        $scope.answeredQuestion = false;
    }

    // Wait for connection and then emit the join message with
    // the room and player ID provided in the API response.
    socket.on( 'connect', function() {
        $scope.statusMessage = 'Waiting for more players...';
        socket.emit( 'join', { room: $rootScope.game.room, player: $rootScope.game.player,
            playerName:  $rootScope.game.playerName} );
    });

    socket.on( 'you:joined', function(data){
        console.log('I joined');
        $scope.$apply(function(){
            //Set the game on the scope
            $scope.game = data.game
            //Check if my opponent is here, if so set the object so their name is shown
            if($scope.game.players.length > 1){
                //Opponent here set name
                $scope.setPlayerAndOpponent(data.playerId)
            }
        })
    })

    socket.on( 'player:joined', function(data){
        $scope.$apply(function(){
            //Set the game on the scope
            $scope.game = data.game
            //Right now we are only doing two-on-two. TODO: Change to adapt for more people
            $scope.setPlayerAndOpponent($scope.player.id);
        })

    });

    socket.on('game:ready', function(){
        $scope.$apply(function(){
            $scope.statusMessage = 'All players have joined! Click READY to begin the game. Once both players have clicked ready, the first question will be asked in 3 seconds.'
            $scope.showReady = true;
        })
    })

    socket.on('question:ask', function(data){
        $scope.$apply(function(){
            $scope.showReady = false;
            $scope.game = data.game
            $scope.statusMessage = 'The question will be displayed in 3 seconds.'
            $scope.question = $scope.game.questions[0];
            //TODO: Jumble up answers in random order after making array
            $scope.question.answers = [$scope.question.answer, $scope.question.fakeAnswer1,
                $scope.question.fakeAnswer2, $scope.question.fakeAnswer3];
            setTimeout(function(){
                //After three second wait display question to players
                $scope.$apply(function(){
                    $scope.statusMessage = $scope.question.question;
                    $scope.showQuestionAnswers = true;
                })
            }, 3000)
        })
    });

    socket.on('question:incorrect', function(){
        $scope.$apply(function(){
            $scope.statusMessage = "Sorry, that is incorrect. Let's see if your opponent gets it right!"
        })
    })

    socket.on('question:correct', function(){
        $scope.$apply(function(){
            //Client got the answer correct
            $scope.statusMessage = 'You got the question correct! Press ready to move to the next question.';
            $scope.score.player = 1;
            $scope.resetQuestion();
        })
    })

    socket.on('question:answered', function(data){
        $scope.$apply(function(){
            $scope.statusMessage = 'Your opponent got the question correct. Press ready to move to the next question.'
            $scope.score.opponent = 1;
            $scope.resetQuestion();
        })
    })

    socket.on('question:fail', function(){
        $scope.$apply(function(){
            $scope.statusMessage = 'FAIL! You both got it wrong. The answer was: ' + $scope.question.answer + '. Press ready to move to the next question.'
            $scope.resetQuestion();
        })
    })
}
