/*
200 - OK                Request completed successfully.
201 - Created           Document created successfully.
202 - Accepted          Request has been accepted, but the corresponding operation may not have completed. This is used for background operations, such as database compaction.
304 - Not Modified      The additional content requested has not been modified. This is used with the ETag system to identify the version of information returned.
400 - Bad Request       Bad request structure. The error can indicate an error with the request URL, path or headers. Differences in the supplied MD5 hash and content also trigger this error, as this may indicate message corruption.
401 - Unauthorized      The item requested was not available using the supplied authorization, or authorization was not supplied.
403 - Forbidden         The requested item or operation is forbidden.
404 - Not Found         The requested content could not be found. The content will include further information, as a JSON object, if available. The structure will contain two keys, error and reason. For example:
405 - Resource Not Allowed      A request was made using an invalid HTTP request type for the URL requested. For example, you have requested a PUT when a POST is required. Errors of this type can also triggered by invalid URL strings.
406 - Not Acceptable            The requested content type is not supported by the server.
409 - Conflict                  Request resulted in an update conflict.
412 - Precondition Failed                   The request headers from the client and the capabilities of the server do not match.
415 - Bad Content Type                      The content types supported, and the content type of the information being requested or submitted indicate that the content type is not supported.
416 - Requested Range Not Satisfiable       The range specified in the request header cannot be satisfied by the server.
417 - Expectation Failed                    When sending documents in bulk, the bulk load operation failed.
500 - Internal Server Error                 The request was invalid, either because the supplied JSON was invalid, or invalid information was supplied as part of the request.


*/


