exports.exec = function(req,params,doc,caller){
  var v = require("lib/utils").utils(req), caller=caller||{}, msg = caller.msg||"Profile updated successfully.", isNew = false;
  v.shouldBeLogged();

  v.assert(v.isRole('backend') || req.id === req.userCtx.name, "You are not the owner of this profile doc!",401);
  v.assert(!params.url || v.isUrl(params.url),'Url not valid',400);

  var isNew = !doc;
  if (isNew) { // insert
      var doc = { 
        _id : req.id,
        u : req.id,
        type :'profile',
        ts_create : v.now()
      };
  }  

  v.sameEscaped(params.name,"Name");
  v.sameEscaped(params.desc,"Description");

  doc.name = params.name||doc.name||'Anonymous';
  doc.url = params.url||doc.url||'';
  doc.desc = params.desc||doc.desc||'No description';
  doc.ts_lastupd = v.now();

  return [doc,v.response({ok:true, msg:msg}),doc?200:201];
};