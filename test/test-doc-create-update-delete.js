process.mixin(GLOBAL, require("./mjsunit"));
process.mixin(GLOBAL, require("../../module/node-couch"));

function unwantedError(result) {
	throw(new Error("Unwanted error" + JSON.stringify(result)));
}

var db;
var doc;
var id;
var rev;

CouchDB.generateUUIDs({	count : 1 }).addCallback(withUUIDs).addErrback(unwantedError).wait();

function withUUIDs(uuids) {
	db = CouchDB.db("test" + uuids[0]);
	db.create().addCallback(withDB).addErrback(unwantedError).wait();
}

function withDB() {
	doc = {};
	db.saveDoc(doc).addCallback(afterSave).addErrback(unwantedError).wait();
}

function afterSave(returnVal) {
	assertEquals(doc, returnVal, "should return the doc");
	assertEquals(typeof doc._id, "string");
	
	id = doc._id;
	rev = doc._rev;
	doc.foo = "bar";
	db.saveDoc(doc).addCallback(afterUpdate).addErrback(unwantedError).wait();
}

function afterUpdate(returnVal) {
	assertEquals(doc, returnVal, "should return the doc");
	assertEquals(typeof doc._id, "string");
	assertFalse(doc._rev === rev, "rev did not update");
	assertEquals(id, doc._id, "doc id changed");
	
	db.addAttachment(doc, attachment, "text/plain").addCallback(afterAttachment).addErrback(unwantedError).wait();
}

function afterAttachment(returnVal) {
	
	db.removeDoc(doc).addCallback(afterRemove).addErrback(unwantedError).wait();
}

function afterRemove(returnVal) {
	assertEquals(doc, returnVal, "did not return the doc");

	assertTrue(doc._rev === undefined, "did not remove the rev");
	assertEquals(id, doc._id, "changed the id");
	
	db.drop().addCallback(afterDrop).addErrback(unwantedError).wait();
}

function afterDrop() {
	db = "success";
}

assertEquals("success", db, "Please check the chain, last callback was never reached");
