exports.exec = function(req,params,doc,caller){
  var v = require("lib/utils").utils(req), caller=caller||{}, isNew = false, 
  msg = caller.msg||'Doc "'+(doc.name||doc._id)+'" successfully deleted';

  v.shouldBeLogged();
  // USEFUL FOR DEMO ONLY: prevent backend users from changing their credentials
  v.assert(!(v.isRole('backend') && doc.roles.indexOf('backend')>=0), "DEMO LOCKIN: Backend users cannot modify backend user documents.", 401);
  v.assert(v.isGranted(doc.grants.creator||""), "A user doc can only be deleted by the user who created it", 401);

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