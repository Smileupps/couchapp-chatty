/* TIP: Here we are using the first element of the user roles array to filter records. But we can have used everything within the userCtx object. This means we can eventually store filtering values to check against within the roles array. These filtering values can of course be plain strings, but also json strings containing entire documents, or numbers reflecting user reputation(parseable from string), etc.. */

function(doc, req)
{
  /* if your user indexing key(the one passed within the request) is not intended to be found within the first element of the roles array, you need to modify the following assignment */

  var loggeduser = (req.userCtx 
      && req.userCtx.roles
      && req.userCtx.roles.length>0
      && typeof req.userCtx.roles[0]=="string")?req.userCtx.roles[0]:false;

  /* This check helps preventing not authed or malicious users to submit requests which can be cpu-intensive: we throw an error if the "since" value passed within the request is too far from the actual update_sequence. This allows the changes request to never span the entire database, but start checking from since, only on recent updates. If this exception is catched client side, then the client can submit the "/owndoce/myuserkey/0" view based request, which is very efficient. */

  if (!(loggeduser 
      && loggeduser===(req.query.k||true)
      && Math.abs(parseInt(req.query.since)-req.info.update_seq)<500)) {
      throw "Invalid request";
  }

  // We consider only doc with the "type" attribute set
  if (doc._deleted!==true && typeof doc.type!=="string") return false; 

  /* Here we perform the effective filtering by user. We match loggeduser against grants array and document owner(doc.u) */
  if (loggeduser=="backend") {
    // the role "backend" in first position can see everything
    return true
  } else if ((doc.grants?Object.keys(doc.grants).map(function(k){return doc.grants[k];}):[]).concat(doc.u).indexOf(loggeduser)>=0 ) {
    return true;
  }

  return false;
}