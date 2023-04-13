
var game = new Phaser.Game(800, 600, Phaser.CANVAS, 'phaser-example', { preload: preload, create: create, update: update, render: render });


function initializeGame() {
    game = new Phaser.Game(800, 600, Phaser.AUTO, 'gameCanvas', { preload: preload, create: create, update: update });
}


function preload() {

    game.load.image('bullet', '/static/assets/sprites/shmup-bullet.png');
    game.load.image('ship', '/static/assets/sprites/ship.png');
    game.load.image('background', '/static/assets/background');
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

    sprite = this.add.sprite(400, 300, 'ship');

    sprite.anchor.set(0.5);

    game.physics.arcade.enable(sprite);

    sprite.body.drag.set(70);
    sprite.body.maxVelocity.set(200);

    //  Tell the Weapon to track the 'player' Sprite
    //  With no offsets from the position
    //  But the 'true' argument tells the weapon to track sprite rotation
    weapon.trackSprite(sprite, 0, 0, true);

    cursors = this.input.keyboard.createCursorKeys();

    fireButton = this.input.keyboard.addKey(Phaser.KeyCode.SPACEBAR);

}

function update() {

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

    if (fireButton.isDown) {
        weapon.fire();
    }

    game.world.wrap(sprite, 16);

}

function render() {

    weapon.debug();

}