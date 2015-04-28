# couchapp-chatty

Chatty is a couchapp linked to the [Smileupps Chatty Tutorial](https://www.smileupps/couchapp-tutorial-chatty), to learn building **an instant-messaging web application**, exclusively built on Javascript, HTML and CSS, using **Apache CouchDB as [all-in-one web app server](https://www.smileupps/couchdb-all-in-one-web-app-server)**, to deliver all presentation, business logic and data layers typical of a multi-tier architecture.

Chatty includes:

* a **frontend for administration activities** (user management / chat moderation)
* a **frontend for regular users, intended for chatting**: users only see their own conversations
* a **secure server side API**, stored as a [Couchapp](https://www.smileupps.com/couchapps), implementing business rules and role based read/write ACLs

Chatty features:

* **frontend access is restricted** to authorized users only
* users have **access to their own data only**
* administration UI is restricted to administrators only
* frontend **users are created by administrators**, using the admin UI
* **administrators can manage(insert/update/delete) all entities** in the database (users, profiles, chat)
* a secure server side API implements custom business rules with **user/role based ACLs** for read, insert, update and delete operations
* updates to documents are automatically **pushed in real-time** to granted users, via long-polling

# Installation

## The easy, fast install

1. Install [Chatty upp](https://www.smileupps.com/store/apps/chatty-couchapp-tutorial) from Smileupps App Store
2. Wait for your activation e-mail 

## Manual install

**Prerequisites**

* Apache CouchDB: you can download it from the [CouchDB official homepage](http://couchdb.apache.org) or use Smileupps [free CouchDB Hosting service](https://www.smileupps.com/couchdb-hosting)

**Install**

1. If it's still in Admin Party, secure your CouchDB instance, by creating your own admin user. Click on *Fix this* in Futon's bottom-right corner
1. Download this couchapp to your local disk
1. Using your preferred [Couchapp Deployment tool](https://www.smileupps.com/wiki), upload your couchapp folder to your remote CouchDB instance, **using *chatty* as database name.**
1. Choose two domains to serve public UI and admin UI, such as *chattypublic.yourdomain.com* and *chattyadmin.yourdomain.com*  
1. Adjust your DNS records, or */etc/hosts* file, or *C:\Windows\System32\drivers\etc\hosts* file , to let these domains point directly to your CouchDB instance
		127.0.0.1  chattypublic.yourdomain.com
		127.0.0.1  chattyadmin.yourdomain.com
        
	Use your CouchDB Hosting provider ip, if you are using an Hosted service
1. In your CouchDB configuration
	1. in *vhosts* section create two new entries:

			[vhosts]
			chattypublic.yourdomain.com = /chatty/_design/app/_rewrite/CONFIGSECRET/frontend/
			chattyadmin.yourdomain.com = /chatty/_design/app/_rewrite/CONFIGSECRET/backend/
	where *CONFIGSECRET* is the same as your *couch_httpd_auth->secret* CouchDB configuration value

	1. disable rewrites by setting *httpd/secure_rewrites* to *false*
1. Create a persistent replication document to continuously replicate users from *chatty* to *_users*

        {
            "source": "chatty",
            "target": "_users",
            "create_target": true,
            "continuous": true,
            "user_ctx": {
                "name": "admin",
                "roles": [
                    "_admin"
                ]
            },
            "owner": "admin"
        }
        
1. Create *chatty* administration user:

        curl -X PUT -k https://couchdb-root-url/chatty/_design/app/_rewrite/CONFIGSECRET/backend/user/org.couchdb.user:chatty -d "{\"name\":\"chatty\",\"password\":\"chatty\"}"


