var cj = {

    encAlgorithm: 'aes-256-ctr',

    sessionPath: function (basepath, sessionId) {
        return path.join(basepath, sessionId + '.json');
    },

    sessionId: function (file) {
        return file.substring(0, file.lastIndexOf('.json'));
    },

    getLastAccess: function (session) {
        return session.__lastAccess;
    },

    setLastAccess: function (session) {
        session.__lastAccess = new Date().getTime();
    },
    isExpired: function (session, options) {
        if (!session) return true;

        var ttl = session.cookie && session.cookie.originalMaxAge ? session.cookie.originalMaxAge : options.ttl * 1000;
        return !ttl || cj.getLastAccess(session) + ttl < new Date().getTime();
    }

}
var fs = require('fs-extra');
var path = require('path');
var retry = require('retry');
var writeFileAtomic = require('write-file-atomic');
var crypto = require('crypto');
module.exports = function (session) {
    var Store = session.Store;
    function FileStore(cc) {
        var self = this;

        var options = {path:cc};
        Store.call(self, options);

        function defaults(options) {
            options = options || {};

            var NOOP_FN = function () {
            };

            return {
                path: options.path || './sessions',
                ttl: options.ttl || 3600,
                retries: options.retries || 5,
                factor: options.factor || 1,
                minTimeout: options.minTimeout || 50,
                maxTimeout: options.maxTimeout || 100,
                filePattern: /\.json$/,
                reapInterval: options.reapInterval || 3600,
                reapMaxConcurrent: options.reapMaxConcurrent || 10,
                reapAsync: options.reapAsync || false,
                reapSyncFallback: options.reapSyncFallback || false,
                logFn: options.logFn || console.log || NOOP_FN,
                fallbackSessionFn: options.fallbackSessionFn,
                encrypt: options.encrypt || false
            };
        }
        self.options = defaults(options);
        fs.mkdirsSync(self.options.path);
    }


    FileStore.prototype.__proto__ = Store.prototype;

    FileStore.prototype.get = function (sessionId, callback) {
        var options = this.options;
        console.log(this.options.path);
            var sessionPath = cj.sessionPath(options.path, sessionId);
        console.log(this.options.path);

            var operation = retry.operation({
                retries: options.retries,
                factor: options.factor,
                minTimeout: options.minTimeout,
                maxTimeout: options.maxTimeout
            });

            operation.attempt(function () {
                fs.readFile(sessionPath, 'utf8', function (err, data) {

                    if (!err) {
                        var json;
                        try {
                            json = JSON.parse(options.encrypt ? cj.decrypt(data, sessionId) : data);
                        } catch (err2) {
                            err = err2;
                        }
                        if (!err) {
                            return callback(null, cj.isExpired(json, options) ? null : json);
                        }
                    }

                    if (operation.retry(err)) {
                        options.logFn('[session-file-store] will retry, error on last attempt: ' + err);
                    } else if (options.fallbackSessionFn) {
                        var session = options.fallbackSessionFn(sessionId);
                        cj.setLastAccess(session);
                        callback(null, session);
                    } else {
                        callback(err);
                    }
                });
            });
    };


    FileStore.prototype.set = function (sessionId, session, callback) {
        var options = this.options;
            try {
                cj.setLastAccess(session);

                var sessionPath = cj.sessionPath(options.path, sessionId);
                var json = JSON.stringify(session);
                if (options.encrypt) {
                    json = cj.encrypt(json, sessionId)
                }
                writeFileAtomic(sessionPath, json, function (err) {
                    if (callback) {
                        err ? callback(err) : callback(null, session);
                    }
                });
            } catch (err) {
                if (callback) callback(err);
            }
    };


    FileStore.prototype.touch = function (sessionId, session, callback) {
            try {
                cj.setLastAccess(session);
                var options =  this.options;
                var sessionPath = cj.sessionPath(options.path, sessionId);
                var json = JSON.stringify(session);
                if (options.encrypt) {
                    json = cj.encrypt(json, sessionId)
                }
                writeFileAtomic(sessionPath, json, function (err) {
                    if (callback) {
                        err ? callback(err) : callback(null, session);
                    }
                });
            } catch (err) {
                if (callback) callback(err);
            }
    };

    FileStore.prototype.destroy = function (sessionId, callback) {
        var options = this.options;
            var sessionPath = cj.sessionPath(options.path, sessionId);
            fs.remove(sessionPath, callback);
    };

    FileStore.prototype.length = function (callback) {
        var options = this.options;
            fs.readdir(options.path, function (err, files) {
                if (err) return callback(err);

                var result = 0;
                files.forEach(function (file) {
                    if (options.filePattern.exec(file)) {
                        ++result;
                    }
                });

                callback(null, result);
            });
    };

    FileStore.prototype.clear = function (callback) {
        var options = this.options;
            fs.readdir(options.path, function (err, files) {
                if (err) return callback([err]);
                if (files.length <= 0) return callback();

                var errors = [];
                files.forEach(function (file, i) {
                    if (options.filePattern.exec(file)) {
                        fs.remove(path.join(options.path, file), function (err) {
                            if (err) {
                                errors.push(err);
                            }
                            if (i >= files.length - 1) {
                                errors.length > 0 ? callback(errors) : callback();
                            }
                        });
                    } else {

                        if (i >= files.length - 1) {
                            errors.length > 0 ? callback(errors) : callback();
                        }
                    }
                });
            });
    };


    FileStore.prototype.list = function (callback) {
        var options = this.options;
            fs.readdir(options.path, function (err, files) {
                if (err) return callback(err);

                files = files.filter(function (file) {
                    return options.filePattern.exec(file);
                });

                callback(null, files);
            });
    };

    FileStore.prototype.expired = function (sessionId, callback) {
        var options = this.options;
            cj.get(sessionId, options, function (err, session) {
                if (err) return callback(err);

                err ? callback(err) : callback(null, cj.isExpired(session, options));
            });
    };

    return FileStore;
};
