const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

let gameStarted = false;
let gameTime = 30;
let gameInterval;
let timerInterval;

function resizeCanvas() {
  canvas.width = window.innerWidth - 4;
  canvas.height = window.innerHeight - 300 - 4;
  gridSize = Math.floor(canvas.width / 20);
}

resizeCanvas();
window.addEventListener("resize", resizeCanvas);

const speed = 0.67;
const turnSpeed = 0.67;

const players = [
  {
    x: 100,
    y: 100,
    speed: speed,
    color: "red",
    direction: 0,
    moving: true,
    turningLeft: false,
    turningRight: false,
    keys: { left: "a", right: "d" },
    isBot: false,
    blocked: false,
    blockedUntil: 0,
    letter: null,
  },
  {
    x: 200,
    y: 200,
    speed: speed,
    color: "blue",
    direction: 0,
    moving: true,
    turningLeft: false,
    turningRight: false,
    keys: { left: "j", right: "l" },
    isBot: true,
    blocked: false,
    blockedUntil: 0,
    letter: null,
  },
  {
    x: 300,
    y: 300,
    speed: speed,
    color: "green",
    direction: 0,
    moving: true,
    turningLeft: false,
    turningRight: false,
    keys: { left: "q", right: "e" },
    isBot: true,
    blocked: false,
    blockedUntil: 0,
    letter: null,
  },
  {
    x: 400,
    y: 400,
    speed: speed,
    color: "orange",
    direction: 0,
    moving: true,
    turningLeft: false,
    turningRight: false,
    keys: { left: "u", right: "i" },
    isBot: true,
    blocked: false,
    blockedUntil: 0,
    letter: null,
  },
];

function getPlayerType(playerIndex) {
  const playerType = document.querySelector(`input[name="player${playerIndex}"]:checked`).value;
  return playerType === "human" ? false : true;  
}

let occupiedPixels = Array.from(
  { length: Math.ceil(canvas.height / gridSize) },
  () => Array(Math.ceil(canvas.width / gridSize)).fill(null)
);

let powerUps = [];

function spawnPowerUp() {
  const types = ["speed", "slowdown"];
  const type = types[Math.floor(Math.random() * types.length)];

  let x, y;
  let foundSpot = false;

  while (!foundSpot) {
    x = Math.random() * (canvas.width - gridSize);
    y = Math.random() * (canvas.height - gridSize);

    foundSpot = true;
    for (let i = 0; i < players.length; i++) {
      const dist = Math.sqrt(Math.pow(players[i].x - x, 2) + Math.pow(players[i].y - y, 2));
      if (dist < gridSize) {
        foundSpot = false;
        break;
      }
    }
  }

  powerUps.push({ x, y, type, createdAt: Date.now(), used: false });
}

function drawPowerUps() {
  const currentTime = Date.now();
  powerUps.forEach((powerUp, index) => {

    if (currentTime - powerUp.createdAt > 10000) {
      return;
    }

    const color = powerUp.used ? "black" : (
      powerUp.type === "speed" ? "yellow" :
      powerUp.type === "invincibility" ? "cyan" :
      powerUp.type === "reverse" ? "purple" :
      powerUp.type === "invisible" ? "gray" : "pink"
    );

    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(powerUp.x + gridSize / 2, powerUp.y + gridSize / 2, gridSize / 3, 0, Math.PI * 2);
    ctx.fill();
  });
}

function checkPowerUpCollision(player) {
  if (player.blocked) return;

  powerUps = powerUps.filter(powerUp => {
    const dist = Math.sqrt((player.x - powerUp.x) ** 2 + (player.y - powerUp.y) ** 2);

    if (dist < gridSize && !powerUp.used) {  
      activatePowerUp(player, powerUp.type); 
      powerUp.used = true;  
      return false;  
    }

    return true;  
  });
}

function activatePowerUp(player, type) {
  if (type === "speed") {
    player.speed = 2;
    setTimeout(() => player.speed = speed, 5000);
  } else if (type === "invincibility") {
    player.invincible = true;
    setTimeout(() => player.invincible = false, 5000);
  } else if (type === "reverse") {
    [player.keys.left, player.keys.right] = [player.keys.right, player.keys.left];
    setTimeout(() => [player.keys.left, player.keys.right] = [player.keys.right, player.keys.left], 5000);
  } else if (type === "invisible") {
    player.invisible = true;
    setTimeout(() => player.invisible = false, 5000);
  } else if (type === "slowdown") {
    player.speed = 0.1;
    console.log(`Player speed (after slowdown): ${player.speed}`);
    setTimeout(() => player.speed = speed, 5000);
  }
}

