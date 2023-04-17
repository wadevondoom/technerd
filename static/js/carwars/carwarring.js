// velocityFromRotation() can be called like a plain function.
const VelocityFromRotation = Phaser.Physics.Arcade.ArcadePhysics.prototype.velocityFromRotation;

class Racecar extends Phaser.Physics.Arcade.Image {
    throttle = 0;
    health = 10; // Add health property

    configure() {
        this.angle = -90;

        this.body.angularDrag = 120;
        this.body.maxSpeed = 512;

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

    throttle = 0; // Add this line

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

    chasePlayer(player) {
        const distance = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y);
        if (distance <= this.chaseRange) {
            this.scene.physics.moveToObject(this, player, 350);
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
        this.load.json('enemyWaves', '/static/js/carwars/enemyWaves.json');
    }

    create() {
        // Set the background color to black
        this.cameras.main.setBackgroundColor(0x000000);
    
        // Add player's car
        this.car = new Racecar(this, 256, 512, 'car');
        this.add.existing(this.car);
        this.physics.add.existing(this.car);
        this.car.configure();
    
        // Add bullet group
        this.bullets = this.physics.add.group({
            classType: Phaser.Physics.Arcade.Image,
            defaultKey: 'bullet',
            maxSize: 10,
            runChildUpdate: true,
            createCallback: (bullet) => {
                bullet.setActive(false);
                bullet.setVisible(false);
            }
        });
    
        // Add cursors
        this.cursorKeys = this.input.keyboard.createCursorKeys();
        this.spacebar = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    
        // Camera follows player
        this.cameras.main.startFollow(this.car);
    
        this.enemyWaves = this.cache.json.get('enemyWaves');
        this.currentWave = 0;
    
        // Initialize the enemies array and spawn the first enemy
        this.enemies = [];
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

        this.enemies.children.iterate((enemyCar) => {
            enemyCar.chasePlayer(this.car);
        });

    }

    spawnEnemy() {
        const enemyData = this.getEnemyData();
        if (enemyData) {
            const enemyCar = new EnemyCar(this, enemyData.x, enemyData.y, 'robutt', this.spawnEnemyNearPlayer.bind(this));
            this.enemies.push(enemyCar);
            this.physics.add.collider(this.car, enemyCar, this.carHitEnemy, null, this);
            this.physics.add.overlap(this.bullets, enemyCar, this.bulletHitEnemy, null, this);
    
            // Start chasing after a 1-second delay
            this.time.delayedCall(1000, () => {
                enemyCar.chasePlayer(this.car);
            }, null, this);
        }
    }

    spawnEnemyNearPlayer(player) {
        const side = Math.random() < 0.5 ? -1 : 1;
        const offsetX = 200 * side;
        const offsetY = 200 * side;

        const enemyCar = new EnemyCar(this, player.x + offsetX, player.y + offsetY, 'robutt', this.spawnEnemyNearPlayer.bind(this));
        this.enemies.add(enemyCar);
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
            this.scene.start('GameOverScene');
        }
        this.spawnEnemy();
    }

    bulletHitEnemy(bullet, enemyCar) {
        bullet.setActive(false);
        bullet.setVisible(false);
        if (bullet.body) { // Add this check
            bullet.body.stop();
        }

        enemyCar.destroy();
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
    backgroundColor: 0x000000,
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