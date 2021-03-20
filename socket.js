const WebSocket = require('ws');

// userID:{conneted: boolean, pin: number}
const mappedUsers = {};

const connect = (userID) => {
    const url = `ws://localhost:8081/ws/${userID}`;
    return new WebSocket(url);
};

const handleEvents = (userID, cb) => {
    const socket = connect(userID);

    socket.on('open', () => {
        cb(socket);
    });

    socket.on('message', (message) => {

    });
}

const joinGame = (socket, userID) => {
    const gamePin = mappedUsers[userID].pin;

    socket.send(JSON.stringify({
        'payload_type': 'game:join',
        'payload': {
            'user_id': userID,
            'game_id': gamePin,
        },
    }));
};

module.exports = {
    handleEvents, joinGame, mappedUsers,
};