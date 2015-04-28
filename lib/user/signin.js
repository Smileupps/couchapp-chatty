exports.exec = function(req,params,doc,caller){

   var v = require("lib/utils").utils(req),
	    caller=caller||{}, 
	    msg = caller.msg||"User successfully authed.", isNew = !doc, 
	    userid=v.getUserid(),
	    pbkdf2 = require("lib/pbkdf2"),
		CryptoJS   = require("lib/hmac-sha1"),
		base64 = require("lib/base64"),
	    hash = "",
	    calc = "",
	    timestamp    = Math.round(v.now()/1000);

    v.assert(doc&&doc.type=="user","Invalid username or password",400);
    v.assert(doc.salt && doc.derived_key && doc.roles,"salt, derived_key or roles not found",400);
    v.assert(req.query && doc.roles.indexOf(req.query.site)>=0,"Not granted on this site",400);

  	v.assert(typeof params.password ==="string","Invalid password. Must be at least 6 characters long",400);

	hash = pbkdf2.pbkdf2(params.password, doc.salt, { keySize: 256/32, iterations: doc.iterations }).toString().substring(0,40);
	v.assert(hash===doc.derived_key,"Incorrect password",401);

    var sessdata = doc.name+":"+timestamp.toString(16).toUpperCase();

    v.assert(req.query.configsecret,"\"configsecret\" query parameter is mandatory. You can define it directly within your domain base path, from your smileupps control panel. Your vhost host must point to /"+req.info.db_name+"/_design/app/_rewrite/CONFIGSECRET/SITE/ where CONFIGSECRET is the value in your \"couch_httpd_auth/secret\" CouchDB config parameter and SITE can be one of [frontend,backend]");
	var configsecret = req.query.configsecret;

    var ret = [];
    hash = CryptoJS.HmacSHA1(sessdata,configsecret+doc.salt).words;
    for (var i in hash) {
    	var v = hash[i], pos = v>=0, last=ret.length;
        for(v=pos?v:v>>>0; v>0; v=Math.floor(v/256)) {
            ret.splice(last, 0, v%256);
        }
    }

    calc = base64.btoa(sessdata+":"+(String.fromCharCode.apply(String,ret)));
    calc = calc.replace(/\//g,'_').replace(/\+/g,'-');

    return [null,
        {
            "code": 200,
            "headers" : {
                "Content-Type" : "application/json",
                "Set-Cookie" : "AuthSession="+calc+"; Version=1; Path=/; HttpOnly"
            },
            "body" : JSON.stringify({ ok:true, msg:msg})
        },
        200
    ];
};
