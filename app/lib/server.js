
module.exports = function(app, config, socket) {
    console.log('[express train application listening on %s]', config.port);
    return socket.server.listen(config.port);
}