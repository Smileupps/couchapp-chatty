exports.exec = function(req,params,doc,caller){
    return require("lib/profile/profile").exec(req,params,doc,{});
};