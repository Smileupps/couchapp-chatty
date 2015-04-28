exports.exec = function(req,params,doc,caller){
    var v = require("lib/utils").utils(req), caller=caller||{}, msg = caller.msg||'Your message has been dispatched!', isNew = true;
    var parties = req.id.toLowerCase().split("|");

    v.shouldBeLogged();
    if (!doc) {
        v.assert(req.id.toLowerCase()===req.id,"Request id must be lowercase",400);
        // checks on request id. Username must be ordered in id, in order to uniquely identifies a conversation between two parties
        v.assert(parties.length==2,"Invalid request id",400);
        v.assert(parties[0]!=parties[1],"Can't start a chat with yourself",400);
        v.assert(parties[0]<parties[1],"Usernames in request id must be lexicographically ordered",400);
    } 

    v.assert(v.isRole("backend")
        ||v.isGranted(parties[0])
        ||v.isGranted(parties[1]), "Not enough privileges on this chat", 401);

    v.assert(params.msg && typeof params.msg ==="string" && params.msg.length>0, "Msg parameter cannot be null", 400);
    // escape the message from malicous code
    v.sameEscaped(params.msg, "Message");

    if (!doc) {
        doc = {
            _id : req.id,
            grants : {},
            history : [],
            ts_create : v.now(),
            type:'chat'
        }
    }
    for (var i in parties) doc.grants[parties[i]]=parties[i];
    doc.grants[req.userCtx.name]=req.userCtx.name;
    doc.history.push({
        msg :params.msg,
        u : req.userCtx.name,
        ts:v.now()
    })
    doc.history = doc.history.slice(-10); // we took only the last 10 messages

    return [doc,v.response({ok:true,msg:msg},isNew?201:200)];
};