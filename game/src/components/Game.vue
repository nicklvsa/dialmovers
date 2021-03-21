<template>
  <div class="game-container">
    <h3 class="game-id-text" v-if="gameID !== ''">Game ID: {{ gameID }}</h3>
    <div class="data-container">
      <input :disabled="phoneField" type="number" placeholder="Your phone number: " v-model="userID" />
      <button type="button" @click="handleConnection" :disabled="!userID || userID === ''">{{ connectionTitle }}</button>
      <p>
         Show Event History <input type="checkbox" v-model="showEventHistory">
      </p>
    </div>
    <div class="content-container">
      <canvas 
        ref="game" 
        width="800" 
        height="600"
        class="game-canvas"
        v-if="userID !== '' && socket"
      >
      </canvas>
      <button type="button" @click="showHelp" class="help-btn">Help / Info</button> 
      <div class="web-term" v-if="showEventHistory">
        <h3>Event History</h3>
        <div class="web-term-content">
          <div v-for="(event, idx) in events" :key="idx">
            <h5 class="event-log" :style="{'background-color': event.color}">[{{ event.type }}]: {{ event.message }}</h5>
          </div>
        </div>
      </div>
    </div> 
    <h4>Red Square = Enemy</h4>
    <h4>Green Square = You</h4>
  </div>
</template>

