function(head, req) {
    try {
        /* if your user indexing key(the one passed within the request) is not intended to be found within the first element of the roles array, you need to modify the following assignment */

        var loggeduser = (req.userCtx 
            && req.userCtx.roles
            && req.userCtx.roles.length>0
            && typeof req.userCtx.roles[0]=="string")?req.userCtx.roles[0]:false;

        if (loggeduser && loggeduser===(req.query.k||true)) {

            start({
                code : 200
            });

            send('{"results":[');
            var i=0;
            while (row = getRow()) {
                send((i++>0?",":"")+JSON.stringify({doc:row.doc}));
            }
            send('],"last_seq":'+req.info.update_seq+'}');

        } else {
            throw {
                code:401,
                body:JSON.stringify({
                    "error":"unauthorized",
                    "reason":"You are not authorized to access this db."
                })
            }
        }
    } catch(ex){
        start({
            code : ex.code,
            headers: {"Content-Type" : "text/json"}
        });
        send(ex.body);  
    }   
}