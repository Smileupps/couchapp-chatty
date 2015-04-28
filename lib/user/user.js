exports.exec = function(req,params,doc,caller){
    var v = require("lib/utils").utils(req), caller=caller||{}, isNew = !doc, 
      msg = caller.msg||"User "+(isNew?"created":"updated")+" successfully.", userid=v.getUserid();

    v.shouldBeLogged();
    if (isNew) {
      //Only backend users can insert user documents
      v.assert(v.isAdmin()||v.isRole('backend'), "Only backend users can create user documents", 401);
      v.assert(['upgrade','admin','backend','frontend'].indexOf(userid)<0,"Reserved username: overwrite not allowed",400);
      v.assert(/^[a-z][a-z0-9]*$/.test(userid),"Username can contain lowercase alphanumeric characters. First must be an aplha character.",400);
    } else {
      // USEFUL FOR DEMO ONLY: prevent backend users from changing their credentials
      v.assert(!(v.isRole('backend') && doc.roles.indexOf('backend')>=0), "DEMO LOCKIN: Backend users cannot modify backend user documents.", 401);

      // Only owner, creator or server admin can update user documents
      // Therefore: Backend users who has not created the user document, cannot modify it
      v.assert(v.isAdmin() || v.isGranted(doc.grants.creator) || v.isGranted(doc.u), "A user doc can be modified only by server admin, the user who has created it, the owner of the user document itself", 401);
    }

    v.assert(typeof userid == "string" && userid.length >= 3, "Userid too short. Must be at least 3 characters long.",400);
    v.assert(/[a-zA-Z]+[a-zA-Z0-9]*/i.test(userid), "Invalid user id.",400);

    /* remove this comment for mandatory e-mail address
    v.assert(params.email, "E-mail is mandatory", 400);
    //*/


    // Please not the first role, which represents the view indexing key
    // This will be used within doc.u,doc.grants fields and views to identify this user.
    // This value will be also passed within "changes" request, to retrieve user specific documents
    // By default it is set equal to the username of the user
    // You can eventually use another value, like the md5 or sha1 of the username.
    // Admins can extend user roles array to expand their privileges.
    // Try to manually modify a "user" document by adding "backend" as the first element in his roles array.
    // Given "own_docs_view" emits "backend" for every doc, the modified user will see all documents within the db.
    // Please note that any changes to the roles array requires the user to login again.

    if (isNew) {
      doc = {
        _id   : "org.couchdb.user:"+userid,
        u     : userid,
        name  : userid,
        roles : v.isAdmin()?['backend',userid]:[userid,'frontend'],
        grants: {creator:req.userCtx.name},
        type  : 'user',
        ts_create  : v.now(),
        ts_lastupd : v.now()
      };
    }

    var pass = params.password, dontsetpass=false;
    // password has to be set only if the user doc has not yet been created or the password parameter is not empty
    if (!isNew) {
      dontsetpass = typeof pass !=="string" || pass.length == 0;
    }

    if (!dontsetpass) {
      v.assert(typeof pass ==="string" && pass.length >= 6,"Invalid password. Must be at least 6 characters long",400);

      var hash = require("lib/pbkdf2"),salt=v.unique(v.now().toString(),'salt');
      doc.derived_key = hash.pbkdf2(pass,salt, { keySize: 256/32, iterations: 10 }).toString().substring(0,40);
      doc.iterations = 10;
      doc.password_scheme = 'pbkdf2';
      doc.salt = salt;
    }

    /* remove this comment for mandatory e-mail address
    v.assert(params.email, "E-mail is mandatory", 400);
    //*/
    
    // email change is allowed
    if (params.email) {
      v.assert(v.isEmail(params.email), "E-mail is not a valid e-mail address", 400);
      v.assert(!v.isFakeEmail(params.email), "E-mail address is a fake.",400);
      doc.email = params.email;
    }

   return [doc,v.response({ok:true, msg:msg}),doc?200:201];
};