/*
Copyright (c) 2009 Hagen Overdick

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
*/

var sys = require('sys'),
    http = require('http'),
		promise = require('./promise');

try {
	var log = require('./log4js-node').getLogger('couch');
} catch (e) {
	//no log4js? let's define a little replacement
	var log = {
		debug: function(message) {
			if (process.ENV['NODE_DEBUG'] > 0) {
				sys.debug(message);
			}
		}
	}
}

var clients = {};

function cache_client(port, host) {
	var key = [port, host];
	var client = clients[key];
	if (client) {
		return client;
	} else {
		return clients[key] = http.createClient(port, host);
	}
}

function _interact(verb, path, successStatus, options, port, host) {
  verb = verb.toUpperCase();
	options = options || {};
	var request, deferred = new promise.Deferred();
	
	var client = cache_client(port, host);
	var requestPath = path + encodeOptions(options);
	log.debug("COUCHING " + requestPath + " -> " + verb);
	
	if (options.keys) {
		options.body = {keys: options.keys};
	}
	
	if (options.body) {
		if (verb === "GET") {
			verb = "POST";
		}
		var requestBody = toJSON(options.body);
		request = client.request(verb, requestPath, [["Content-Length", requestBody.length], ["Content-Type", "application/json"]]);
		request.sendBody(requestBody, "utf8");
	} else {
		request = client.request(verb, requestPath);
	}
	request.addListener("response", function(response) {
		var responseBody = "";
		response.setBodyEncoding("utf8");
		
		response.addListener("data", function(chunk) {
			responseBody += chunk;
		});
		
		response.addListener("end", function() {
			log.debug("COMPLETED " + requestPath + " -> " + verb);

			responseBody = JSON.parse(responseBody);
			if (response.statusCode === successStatus) {
				deferred.emitSuccess(responseBody);
			} else {
				deferred.emitError(responseBody);
			}
		});
	});
	request.close();
	return deferred.promise;
}

function encodeOptions(options) {
  	var result = [];
  	if (typeof(options) === "object" && options !== null) {
    	for (var name in options) {
			if (options.hasOwnProperty(name)) {
				if (name === "request" || name === "error" || name === "success" || name === "body" || name === "keys") {
					continue;
				}
				
				var value = options[name];
	      		
				if (name == "key" || name == "startkey" || name == "endkey") {
	      			value = toJSON(value);
				}
				
		      	result.push(encodeURIComponent(name) + "=" + encodeURIComponent(value));
			}
		}
  	}
  	return result.length ? ("?" + result.join("&")) : "";
}

function toJSON(obj) {
    return obj !== null ? JSON.stringify(obj) : null;
}

var CouchDB = {
	defaultPort : 5984,
	defaultHost : "127.0.0.1",
	debug : true,
	
	activeTasks: function(options) {
		return _interact("get", "/_active_tasks", 200, options, CouchDB.defaultPort, CouchDB.defaultHost);
	},
	
	allDbs : function(options) {
		return _interact("get", "/_all_dbs", 200, options, CouchDB.defaultPort, CouchDB.defaultHost);	
	},
	
	generateUUIDs : function(options) {
		options = options || {};
		if (!options.count) {
			options.count = 100;
		}
		
		var promiseWrapper = new process.Promise();
		var promise = _interact("get", "/_uuids", 200, options, CouchDB.defaultPort, CouchDB.defaultHost);
		promise.addCallback(
			function(result) { promiseWrapper.emitSuccess(result.uuids); }
		).addErrback(
			function(error) { promiseWrapper.emitError(error); }
		);
		return promiseWrapper;
	},
	
	db : function(name, port, host) {
		return {
			name : name,
			uri  : "/" + encodeURIComponent(name) + "/",
			port : port || CouchDB.defaultPort,
			host : host || CouchDB.defaultHost,

			interact : function(verb, path, successStatus, options, suppressPrefix) {
				if (!suppressPrefix) {
					path = this.uri + path;
				}
				return _interact(verb, path, successStatus, options, this.port, this.host);
			},
			
			compact : function(options) {
				return this.interact("post", "_compact", 202, options);
			},
			
			create : function(options) {
				return this.interact("put", "", 201, options);
			},
			
			drop : function(options) {
				return this.interact("delete", "", 200, options);
			},
			
			info : function(options) {
				return this.interact("get", "", 200, options);				
			},

			allDocs : function(options) {
				return this.interact("get", "_all_docs", 200, options);
			},

			openDoc : function(docId, options) {
				var path;
				if (typeof docId === "string") {
					path = docId;				
				} else {
					path = "_all_docs";
					options.body = {
						keys : docId
					};				
				}
				return this.interact("get", path, 200, options); // interact will override get to post when needed
			},

			saveDoc : function(doc, options) {
				options = options || {};
				options.body = doc;
				var promise, promiseWrapper = new process.Promise();
				
				doc = doc || {};
				if (doc._id === undefined) {
					promise = this.interact("post", "", 201, options);
				} else {
					promise = this.interact("put", doc._id, 201, options);
				}
				
				promise.addCallback(function(result) {
					if (!result.ok) {
						promiseWrapper.emitError(result);
					} else {
						doc._id = result.id;
						doc._rev = result.rev;
						promiseWrapper.emitSuccess(doc);
					}
				}).addErrback(function (error) { promiseWrapper.emitError(error); });

				return promiseWrapper;
			},

			removeDoc : function(doc, options) {
				options = options || {};
				options.rev = doc._rev;

				var promise, promiseWrapper = new process.Promise();
				promise = this.interact("delete", doc._id, 200, options);
				promise.addCallback(function(result) {
					if (!result.ok) {
						promiseWrapper.emitError(result);
					} else {
						delete doc._rev;
						promiseWrapper.emitSuccess(doc);
					}
				}).addErrback(function(error) { promiseWrapper.emitError(error); });

				return promiseWrapper;
			},

			view : function(name, options) {
				name = name.split('/');
				this.interact("get", "_design/" + name[0] + "/_view/" + name[1], 200, options);
			}
		}	
	}
};

exports.CouchDB = CouchDB;
