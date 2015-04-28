exports.exec = function(req,params,doc,caller){
    return require("lib/user/user").exec(req,params,doc,{});
};