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
    
        // Create shadow and add it to the scene
        this.shadow = this.scene.add.graphics();
        this.shadow.fillStyle(0x000000, 0.20);
        this.shadow.fillRoundedRect(0, 0, 60, 34, 4);
        this.shadow.generateTexture('shadow', 60, 34);
        this.shadow.destroy();
    
        // Add shadow under the car
        this.shadowSprite = this.scene.add.image(this.x, this.y, 'shadow');
        this.setDepth(1); // Render the car above the shadow
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


        // Update shadow position and rotation
        this.shadowSprite.x = this.x; // Center the shadow horizontally
        this.shadowSprite.y = this.y; // Center the shadow vertically
        this.shadowSprite.rotation = this.rotation;


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
    chaseRange = 50; // Set how close enemies will aggro

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
        this.body.setSize(52, 26, true);
    }

    chasePlayer(player) {
        const distance = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y);
        if (distance <= this.chaseRange) {
            if (this.scene && this.scene.physics) {
                this.scene.physics.moveToObject(this, player, 350);
            }
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

    update() {
        console.log("Enemy Car:", this.x, this.y, this.active);
    }
    

}

class MainScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MainScene' });
    }

    preload() {
        this.load.image('ground', '/static/assets/carwars/sprites/ground2.jpg');
        this.load.image('car', '/static/assets/carwars/sprites/hunter.png');
        this.load.image('bullet', '/static/assets/carwars/sprites/bullet.png');
        this.load.image('robutt', '/static/assets/carwars/sprites/robutt.png');
        this.load.json('enemyWaves', '/static/js/carwars/enemyWaves.json');


        
    }

    create() {
        // Set the background color to black
        this.cameras.main.setBackgroundColor(0x000000);
        this.ground = this.add.tileSprite(0, 0, 4096, 4096, 'ground');
        this.ground.setOrigin(0, 0);
        this.ground.setScrollFactor(0);

        //Bind camera to ground
        this.cameras.main.setBounds(0, 0, this.ground.width, this.ground.height);

        // Setup walls
        this.borderTop = this.add.rectangle(0, 0, this.ground.width, borderWidth, borderColor).setOrigin(0, 0);
        this.borderBottom = this.add.rectangle(0, this.ground.height - borderWidth, this.ground.width, borderWidth, borderColor).setOrigin(0, 0);
        this.borderLeft = this.add.rectangle(0, 0, borderWidth, this.ground.height, borderColor).setOrigin(0, 0);
        this.borderRight = this.add.rectangle(this.ground.width - borderWidth, 0, borderWidth, this.ground.height, borderColor).setOrigin(0, 0);
        
        this.physics.add.existing(this.borderTop, true);
        this.physics.add.existing(this.borderBottom, true);
        this.physics.add.existing(this.borderLeft, true);
        this.physics.add.existing(this.borderRight, true);

        // Create border rectangles
        this.topBorder = this.add.rectangle(0, 0, this.ground.width, 10, 0xaaaaaa);
        this.bottomBorder = this.add.rectangle(0, this.ground.height - 10, this.ground.width, 10, 0xaaaaaa);
        this.leftBorder = this.add.rectangle(0, 0, 10, this.ground.height, 0xaaaaaa);
        this.rightBorder = this.add.rectangle(this.ground.width - 10, 0, 10, this.ground.height, 0xaaaaaa);

        // Add physics and make border rectangles immovable
        this.physics.add.existing(this.topBorder, true);
        this.physics.add.existing(this.bottomBorder, true);
        this.physics.add.existing(this.leftBorder, true);
        this.physics.add.existing(this.rightBorder, true);

        // Add player's car
        this.car = new Racecar(this, this.ground.width / 2, this.ground.height / 2, 'car');
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
        this.enemies = this.physics.add.group({
            runChildUpdate: true, // Add this line
        });

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

        this.enemies.getChildren().forEach((enemyCar) => {
            enemyCar.chasePlayer(this.car);
        });
        

    }

    spawnEnemy() {
        const enemyData = this.getEnemyData();
        if (enemyData) {
            const enemyCar = new EnemyCar(this, enemyData.x, enemyData.y, 'robutt', this.spawnEnemyNearPlayer.bind(this));
            this.enemies.add(enemyCar);
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
        if (car.health === 0) {
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
        this.spawnEnemy();
    }

    bulletHitBorder(bullet) {
        bullet.setActive(false);
        bullet.setVisible(false);
        if (bullet.body) {
            bullet.body.stop();
        }
    }
    
    getEnemyData() {
        if (this.currentWave < this.enemyWaves.waves.length) {
            const waveData = this.enemyWaves.waves[this.currentWave].enemies.shift();
    
            // Check if there are no more enemies in the current wave
            if (this.enemyWaves.waves[this.currentWave].enemies.length === 0) {
                this.currentWave++;
            }
    
            return waveData;
        } else {
            this.scene.start('GameOverScene');
            return null;
        }
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