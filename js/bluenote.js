var app = angular.module("bluenote", ['ionic'])

.config(function($stateProvider, $urlRouterProvider) {
  $stateProvider
    .state('search', {
      url: '/search',
      templateUrl: 'templates/search.html'
    })
    .state('result', {
      url: '/result?mbid&name',
      templateUrl: 'templates/result.html'
    });

    $urlRouterProvider.otherwise('/search');
})
.directive("ngEnter", function() {
  return function(scope, element, attrs) {
    element.bind("keydown keypress", function(event) {
      if(event.which === 13) {
        scope.$apply(function() {
          scope.$eval(attrs.ngEnter);
        });
        event.preventDefault();
      }
    });
  };
});