myApp.controller('AppCtrl',['$scope','happy','$q',function($scope,happy,$q) {
  var vm=this;

  $scope.happy = happy;
  $scope.docs = happy.mydocs;

  $scope.nmess=2;

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
      },happy.err);
  };

  $scope.submit = function(method, arg) {
      var tab = method;
      if (typeof vm[tab]==='function') 
          vm[tab](arg);
  };

}]);


