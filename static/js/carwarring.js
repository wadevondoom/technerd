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
    hitpoints = 2; // Add hitpoints property

    constructor(scene, x, y, texture) {
        super(scene, x, y, texture);
        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.configure();
    }

    configure() {
        this.angle = -90;

        this.body.angularDrag = 120;
        this.body.maxSpeed = 600;

        this.body.setSize(64, 64, true);

        // Set a random off-screen spawn position
        const spawnSide = Phaser.Math.Between(0, 3);
        let x, y;

        switch (spawnSide) {
            case 0: // Top
                x = Phaser.Math.Between(0, this.scene.cameras.main.width);
                y = -64;
                break;
            case 1: // Right
                x = this.scene.cameras.main.width + 64;
                y = Phaser.Math.Between(0, this.scene.cameras.main.height);
                break;
            case 2: // Bottom
                x = Phaser.Math.Between(0, this.scene.cameras.main.width);
                y = this.scene.cameras.main.height + 64;
                break;
            case 3: // Left
            default:
                x = -64;
                y = Phaser.Math.Between(0, this.scene.cameras.main.height);
                break;
        }

        this.setPosition(x, y);
        this.spawnX = x;
        this.spawnY = y;
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

        // Load fire sprites
        this.load.image('fire1', '/static/assets/carwars/sprites/fire1.png');
        this.load.image('fire2', '/static/assets/carwars/sprites/fire2.png');
        this.load.image('fire3', '/static/assets/carwars/sprites/fire3.png');

    }

    create() {
        this.ground = this.add.tileSprite(512, 512, 1024, 1024, 'ground').setScrollFactor(0, 0);

        this.car = new Racecar(this, 256, 512, 'car');
        this.add.existing(this.car);
        this.physics.add.existing(this.car);
        this.car.configure();

        this.bombo = new Bombo(this, 768, 512, 'bombo');
        this.add.existing(this.bombo);
        this.physics.add.existing(this.bombo);
        this.bombo.configure();

        this.cursorKeys = this.input.keyboard.createCursorKeys();

        this.cameras.main.startFollow(this.car);

        // Create a particle emitter manager
        this.particles = this.add.particles();

        // Create a particle emitter
        this.explosionEmitter = this.particles.createEmitter({
            x: 0,
            y: 0,
            speed: { min: 100, max: 300 },
            angle: { min: 0, max: 360 },
            scale: { start: 0.5, end: 0 },
            alpha: { start: 1, end: 0 },
            lifespan: 1000,
            on: false,
        });

        // Create text objects for player's HP and enemy count
        this.hpText = this.add.text(10, 10, `HP: ${this.car.hitpoints}`, {
            fontSize: '16px',
            color: '#ffffff',
        }).setScrollFactor(0);

        this.enemyCountText = this.add.text(
            this.cameras.main.width - 100, 10, `Enemies: 1`, {
            fontSize: '16px',
            color: '#ffffff',
        }).setScrollFactor(0);

        this.physics.add.collider(
            this.car,
            this.bombo,
            (player, bombo) => {
                if (player.invulnerable) return;

                player.hitpoints -= 1;
                this.hpText.setText(`HP: ${player.hitpoints}`);

                player.invulnerable = true;
                this.time.delayedCall(1000, () => {
                    player.invulnerable = false;
                });

                bombo.hitpoints--;

                if (bombo.hitpoints === 0) {
                    const fireIndex = Phaser.Math.Between(1, 3);
                    const explosion = this.add.image(bombo.x, bombo.y, `fire${fireIndex}`);
                    this.tweens.add({
                        targets: explosion,
                        alpha: 0,
                        duration: 1000,
                        onComplete: () => {
                            explosion.destroy();
                        },
                    });

                    // Trigger the particle effect
                    this.explosionEmitter.setPosition(bombo.x, bombo.y);
                    this.explosionEmitter.explode(30);

                    bombo.destroy();

                    // Update enemy count text
                    this.enemyCountText.setText('Enemies: 0');
                } else {
                    bombo.body.velocity.setTo(0, 0);
                    bombo.chasing = false;
                    bombo.x = bombo.spawnX;
                    bombo.y = bombo.spawnY;
                }
            },
            () => !this.car.invulnerable,
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
