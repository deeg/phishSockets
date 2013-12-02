
module.exports = function(app, config) {
    var server = require('http').createServer(app),
        io = require('socket.io').listen(server);

    return {server: server, io: io};
}