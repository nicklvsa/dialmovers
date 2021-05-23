const http = require('http');
const express = require('express');
const MessagingResponse = require('twilio').twiml.MessagingResponse;
const VoiceResponse = require('twilio').twiml.VoiceResponse;
const { handleEvents, mappedUsers, joinGame, movePlayer } = require('./socket');

const port = 8080;
const app = express();

app.get('/voice', async (req, res) => {
    const twiml = new VoiceResponse();

    const userID = `${req.query['Caller']}:caller`.toLowerCase();

    let recaller = false;
    let enteredGamePin = false;
    let firstPass = true;
    let hangup = false;

    if (mappedUsers[userID] && mappedUsers[userID].pin && mappedUsers[userID].pin !== null) {
        enteredGamePin = true;
        recaller = true;
    }

    if (req.query['Digits']) {
        const digits = req.query['Digits'].toString();
        let direction = null;

        if (mappedUsers[userID] && mappedUsers[userID] !== null) {
            if (!digits || digits.length <= 0 || digits.length > 1) {
                if (digits.includes('*')) {
                    if (mappedUsers[userID]) {
                        if (mappedUsers[userID].connection) {
                            mappedUsers[userID].connection.close();
                            mappedUsers[userID].connection = null;
                        }

                        delete mappedUsers[userID];
                    }

                    twiml.say('Removing your game session!');
                } else {
                    twiml.say('Please only enter on digit at a time!');
                }

                res.writeHead(200, {
                    'Content-Type': 'text/xml',
                });
                res.end(twiml.toString());
    
                return;
            }

            switch (digits) {
                case '2':
                    direction = 'UP';
                    break;
                case '0':
                case '8':
                    direction = 'DOWN';
                    break;
                case '4':
                    direction = 'LEFT';
                    break;
                case '6':
                    direction = 'RIGHT';
                    break;
                default:
                    hangup = true;
                    break;
            }
    
            if (!hangup) {
                movePlayer(userID, direction);

                twiml.say(`
                    Moving ${direction}
                `);
            }

            if (mappedUsers[userID] && mappedUsers[userID].pin && mappedUsers[userID].pin !== null) {
                enteredGamePin = true;
            }

            firstPass = false;
        } else {
            twiml.say(`Setting your game code to ${digits.toString().split('').join(' ')}.`);
            mappedUsers[userID] = {};
            mappedUsers[userID].pin = digits;
            enteredGamePin = true;

            if (!mappedUsers[userID].connection) {
                handleEvents(userID, (socket) => {
                    mappedUsers[userID].connection = socket;
                    joinGame(socket, userID);
                });
            } else {
                joinGame(mappedUsers[userID].connection, userID);
            }
        }
    } else {
        twiml.say(`
            Get ready!
        `);
    }

    if (hangup) {
        twiml.say(`
            You selected an invalid move, goodbye.
        `);

        res.writeHead(200, {
            'Content-Type': 'text/xml',
        });
        res.end(twiml.toString());

        return;
    }

    const gatherer = twiml.gather({
        action: '/voice',
        method: 'GET',
    });

    if (!enteredGamePin) {
        gatherer.say('Enter your game pin.');
    } else {
        if (firstPass) {
            if (recaller) {
                gatherer.say('Thanks for coming back to play, rejoining your previous game.');
            }

            gatherer.say('Remember, use 2 for up, 8 for down, 4 for left, and 6 for right.');
        } else {
            gatherer.say('Choose your next move.');
        }
    }

    res.writeHead(200, {
        'Content-Type': 'text/xml',
    });
    res.end(twiml.toString());
});

app.get('/check', (req, res) => {
    res.send('Status check: OK');
});

http.createServer(app).listen(port, () => {
    console.log(`Waiting for incoming messages on port ${port}...`);
});