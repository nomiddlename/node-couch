process.mixin(GLOBAL, require("./mjsunit"));
process.mixin(GLOBAL, require("../../module/node-couch"));

function unwantedError(result) {
	throw(new Error("Unwanted error" + JSON.stringify(result)));
}

var db;

CouchDB.generateUUIDs({ count : 1 }).addCallback(withUUIDs).addErrback(unwantedError).wait();

function withUUIDs(uuids) {
	db = CouchDB.db("test" + uuids[0]);
	db.create().addCallback(withDB).addErrback(unwantedError).wait();
}

function withDB() {
	db.compact().addCallback(afterCompact).addErrback(unwantedError).wait();
}

function afterCompact() {
	db.info().addCallback(withInfo).addErrback(unwantedError).wait();
}

function withInfo(info) {
	assertEquals(db.name, info.db_name);

	db.drop().addCallback(afterDrop).addErrback(unwantedError).wait();
}

function afterDrop() {
	db = "success";
}

assertEquals("success", db, "Please check the chain, last callback was never reached");