<script>
export default {
  name: 'Game',
  data() {
    return {
      userID: '',
      gameID: '',
      socket: {},
      context: {},
      // {userID: '', x: 0, y: 0}
      positions: [],
      events: [],
      phoneField: false,
      showEventHistory: false,
      gameSpeed: 20,
      connectionTitle: 'Connect!',
    };
  },
  watch: {
    positions: {
      handler(vals) {
        this.context.clearRect(0, 0, this.$refs.game.width, this.$refs.game.height);
        if (!vals || vals.length <= 0) {
          alert('All players have disconnected!');
        } else {
          for (const val of vals) {
            val.updatePos(val.x, val.y);
          }
        }
      },
      deep: true,
    }
  },
  methods: {
    showHelp() {
      alert('To connect your phone, dial into this number: +1(484)255-3747.\nWhen entering your phone number into the text box above, do NOT include the "+1,(),-" characters!\n\nNOTE: This game is still under development!');
    },
    handleConnection() {
      if (this.socket.readyState !== WebSocket.CLOSED && this.connectionTitle === 'Disconnect!') {
        this.connectionTitle = 'Connect!';
        this.phoneField = false;
        this.socket.close();
      } else {
        if (this.userID.length !== 10) {
          alert('You must enter a valid 10 digit phone number!');
          return;
        }

        const url = `${process.env.VUE_APP_WS_URL}/${this.formatUserID()}`;
        this.connectionTitle = 'Disconnect!';
        this.socket = new WebSocket(url);
        this.phoneField = true;

        if (this.gameID === '') {
          this.gameID = this.randomGameID();
        }

        this.socket.addEventListener('message', (event) => {
          const response = JSON.parse(event.data);

          switch (response.payload_type) {
            case 'connect':
              this.events.push({
                type: 'Connect',
                color: 'green',
                message: `New user ${response.payload.user_id} has connected!`,
              });
              if (response.payload.user_id === this.formatUserID()) {
                console.log('joining game...');
                this.joinGame(this.gameID);
              }
              break;
            case 'disconnect':
              this.events.push({
                type: 'Disconnect',
                color: 'red',
                message: `User ${response.payload.user_id} has disconnected!`,
              });
              this.positions.forEach((val, i) => {
                if (val.user_id === response.payload.user_id) {
                  this.positions.splice(i, 1);
                }

                val.updatePos(val.x, val.y);
              });

              break;
            case 'game:join':
              this.events.push({
                type: 'Join',
                color: 'green',
                message: `User ${response.payload.user_id} has joined game ${response.payload.game_id}!`,
              });
              if (this.isCaller(response.payload.user_id)) {
                this.$nextTick(() => { 
                  this.context = this.$refs.game.getContext('2d');

                  const pos = {
                    x: 100,
                    y: 100,
                    user_id: response.payload.user_id,
                    you: true,
                    updatePos: (newX, newY) => {
                      this.context.fillStyle = "#009933";
                      this.context.fillRect(newX, newY, 20, 20);
                    },
                  };

                  this.context.clearRect(0, 0, this.$refs.game.width, this.$refs.game.height);
                  this.context.fillStyle = "#009933";
                  this.context.fillRect(pos.x, pos.y, 20, 20);

                  for (const old of this.positions) {
                    if (old.user_id != response.payload.user_id) {
                      old.updatePos(old.x, old.y);
                    }
                  }

                  this.positions.push(pos);
                });
              } else {
                // all other users
                this.$nextTick(() => {
                  this.context = this.$refs.game.getContext('2d');   

                  const pos = {
                    x: 100,
                    y: 100,
                    user_id: response.payload.user_id,
                    you: false,
                    updatePos: (newX, newY) => {
                      this.context.fillStyle = "#FF0000";
                      this.context.fillRect(newX, newY, 20, 20);
                    },
                  };
                    
                  this.context.clearRect(0, 0, this.$refs.game.width, this.$refs.game.height);
                  this.context.fillStyle = "#FF0000";
                  this.context.fillRect(pos.x, pos.y, 20, 20);

                  for (const old of this.positions) {
                    if (old.user_id != response.payload.user_id) {
                      old.updatePos(old.x, old.y);
                    }
                  }

                  this.positions.push(pos);
                });
              }
              break;
            case 'game:move':
              this.events.push({
                type: 'Move',
                color: 'blue',
                message: `User ${response.payload.user_id} moved ${response.payload.direction}`,
              });
              if (this.isCaller(response.payload.user_id)) {
                this.$nextTick(() => {
                  if (this.context) {
                    const direction = response.payload.direction.toString().toLowerCase();

                    for (const pos of this.positions) {
                      if (pos.user_id === response.payload.user_id) {
                        switch (direction) {
                          case 'up':
                            pos.y -= this.gameSpeed;
                            break;
                          case 'down':
                            pos.y += this.gameSpeed;
                            break;
                          case 'left':
                            pos.x -= this.gameSpeed;
                            break;
                          case 'right':
                            pos.x += this.gameSpeed;
                            break;
                        }
                      }
                    }
                  }
                });
              } else {
                // moving other user
                this.$nextTick(() => {
                  if (this.context) {
                    const direction = response.payload.direction.toString().toLowerCase();

                    for (const pos of this.positions) {
                      if (pos.user_id === response.payload.user_id) {
                        switch (direction) {
                          case 'up':
                            pos.y -= this.gameSpeed;
                            break;
                          case 'down':
                            pos.y += this.gameSpeed;
                            break;
                          case 'left':
                            pos.x -= this.gameSpeed;
                            break;
                          case 'right':
                            pos.x += this.gameSpeed;
                            break;
                        }
                      }
                    }
                  }
                });
              }
              break;
            default:
              break;
          }
        });
      }
    },
    joinGame(gameID) {
      this.socket.send(JSON.stringify({
        payload_type: 'game:join',
        payload: {
          game_id: gameID,
        },
      }));
    },
    formatUserID() {
      return `+1${this.userID}:client`;
    },
    isCaller(callerID) {
      const strippedCaller = callerID.split(':');
      return (strippedCaller[0] === `+1${this.userID}` && strippedCaller[1] === 'caller');
    },
    randomGameID() {
      return (Math.floor(Math.random() * 100000) + 1).toString();
    },
  },
}
</script>

<style scoped>
  canvas {
    margin-bottom: 20px;
  }

  .game-container {
    display: flex;
    flex-direction: column;
  }

  .data-container {
    display: flex;
    align-items: center;
    text-align: center;
    justify-content: space-between;
    margin-bottom: 20px;
  }

  .content-container {
    display: flex;
    flex-direction: column;
  }

  .web-term {
    text-align: center;
    border: 1px solid black;
  }

  .event-log {
    margin-top: 5px;
    margin-bottom: 5px;
  }

  .game-canvas {
    border: 1px solid black;
  }

  .help-btn {
    font-size: 12px;
  }

  .game-id-text {
    text-align: center;
  }
</style>
