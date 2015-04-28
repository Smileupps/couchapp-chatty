exports.exec = function(req,params,doc,caller){
  var v = require("lib/utils").utils(req), caller=caller||{}, isNew = false, 
  msg = caller.msg||'Doc "'+(doc.name||doc._id)+'" successfully deleted';

  v.shouldBeLogged();
  v.assert(v.isRole('backend') || doc.u === req.userCtx.name, "You cannot delete this doc!",401);
  
  var old = doc;
  doc = {
      _id:old._id,
      _rev:old._rev,
      u: old.u,
      grants: old.grants,
      _deleted :true
  };

  return [doc,v.response({ok:true, msg:msg}),!isNew?200:201];
};