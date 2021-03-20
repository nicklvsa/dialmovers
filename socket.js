const WebSocket = require('ws');

// userID:{connection: WebSocket(), pin: number}
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

const movePlayer = (userID, direction) => {
    const gamePin = mappedUsers[userID].pin;
    const socket = mappedUsers[userID].connection;

    socket.send(JSON.stringify({
        'payload_type': 'game:move',
        'payload': {
            'user_id': userID,
            'game_id': gamePin,
            'direction': direction,
        },
    }));
};

module.exports = {
    handleEvents, joinGame, movePlayer, mappedUsers,
};