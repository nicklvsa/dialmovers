const WebSocket = require('ws');

const mappedUsers = {};

const connect = () => {
    const url = 'ws://localhost:8081/ws';
    return new WebSocket(url);
};

const handleEvents = () => {
    const socket = connect();

    socket.on('open', () => {
        socket.send(JSON.stringify({
            'type': 'define_users',
            'users': mappedUsers,
        }));
    });

    socket.on('message', (message) => {

    });
}

module.exports = {
    handleEvents, mappedUsers,
};