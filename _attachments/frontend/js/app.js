myApp.controller('AppCtrl',['$scope','happy','$q',function($scope,happy,$q) {
  var vm=this;

  $scope.happy = happy;
  $scope.docs = happy.mydocs;

  $scope.nmess=1;

  vm.logout = function (email) {
    happy.action('signout').then(function(data){
      happy.session();
    },happy.err);
  };

  $scope.submit = function(method, arg) {
      var tab = method;
      if (typeof vm[tab]==='function') 
          vm[tab](arg);
  };

  $scope.drop = function(key) {
      var doc=happy.getDoc(key);

      happy.askConfirm({
          title : "<i class='fa fa-trash-o txt-color-orangeDark'></i> <strong><span class='txt-color-orangeDark'>Confirm </span> deletion</strong>",
          content : "Are you sure you want to delete \""+(doc.name||key)+"\" ?",
          buttons : '[No][Yes]'
      }).then(function(){
         happy.action('drop',{doc:key}).then(happy.success,happy.err);
      });
  };  

  $scope.chat = function(target){
    var msg = window.prompt("Message to send:");
    if (msg && msg.length>0) {
      happy.action('chat',{
        doc : target,
        msg : msg
      }).then(happy.success,happy.err);
    } 
  };


  $scope.chooseProfile=function(){
      var deferred = $q.defer();

      happy.getAllProfiles().then(function(data){
        if (data && data.rows && data.rows.length>0) {
          var opt = data.rows.map(function(v){return "["+v.key+"]"}).join('')
          $.SmartMessageBox({
              title: "Choose a target profile:",
              content: "",//<div class='note'>Please note that:<ul><li>INSTALL action will clean <strong>both your data and your configuration</strong> before deployment steps</li><li>All Uppercase actions will <strong>clean your configuration</strong> before deployment steps</li></ul></div>",
              buttons: "[Cancel][Ok]",
              input: "select",
              options: opt
          }, function (ButtonPress, Value) {
              if (ButtonPress=="Ok") {
                $scope.chat([happy.userCtx.name.toLowerCase(),Value.toLowerCase()].sort().join('|'));
              }
          });
        } else {
          happy.err("No profile returned. You need to create some profiles from the administration dashboard first!");
        }
      },happy.err);

      return deferred.promise;
  };

}]);

myApp.controller('LoginCtrl',['$scope','happy',function($scope,happy) {
  var vm=this;

  $scope.fields = {
    username : "",
    password : ""
  };

  vm.login = function (email) {
    happy.action('signin', angular.extend({},$scope.fields,{
        doc : "org.couchdb.user:"+$scope.fields.username,
      })).then(function(data){
        happy.session();
        $scope.fields.password = $scope.fields.username = '';
        //happy.info("You have been signed in successfully!");
      },happy.err);
  };

  $scope.submit = function(method, arg) {
      var tab = method;
      if (typeof vm[tab]==='function') 
          vm[tab](arg);
  };

}]);


