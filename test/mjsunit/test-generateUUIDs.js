process.mixin(GLOBAL, require("./mjsunit"));
process.mixin(GLOBAL, require("../../module/node-couch"));

function unwantedError(result) {
	throw(new Error("Unwanted error" + JSON.stringify(result)));
}

var result = 0;

CouchDB.generateUUIDs({	count : 10 }).addCallback(
	function(response) {
		result++;
		assertEquals(10, response.length, "not honoring count");
	}
).addErrback(unwantedError).wait();

CouchDB.generateUUIDs().addCallback(
	function(response) {
		result++;
		assertEquals(100, response.length, "not honoring default count");
	}
).addErrback(unwantedError).wait();

assertEquals(2, result, "Number of callbacks mismatch");
