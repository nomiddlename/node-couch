process.mixin(GLOBAL, require("./mjsunit"));
process.mixin(GLOBAL, require("../../module/node-couch"));

assertEquals(5984, CouchDB.defaultPort, "default port");
assertEquals("127.0.0.1", CouchDB.defaultHost, "default host");
