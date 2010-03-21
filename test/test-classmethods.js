var
	assert = require('assert'),
	couch = require('../module/node-couch').CouchDB,
	logging = require('../module/log4js-node');

var log = logging.getLogger('test.classmethods');
logging.addAppender(logging.consoleAppender());

assert.equal(5984, couch.defaultPort);
assert.equal("127.0.0.1", couch.defaultHost);
log.debug("test passed");