// a library for validations
// over time we expect to extract more helpers and move them here.
// a library for validations
// over time we expect to extract more helpers and move them here.
exports.utils = function(req) {
    var v = {};

    v.getSettingsFromRoles = function(roles) {
        var ret = null;
        for (var i in roles){
            try {
                ret = JSON.parse(roles[i]);
                if (typeof ret == "object") return ret;
            }catch(ex){}
        }
        return {
            rep:0
        };
    };

    v.setSettingsInUserDoc = function(userdoc,newconfig) {
        var added=false,config=null;
        for (var i in userdoc.roles){
            try {
                config = JSON.parse(userdoc.roles[i]);
                if (typeof config == "object") {
                    userdoc.roles[i] = JSON.stringify(newconfig);
                    added=true;
                    break;
                }
            }catch(ex){}
        }
        if (!added) userdoc.roles.push(JSON.stringify(newconfig));
        return userdoc;
    };

    v.getParams = function(){
        try {              
            return JSON.parse(req.body);
        } catch(ex) {
            v.assert(false,"request body must be a json document",600);
        }
    };

    v.getUserid = function(){
        var split = req.id.split(":");
        v.assert(req.id.indexOf('org.couchdb.user:')===0 && split.length==2,"Id must be in the form \"org.couchdb.user:your-userid\"",401);
        return split[1];
    };

    v.buildMailTrigger = function(params) {
        return {    
            start  : v.now(),
            params : params,
            type   : 'sendemail'
        };
    };
    
    v.getUsername = function() {
        return req.userCtx.name;
    };
    
    v.assert = function(should, message, code) {
        code = code || 400;
        if (!should) {
            switch (code) {
                case 409: 
                    throw(v.response({error:"conflict", reason: message},code));
                case 404:
                    //throw(v.response({error:"not_found", reason: message},code));
                    throw(v.response({error:"not_found", reason: "missing"},code));
                case 403: 
                    throw(v.response({error:"forbidden", reason: message},code));
                case 401:  
                    throw(v.response({error:"unauthorized", reason: message},code));
                case 200:  
                case 201:  
                    throw(v.response({ok:true, msg: message},code));
                case 400:  
                default:
                    throw(v.response({error:"bad_request", reason: message},code));
                    break;
            }
        }
    };
    
    v.isGranted = function( usersGranted) {
        if (!(req.userCtx&&req.userCtx.name)) return false;
        var name = req.userCtx.name,
            md5 = v.unique(name,'profile'),
            granted=false;
        if (usersGranted) {
            if (typeof usersGranted === "string") {
                granted |= usersGranted === name || usersGranted === md5;
            } else {
                for (var i in usersGranted) {
                    granted |= usersGranted.indexOf(name)>=0 || usersGranted.indexOf(md5)>=0 ;
                }
            }
        }
        return granted;
    };
    
    v.shouldBeGranted = function( usersGranted) {
        v.assert(v.isGranted(usersGranted),"You haven't required privilege to perform this action",401);
    };

    v.unique = function(val,type) {
        var md5 = require("lib/md5").hex;
            type=type||"";
        return md5(type+val);
    };
    
    v.now = function(){
        return new Date().getTime();
    };

    v.response = function(jsonrsp,httpcode) {
        return {
            "code": httpcode||200,
            "headers" : {
                "Content-Type" : "application/json",
            },
            "body" : JSON.stringify(jsonrsp)
        };
    };

    v.isLogged = function() {
        return req.userCtx 
            && req.userCtx.name 
            && req.userCtx.name.length > 0;
    };

    v.shouldBeLogged = function() {
        v.assert(v.isLogged(),"You must be logged in",401);
    };

    v.isAdmin = function() {
        return req.userCtx.roles.indexOf('_admin') != -1
    };

    v.isRole = function(role) {
        return req.userCtx.roles.indexOf(role) != -1
    };

    // this ensures that the date will be UTC, parseable, and collate correctly
    v.dateFormat = function(field) {
        message = "Sorry, '"+field+"' is not a valid date format. Try: 2010-02-24T17:00:03.432Z";
        v.matches(field, /\d{4}\-\d{2}\-\d{2}T\d{2}:\d{2}:\d{2}(\.\d*)?Z/, message);
    };

    v.isUrl = function(s){
        return /(http|ftp|https):\/\/[\w-]+(\.[\w-]+)+([\w.,@?^=%&amp;:\/~+#-]*[\w@?^=%&amp;\/~+#-])?$/.test(s)
    };
    
    v.isEmail = function(email) {
        return /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(email);
    };
    
    v.isFakeEmail = function(email) {
        var res = new RegExp(".+@(.+)","i").exec(email);
        return res.length>0 && "|0-mail.com|0815.ru|0clickemail.com|0wnd.net|0wnd.org|10minutemail.com|20minutemail.com|2prong.com|30minutemail.com|33mail.com|3d-painting.com|4warding.com|4warding.net|4warding.org|60minutemail.com|675hosting.com|675hosting.net|675hosting.org|6url.com|75hosting.com|75hosting.net|75hosting.org|7tags.com|9ox.net|a-bc.net|afrobacon.com|ajaxapp.net|amilegit.com|amiri.net|amiriindustries.com|anonbox.net|anonymbox.com|antichef.com|antichef.net|antispam.de|baxomale.ht.cx|beefmilk.com|binkmail.com|bio-muesli.net|bobmail.info|bodhi.lawlita.com|bofthew.com|brefmail.com|broadbandninja.com|bsnow.net|bugmenot.com|bumpymail.com|casualdx.com|centermail.com|centermail.net|chogmail.com|choicemail1.com|cool.fr.nf|correo.blogos.net|cosmorph.com|courriel.fr.nf|courrieltemporaire.com|cubiclink.com|curryworld.de|cust.in|dacoolest.com|dandikmail.com|dayrep.com|deadaddress.com|deadspam.com|despam.it|despammed.com|devnullmail.com|dfgh.net|digitalsanctuary.com|discardmail.com|discardmail.de|disposableaddress.com|disposableemailaddresses:emailmiser.com|disposeamail.com|disposemail.com|dispostable.com|dm.w3internet.co.ukexample.com|dodgeit.com|dodgit.com|dodgit.org|donemail.ru|dontreg.com|dontsendmespam.de|drdrb.com|dump-email.info|dumpandjunk.com|dumpmail.de|dumpyemail.com|e4ward.com|email60.com|emaildienst.de|emailias.com|emailigo.de|emailinfive.com|emailmiser.com|emailsensei.com|emailtemporario.com.br|emailto.de|emailwarden.com|emailx.at.hm|emailxfer.com|emz.net|enterto.com|ephemail.net|etranquil.com|etranquil.net|etranquil.org|explodemail.com|fake-box.com|fakeinbox.com|fakeinformation.com|fastacura.com|fastchevy.com|fastchrysler.com|fastkawasaki.com|fastmazda.com|fastmitsubishi.com|fastnissan.com|fastsubaru.com|fastsuzuki.com|fasttoyota.com|fastyamaha.com|filzmail.com|fizmail.com|fr33mail.info|frapmail.com|front14.org|fux0ringduh.com|garliclife.com|get1mail.com|get2mail.fr|getonemail.com|getonemail.net|ghosttexter.de|girlsundertheinfluence.com|gishpuppy.com|gowikibooks.com|gowikicampus.com|gowikicars.com|gowikifilms.com|gowikigames.com|gowikimusic.com|gowikinetwork.com|gowikitravel.com|gowikitv.com|great-host.in|greensloth.com|gsrv.co.uk|guerillamail.biz|guerillamail.com|guerillamail.net|guerillamail.org|guerrillamail.biz|guerrillamail.com|guerrillamail.de|guerrillamail.net|guerrillamail.org|guerrillamailblock.com|h.mintemail.com|h8s.org|haltospam.com|hatespam.org|hidemail.de|hochsitze.com|hotpop.com|hulapla.de|ieatspam.eu|ieatspam.info|ihateyoualot.info|iheartspam.org|imails.info|inboxalias.com|inboxclean.com|inboxclean.org|incognitomail.com|incognitomail.net|incognitomail.org|insorg-mail.info|ipoo.org|irish2me.com|iwi.net|jetable.com|jetable.fr.nf|jetable.net|jetable.org|jnxjn.com|junk1e.com|kasmail.com|kaspop.com|keepmymail.com|killmail.com|killmail.net|kir.ch.tc|klassmaster.com|klassmaster.net|klzlk.com|koszmail.pl|kulturbetrieb.info|kurzepost.de|letthemeatspam.com|lhsdv.com|lifebyfood.com|link2mail.net|litedrop.com|lol.ovpn.to|lookugly.com|lopl.co.cc|lortemail.dk|lr78.com|m4ilweb.info|maboard.com|mail-temporaire.fr|mail.by|mail.mezimages.net|mail2rss.org|mail333.com|mail4trash.com|mailbidon.com|mailblocks.com|mailcatch.com|maildrop.cc|maileater.com|mailexpire.com|mailfreeonline.com|mailin8r.com|mailinater.com|mailinator.com|mailinator.net|mailinator2.com|mailincubator.com|mailme.ir|mailme.lv|mailmetrash.com|mailmoat.com|mailnator.com|mailnesia.com|mailnull.com|mailshell.com|mailsiphon.com|mailslite.com|mailzilla.com|mailzilla.org|mbx.cc|mega.zik.dj|meinspamschutz.de|meltmail.com|messagebeamer.de|mierdamail.com|mintemail.com|moburl.com|moncourrier.fr.nf|monemail.fr.nf|monmail.fr.nf|msa.minsmail.com|mt2009.com|mx0.wwwnew.eu|mycleaninbox.net|mypartyclip.de|myphantomemail.com|myspaceinc.com|myspaceinc.net|myspaceinc.org|myspacepimpedup.com|myspamless.com|mytrashmail.com|neomailbox.com|nepwk.com|nervmich.net|nervtmich.net|netmails.com|netmails.net|netzidiot.de|neverbox.com|no-spam.ws|nobulk.com|noclickemail.com|nogmailspam.info|nomail.xl.cx|nomail2me.com|nomorespamemails.com|nospam.ze.tc|nospam4.us|nospamfor.us|nospamthanks.info|notmailinator.com|nowmymail.com|nurfuerspam.de|nus.edu.sg|nwldx.com|objectmail.com|obobbo.com|oneoffemail.com|onewaymail.com|online.ms|oopi.org|opentrash.com|ordinaryamerican.net|otherinbox.com|ourklips.com|outlawspam.com|ovpn.to|owlpic.com|pancakemail.com|pimpedupmyspace.com|pjjkp.com|politikerclub.de|poofy.org|pookmail.com|privacy.net|proxymail.eu|prtnx.com|punkass.com|putthisinyourspamdatabase.com|qq.com|quickinbox.com|rcpt.at|re-gister.com|recode.me|recursor.net|regbypass.com|regbypass.comsafe-mail.net|rejectmail.com|rklips.com|rmqkr.net|rppkn.com|rtrtr.com|s0ny.net|safe-mail.net|safersignup.de|safetymail.info|safetypost.de|sandelf.de|saynotospams.com|selfdestructingmail.com|sendspamhere.com|sharklasers.com|shiftmail.com|shitmail.me|shortmail.net|sibmail.com|skeefmail.com|slaskpost.se|slopsbox.com|smellfear.com|snakemail.com|sneakemail.com|sofimail.com|sofort-mail.de|sogetthis.com|soodonims.com|spam.la|spam.su|spam4.me|spamavert.com|spambob.com|spambob.net|spambob.org|spambog.com|spambog.de|spambog.ru|spambox.info|spambox.irishspringrealty.com|spambox.us|spamcannon.com|spamcannon.net|spamcero.com|spamcon.org|spamcorptastic.com|spamcowboy.com|spamcowboy.net|spamcowboy.org|spamday.com|spamex.com|spamfree24.com|spamfree24.de|spamfree24.eu|spamfree24.info|spamfree24.net|spamfree24.org|spamgourmet.com|spamgourmet.net|spamgourmet.org|spamherelots.com|spamhereplease.com|spamhole.com|spamify.com|spaminator.de|spamkill.info|spaml.com|spaml.de|spammotel.com|spamobox.com|spamoff.de|spamslicer.com|spamspot.com|spamthis.co.uk|spamthisplease.com|spamtrail.com|speed.1s.fr|supergreatmail.com|supermailer.jp|suremail.info|tagyourself.com|teewars.org|teleworm.com|tempalias.com|tempe-mail.com|tempemail.biz|tempemail.com|tempemail.net|tempinbox.co.uk|tempinbox.com|tempmail.it|tempmail2.com|tempmailer.com|tempomail.fr|temporarily.de|temporarioemail.com.br|temporaryemail.net|temporaryforwarding.com|temporaryinbox.com|thanksnospam.info|thankyou2010.com|thisisnotmyrealemail.com|throwawayemailaddress.com|tilien.com|tmailinator.com|tradermail.info|trash-amil.com|trash-mail.at|trash-mail.com|trash-mail.de|trash-me.com|trash2009.com|trashemail.de|trashmail.at|trashmail.com|trashmail.de|trashmail.me|trashmail.net|trashmail.org|trashmail.ws|trashmailer.com|trashymail.com|trashymail.net|trillianpro.com|turual.com|twinmail.de|tyldd.com|uggsrock.com|upliftnow.com|uplipht.com|venompen.com|veryrealemail.com|viditag.com|viewcastmedia.com|viewcastmedia.net|viewcastmedia.org|webm4il.info|wegwerfadresse.de|wegwerfemail.de|wegwerfmail.de|wegwerfmail.net|wegwerfmail.org|wetrainbayarea.com|wetrainbayarea.org|wh4f.org|whatpaas.com|whyspam.me|willselfdestruct.com|winemaven.info|wronghead.com|wuzup.net|wuzupmail.net|www.e4ward.com|www.gishpuppy.com|www.mailinator.com|wwwnew.eu|xagloo.com|xemaps.com|xents.com|xmaily.com|xoxy.net|yep.it|yogamaven.com|yopmail.com|yopmail.fr|yopmail.net|you-spam.com|ypmail.webarnak.fr.eu.org|yuurok.com|zehnminutenmail.de|zippymail.info|zoaxe.com|zoemail.org|".indexOf('|'+res[1]+'|')>=0;
    };

    v.sameEscaped = function(s,p){
        var pname = p?' in "'+p+'" parameter':'';
        v.assert(v.escapeHtml(s||"")===(s||""),"Invalid characters"+pname,400);
    };

    v.escapeHtml = function (s)
    {
        s = ('' + s); /* Coerce to string */
        s = s.replace(/&/g, '&amp;');
        s = s.replace(/</g, '&lt;');
        s = s.replace(/>/g, '&gt;');
        s = s.replace(/"/g, '&quot;');
        s = s.replace(/'/g, '&#39;');
        return s;
    };

    return v;
};
