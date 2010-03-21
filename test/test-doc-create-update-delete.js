var
	assert = require('assert'),
	couch = require('../module/node-couch').CouchDB,
	logging = require('../module/log4js-node');

var log = logging.getLogger('test.doc-crud');
logging.addAppender(logging.consoleAppender());

function unwantedError(result) {
	throw(new Error("Unwanted error" + JSON.stringify(result)));
}

var db;
var doc;
var id;
var rev;

couch.generateUUIDs({	count : 1 }).then(withUUIDs, unwantedError);

function withUUIDs(uuids) {
	db = couch.db("test" + uuids[0]);
	db.create().then(withDB, unwantedError);
}

function withDB() {
	doc = {};
	db.saveDoc(doc).then(afterSave, unwantedError);
}

function afterSave(returnVal) {
	assert.equal(doc, returnVal);
	assert.equal(typeof doc._id, "string");
	
	id = doc._id;
	rev = doc._rev;
	doc.foo = "bar";
	db.saveDoc(doc).then(afterUpdate, unwantedError);
}

function afterUpdate(returnVal) {
	assert.equal(doc, returnVal);
	assert.equal(typeof doc._id, "string");
	assert.notEqual(doc._rev, rev);
	assert.equal(id, doc._id);
	
	db.removeDoc(doc).then(afterRemove, unwantedError);
}

function afterRemove(returnVal) {
	assert.equal(doc, returnVal);

	assert.ok(doc._rev === undefined);
	assert.equal(id, doc._id);
	
	db.drop().then(afterDrop, unwantedError);
}

function afterDrop() {
	log.debug("test passed");
}