const availableLetters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

function assignRandomLetters() {
  const shuffledLetters = availableLetters.sort(() => 0.5 - Math.random());
  players.forEach((player, index) => {
    player.letter = shuffledLetters[index % shuffledLetters.length];
  });
}

assignRandomLetters();

function resetGame() {

  players.forEach((player, index) => {
    player.isBot = getPlayerType(index + 1);  
  });

  players.forEach((player) => {
    player.x = Math.random() * canvas.width;
    player.y = Math.random() * canvas.height;
    player.direction = 0;
    player.moving = true;
    player.turningLeft = false;
    player.turningRight = false;
    player.blocked = false;
    player.blockedUntil = 0;
  });

  gameTime = 30;
  document.getElementById("score").innerHTML = "";
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  document.getElementById("playerSelection").style.display = "none";
  document.getElementById("startButton").style.display = "none";

  clearInterval(gameInterval);
  startTimer();
  gameStarted = true;
  gameLoop();
}

function draw() {
  players.forEach((player) => {
    ctx.fillStyle = player.color;
    ctx.beginPath();
    ctx.arc(
      player.x + gridSize / 2,
      player.y + gridSize / 2,
      gridSize / 2,
      0,
      Math.PI * 2
    );
    ctx.fill();
    ctx.fillStyle = "white";
    ctx.font = "bold 16px Arial";
    ctx.textAlign = "center";
    ctx.fillText(
      player.letter,
      player.x + gridSize / 2,
      player.y + gridSize / 2 + 5
    );
  });

  drawPowerUps();

  const scoreElement = document.getElementById("score");
  scoreElement.innerHTML = `
    <div>
      ${players
        .map((player) => {
          const coverage = calculateCoverage(player.color);
          return `<p>${
            player.color.charAt(0).toUpperCase() + player.color.slice(1)
          }: ${coverage.toFixed(2)}%</p>`;
        })
        .join("")}
      <p>Time: ${gameTime}s</p>
    </div>
  `;
}

function calculateCoverage(color) {
  let covered = 0;
  let total = 0;

  for (let i = 0; i < Math.ceil(canvas.height / gridSize); i++) {
    for (let j = 0; j < Math.ceil(canvas.width / gridSize); j++) {
      total++;
      if (occupiedPixels[i][j] === color) {
        covered++;
      }
    }
  }

  return (covered / total) * 100;
}

function checkCollision(player) {
  return (
    player.x < 0 ||
    player.x + gridSize > canvas.width ||
    player.y < 0 ||
    player.y + gridSize > canvas.height
  );
}

function checkPlayerCollision(player1, player2) {
  const dist = Math.sqrt(
    Math.pow(player2.x - player1.x, 2) + Math.pow(player2.y - player1.y, 2)
  );
  return dist < gridSize;
}

function resolvePlayerCollision(player1, player2) {
  player1.blocked = true;
  player2.blocked = true;

  player1.blockedUntil = Date.now() + 3000;
  player2.blockedUntil = Date.now() + 3000;

  setTimeout(() => {
    player1.blocked = false;
    player2.blocked = false;
  }, 3000);

  const angle1 = Math.atan2(player2.y - player1.y, player2.x - player1.x);
  const angle2 = Math.atan2(player1.y - player2.y, player1.x - player2.x);

  player1.x -= Math.cos(angle1) * 30;
  player1.y -= Math.sin(angle1) * 30;
  player2.x -= Math.cos(angle2) * 30;
  player2.y -= Math.sin(angle2) * 30;
}

function resolveWallCollision(player) {
  if (checkCollision(player)) {
    player.x = Math.max(0, Math.min(player.x, canvas.width - gridSize));
    player.y = Math.max(0, Math.min(player.y, canvas.height - gridSize));
  }
}

