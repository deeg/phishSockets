'use strict';


function AddQuestionCtrl($scope,$rootScope, $http, $location, Question) {

    $scope.newQuestion = {};

    $scope.addQuestion = function(){
        $scope.newQuestion = new Question($scope.newQuestion);

        $scope.newQuestion.$save(function(){
            //Clear out the input boxes, question saved.
            $scope.newQuestion = {};
        })
    }
}
