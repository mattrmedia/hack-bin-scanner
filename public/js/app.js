(function(window) {
  var host;
  window.__env = window.__env || {};
  host = 'undefined';
  window.__env.apiUrl = host === 'undefined' ? 'http://localhost:3000' : host;
})(this);

this.binScanner = angular.module('binScanner', ['restangular', 'ui.router', 'ngCookies', 'angularMoment']);

this.binScanner.constant('__env', window.__env);

this.binScanner.config([
  'RestangularProvider', '__env', function(RestangularProvider, __env) {
    RestangularProvider.setDefaultHeaders({
      'Authorization': 'Token token=fe420ac77d9360dbdca56aa0b3aa5851',
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    });
    return RestangularProvider.setBaseUrl(__env.apiUrl + "/api/v1");
  }
]);

this.binScanner.config([
  '$stateProvider', '$urlRouterProvider', function($stateProvider, $urlRouterProvider) {
    $urlRouterProvider.otherwise('/');
    return $stateProvider.state('home', {
      url: '/',
      templateUrl: 'templates/home.html',
      controller: 'ScanCtrl',
      controllerAs: 'scan'
    }).state('login', {
      url: '/login',
      templateUrl: 'templates/login.html',
      controller: 'LoginCtrl',
      controllerAs: 'login'
    });
  }
]);

this.binScanner.run([
  '$rootScope', '$state', '$cookies', 'Restangular', function($rootScope, $state, $cookies, Restangular) {
    Restangular.addErrorInterceptor(function(response) {
      if (response.status === (401 || 403)) {
        return $state.go('login');
      }
    });
    Restangular.addFullRequestInterceptor(function(el, op, what, url, headers, params) {
      var authToken, currentHeaders;
      if (what !== 'auth/token') {
        currentHeaders = headers;
        authToken = $cookies.getObject('authToken');
        currentHeaders['X-USER-LOGIN'] = authToken.email;
        currentHeaders['X-USER-TOKEN'] = authToken.token;
      }
      return {
        headers: currentHeaders
      };
    });
    return $rootScope.$on('$stateChangeStart', function(ev, toState, toParams, fromState, fromParams) {
      if (($cookies.getObject('authToken') === void 0) && !(toState.name === 'login')) {
        ev.preventDefault();
        return $state.go('login');
      }
    });
  }
]);

this.binScanner.controller('ScanCtrl', [
  'BinService', function(BinService) {
    var vm;
    vm = this;
    vm.binCode = null;
    vm.itemCode = null;
    vm.addResult = null;
    vm.itemCount = null;
    vm.processCode = function(code) {
      if (code.match(/BIN/)) {
        console.log("Updating BIN number");
        return BinService.getBin(code).then(function(result) {
          vm.binCode = result.barcode;
          vm.itemCount = result.item_count;
          return true;
        }, function(error) {
          console.log(error);
          return vm.addResult = 'failure';
        });
      } else if (code.match(/\d{2}[A-Z]{3}/)) {
        console.log("Updating ITEM number");
        vm.itemCode = code;
        if (vm.binCode === null) {
          return alert("No BIN selected.  Scan BIN to add Item.");
        } else {
          vm.itemCode = code;
          return BinService.addItemToBin(vm.binCode, {
            item_barcode: vm.itemCode
          }).then(function(result) {
            vm.addResult = 'success';
            return vm.itemCount = result.item_count;
          }, function(error) {
            console.log(error);
            return vm.addResult = 'failure';
          });
        }
      } else {
        return "What'd you do?";
      }
    };
    return vm;
  }
]);

this.binScanner.controller('LoginCtrl', [
  'LoginService', '$state', '$cookies', 'moment', function(LoginService, $state, $cookies, moment) {
    var vm;
    vm = this;
    vm.params = {};
    vm.error = {
      present: false,
      message: null
    };
    vm.submitLogin = function() {
      var params;
      params = {
        login: vm.params.login,
        password: vm.params.password
      };
      return LoginService.login(params).then(function(result) {
        $cookies.putObject('authToken', {
          email: result.user.email,
          token: result.authentication_token
        }, {
          expires: moment().add(4, 'hours').toDate()
        });
        return $state.go('home');
      }, function(error) {
        return vm.error = {
          present: true,
          message: "Invalid login"
        };
      });
    };
    return vm;
  }
]);

this.binScanner.factory('BinService', [
  'Restangular', function(Restangular) {
    var path, service;
    path = 'admin/bins';
    service = {
      getBin: function(code) {
        return Restangular.one(path, code).get();
      },
      addItemToBin: function(bin, data) {
        return Restangular.one(path, bin).patch(data);
      }
    };
    return service;
  }
]);

this.binScanner.factory('LoginService', [
  'Restangular', function(Restangular) {
    var service;
    service = {
      login: function(params) {
        return Restangular.all('auth/token').post(params);
      }
    };
    return service;
  }
]);

this.binScanner.directive('codeScan', [
  '$document', '$timeout', function($document, $timeout) {
    return {
      restrict: 'E',
      controller: 'ScanCtrl',
      controllerAs: 'scan',
      bindToController: true,
      link: function(scope) {
        var chars, maxTime, minChars, pressed;
        minChars = 8;
        maxTime = 100;
        pressed = false;
        chars = [];
        $document.on('keypress', function(event) {
          var keycode;
          keycode = (event.which) ? event.which : event.keyCode;
          if ((keycode >= 65 && keycode <= 90) || (keycode >= 97 && keycode <= 122) || (keycode >= 48 && keycode <= 57) || (keycode === 45)) {
            chars.push(String.fromCharCode(event.which));
          }
          if (pressed === false) {
            $timeout(function() {
              if (chars.length >= minChars) {
                scope.scan.processCode(chars.join(''));
              }
              chars = [];
              return pressed = false;
            }, maxTime);
          }
          return pressed = true;
        });
        return false;
      }
    };
  }
]);
