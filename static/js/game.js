// game.js

var game = new Phaser.Game(800, 600, Phaser.AUTO, 'gameCanvas', { preload: preload, create: create, update: update });

var player;
var cursors;
var platforms;
var ground;
var background;
var gameOverText;
var restartButton;

function preload() {
    game.load.crossOrigin = 'anonymous';
    game.load.image('player1', '/static/assets/p1.png');
    game.load.image('player2', '/static/assets/p2.png');
    game.load.image('ground', '/static/assets/ground.png');
    game.load.image('background', '/static/assets/background.png');
    game.load.image('startButton', '/static/assets/startButton.png');
}

function create() {
    game.physics.startSystem(Phaser.Physics.ARCADE);
    game.physics.arcade.gravity.y = 1000;

    // Set up the background
    background = game.add.tileSprite(0, 0, game.width, game.height, 'background');
    background.fixedToCamera = true;

    // Set up the ground
    ground = game.add.tileSprite(0, game.height - 173, game.width, 173, 'ground');
    game.physics.arcade.enable(ground);
    ground.body.immovable = true;
    ground.body.allowGravity = false;

    // Set up the player
    player = game.add.sprite(100, game.world.height - 300, 'player1');
    game.physics.arcade.enable(player);
    player.body.collideWorldBounds = true;
    player.anchor.setTo(0.5, 0.5);

    // Create a simple two-frame walking animation
    player.animations.add('walk', ['player1', 'player2'], 10, true);
    player.animations.play('walk');

    // Set up the platforms group
    platforms = game.add.group();
    platforms.enableBody = true;

    // Create custom platforms
    createPlatform(400, 400, 300, 20); // Example platform

    // Set up input for player movement
    cursors = game.input.keyboard.createCursorKeys();

    // Add a start button
    const startButton = game.add.button(game.world.centerX, game.world.centerY, 'startButton', startGame, this);
    startButton.anchor.set(0.5);
}

function createPlatform(x, y, width, height) {
    const platform = game.add.graphics(x, y);
    platform.beginFill(0xffffff);
    platform.lineStyle(2, 0xffffff, 1);
    platform.drawRoundedRect(0, 0, width, height, 10);
    platform.endFill();

    game.physics.arcade.enable(platform);
    platform.body.immovable = true;
    platform.body.allowGravity = false;
    platforms.add(platform);
}

function startGame() {
    game.state.start('MainGame');
}

function gameOver() {
    player.kill(); // Hide the player
    gameOverText = game.add.text(game.world.centerX, game.world.centerY - 100, 'Game Over', { font: '48px Arial', fill: '#ff0000' });
    gameOverText.anchor.set(0.5);

    // Add a restart button
    restartButton = game.add.button(game.world.centerX, game.world.centerY, 'startButton', restartGame, this);
    restartButton.anchor.set(0.5);
}

function restartGame() {
    // Clean up game over elements
    gameOverText.destroy();
    restartButton.destroy();

    // Reset the game state
    game.state.restart();
}

function update() {
    game.physics.arcade.collide(player, ground, gameOver);
    game.physics.arcade.collide(player, platforms);

    // Player movement
    player.body.velocity.x = 200; // Constant horizontal speed
    if (cursors.up.isDown && (player.body.touching.down || player.body.onFloor())) {
        player.body.velocity.y = -500; // Adjust jump height as needed
    }
}

// Define the MainGame state
var MainGame = {
    preload: preload,
    create: create,
    update: update
};

// Add the MainGame state to the game and start with the StartScreen state
game.state.add('MainGame', MainGame);
game.state.start('MainGame');