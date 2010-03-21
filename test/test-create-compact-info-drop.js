var
	assert = require('assert'),
	couch = require('../module/node-couch').CouchDB,
	logging = require('../module/log4js-node');

var log = logging.getLogger('test.create-compact-info-drop');
logging.addAppender(logging.consoleAppender());

function unwantedError(result) {
	throw(new Error("Unwanted error" + JSON.stringify(result)));
}

var db;

couch.generateUUIDs({ count : 1 }).then(withUUIDs, unwantedError);

function withUUIDs(uuids) {
	db = couch.db("test" + uuids[0]);
	db.create().then(withDB, unwantedError);
}

function withDB() {
	db.compact().then(afterCompact, unwantedError);
}

function afterCompact() {
	db.info().then(withInfo, unwantedError);
}

function withInfo(info) {
	assert.equal(db.name, info.db_name);
	db.drop().then(afterDrop, unwantedError);
}

function afterDrop() {
	log.debug("test passed");
}
