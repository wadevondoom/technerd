let canvas = document.getElementById("canvas");
let ctx = canvas.getContext("2d");

let player = {
    x: 50,
    y: 200,
    width: 50,
    height: 50,
    speed: 5,
    jumping: false,
    jumpHeight: 100,
    jumpCount: 0,
    jumpLimit: 2
};

function drawPlayer() {
    ctx.fillStyle = "red";
    ctx.fillRect(player.x, player.y, player.width, player.height);
}

function update() {
    // Move player left or right
    if (keys.left) {
        player.x -= player.speed;
    } else if (keys.right) {
        player.x += player.speed;
    }

    // Jump logic
    if (keys.up && !player.jumping && player.jumpCount < player.jumpLimit) {
        player.jumping = true;
        player.jumpCount++;
    }

    if (player.jumping) {
        player.y -= player.jumpHeight / 10;
        player.jumpHeight--;

        if (player.jumpHeight < 0) {
            player.jumping = false;
            player.jumpHeight = 100;
        }
    }
}

function draw() {
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw player
    drawPlayer();
}

let keys = {
    left: false,
    right: false,
    up: false
};

document.addEventListener("keydown", function (event) {
    if (event.keyCode === 37) {
        keys.left = true;
    } else if (event.keyCode === 39) {
        keys.right = true;
    } else if (event.keyCode === 38) {
        keys.up = true;
    }
});

document.addEventListener("keyup", function (event) {
    if (event.keyCode === 37) {
        keys.left = false;
    } else if (event.keyCode === 39) {
        keys.right = false;
    } else if (event.keyCode === 38) {
        keys.up = false;
    }
});

function gameLoop() {
    update();
    draw();
}

setInterval(gameLoop, 30);
