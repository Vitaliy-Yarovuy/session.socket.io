module.exports = SessionSockets;

function SessionSockets(io, sessionStore, cookieParser, key) {
  key = typeof key === 'undefined' ? 'connect.sid' : key;
  var sessionSockets = this;

  this.on = function(event, callback) {
    return bind(event, callback, io.sockets);
  };

  this.emit = function() {
    io.sockets.emit.apply(io.sockets, arguments);
  };
      

  this.of = function(namespace) {
    var ns = io.of(namespace);

    return {
      get manager() {
        return ns.manager
      },
      get sockets() {
        return ns.sockets
      },
      authorization: function() {
        ns.authorization.apply(ns, arguments);
        return this;
      },
      emit: function() {
        ns.emit.apply(ns, arguments);
      },
      on: function(event, callback) {
        bind(event, callback, ns);
        return this;
      }
    };
  };

  this.getSession = function(socket, callback) {
    cookieParser(socket.handshake, {}, function (parseErr) {
      sessionStore.load(findCookie(socket.handshake), function (storeErr, session) {
        var err = resolveErr(parseErr, storeErr, session);
        callback(err, session);
      });
    });
  };

  function bind(event, callback, namespace) {
    namespace.on(event, function (socket) {
      sessionSockets.getSession(socket, function (err, session) {
        callback(err, socket, session);
      });
    });
  }

  function findCookie(handshake) {
    if (handshake)
      return (handshake.secureCookies && handshake.secureCookies[key]) ||
             (handshake.signedCookies && handshake.signedCookies[key]) ||
             (handshake.cookies && handshake.cookies[key]);
  }

  function resolveErr(parseErr, storeErr, session) {
    var err = parseErr || storeErr || null;
    if (!err && !session) err = new Error('Could not lookup session by key: ' + key);
    return err;
  }
}
