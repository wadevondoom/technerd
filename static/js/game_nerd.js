var game = new Phaser.Game(800, 600, Phaser.CANVAS, 'phaser-example', { preload: preload, create: create, update: update, render: render });

// At the top of your script
var playerGroup;
var enemyGroup;
var bulletGroup;

const GameState = {
    Start: 0,
    Play: 1,
    GameOver: 2,
};

function preload() {

    game.load.image('bullet', '/static/assets/sprites/bullet.png');
    game.load.image('ship', '/static/assets/sprites/ship.png');
    game.load.image('background', '/static/assets/background.png');
    game.load.image('enemy1', '/static/assets/sprites/braino.png');
    game.load.image('enemy2', '/static/assets/sprites/glitchy.png');
    game.load.image('enemy3', '/static/assets/sprites/malware.png');
    game.load.image('enemy4', '/static/assets/sprites/roguebot.png');
    game.load.image('startButton', '/static/assets/startButton.png');

}

var sprite;
var weapon;
var cursors;
var fireButton;
var background;

let startButton;
let gameOverText;
let scoreText;

let score = 0;
let player;
let hitPoints = 3;
let hitPointsText;

let glitchyEnemy;
let baseSpeedMin = 100;
let baseSpeedMax = 200;
let speedRangeIncrease = 50;

let gameState = GameState.Start;

function create() {

    // Add the background image to the game
    background = game.add.sprite(0, 0, 'background');
    game.physics.startSystem(Phaser.Physics.ARCADE);

    // Initialize collision groups
    playerGroup = game.add.group();
    enemyGroup = game.add.group();
    bulletGroup = game.add.group();

    // Create Player Sprite
    player = game.add.sprite(400, 300, 'ship');
    player.anchor.set(0.5);
    game.physics.arcade.enable(player);
    player.body.drag.set(70);
    player.body.maxVelocity.set(200);

    //  Creates 30 bullets, using the 'bullet' graphic
    weapon = game.add.weapon(30, 'bullet');
    //  The bullet will be automatically killed when it leaves the world bounds
    weapon.bulletKillType = Phaser.Weapon.KILL_WORLD_BOUNDS;
    //  The speed at which the bullet is fired
    weapon.bulletSpeed = 600;
    //  Speed-up the rate of fire, allowing them to shoot 1 bullet every 60ms
    weapon.fireRate = 100;

    // Add player to player group
    playerGroup.add(player);

    // Add bullets to bullet group
    bulletGroup = weapon.bullets;

    // Set collision groups
    playerGroup.setAll('collisionGroup', playerGroup);
    enemyGroup.setAll('collisionGroup', enemyGroup);
    bulletGroup.setAll('collisionGroup', bulletGroup);

    // Add Hit Points Text
    hitPointsText = game.add.text(game.world.width - 16, 16, `Shields: ${hitPoints}`, { fontSize: '24px', fill: '#fff' });
    hitPointsText.anchor.set(1, 0);
    //  Tell the Weapon to track the 'player' Sprite
    //  With no offsets from the position
    //  But the 'true' argument tells the weapon to track sprite rotation
    weapon.trackSprite(player, 0, 0, true);
    cursors = this.input.keyboard.createCursorKeys();
    fireButton = this.input.keyboard.addKey(Phaser.KeyCode.SPACEBAR);


    // Add Start Button
    startButton = game.add.button(game.world.centerX, game.world.centerY, 'startButton', startGame, this);
    startButton.anchor.set(0.5);
    game.world.bringToTop(startButton); // Bring start button to the top

    // Add Game Over Text
    gameOverText = game.add.text(game.world.centerX, game.world.centerY - 50, '', { fontSize: '32px', fill: '#fff' });
    gameOverText.anchor.set(0.5);

    // Add Score Text
    scoreText = game.add.text(16, 16, 'Score:', { fontSize: '24px', fill: '#fff' });
    scoreText.anchor.set(0, 0);

    // Hide player sprite and bullets
    player.visible = false;
    weapon.bullets.visible = false;
}

function createGlitchyEnemy() {

    const offscreenPadding = 50;
    const spawnX = Math.random() < 0.5 ? -offscreenPadding : game.world.width + offscreenPadding;
    const spawnY = Math.floor(Math.random() * (game.world.height - 2 * offscreenPadding)) + offscreenPadding;

    // Calculate speed range based on player score
    const speedMin = baseSpeedMin + Math.floor(score / 1000) * speedRangeIncrease;
    const speedMax = baseSpeedMax + Math.floor(score / 1000) * speedRangeIncrease;
    const speed = game.rnd.integerInRange(speedMin, speedMax);

    // Create new glitchyEnemy with random speed
    glitchyEnemy = game.add.sprite(spawnX, spawnY, 'enemy3');
    glitchyEnemy.anchor.set(0.5);
    game.physics.arcade.enable(glitchyEnemy);
    glitchyEnemy.body.collideWorldBounds = true;
    glitchyEnemy.body.bounce.set(1);
    game.physics.arcade.velocityFromAngle(Math.random() * 360, speed, glitchyEnemy.body.velocity);

    // Add the new glitchyEnemy to the enemy group
    enemyGroup.add(glitchyEnemy);
}



