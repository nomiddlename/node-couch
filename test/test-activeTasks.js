var
	sys = require('sys'),
	assert = require('assert'),
	couch = require('../module/node-couch').CouchDB,
	logging = require('../module/log4js-node');

var log = logging.getLogger('test.activeTasks');
logging.addAppender(logging.consoleAppender());

function unwantedError(result) {
	throw(new Error("Unwanted error" + JSON.stringify(result)));
}

couch.activeTasks().then(
	function(response) {
		assert.ok(response instanceof Array);
		log.debug("test passed");
	},
unwantedError);
