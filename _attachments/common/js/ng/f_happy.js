var myApp = angular.module('myApp', ['ui.bootstrap']);
myApp.factory('happy', ['$http','$q','$log',function($http,$q,$log){
    var sv=this;
    sv.docsarr = [];
    sv.bykey = {};
    sv.prio = 0;

    var t = {
        firstLoad : false,
        mydocs : sv.docsarr,
        docs : sv.bykey,
        loggedIn: false,
        userCtx : null,
        alreadyasked : {},

        getDocIndex: function(key) {
            for (var i in sv.docsarr){
                if (sv.docsarr[i]._id==key) {
                    return i;
                }
            }
            return -1;
        },

        getAllProfiles:function(){
            var deferred = $q.defer();
            $http({
                method:"GET",
                url: "allprofiles"
            }).success( function (data) {
                if (data && data.rows) {
                    for (var i in data.rows) {
                        t.addOrUpdateToDocs(data.rows[i].doc);
                    }
                }
                deferred.resolve(data);
            }).error(deferred.reject);
            return deferred.promise;
        },

        getChanges : function(callingprio) {
            var wait = 5000,prio=callingprio||1;
            if (prio<(sv.prio||1)) return;

            if (prio>sv.prio) {
                sv.prio=prio;
            } else if (sv.fetching) {
                return;
            }

            if (t.userCtx && t.userCtx.key) {
                sv.fetching=true;
                $http({
                    method:"GET",
                    url: "owndocs/"+t.userCtx.key+"/"+(sv.since||0)
                    //url: t.dashPrefix+"authed/owndocs/"+ since
                }).success( function (data) {
                    sv.fetching=false;
                    if (prio==sv.prio){
                        if (t.userCtx && t.userCtx.key) {
                            t.firstLoad =true;
                            if (data && data.last_seq) {
                                sv.since = data.last_seq;
                                var ch = data.results;
                                for (var i in ch) {
                                    t.addOrUpdateToDocs(ch[i].doc);
                                }
                                wait = 1000;
                            }
                        }
                    }
                    sv.timeoutChanges = setTimeout(function(){t.getChanges(prio);},wait);
                }).error( function(data) {
                    sv.fetching=false;
                    sv.timeoutChanges = setTimeout(function(){t.getChanges(prio);},wait);
                });
            } else {
                t.firstLoad = true;
                sv.timeoutChanges = setTimeout(function(){t.getChanges(prio);},wait);
            }
        },   

        addOrUpdateToDocs : function (doc){
            //if (ch[i].doc.deleted>0 || ch[i].deleted) {
            if (doc._deleted || (doc.deleted && doc.deleted>0) ) { // delete
                t.deleteDoc(doc._id);
            } else { // update or insert
                if (sv.bykey[doc._id]) {
                    angular.extend(sv.bykey[doc._id],doc);
                } else {
                    sv.docsarr.push(doc);
                    sv.bykey[doc._id] = sv.docsarr[sv.docsarr.length-1];
                }
                if (typeof t.loggedIn=="boolean" && t.loggedIn && doc._id=="org.couchdb.user:"+t.userCtx.name) {
                    t.loggedIn = sv.bykey[doc._id];
                }
            }
        },

        deleteDoc : function(docid) {
            if (sv.bykey[docid]) {
                // remove
                delete sv.bykey[docid];
                var pos = t.getDocIndex(docid);
                if (pos >=0) sv.docsarr.splice(pos,1);
            }
        },

        getDoc:function(key){
            if (typeof key!="string") return null;
            var ret = key!=null?(sv.bykey[key]||null):null;
            if (ret==null && !t.alreadyasked[key]) {
                t.alreadyasked[key]=true;
                t.loadDoc(key);
            }
            return ret;
        },

        session : function(wasLogging) {
            var deferred = $q.defer();
            wasLogging = wasLogging || false;

            t.clearAll();
            $http ({
                method:     "GET",
                url:        "_session"
            })
            .success(function(data) {
                var ctx = data.userCtx||null;
                if (ctx && ctx.roles) {
                    if (ctx.name && ctx.roles && ctx.roles.length>0) {
                        t.userCtx = ctx;
                        // "key" is used in every doc.u,doc.grants and views to identify this user.
                        // "key" is passed within "changes" request, to retrieve user documents
                        t.userCtx.key = t.userCtx.roles[0];

                        // getDoc is responsible for the lazy loading the user document
                        t.loggedIn = t.getDoc("org.couchdb.user:"+t.userCtx.name)||true;
                        t.firstLoad =false;
                        t.getChanges(sv.prio+1);
                        deferred.resolve(data);
                    } else {
                        t.action('signout').then(function(){
                            t.userCtx = null;
                            t.loggedIn = false;
                        });
                        deferred.reject('userCtx.roles must have at least one role. The first role in the array is used as key to get changes.');
                    }
                } else {
                    t.firstLoad =true;
                    t.loggedIn = false;
                    deferred.reject("Session returned empty");
                }
            }).error(function(data) {
                t.firstLoad =true;
                t.userCtx = null;
                t.loggedIn = false;
                deferred.reject(data);
            });
            return deferred.promise;
        },
       
        clearAll:function(){
            t.userCtx = null;
            t.loggedIn = false;
            var todelete = Object.keys(sv.bykey);
            for (var i in todelete) {
                t.deleteDoc(todelete[i]);
            }
            t.alreadyasked = {};
            sv.since = 0;
        },

        action: function(action,params) {
            if (typeof t["action"+action]=='function')
                return t["action"+action](params);
            params = params || {};

            var deferred = $q.defer();
            $http({
                method:     "PUT",
                url:        ""+action+(params&&params.doc?"/"+params.doc:""),
                data:   params
            }).success(deferred.resolve).error(deferred.reject);
            return deferred.promise;
        }, 

        actionsignout :  function(succ) {
            var deferred = $q.defer();
            $http({
                method:     "DELETE",
                url:        "_session",
                data:   {}
            })
            .success(function(data) {
                t.clearAll();
                deferred.resolve(data);
            }).error(function(data) {
                deferred.reject(data);
            });
            return deferred.promise;
        },

        loadDoc: function(key,forcereload) {
            var deferred = $q.defer(),
            reload = forcereload || false,
            doc = forcereload?null:t.getDoc(key);

            if (doc != null) {
                deferred.resolve(doc);
            } else {
                $http({
                    method:"GET",
                    url: "doc/"+key
                }).success(function(data){
                    t.addOrUpdateToDocs(data);
                    deferred.resolve(t.getDoc(data._id));    
                }).error(function(data){
                    deferred.reject(data);    
                });
            }

            return deferred.promise;
        },  

        err : function(err) {
            $.bigBox({
                title : err && err.error ? err.error:"Error",
                content : typeof err=="string"?err:(err.reason?err.reason:JSON.stringify(err)),
                color : "#C46A69",
                //timeout: 6000,
                icon : "fa fa-warning shake animated",
                //number : "1",
                timeout : 6000
            });            
        }, 

        success : function(data) {
            $.bigBox({
                title : "Success",
                content : typeof data=="string"?data:(data.msg?data.msg:JSON.stringify(data)),
                color : "#739E73",
                //timeout: 6000,
                icon : "fa fa-check shake animated",
                //number : "1",
                timeout : 6000
            });            
        },

        info : function(data) {
            $.bigBox({
                title : "Info",
                content : typeof data=="string"?data:(data.msg?data.msg:JSON.stringify(data)),
                color : "#3276B1",
                //timeout: 6000,
                icon : "fa fa-info shake animated",
                //number : "1",
                timeout : 6000
            });            
        },

        askConfirm :function(data){
             var deferred = $q.defer();
            // to replace with a better confirmation dialog
            if (window.confirm(data.content)) {
                deferred.resolve();
            } else {
                deferred.reject();
            }
            return deferred.promise;
        },

    };

    //t.performAutoActions();
    t.session();

    return t;

}]);
