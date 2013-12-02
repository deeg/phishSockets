'use strict';

/* Directives */


angular.module('phish.directives', []).
  directive('appVersion', ['version', function(version) {
    return function(scope, elm, attrs) {
      elm.text(version);
    };
  }])
    .directive('dropdown', function () {
    return function (scope, elm, attrs) {
         $(elm).dropdown();
        };
    }).directive('tooltip', function () {
    return {
        restrict:'A',
        link: function(scope, element, attrs){
            $(element)
                .attr('title',scope.$eval(attrs.tooltip))
                .tooltip({placement: "right"});
            }
        }
    }).directive('inputMask', function(){
    return {
        restrict: 'A',
        link: function(scope, el, attrs){
            el.inputmask(scope.$eval(attrs.inputMask));
            el.on('change', function(){
                scope.$eval(attrs.ngModel + "='" + el.val() + "'");
            });
        }
    };
}).directive('personPicker', ['$http', function($http){
    return {
        restrict: 'A',
        link: function(scope, el, attrs){
            autocomplete(scope.$eval(attrs.personPicker));

            /**
             * convertData: obj -> obj
             * @param data
             * takes the data obj and formats the contents
             */
            function convertData (data) {
                var imgSource = "http://info.mitre.org/phonebook/photos/small/{mitreAssignedId}.jpg";
                imgSource = imgSource.replace(/{mitreAssignedId}/, data.id);
                var noPhoto = 'http://info.mitre.org/person_profile/gadgets/businesscard/nophoto.png';

                var x = '<img src="{source}" class="circleNodePhoto" onerror="this.src=\'{onErrorPhoto}\';"/> <span class="autocompleteName">{name}</span>';
                x = x.replace(/{name}/, data.Title);
                x = x.replace(/{onErrorPhoto}/, noPhoto);
                x = x.replace(/{source}/, imgSource);
                if (data.Organization) {
                    x += '<br><span class="autocompleteOrg">' + data.Organization + '</span>';
                }

                //Endeca API has an issue when returning JSON. It removes leading 0's from numbers.
                //Since all IDS should be at least 5 in length, adding back in leading 0's
                var idString = data.id.toString();

                while(idString.length < 5){
                    idString = '0' + idString;
                }

                return {value : data.Title, label : x, id : idString, phone : data.PhoneNumber, org : data.Organization};
            }

            /**
             * autocomplete: String, Obj -> void
             * @param options the options to be passed to the autocomplete
             */
            function autocomplete (options) {
                options = options || {};
                options.source = options.source || function autocompleterSource(request, response) {

                    if (request.term.length > 1) {
                        scope.$apply(function() {
                            $http.get('/qwf/api/personPicker?q='
                                + encodeURIComponent(request.term))
                                .success(function (res) {
                                    var data = res,
                                        result = [],
                                        people = data.records.record;
                                    for (var i in people) {
                                        var singleResult = convertData(people[i]);
                                        result.push(singleResult);
                                    }
                                    response(result);

                                })
                            ;
                        });
                    }
                };

                el.autocomplete(options).data("uiAutocomplete")._renderItem = function (ul, item) {
                    return $("<li></li>")
                        .data("item.autocomplete", item)
                        .append("<a>" + item.label + "</a>")
                        .appendTo(ul);
                };
            }
        }
    };
}]);