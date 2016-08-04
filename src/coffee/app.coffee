((window) ->
  window.__env = window.__env or {}
  host = '/* @echo API_HOST */'
  window.__env.apiUrl = if host == 'undefined' then 'http://localhost:3000' else host
  return
) this

@binScanner = angular.module 'binScanner', ['restangular', 'ui.router', 'ngCookies']

@binScanner.constant('__env', window.__env)

@binScanner.config ['RestangularProvider', '__env', (RestangularProvider, __env) ->
  RestangularProvider.setDefaultHeaders({'Authorization': 'Token token=fe420ac77d9360dbdca56aa0b3aa5851'})
  RestangularProvider.setBaseUrl("#{__env.apiUrl}/api/v1")
]

@binScanner.config ['$stateProvider', '$urlRouterProvider', ($stateProvider, $urlRouterProvider) ->

  $urlRouterProvider.otherwise('/')

  $stateProvider
  .state 'home',
    url: '/'
    templateUrl: 'templates/home.html'
    controller: 'ScanCtrl'
    controllerAs: 'scan'
  .state 'login',
    url: '/login'
    templateUrl: 'templates/login.html'
    controller: 'LoginCtrl'
    controllerAs: 'login'
]

@binScanner.run ['$rootScope', '$state', '$cookies', 'Restangular', ($rootScope, $state, $cookies, Restangular) ->
  Restangular.addErrorInterceptor (response) ->
    $state.go('login') if response.status is (401 || 403)

  $rootScope.$on '$startChangeStart', (ev, toState, toParams, fromState, fromParams) ->
    if ($cookies.getObject('authToken') is null) and (toState is 'home')
      $state.go('login')
]

@binScanner.controller 'ScanCtrl', [ 'BinService', (BinService)->
  vm = this
  vm.binCode = null
  vm.itemCode = null
  vm.addResult = null
  vm.itemCount = "-"

  vm.processCode = (code) ->
    if code.match(/BIN/)
      console.log("Updating BIN number")
      BinService.getBin(code).then (result) ->
        vm.binCode = result.barcode
        vm.itemCount = result.item_count
      , (error) ->
        console.log error
        vm.addResult = 'failure'
    else if code.match(/\d{2}[A-Z]{3}/)
      console.log("Updating ITEM number")
      vm.itemCode = code

      if vm.binCode is null
        alert("No BIN selected.  Scan BIN to add Item.")
      else
        vm.itemCode = code
        BinService.addItemToBin({bin_barcode: vm.binCode, item_barcode: vm.itemCode}).then (result) ->
          vm.addResult = 'success'
          vm.itemCount = result.item_count
        , (error) ->
          console.log response
          vm.addResult = 'failure'

    else "What'd you do?"

  vm
]

@binScanner.controller 'LoginCtrl', ['LoginService', '$state', (LoginService) ->

  vm = this
  vm.params = {}
  vm.error = { present: false, message: null }

  vm.submitLogin = () ->
    params = { login: vm.user.login, password: vm.user.password }
    LoginService.login(params).then (result) ->
      $cookies.putOject('authToken', {email: result.user.email, token: result.authentication_token})
    , (error) ->


  vm
]

@binScanner.factory 'BinService', ['Restangular', (Restangular)->

  path = 'admin/bins'

  service =

    getBin: (code) ->
      Restangular.one(path, code).get()

    addItemToBin: (data) ->
      Restangular.all(path).post(data)

  service
]

@binScanner.factory 'LoginService', ['Restangular', (Restangular) ->

  service =

    login: (params) ->
      Restangular.all('auth/token').post(params)

  service
]

@binScanner.directive 'codeScan', [ '$document', '$timeout', ($document, $timeout)->
  restrict: 'A'
  controller: 'ScanCtrl'
  controllerAs: 'scan'
  bindToController: true
  link: (scope) ->
    minChars = 8
    maxTime = 100
    pressed = false
    chars = []
    $document.on 'keypress', (event) ->
      keycode = `(event.which) ? event.which : event.keyCode`
      chars.push(String.fromCharCode(event.which)) if (keycode >= 65 && keycode <= 90) || (keycode >= 97 && keycode <= 122) || (keycode >= 48 && keycode <= 57) || (keycode == 45)
      if pressed is false
        $timeout () ->
          scope.scan.processCode chars.join('') if (chars.length >= minChars)
          chars = []
          pressed = false
        , maxTime
      pressed = true
    false
]