var
	sys = require('sys'),
	assert = require('assert'),
	couch = require('../module/node-couch').CouchDB,
	logging = require('../module/log4js-node');

var log = logging.getLogger('test.allDbs');

logging.addAppender(logging.consoleAppender());

function unwantedError(result) {
	throw(new Error("Unwanted error" + JSON.stringify(result)));
}

couch.allDbs().then(function(result) {
	log.debug(sys.inspect(result));
	assert.ok(result instanceof Array);
	for (var ii = 0; ii < result.length; ii++) {
		assert.equal("string", typeof result[ii]);
	}	
}, unwantedError);

