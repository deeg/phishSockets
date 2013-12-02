'use strict';

// Declare app level module which depends on filters, and services
angular.module('phish', ['phish.filters', 'phish.services', 'phish.directives', 'ui.sortable', 'ngRoute', 'ui.tinymce',
    'ui.validate', 'ui.mask', 'ui.date', 'ngEkathuwa', 'ngynSelectKey', 'ngSanitize'])
    .config(['$routeProvider', '$locationProvider', '$httpProvider', function ($routeProvider, $locationProvider, $httpProvider) {

        //gets rid of the # in urls
        $locationProvider.html5Mode(true);

        //Disable all caching for HTTP get requests
        if (!$httpProvider.defaults.headers.get) {
            $httpProvider.defaults.headers.get = {};
        }
        //disable IE ajax request caching
        $httpProvider.defaults.headers.get['If-Modified-Since'] = '0';

        //The routes that our angular app will handle
        $routeProvider
            .when('/', { templateUrl: '/partials/index.html'})
            .when('/createGame', { templateUrl: '/partials/createGame.html', controller: GameCreationCtrl})
            .when('/joinGame', { templateUrl: '/partials/joinGame.html', controller: GameCreationCtrl})
            .when('/playGame', { templateUrl: '/partials/playGame.html', controller: GameCtrl})
            .when('/addQuestion', { templateUrl: '/partials/addQuestion.html', controller: AddQuestionCtrl})
            .otherwise({ templateUrl: '/partials/404.html' });

        /*
         Set up an interceptor to watch for 401 errors.
         The server, rather than redirect to a login page (or whatever), just returns  a 401 error
         if it receives a request that should have a user session going.  Angular catches the error below
         and says what happens - in this case, we just redirect to a login page.  You can get a little more
         complex with this strategy, such as queueing up failed requests and re-trying them once the user logs in.
         Read all about it here: http://www.espeo.pl/2012/02/26/authentication-in-angularjs-application
         */
        var interceptor = ['$q', '$location', '$rootScope', function ($q, $location, $rootScope) {
            function success(response) {
                return response;
            }

            function error(response) {
                var status = response.status;
                if (status == 401) {
                    $rootScope.redirect = $location.url(); // save the current url so we can redirect the user back
                    $rootScope.user = {}
                    $location.path('/login');
                }
                return $q.reject(response);
            }

            return function (promise) {
                return promise.then(success, error);
            }
        }];
        $httpProvider.responseInterceptors.push(interceptor);

    }])
    .run(function ($rootScope, $http, $location, $routeParams ) {
        $rootScope.$on('$routeChangeSuccess', function(e, current, pre) {

        });

    });