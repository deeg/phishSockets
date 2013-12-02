'use strict';


function GameCreationCtrl($scope,$rootScope, $http, $location, Game) {

    $rootScope.newGame = {};

    $rootScope.createGame = function(){
        $rootScope.newGame = new Game($scope.newGame);
        $rootScope.newGame.$save(function(){
            //New game has been created. Take the user to the page to connect to the socket
            $rootScope.game = $rootScope.newGame;
            $location.path('/playGame')
        })
    }

    $rootScope.joinGame = function(){
        $rootScope.newGame = new Game($scope.newGame);
        $rootScope.newGame.$save(function(){
            //New game has been created. Take the user to the page to connect to the socket
            $rootScope.game = $rootScope.newGame;
            $location.path('/playGame')
        })
    }
}
