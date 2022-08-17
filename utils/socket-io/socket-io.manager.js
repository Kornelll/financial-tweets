const socket = require('socket.io');
const appConfig = require('./../../config/appConfig');
const crypto = require('./../crypto');

var lastSocket;
module.exports = {
    connect: (app, port) => {
        connectSocketIO(app, port);
    },

    sendMessage: (data, encrypt) => {
        try {
            if (encrypt) {
                data = { data: crypto.encrypt(JSON.stringify(data), appConfig.SOCKET_IO_SECRET), __encrypted: true };
            }
            lastSocket.emit('new message', data);
            lastSocket.broadcast.emit('new message', data);
        } catch (err) {
            console.log(`error sending/broadcasting socket.io`, err);
        }
    }
}


function connectSocketIO(app, port) {

    console.log("> connecting socket.io: " + port);
    const server = app.listen(port, () => {
        console.log(`> Server started on : ${port} ... (from socket-io)`);
    });
    io = socket.listen(server);

    io.on("connection", (socket) => {
        lastSocket = socket;
        socket.on("disconnect", (data) => {
        })
    });


}