'use strict';


function GameCtrl($scope,$rootScope, $http, $location, Game) {
    // Open socket
    var socket = io.connect();

    // Wait for connection and then emit the join message with
    // the room and player ID provided in the API response.
    socket.on( 'connect', function() {
        socket.emit( 'join', { room: $rootScope.game.room, player: $rootScope.game.player } );
    });

    socket.on( 'joined', function(){
        console.log('player joined')
    })
}
