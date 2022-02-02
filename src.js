class EventEmitter {
  constructor() {
    this.listeners = {};
  }

  on(message, listener) {
    if (!this.listeners[message]) {
      this.listeners[message] = [];
    }
    this.listeners[message].push(listener);
  }

  emit(message, payload = null) {
    if (this.listeners[message]) {
      this.listeners[message].forEach((l) => l(message, payload));
    }
  }
}

class GameObjects {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.img = undefined;
    this.type = "";
    this.height = 0;
    this.width = 0;
    this.dead = false;
  }
  draw(ctx) {
    ctx.drawImage(this.img, this.x, this.y, this.width, this.height);
  }
  rectFromgameObject() {
    return {
      top: this.y,
      bottom: this.y + this.height,
      left: this.x,
      right: this.x + this.width,
    };
  }
}
function intersectObject(r1, r2) {
  return !(
    r2.left > r1.right ||
    r2.right < r1.left ||
    r2.top > r1.bottom ||
    r2.bottom < r1.top
  );
}
class Boll extends GameObjects {
  constructor(x, y) {
    super(x, y);
    this.width = this.height = 50;
    this.type = "boll";
    let Id = setInterval(() => {
      if (!this.dead) {
        if (this.x > 0) {
          this.x -= 10;
        } else if (this.x <= 0) {
          this.dead = true;
          eventEmitter.emit("BOLLS_OVER");
        }
      } else {
        clearInterval(Id);
      }
    }, 200);
  }
}

class Ship extends GameObjects {
  constructor(x, y) {
    super(x, y);
    this.width = 130;
    this.height = 80;
    this.type = "ship";
    this.cooldown = 0;
    this.life = 3;
    this.point = 0;
    this.Speed = 0;
  }
  fire() {
    laser = new Laser(this.x + 65, this.y - 4);
    laser1 = new Laser(this.x + 65, this.y + 59);
    gameObjects.push(laser);
    gameObjects.push(laser1);
    this.cooldown = 500;
    let id = setInterval(() => {
      if (this.cooldown > 0) {
        this.cooldown -= 100;
      } else {
        clearInterval(id);
      }
    }, 200);
  }
  canFire() {
    return this.cooldown == 0;
  }

  increasePoint() {
    this.point+=100;
  }
  decreaseLife() {
    this.life--;
    if (this.life == 0) {
      this.dead = true;
    }
  }
}

class Laser extends GameObjects {
  constructor(x, y) {
    super(x, y);
    (this.height = 25), (this.width = 80);
    this.type = "laser";
    this.img = laserImg;
    let id = setInterval(() => {
      if (this.x < myCanvas.width) {
        this.x += 15;
      } else {
        this.dead = true;
        clearInterval(id);
      }
    }, 100);
  }
}
class Explosion extends GameObjects {
  constructor(x, y) {
    super(x, y);
    this.width = this.height = 50;
    this.type = "explosion";
    setTimeout(() => {
      this.dead = true;
    }, 200);
  }
}
function loadImage(path) {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = path;
    img.onload = () => {
      resolve(img);
    };
  });
}

