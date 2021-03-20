<template>
  <div>
    <div class="data-container">
      <h3 v-if="gameID !== ''">Game ID: {{ gameID }}</h3>
      <input :disabled="phoneField" type="text" placeholder="Enter phone number: " v-model="userID" class="userid-field" />
      <button type="button" @click="handleConnection" :disabled="!userID || userID === ''">{{ connectionTitle }}</button>
    </div>
    <canvas 
      ref="game" 
      width="800" 
      height="600"
      class="game-canvas"
      v-if="userID !== '' && socket"
    >
    </canvas>  
    <h5>Red Square = Enemy</h5>
    <h5>Green Square = You</h5>
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
      phoneField: false,
      connectionTitle: 'Connect!',
    };
  },
  watch: {
    positions: {
      handler(vals) {
        this.context.clearRect(0, 0, this.$refs.game.width, this.$refs.game.height);

        for (const val of vals) {
          val.updatePos(val.x, val.y);
        }
      },
      deep: true,
    }
  },
  methods: {
    handleConnection() {
      if (this.socket && this.connectionTitle === 'Disconnect!') {
        this.connectionTitle = 'Connect!';
        this.phoneField = false;
        this.socket.close();
      } else {
        const url = `ws://localhost:8081/ws/${this.formatUserID()}`;
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
              if (response.payload.user_id === this.formatUserID()) {
                console.log('joining game...');
                this.joinGame(this.gameID);
              }
              break;
            case 'disconnect':
              break;
            case 'game:join':
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
              if (this.isCaller(response.payload.user_id)) {
                this.$nextTick(() => {
                  if (this.context) {
                    const direction = response.payload.direction.toString().toLowerCase();

                    for (const pos of this.positions) {
                      if (pos.user_id === response.payload.user_id) {
                        switch (direction) {
                          case 'up':
                            pos.y -=5;
                            break;
                          case 'down':
                            pos.y += 5;
                            break;
                          case 'left':
                            pos.x -= 5;
                            break;
                          case 'right':
                            pos.x += 5
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
                            pos.y -=5;
                            break;
                          case 'down':
                            pos.y += 5;
                            break;
                          case 'left':
                            pos.x -= 5;
                            break;
                          case 'right':
                            pos.x += 5
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

  .data-container {
    margin-bottom: 20px;
  }

  .game-canvas {
    border: 1px solid black;
  }

  .userid-field {
    margin-right: 10px;
  }
</style>
