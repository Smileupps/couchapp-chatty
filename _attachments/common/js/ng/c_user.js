myApp.controller('UserController', ['$scope','$http','$log', 'happy','$modalInstance','selectedTab','selectedUser','$q', function ($scope, $http, $log, happy, $modalInstance,selectedTab,selectedUser,$q) {
    var vm = this;

    $scope.happy = happy;
    $scope.selectedTab = selectedTab||'tab-login';

    $scope.setTab = function(tabFocused) {
        $scope.selectedTab = tabFocused;
    };
    $scope.isSelected = function(e) {
        if (typeof e === "string") {
            return $scope.selectedTab === e;
        } 
    };

    $scope.fields = {
    	user: {
            name:'',
	        email:'',
	        password:''
    	},
    	profile : {

    	}
    };

    // We retrieve the suer document
    happy.loadDoc("org.couchdb.user:"+selectedUser).then(function(data){
    	// We create a binding with the effective underlying document, so every document change within the database is automatically reflected within the ui
    	$scope.user = happy.getDoc("org.couchdb.user:"+selectedUser);
    	$scope.fields.user = angular.copy(data);
    });

    // We retrieve the profile document (user public information)
    happy.loadDoc(selectedUser).then(function(data){
        $scope.fields.profile = angular.copy(data);
        });

    $scope.signin = function (username) {
        username = username?username:$scope.fields.user.name;

        happy.action('signin', angular.extend({},$scope.fields.user,{
            doc : "org.couchdb.user:"+username,
          })).then(function(data){
            happy.session();
            $scope.fields.user.password = $scope.fields.user.name = '';
            happy.info("You have been signed in successfully!");
            $modalInstance.dismiss('close');
          },happy.err);
    };

    $scope.submituser = function() {
        var username =selectedUser||$scope.fields.user.name;
        happy.action('user',angular.extend({},$scope.fields.user,{
            doc:"org.couchdb.user:"+username
        })).then(function(data) {
        	if (username === happy.userCtx.name && $scope.fields.user.password) {
	            // relogin with the new password
	            setTimeout(function(){
	                $scope.signin(username);
	                },3000);
        	} else {
                $modalInstance.dismiss('close');
            }
            happy.success(data);
        },happy.err);
    };

    $scope.submitprofile = function() {
        happy.action('profile',angular.extend({},$scope.fields.profile,{
            doc:selectedUser
        })).then(function(data) {
            happy.success(data);
            $modalInstance.dismiss('close');
        },happy.err);
    };

    $scope.submit = function(act) {
    	switch(act) {
    		default:
                $('#myForm').attr('action','');
                var tab = 'submit'+(act||$scope.selectedTab.split('-')[1]);
                if (typeof $scope[tab]==='function') 
                    $scope[tab]();
    			break;
    	}
    };

    $scope.cancel = function () {
        $modalInstance.dismiss('cancel');
    };    

}]).directive('userPanel', function(happy,$modal){
    return {
        restrict: 'A',
        link: function(scope, element){
            var userPanel = function(){
                var sTab = $(this).attr('selected-tab')||'tab-login';
                var sUser =  $(this).attr('selected-username')||null;

                var modalInstance = $modal.open({
                    templateUrl: "common/partials/userPanel.html",
                    controller: 'UserController',
                    resolve: {
                        selectedTab : function(){return sTab},
                        selectedUser : function(){return sUser}
                    }
                });

                modalInstance.result.then(function (selectedItem) {
                    }, function () {
                        //$log.info('Modal dismissed at: ' + new Date());
                }); 
            };

            element.on('click', userPanel);

            scope.$on('requestUserPanel', function(){
                userPanel();
            });
        }
    }
});