const Messages = {
  KEY_EVENT_UP: "KEY_EVENT_UP",
  KEY_EVENT_DOWN: "KEY_EVENT_DOWN",
  KEY_EVENT_LEFT: "KEY_EVENT_LEFT",
  KEY_EVENT_RIGHT: "KEY_EVENT_RIGHT",
  KEY_EVENT_SPACE: "KEY_EVENT_SPACE",
  SHIP_SPEED_UP: "SHIP_SPEED_UP",
  SHIP_SPEED_DOWN: "SHIP_SPEED_DOWN",
  SHIP_SPEED_ZERO: "SHIP_SPEED_ZERO",
  COLLISION_BOLL_LASER: "COLLISION_BOLL_LASER",
  COLLISION_BOLL_SHIP: "COLLISION_BOLL_SHIP",
  BOLLS_OVER: "BOLLS_OVER",
  GAME_OVER_WIN: "GAME_OVER_WIN",
  GAME_OVER_LOSE: "GAME_OVER_LOSE",
  GAME_START: "GAME_START",
};
class Game {
  constructor() {
    this.end = false;
    this.ready = false;
    eventEmitter.on(Messages.BOLLS_OVER, () => {
      ship.dead = true;
    });
    eventEmitter.on(Messages.GAME_OVER_LOSE, (_, gameLoopId) => {
      game.end = true;
      gameObjects = [];
      clearAnddraw();
      displayMessage("You Lose, Restart Game by pressing Enter key", "#ff1a1a");
      clearInterval(gameLoopId);
    });

    eventEmitter.on(Messages.GAME_OVER_WIN, (_, gameLoopId) => {
      game.end = true;
      gameObjects = [];
      clearAnddraw();
      displayMessage("Hurrah!! You Won ,Restart Game by pressing Enter key", "#66ff66");
      clearInterval(gameLoopId);
    });

    eventEmitter.on(Messages.KEY_EVENT_UP, () => {
      if (ship.y > 10) {
        ship.y -= 10;
      }
    });

    eventEmitter.on(Messages.KEY_EVENT_DOWN, () => {
      if (ship.y < (myCanvas.height-70)) {
        ship.y += 10;
      }
    });

    eventEmitter.on(Messages.KEY_EVENT_LEFT, () => {
      if (ship.x > 10) {
        ship.x -= 5;
      }
    });

    eventEmitter.on(Messages.KEY_EVENT_RIGHT, () => {
      ship.x += 5;
    });

    eventEmitter.on(Messages.KEY_EVENT_SPACE, () => {
      if (ship.canFire()) {
        ship.fire();
      }
    });

    eventEmitter.on(Messages.SHIP_SPEED_ZERO, () => {
      ship.Speed = 0;
    });

    eventEmitter.on(Messages.SHIP_SPEED_UP, () => {
      ship.Speed = -10;
    });

    eventEmitter.on(Messages.SHIP_SPEED_DOWN, () => {
      ship.Speed = 10;
    });

    eventEmitter.on(
      Messages.COLLISION_BOLL_LASER,
      (_, { first: laser, second: boll }) => {
        laser.dead = true;
        boll.dead = true;
        ship.increasePoint();
        const explosion = new Explosion(boll.x, boll.y);
        explosion.img = explosionImg;
        gameObjects.push(explosion);
      }
    );
    eventEmitter.on(
      Messages.COLLISION_BOLL_SHIP,
      (_, { first: ship, second: boll }) => {
        boll.dead = true;
        ship.decreaseLife();
        if (ship.life == 0) {
          ship.dead = true;
          eventEmitter.emit(Messages.GAME_OVER_LOSE, gameLoopId);
        }
      }
    );

    eventEmitter.on(Messages.GAME_START, () => {
      if (game.ready && game.end) {
        runGame();
      }
    });
  }
}

//declaring variables
let bollImg,
  myCanvas,
  ctx,
  shipImg,
  laserImg,
  explosionImg,
  lifeImg,
  ship = new Ship(0, 0),
  boll,
  laser,
  laser1,
  gameLoopId,
  gameObjects = [];
let eventEmitter = new EventEmitter();
let game = new Game();

let onKeyDown = function (e) {
  switch (e.keyCode) {
    case 37:
    case 39:
    case 38:
    case 40: // Arrow keys
    case 32:
      e.preventDefault();
      break; // Space
    default:
      break; // do not block other keys
  }
};

window.addEventListener("keydown", onKeyDown);
window.addEventListener("keydown", (e) => {
  switch (e.keyCode) {
    case 38:
      eventEmitter.emit(Messages.SHIP_SPEED_UP);
      break;
    case 40:
      eventEmitter.emit(Messages.SHIP_SPEED_DOWN);
      break;
  }
});
window.addEventListener("keyup", (evt) => {
  eventEmitter.emit(Messages.SHIP_SPEED_ZERO);
  if (evt.key === "ArrowUp") {
    eventEmitter.emit(Messages.KEY_EVENT_UP);
  } else if (evt.key === "ArrowDown") {
    eventEmitter.emit(Messages.KEY_EVENT_DOWN);
  } else if (evt.key === "ArrowLeft") {
    eventEmitter.emit(Messages.KEY_EVENT_LEFT);
  } else if (evt.key === "ArrowRight") {
    eventEmitter.emit(Messages.KEY_EVENT_RIGHT);
  } else if (evt.keyCode == 32) {
    eventEmitter.emit(Messages.KEY_EVENT_SPACE);
  } else if (evt.key === "Enter") {
    eventEmitter.emit(Messages.GAME_START);
  }
});
function drawGameObjects(ctx) {
  gameObjects.forEach((object) => object.draw(ctx));
}

