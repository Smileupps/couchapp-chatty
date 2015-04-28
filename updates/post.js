function(doc, req) {
    var v = require("lib/utils").utils(req),msg='',isNew=false, path="",module=null,params={};
    try {
        v.assert(req.method == "POST", "Only POST method is allowed.", 400);
        v.assert(req.query&&req.query.action, "Query string parameter \"action\" is mandatory.", 400);

        if (doc) {
            v.assert(doc.type,"Document type not present", 400);
            path = doc.type+"/"+req.query.action;
        } else {
            path = "default/"+req.query.action;
        }
        //path="couchappy";
        //v.assert(false,path,400);
        module = require("lib/"+path);
        v.assert(module && typeof module.exec ==="function", "Invalid action \""+path+"\"",400);
        ret = module.exec(req,params,doc);
        return ret;
    } catch(ex) {
        if (ex.length && ex[1] && ex[1]=="invalid_require_path") {
            return [null,v.response({error:"bad_request", reason: "Invalid document id for action \""+path+"\""},400)];
        }

        if (ex.code) return [null,ex,ex.code];
        return [null,ex];
    }
}