function moveGlitchyEnemy() {
    if (!glitchyEnemy.moveTimer || glitchyEnemy.moveTimer <= 0) {
        const speed = 150;
        const angle = Math.random() * 360;
        game.physics.arcade.velocityFromAngle(angle, speed, glitchyEnemy.body.velocity);
        glitchyEnemy.moveTimer = game.time.now + 1500; // Change direction every 2 seconds
    } else {
        glitchyEnemy.moveTimer -= game.time.elapsed;
    }
}

function killGlitchyEnemy(bullet, enemy) {
    bullet.kill();
    enemy.kill();
    // Add score, sound effects, etc.
    score += 100;
    createGlitchyEnemy();
}

function handlePlayerCollision(player, enemy) {
    if (player.invincible) return; // don't handle collision if player is invincible
    enemy.kill();
    hitPoints -= 1;
    hitPointsText.text = `HP: ${hitPoints}`;
    player.invincible = true;
    game.time.events.add(Phaser.Timer.SECOND * 2, () => {
        player.invincible = false;
    });
    // Play sound effects, add visual feedback, etc.

    // Add a delay before respawning the enemy
    game.time.events.add(Phaser.Timer.SECOND * 1, () => {
        createGlitchyEnemy();
    });
}


function update() {
    switch (gameState) {
        case GameState.Start:

            // Show start button
            startButton.visible = true;

            // Hide game over text and score
            gameOverText.visible = false;
            scoreText.visible = false;

            // Listen for the Enter key to start the game
            if (game.input.keyboard.isDown(Phaser.KeyCode.ENTER)) {
                startGame();
            }

            break;

        case GameState.Play:
            // Show player sprite and bullets
            player.visible = true;
            weapon.bullets.visible = true;

            // Hide start button
            startButton.visible = false;

            // Hide game over text and score
            gameOverText.visible = false;
            scoreText.visible = true;

            // Update player movement
            if (cursors.up.isDown) {
                game.physics.arcade.accelerationFromRotation(player.rotation, 300, player.body.acceleration);
            }
            else {
                player.body.acceleration.set(0);
            }

            if (cursors.left.isDown) {
                player.body.angularVelocity = -300;
            }
            else if (cursors.right.isDown) {
                player.body.angularVelocity = 300;
            }
            else {
                player.body.angularVelocity = 0;
            }

            // Wrap the ship around the screen bounds
            if (player.x < 0) {
                player.x = game.world.width;
            } else if (player.x > game.world.width) {
                player.x = 0;
            }

            if (player.y < 0) {
                player.y = game.world.height;
            } else if (player.y > game.world.height) {
                player.y = 0;
            }

            // Fire bullets
            if (fireButton.isDown) {
                weapon.fire();
            }

            // Update Glitchy movement
            moveGlitchyEnemy();

            // Check for collisions between player and enemies
            game.physics.arcade.collide(playerGroup, enemyGroup, handlePlayerCollision, null, this);

            // Check for collisions between bullets and enemies
            game.physics.arcade.collide(bulletGroup, enemyGroup, killGlitchyEnemy, null, this);

            // Add score
            scoreText.text = `Score: ${score}`;

            // Check game over condition
            if (hitPoints <= 0) {
                endGame();
            }

            break;

        case GameState.GameOver:
            // Hide player sprite and bullets
            player.visible = false;
            weapon.visible = false;

            // Hide start button
            startButton.visible = false;

            // Show game over text and score
            gameOverText.visible = true;
            scoreText.visible = true;

            break;

        default:
            break;
    }
}



function startGame() {
    if (gameState === GameState.GameOver) {
        hitPoints = 3;
        score = 0;
        gameOverText.visible = false;
        scoreText.visible = false;
        startButton.text = 'Start Game';
    }

    gameState = GameState.Play;
    startButton.visible = false;

    // Create a Glitchy
    createGlitchyEnemy();

    // Reset Glitchy's position and movement
    glitchyEnemy.reset(game.world.randomX, game.world.randomY);
    glitchyEnemy.moveTimer = 0;
}


function endGame() {
    gameState = GameState.GameOver;
    weapon.killAll();
    glitchyEnemy.kill();

    gameOverText.text = 'Game Over';
    scoreText.text = `Score: ${score}`;

    gameOverText.visible = true;
    scoreText.visible = true;
    startButton.visible = true;
    startButton.text = 'Play Again?';
}


function render() {

    // weapon.debug();

}