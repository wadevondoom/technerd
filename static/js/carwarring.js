// velocityFromRotation() can be called like a plain function.
const VelocityFromRotation = Phaser.Physics.Arcade.ArcadePhysics.prototype.velocityFromRotation;

class Racecar extends Phaser.Physics.Arcade.Image {
    throttle = 0;
    hitpoints = 8;
    invulnerable = false; // Add invulnerability flag
    configure() {
        this.angle = -90;

        this.body.angularDrag = 120;
        this.body.maxSpeed = 800;

        this.body.setSize(64, 64, true);
    }

    update(delta, cursorKeys) {
        const { left, right, up, down } = cursorKeys;

        if (up.isDown) {
            this.throttle += 0.6 * delta;
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

// Add this after the Racecar class
class Bombo extends Phaser.Physics.Arcade.Image {
    constructor(scene, x, y, texture) {
        super(scene, x, y, texture);
        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.configure();
    }

    configure() {
        this.angle = -90;
        this.body.angularDrag = 120;
        this.body.maxSpeed = 200; // A bit slower than the player
        this.body.setSize(64, 64, true);
        this.chasing = false;
        this.body.maxSpeed = 300;
        this.body.velocity.setTo(0, 0); // Set initial velocity to zero
        this.acceleration = 25; // Set acceleration for Bombo
    }

    update(delta, target) {
        if (!this.chasing) {
            this.chasing = true;
            this.scene.time.delayedCall(1000, () => {
                this.chasing = false;
                this.x = -100;
                this.y = Phaser.Math.Between(100, 500);
            });
        } else {
            const direction = Phaser.Math.Angle.Between(this.x, this.y, target.x, target.y);
            this.rotation = direction; // Rotate Bombo towards the direction it's traveling

            // Accelerate Bombo towards the target
            this.scene.physics.velocityFromRotation(
                direction,
                Math.min(this.body.speed + this.acceleration * delta, this.body.maxSpeed),
                this.body.velocity
            );
        }
    }
}

class MainScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MainScene' });
    }
    preload() {
        this.load.image('ground', '/static/assets/carwars/sprites/ground.jpg');
        this.load.image('car', '/static/assets/carwars/sprites/two-way.png');
        this.load.image('bombo', '/static/assets/carwars/sprites/bomb-o.png');

    }

    create() {
        this.ground = this.add.tileSprite(512, 512, 1024, 1024, 'ground').setScrollFactor(0, 0);

        this.car = new Racecar(this, 256, 512, 'car');
        this.add.existing(this.car);
        this.physics.add.existing(this.car);
        this.car.configure();

        this.cursorKeys = this.input.keyboard.createCursorKeys();

        this.cameras.main.startFollow(this.car);

        // Add Bombo to the scene
        this.bombo = new Bombo(this, -100, 300, 'bombo');
        this.load.image('bombo', '/static/assets/carwars/sprites/bombo.png');

        // Update the collider between the player and Bombo
        this.physics.add.collider(
            this.car,
            this.bombo,
            (player, bombo) => {
                if (player.invulnerable) return; // Skip if the player is invulnerable

                player.hitpoints -= 1;

                // Make player invulnerable for a short interval
                player.invulnerable = true;
                this.time.delayedCall(1000, () => {
                    player.invulnerable = false;
                });

                const angle = Phaser.Math.Angle.Between(player.x, player.y, bombo.x, bombo.y);
                const distance = Phaser.Math.Distance.Between(player.x, player.y, bombo.x, bombo.y);
                const force = 1000;

                player.body.setVelocity(
                    player.body.velocity.x - Math.cos(angle) * force / distance,
                    player.body.velocity.y - Math.sin(angle) * force / distance
                );

                // Set Bombo's velocity to zero and make it speed up again
                bombo.body.velocity.setTo(0, 0);
                bombo.chasing = false;
            },
            () => !this.car.invulnerable, // Add this line to filter out collisions when the player is invulnerable
            this
        );
    }

    update(time, delta) {
        const { scrollX, scrollY } = this.cameras.main;

        this.ground.setTilePosition(scrollX, scrollY);
        this.car.update(delta, this.cursorKeys);
        this.bombo.update(delta, this.car);
    }
}

class StartScene extends Phaser.Scene {
    constructor() {
        super({ key: 'StartScene' });
    }
    preload() {
        this.load.image('startScreen', '/static/assets/carwars/sprites/startScreen.jpg');
    }

    create() {
        this.add.image(400, 300, 'startScreen');
        this.spacebar = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    }

    update() {
        if (this.spacebar.isDown) {
            this.scene.start('MainScene');
        }
    }
}

class GameOverScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameOverScene' });
    }
    preload() {
        this.load.image('overScreen', '/static/assets/carwars/sprites/overScreen.jpg');
    }

    create() {
        this.add.image(400, 300, 'overScreen');
        this.spacebar = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    }

    update() {
        if (this.spacebar.isDown) {
            this.scene.start('MainScene');
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