function update() {
  players.forEach(player => {
    if (player.blocked && Date.now() < player.blockedUntil) {
      return;
    }

    if (!player.blocked) {
      if (player.turningLeft) {
        player.direction = (player.direction - turnSpeed + 360) % 360;
      }
      if (player.turningRight) {
        player.direction = (player.direction + turnSpeed) % 360;
      }

      if (player.moving) {
        const radians = (player.direction * Math.PI) / 180;
        const prevX = player.x;
        const prevY = player.y;

        player.x += Math.cos(radians) * player.speed;
        player.y += Math.sin(radians) * player.speed;

        ctx.fillStyle = player.color;
        ctx.beginPath();
        ctx.arc(prevX + gridSize / 2, prevY + gridSize / 2, gridSize / 2, 0, Math.PI * 2);
        ctx.fill();

        const gridX = Math.floor(prevX / gridSize);
        const gridY = Math.floor(prevY / gridSize);

        if (!player.blocked) {
          for (let y = -gridSize / 2; y < gridSize / 2; y++) {
            for (let x = -gridSize / 2; x < gridSize / 2; x++) {
              const distance = Math.sqrt(x * x + y * y);
              if (distance <= gridSize / 2) {
                const newX = gridX + Math.floor(x / gridSize);
                const newY = gridY + Math.floor(y / gridSize);

                if (newX >= 0 && newX < Math.ceil(canvas.width / gridSize) && newY >= 0 && newY < Math.ceil(canvas.height / gridSize)) {
                  occupiedPixels[newY][newX] = player.color;
                }
              }
            }
          }
        }

        resolveWallCollision(player);
      }
    }

    checkPowerUpCollision(player);  
  });

  powerUps = powerUps.filter(powerUp => {
    return Date.now() - powerUp.createdAt <= 10000 && !powerUp.used;
  });

  for (let i = 0; i < players.length; i++) {
    for (let j = i + 1; j < players.length; j++) {
      if (checkPlayerCollision(players[i], players[j])) {
        resolvePlayerCollision(players[i], players[j]);
      }
    }
  }

  players.forEach(player => {
    if (player.isBot) {
      const rand = Math.random();
      if (rand < 0.02) player.turningLeft = !player.turningLeft;
      if (rand > 0.98) player.turningRight = !player.turningRight;
    }
  });
}

function displayPlayerInfo() {
  const playersInfoContainer = document.getElementById("playersInfo");
  playersInfoContainer.innerHTML = '';  
  playersInfoContainer.classList.add("player-info-container");

  players.forEach((player, index) => {

    const playerInfo = document.createElement("div");
    playerInfo.classList.add("player-info");

    const colorInfo = document.createElement("p");
    colorInfo.textContent = `Gracz ${index + 1}: Kolor - ${player.color}`;

    const controlInfo = document.createElement("p");
    controlInfo.textContent = `Sterowanie: Lewo - ${player.keys.left}, Prawo - ${player.keys.right}`;

    playerInfo.appendChild(colorInfo);
    playerInfo.appendChild(controlInfo);

    playersInfoContainer.appendChild(playerInfo);
  });
}

document.getElementById("startButton").addEventListener("click", () => {
  resetGame();
});

document.getElementById("playersInfo");

displayPlayerInfo();

document.addEventListener("keydown", (e) => {
  if (gameStarted) {
    players.forEach((player) => {
      if (!player.isBot) {
        if (e.key === player.keys.left) {
          player.turningLeft = true;
        } else if (e.key === player.keys.right) {
          player.turningRight = true;
        }
      }
    });
  }
});

document.addEventListener("keyup", (e) => {
  if (gameStarted) {
    players.forEach((player) => {
      if (!player.isBot) {
        if (e.key === player.keys.left) {
          player.turningLeft = false;
        } else if (e.key === player.keys.right) {
          player.turningRight = false;
        }
      }
    });
  }
});

setInterval(spawnPowerUp, 7000);

function gameLoop() {
  if (gameStarted) {
    update();
    draw();
    requestAnimationFrame(gameLoop);
  }
}

function startTimer() {
  gameInterval = setInterval(() => {
    if (gameTime <= 0) {
      clearInterval(gameInterval);
      pauseGame();
    } else {
      gameTime--;
    }
  }, 1000);
}

function pauseGame() {
  gameStarted = false;
  document.getElementById("startButton").style.display = "block";
  const winner = getWinner();
  alert(
    `Czas minął! Gra została zatrzymana.\nZwycięzca: ${
      winner.color.charAt(0).toUpperCase() + winner.color.slice(1)
    } z wynikiem: ${winner.coverage.toFixed(2)}%`
  );
}

function getWinner() {
  let maxCoverage = 0;
  let winner = null;

  players.forEach((player) => {
    const coverage = calculateCoverage(player.color);
    if (coverage > maxCoverage) {
      maxCoverage = coverage;
      winner = { color: player.color, coverage };
    }
  });

  return winner;
}