
var game = new Phaser.Game(800, 600, Phaser.CANVAS, 'phaser-example', { preload: preload, create: create, update: update, render: render });

const GameState = {
    Start: 0,
    Play: 1,
    GameOver: 2,
};

function initializeGame() {
    game = new Phaser.Game(800, 600, Phaser.AUTO, 'gameCanvas', { preload: preload, create: create, update: update });
}


function preload() {

    game.load.image('bullet', '/static/assets/sprites/shmup-bullet.png');
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

let gameState = GameState.Start;

function create() {

    // Add the background image to the game
    background = game.add.sprite(0, 0, 'background');
    //  Creates 30 bullets, using the 'bullet' graphic
    weapon = game.add.weapon(30, 'bullet');
    //  The bullet will be automatically killed when it leaves the world bounds
    weapon.bulletKillType = Phaser.Weapon.KILL_WORLD_BOUNDS;
    //  The speed at which the bullet is fired
    weapon.bulletSpeed = 600;
    //  Speed-up the rate of fire, allowing them to shoot 1 bullet every 60ms
    weapon.fireRate = 100;
    // Create Player Sprite
    player = game.add.sprite(400, 300, 'ship');
    player.anchor.set(0.5);
    game.physics.arcade.enable(player);
    player.body.drag.set(70);
    player.body.maxVelocity.set(200);

    // Add Hit Points Text
    hitPointsText = game.add.text(game.world.width - 16, 16, `HP: ${hitPoints}`, { fontSize: '32px', fill: '#fff' });
    hitPointsText.anchor.set(1, 0);
    //  Tell the Weapon to track the 'player' Sprite
    //  With no offsets from the position
    //  But the 'true' argument tells the weapon to track sprite rotation
    weapon.trackSprite(player, 0, 0, true);
    cursors = this.input.keyboard.createCursorKeys();
    fireButton = this.input.keyboard.addKey(Phaser.KeyCode.SPACEBAR);
    // Add Collision Detection
    game.physics.arcade.overlap(weapon.bullets, glitchyEnemy, killGlitchyEnemy, null, this);
    // Add Score Text
    scoreText = game.add.text(16, 16, 'Score: 0', { fontSize: '32px', fill: '#fff' });
    // Add Start Button
    startButton = game.add.button(game.world.centerX, game.world.centerY, 'startButton', startGame, this);
    startButton.anchor.set(0.5);

    // Add Game Over Text
    gameOverText = game.add.text(game.world.centerX, game.world.centerY - 50, '', { fontSize: '32px', fill: '#fff' });
    gameOverText.anchor.set(0.5);

    // Add Score Text
    scoreText = game.add.text(game.world.centerX, game.world.centerY + 50, '', { fontSize: '32px', fill: '#fff' });
    scoreText.anchor.set(0.5);

}

function createGlitchyEnemy() {
    glitchyEnemy = game.add.sprite(game.world.randomX, game.world.randomY, 'enemy2');
    glitchyEnemy.anchor.set(0.5);
    game.physics.arcade.enable(glitchyEnemy);
    glitchyEnemy.body.collideWorldBounds = true;
    glitchyEnemy.body.bounce.set(1);
}

function moveGlitchyEnemy() {
    const speed = 150;
    const angle = Math.random() * 360;
    game.physics.arcade.velocityFromAngle(angle, speed, glitchyEnemy.body.velocity);
}

function killGlitchyEnemy(bullet, enemy) {
    bullet.kill();
    enemy.kill();
    // Add score, sound effects, etc.
    score += 100;
    scoreText.text = `Score: ${score}`;
}

function handlePlayerCollision(player, enemy) {
    enemy.kill();
    hitPoints -= 1;
    hitPointsText.text = `HP: ${hitPoints}`;
    // Play sound effects, add visual feedback, etc.
}

function update() {
    switch (gameState) {
        case GameState.Start:
            // Hide player sprite and bullets
            sprite.visible = false;
            weapon.visible = false;

            // Show start button
            startButton.visible = true;

            // Hide game over text and score
            gameOverText.visible = false;
            scoreText.visible = false;

            break;

        case GameState.Play:
            // Show player sprite and bullets
            sprite.visible = true;
            weapon.visible = true;

            // Hide start button
            startButton.visible = false;

            // Hide game over text and score
            gameOverText.visible = false;
            scoreText.visible = false;

            // Update player movement
            if (cursors.up.isDown) {
                game.physics.arcade.accelerationFromRotation(sprite.rotation, 300, sprite.body.acceleration);
            }
            else {
                sprite.body.acceleration.set(0);
            }

            if (cursors.left.isDown) {
                sprite.body.angularVelocity = -300;
            }
            else if (cursors.right.isDown) {
                sprite.body.angularVelocity = 300;
            }
            else {
                sprite.body.angularVelocity = 0;
            }

            // Fire bullets
            if (fireButton.isDown) {
                weapon.fire();
            }

            // Update Glitchy movement
            glitchyEnemy.update();

            // Check collision between bullets and Glitchy
            game.physics.arcade.overlap(weapon.bullets, glitchyEnemy, killGlitchyEnemy, null, this);

            // Check collision between player and Glitchy
            game.physics.arcade.collide(player, glitchyEnemy, handlePlayerCollision, null, this);

            // Check game over condition
            if (hitPoints <= 0) {
                endGame();
            }

            break;

        case GameState.GameOver:
            // Hide player sprite and bullets
            sprite.visible = false;
            weapon.visible = false;

            // Hide start button
            startButton.visible = false;

            // Show game over text and score
            gameOverText.visible = true;
            scoreText.visible = true;

            break;
    }
}


function startGame() {
    gameState = GameState.Play;
    startButton.visible = false;
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
    startButton.events.onInputDown.add(restartGame, this);
}

function restartGame() {
    gameState = GameState.Start;
    hitPoints = 3;
    score = 0;
    gameOverText.visible = false;
    scoreText.visible = false;
    startButton.text = 'Start Game';
}

function render() {

    weapon.debug();

}