'use strict';


var module = angular.module('phish.services', ['ngResource']);

module.factory('Game', function ($resource) {
    return $resource('/api/Game/:room', {room:'@room'}, {
    });
});
