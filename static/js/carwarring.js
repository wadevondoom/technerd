// velocityFromRotation() can be called like a plain function.
const VelocityFromRotation = Phaser.Physics.Arcade.ArcadePhysics.prototype.velocityFromRotation;

class Racecar extends Phaser.Physics.Arcade.Image {
    throttle = 0;

    configure() {
        this.angle = -90;

        this.body.angularDrag = 120;
        this.body.maxSpeed = 1024;

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
        this.ground = this.add.tileSprite(0, 0, config.width, config.height, 'ground').setOrigin(0, 0).setScrollFactor(0);

        this.car = new Racecar(this, 256, 512, 'car');
        this.add.existing(this.car);
        this.physics.add.existing(this.car);
        this.car.configure();

        this.cursorKeys = this.input.keyboard.createCursorKeys();

        this.cameras.main.startFollow(this.car);
    }

    update(time, delta) {
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

        this.add.text(400, 300, 'Game Over\nPress SPACE to restart', { fontSize: '32px', color: '#ffffff', align: 'center' }).setOrigin(0.5);

        // Save score
        fetch('/save_score', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name: playerName,
                score: playerScore
            })
        });

        this.input.keyboard.on('keydown-SPACE', () => {
            this.scene.start('MainScene');
        });
    }
}

class StartScene extends Phaser.Scene {
    constructor() {
        super({ key: 'StartScene' });
        // Increment play count

    }

    create() {
        this.add.text(400, 300, 'Press SPACE to start', { fontSize: '32px', color: '#ffffff' }).setOrigin(0.5);

        this.input.keyboard.on('keydown-SPACE', () => {
            this.scene.start('MainScene');
        });
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
            debug: false,
        },
    },
    scene: [StartScene, MainScene, GameOverScene],
};

const game = new Phaser.Game(config);