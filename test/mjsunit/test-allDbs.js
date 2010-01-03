process.mixin(GLOBAL, require("./mjsunit"));
process.mixin(GLOBAL, require("../../module/node-couch"));

function unwantedError(result) {
	throw(new Error("Unwanted error" + JSON.stringify(result)));
}

var result;
CouchDB.allDbs().addCallback(function(value) {
	result = value;
}).addErrback(unwantedError).wait();

assertInstanceof(result, Array);
for (var ii = 0; ii < result.length; ii++) {
	assertEquals("string", typeof result[ii]);
}