function(doc) {
/*
  Emits data for the first "changes" request requested by the client.
  Emits key value pairs to be passed to the "own_docs_list" list. Within these pairs key is an array and value is 1.

  The key must be an array and its first field must be the indexing key of the requesting user. A user requesting "/owndocs/myuserkey/0" can have access to all documents indexed with "myuserkey" within the first position of the key array.
  Next fields, within the key array, can be used for sorting or extra filtering.
  Why value is always 1? Because for "changes" purposes, using include_docs=true already grants "own_docs_list", to access the entire underlying database document. So we opted to emit a value efficient to store (Probably a boolean value would have been better?!)
*/

// We consider only doc with the "type" attribute set
if (typeof doc.type!=="string") return false; 

var toemit={};
toemit["backend"]=1;
 if ((typeof doc.u)[0]!=="u") {
    toemit[doc.u]=1;
 }
 if ((typeof doc.grants)[0]!=="u"){
    for (var i in (doc.grants||{})){
      if ((typeof doc.grants[i])[0]==="s")
        toemit[doc.grants[i]]=1;
    }
 }
 for (var i in toemit){
   emit([i,doc.ts_create||0],1);
 }
}