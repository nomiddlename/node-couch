process.mixin(GLOBAL, require("./mjsunit"));
process.mixin(GLOBAL, require("../../module/node-couch"));

function unwantedError(result) {
	throw(new Error("Unwanted error" + JSON.stringify(result)));
}

var result;

CouchDB.activeTasks().addCallback(function(response) {
	result = response;
}).addErrback(unwantedError).wait();

assertInstanceof(result, Array);
