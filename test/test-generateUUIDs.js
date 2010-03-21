var
	assert = require('assert'),
	couch = require('../module/node-couch').CouchDB,
	logging = require('../module/log4js-node');

var log = logging.getLogger('test.generateUUIDs');
logging.addAppender(logging.consoleAppender());

function unwantedError(result) {
	throw(new Error("Unwanted error" + JSON.stringify(result)));
}

couch.generateUUIDs({	count : 10 }).then(
	function(response) {
		assert.equal(10, response.length);
		log.debug("count test passed.");
	},
	unwantedError
);

couch.generateUUIDs().then(
	function(response) {
		assert.equal(100, response.length);
		log.debug("default count test passed.");
	},
	unwantedError
);
