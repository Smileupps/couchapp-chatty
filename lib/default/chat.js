exports.exec = function(req,params,doc,caller){
    return require("lib/chat/chat").exec(req,params,doc,{});
};