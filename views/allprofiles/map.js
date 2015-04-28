function(doc) {
/*
  Emits all docs of type profile. This is used to let frontend users, select a public profile as chat target.
*/

  if (doc.type && doc.type === "profile"){
    emit(doc._id,1);
  }
}