'use strict';


function GameCtrl($scope,$rootScope, $http, $location, Game) {
    // Open socket
    var socket = io.connect();

    //Opponent object
    $scope.opponent = {}
    $scope.player = {};

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

    // Wait for connection and then emit the join message with
    // the room and player ID provided in the API response.
    socket.on( 'connect', function() {
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

    })
}