function updateGameObjects(gameLoopId) {
  const bolls = gameObjects.filter((object) => object.type === "boll");
  const lasers = gameObjects.filter((object) => object.type === "laser");
  // boll laser collisions
  lasers.forEach((l) => {
    bolls.forEach((b) => {
      if (intersectObject(l.rectFromgameObject(), b.rectFromgameObject())) {
        eventEmitter.emit(Messages.COLLISION_BOLL_LASER, {
          first: l,
          second: b,
        });
      }
    });
  });
  // boll ship collisions
  bolls.forEach((b) => {
    if (intersectObject(ship.rectFromgameObject(), b.rectFromgameObject())) {
      eventEmitter.emit(Messages.COLLISION_BOLL_SHIP, {
        first: ship,
        second: b,
      });
    }
  });
  if (ship.dead) {
    eventEmitter.emit(Messages.GAME_OVER_LOSE, gameLoopId);
  } else if (bolls.length === 0) {
    eventEmitter.emit(Messages.GAME_OVER_WIN, gameLoopId);
  }

  if (ship.Speed !== 0) {
    ship.y += ship.Speed;
  }

  gameObjects = gameObjects.filter((object) => !object.dead);
}

function runGame() {
  gameObjects = [];
  createBoll(bollImg);
  createShip(shipImg);
  
  gameLoopId = setInterval(() => {
    clearAnddraw();
    updateGameObjects(gameLoopId);
    displayLife(lifeImg);
    displayPoints();
    drawGameObjects(ctx);
  }, 100);
}
window.onload = async () => {
  myCanvas = document.getElementById("myCanvas");
  ctx = myCanvas.getContext("2d");
  bollImg = await loadImage("imgs/boll.png");
  shipImg = await loadImage("imgs/ship.png");
  laserImg = await loadImage("imgs/Laser.png");
  explosionImg = await loadImage("imgs/explosion.png");
  lifeImg = await loadImage("imgs/heart.png");

  game.ready = true;
  game.end = true;
  clearAnddraw();
  displayMessage("Press ENTER key to start game...", "#C8F7C5");
};


function displayLife(lifeImg){
  ctx.font = "25px Arial";
  ctx.fillStyle = "white";
  ctx.fillText("Remaining Lifes",100,myCanvas.height-60)
  for(let i=0;i<ship.life; i++)
  {
    ctx.drawImage(lifeImg,35+(i*40),myCanvas.height-45,30,30);
  }
}
function displayPoints(){
  ctx.font = "25px Arial";
  ctx.fillStyle = "Yellow";
  ctx.fillText("Points = "+ship.point,myCanvas.width-100,myCanvas.height-40)
}

function clearAnddraw() {
  ctx.clearRect(0, 0, myCanvas.width, myCanvas.height);
  ctx.fillStyle = "#000033";
  ctx.fillRect(0, 0, myCanvas.width, myCanvas.height);
}
function displayMessage(message, color) {
  ctx.font = "30px Arial";
  ctx.fillStyle = color;
  ctx.textAlign = "center";
  ctx.fillText(message, myCanvas.width / 2, myCanvas.height / 2);
}

function createBoll(bollImg) {
  const bollDimension = 50;
  const bollNo = 4;
  const start = myCanvas.width - 70;
  const end = start - (bollNo * bollDimension + 30);
  for (let i = 50; i < 6 * bollDimension + 100; i += bollDimension + 10) {
    for (let j = start; j > end; j -= bollDimension + 10) {
      boll = new Boll(j, i);
      boll.img = bollImg;
      gameObjects.push(boll);
    }
  }
}
function createShip(shipImg) {
  ship = new Ship(50, (myCanvas.height - 50) / 2);
  ship.img = shipImg;
  gameObjects.push(ship);
}

//for instructions
let instruction = document.getElementById("instruction");
window.addEventListener("keyup",(e)=>{
  if(e.key === "Enter")
  {
    instruction.style.display = "none";
    myCanvas.style.display = "block";
  }
})