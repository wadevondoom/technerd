// velocityFromRotation() can be called like a plain function.
const VelocityFromRotation = Phaser.Physics.Arcade.ArcadePhysics.prototype.velocityFromRotation;

class Racecar extends Phaser.Physics.Arcade.Image {
    throttle = 0;
    health = 10; // Add health property

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

    shoot(bulletGroup) {
        const bullet = bulletGroup.get(this.x, this.y, 'bullet');
        if (bullet) {
            bullet.setActive(true);
            bullet.setVisible(true);
            bullet.setAngle(this.angle);
            bullet.setRotation(this.rotation);
            const speed = 1000 + this.throttle;
            this.scene.physics.velocityFromAngle(this.angle, speed, bullet.body.velocity);

            // Kill the bullet after 1 second
            this.scene.time.delayedCall(1000, () => {
                bullet.setActive(false);
                bullet.setVisible(false);
                bullet.body.stop();
            });
        }
    }
}

class EnemyCar extends Phaser.Physics.Arcade.Image {
    // Add spawnEnemyNearPlayer parameter to the constructor
    constructor(scene, x, y, texture, spawnEnemyNearPlayer) {
        super(scene, x, y, texture);
        scene.add.existing(this);
        scene.physics.add.existing(this);
        this.configure();
        this.spawnEnemyNearPlayer = spawnEnemyNearPlayer; // Store the reference
    }

    configure() {
        this.angle = -90;
        this.body.setSize(64, 64, true);
    }

    chasePlayer(player, maxChaseDistance = 800) {
        const distance = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y);
        if (distance <= maxChaseDistance) {
            this.scene.physics.moveToObject(this, player, 100);
        } else {
            this.spawnEnemyNearPlayer(player); // Use the stored reference
            this.destroy();
        }
    }

    shoot(bulletGroup) {
        const bullet = bulletGroup.get(this.x, this.y, 'bullet');
        if (bullet) {
            bullet.setActive(true);
            bullet.setVisible(true);
            bullet.setAngle(this.angle);
            bullet.setRotation(this.rotation);
            const speed = 1000 + this.throttle;
            this.scene.physics.velocityFromAngle(this.angle, speed, bullet.body.velocity);

            // Kill the bullet after 1 second
            this.scene.time.delayedCall(1000, () => {
                if (bullet.body) {
                    bullet.setActive(false);
                    bullet.setVisible(false);
                    bullet.body.stop();
                }
            });
        }
    }

}

class MainScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MainScene' });
    }

    preload() {
        this.load.image('ground', '/static/assets/carwars/sprites/ground.jpg');
        this.load.image('car', '/static/assets/carwars/sprites/hunter.png');
        this.load.image('bullet', '/static/assets/carwars/sprites/bullet.png');
        this.load.image('robutt', '/static/assets/carwars/sprites/robutt.png');
    }

    create() {
        //Add ground
        this.ground = this.add.tileSprite(512, 512, 1024, 1024, 'ground').setScrollFactor(0, 0);

        // Add player's car
        this.car = new Racecar(this, 256, 512, 'car');
        this.add.existing(this.car);
        this.physics.add.existing(this.car);
        this.car.configure();

        // Add bullet group
        this.bullets = this.physics.add.group({
            classType: Phaser.Physics.Arcade.Image, // Add this line
            defaultKey: 'bullet',
            maxSize: 10,
            runChildUpdate: true,
            createCallback: (bullet) => { // Add this callback
                bullet.setActive(false);
                bullet.setVisible(false);
            }
        });

        // Add cursors
        this.cursorKeys = this.input.keyboard.createCursorKeys();
        this.spacebar = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE); // Define spacebar key

        // Camera follows player
        this.cameras.main.startFollow(this.car);

        // Spawn enemy
        this.enemyCars = this.physics.add.group();
        this.spawnEnemy();
    }

    update(time, delta) {
        const { scrollX, scrollY } = this.cameras.main;

        this.ground.setTilePosition(scrollX, scrollY);

        this.car.update(delta, this.cursorKeys);

        // Shoot bullet is SPACEBAR pressed
        if (this.spacebar.isDown) {
            this.car.shoot(this.bullets);
        }

        this.enemyCars.children.iterate((enemyCar) => {
            enemyCar.chasePlayer(this.car);
        });

    }

    spawnEnemy() {
        // Pass this.spawnEnemyNearPlayer.bind(this) to the EnemyCar constructor
        const enemyCar = new EnemyCar(this, 600, 500, 'robutt', this.spawnEnemyNearPlayer.bind(this));
        this.enemyCars.add(enemyCar);
        this.physics.add.collider(this.car, enemyCar, this.carHitEnemy, null, this);
        this.physics.add.overlap(this.bullets, enemyCar, this.bulletHitEnemy, null, this);

        // Start chasing after a 1-second delay
        this.time.delayedCall(1000, () => {
            enemyCar.chasePlayer(this.car);
        }, null, this);
    }

    spawnEnemyNearPlayer(player) {
        const side = Math.random() < 0.5 ? -1 : 1;
        const offsetX = 200 * side;
        const offsetY = 200 * side;

        const enemyCar = new EnemyCar(this, player.x + offsetX, player.y + offsetY, 'robutt', this.spawnEnemyNearPlayer.bind(this));
        this.enemyCars.add(enemyCar);
        this.physics.add.collider(this.car, enemyCar, this.carHitEnemy, null, this);
        this.physics.add.overlap(this.bullets, enemyCar, this.bulletHitEnemy, null, this);

        // Start chasing after a 1-second delay
        this.time.delayedCall(1000, () => {
            enemyCar.chasePlayer(this.car);
        }, null, this);
    }


    carHitEnemy(car, enemyCar) {
        enemyCar.destroy();
        car.health -= 1;
        console.log('Player health:', car.health);
        if (car.health == 0) {
            this.scene.start('StartScene');
        }
        this.spawnEnemy();
    }

    bulletHitEnemy(bullet, enemyCar) {
        bullet.setActive(false);
        bullet.setVisible(false);
        bullet.body.stop();

        enemyCar.destroy();
        this.car.health -= 1;
        console.log('Player health:', this.car.health);
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
            debug: false,
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