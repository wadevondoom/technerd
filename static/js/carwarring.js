// velocityFromRotation() can be called like a plain function.
const VelocityFromRotation = Phaser.Physics.Arcade.ArcadePhysics.prototype.velocityFromRotation;

class Racecar extends Phaser.Physics.Arcade.Image {
    throttle = 0;

    configure() {
        this.angle = -90;

        this.body.angularDrag = 120;
        this.body.maxSpeed = 768;

        this.body.setSize(64, 64, true);
    }

    update(delta, cursorKeys) {
        const { left, right, up, down } = cursorKeys;

        if (up.isDown) {
            this.throttle += 0.5 * delta;
        }
        else if (down.isDown) {
            this.throttle -= 1.5 * delta;
        }

        this.throttle = Phaser.Math.Clamp(this.throttle, -64, 1024);

        if (left.isDown) {
            this.body.setAngularAcceleration(-360);
        }
        else if (right.isDown) {
            this.body.setAngularAcceleration(360);
        }
        else {
            this.body.setAngularAcceleration(0);
        }

        VelocityFromRotation(this.rotation, this.throttle, this.body.velocity);

        this.body.maxAngular = Phaser.Math.Clamp(90 * this.body.speed / 1024, 0, 90);
    }
}

class MainScene extends Phaser.Scene {
    preload() {
        this.load.image('ground', '/static/assets/carwars/sprites/ground.jpg');
        this.load.image('car', '/static/assets/carwars/sprites/two-way.png');
    }

    create() {
        console.log("MainScene create");

        this.ground = this.add.tileSprite(0, 0, config.width, config.height, 'ground').setOrigin(0, 0).setScrollFactor(0);

        this.car = new Racecar(this, 256, 512, 'car');
        this.add.existing(this.car);
        this.physics.add.existing(this.car);
        this.car.configure();

        this.cursorKeys = this.input.keyboard.createCursorKeys();

        this.cameras.main.startFollow(this.car, true, 0.05, 0.05);

        this.input.keyboard.on('keydown-F', () => {
            this.toggleFullscreen();
        });
    }

    shutdown() {
        this.input.keyboard.off('keydown-F', this.toggleFullscreen, this);
    }

    toggleFullscreen() {
        if (this.scale.isFullscreen) {
            this.scale.stopFullscreen();
        } else {
            this.scale.startFullscreen();
        }
    }

    update(time, delta) {
        console.log("MainScene update");

        const { scrollX, scrollY } = this.cameras.main;

        this.ground.setTilePosition(scrollX, scrollY);

        this.car.update(delta, this.cursorKeys);
    }
}

class GameOverScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameOverScene' });
    }

    create() {
        console.log("GameOverScene create");

        this.add.text(400, 300, 'Game Over\nPress SPACE to restart', { fontSize: '32px', color: '#ffffff', align: 'center' }).setOrigin(0.5);

        this.input.keyboard.on('keydown-SPACE', () => {
            this.scene.start('MainScene');
        });
    }
}

class StartScene extends Phaser.Scene {
    constructor() {
        super({ key: 'StartScene' });
    }

    create() {
        console.log("StartScene create");

        this.add.text(400, 300, 'Press SPACE to start', { fontSize: '32px', color: '#ffffff' }).setOrigin(0.5);

        this.input.keyboard.once('keydown-SPACE', () => {
            this.scene.start('MainScene');
        });

        this.input.keyboard.on('keydown-F', () => {
            this.toggleFullscreen();
        });
    }

    toggleFullscreen() {
        if (this.scale.isFullscreen) {
            this.scale.stopFullscreen();
        } else {
            this.scale.startFullscreen();
        }
    }
}

const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: true,
        },
    },
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        parent: 'gameCanvas',
        fullscreenTarget: 'gameCanvas',
    },
    scene: [StartScene, MainScene, GameOverScene],
};

const game = new Phaser.Game(config);
