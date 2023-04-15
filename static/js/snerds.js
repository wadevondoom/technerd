class Enemy extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, spriteKey) {
        super(scene, x, y, spriteKey);
        scene.add.existing(this);
        scene.physics.add.existing(this);
        this.setCollideWorldBounds(true);
        this.setBounce(1);
    }
}

class Glitchy extends Enemy {
    constructor(scene, x, y, speed) {
        super(scene, x, y, 'glitchy');
        scene.physics.velocityFromAngle(Phaser.Math.Between(0, 360), speed, this.body.velocity);
        this.moveTimer = 0;
        this.body.collideWorldBounds = true;
        this.body.bounce.set(1);
    }

    preUpdate(time, delta) {
        super.preUpdate(time, delta);
    
        if (this.moveTimer <= 0) {
            const speed = 150;
            let angle = Phaser.Math.Between(0, 360);
            if (this.body.blocked.left || this.body.blocked.right) {
                // If Glitchy is blocked horizontally, change its vertical direction
                angle = 180 - angle;
            } else if (this.body.blocked.up || this.body.blocked.down) {
                // If Glitchy is blocked vertically, change its horizontal direction
                angle = 360 - angle;
            }
            this.scene.physics.velocityFromAngle(angle, speed, this.body.velocity);
            this.moveTimer = time + 100; // Change direction every 0.1 seconds for a stutter effect
        } else {
            this.moveTimer -= delta;
        }
    }
}



class Braino extends Enemy {
    constructor(scene, x, y, speed) {
        super(scene, x, y, 'braino');
        scene.physics.velocityFromAngle(Phaser.Math.Between(0, 360), speed, this.body.velocity);
        this.moveTimer = 0;
    }

    preUpdate(time, delta) {
        super.preUpdate(time, delta);

        if (this.moveTimer <= 0) {
            const speed = 150;
            const angle = Phaser.Math.Between(0, 360);
            this.scene.physics.velocityFromAngle(angle, speed, this.body.velocity);
            this.moveTimer = time + 1500; // Change direction every 1.5 seconds
        } else {
            this.moveTimer -= delta;
        }
    }
}


class Malware extends Enemy {
    constructor(scene, x, y, speed) {
        super(scene, x, y, 'malware');
        scene.physics.velocityFromAngle(Phaser.Math.Between(0, 360), speed, this.body.velocity);
        this.moveTimer = 0;
    }

    preUpdate(time, delta) {
        super.preUpdate(time, delta);

        if (this.moveTimer <= 0) {
            const speed = 150;
            const angle = Phaser.Math.Between(0, 360);
            this.scene.physics.velocityFromAngle(angle, speed, this.body.velocity);
            this.moveTimer = time + 1500; // Change direction every 1.5 seconds
        } else {
            this.moveTimer -= delta;
        }
    }
}

class Roguebot extends Enemy {
    constructor(scene, x, y, speed) {
        super(scene, x, y, 'roguebot');
        scene.physics.velocityFromAngle(Phaser.Math.Between(0, 360), speed, this.body.velocity);
        this.moveTimer = 0;
    }

    preUpdate(time, delta) {
        super.preUpdate(time, delta);

        if (this.moveTimer <= 0) {
            const speed = 150;
            const angle = Phaser.Math.Between(0, 360);
            this.scene.physics.velocityFromAngle(angle, speed, this.body.velocity);
            this.moveTimer = time + 1500; // Change direction every 1.5 seconds
        } else {
            this.moveTimer -= delta;
        }
    }
}

class MainScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MainScene' });
        this.score = 0;
        this.baseSpeedMin = 100;
        this.baseSpeedMax = 300;
        this.speedRangeIncrease = 50;
    }

    preload() {
        this.load.image('background', '/static/assets/background.png');
        this.load.image('player', '/static/assets/sprites/ship.png');
        this.load.image('bullet', '/static/assets/sprites/bullet.png');
        this.load.image('malware', '/static/assets/sprites/malware.png');
        this.load.image('roguebot', '/static/assets/sprites/roguebot.png');
        this.load.image('glitchy', '/static/assets/sprites/glitchy.png');
        this.load.image('durrdurr', '/static/assets/sprites/durrdurr.png');

        // Load other assets as needed
    }

    create() {
        this.add.image(400, 300, 'background');

        // Player
        this.player = this.physics.add.sprite(400, 300, 'player');
        this.player.setOrigin(0.5, 0.5);
        this.player.setCollideWorldBounds(true);

        // Player movement
        this.cursors = this.input.keyboard.createCursorKeys();

        // Player shooting
        this.bulletGroup = this.physics.add.group();

        // Enemies
        this.enemyGroup = this.physics.add.group();

        // Create initial enemies
        this.createGlitchyEnemy();
        // Add other enemy types as needed

    } update() {
        // Player movement
        if (this.cursors.left.isDown) {
            this.player.setVelocityX(-200);
        } else if (this.cursors.right.isDown) {
            this.player.setVelocityX(200);
        } else {
            this.player.setVelocityX(0);
        }

        if (this.cursors.up.isDown) {
            this.player.setVelocityY(-200);
        } else if (this.cursors.down.isDown) {
            this.player.setVelocityY(200);
        } else {
            this.player.setVelocityY(0);
        }

        // Player shooting
        // Player shooting
        if (Phaser.Input.Keyboard.JustDown(this.cursors.space)) {
            this.shootBullet();
        }

        // Check for collisions
        this.physics.add.collider(this.bulletGroup, this.enemyGroup, this.killGlitchyEnemy, null, this);
    }

    createGlitchyEnemy() {
        const offscreenPadding = 50;
        const spawnX = Phaser.Math.Between(0, 1) < 0.5 ? -offscreenPadding : this.cameras.main.width + offscreenPadding;
        const spawnY = Phaser.Math.Between(offscreenPadding, this.cameras.main.height - offscreenPadding);

        // Calculate speed range based on player score
        const speedMin = this.baseSpeedMin + Math.floor(this.score / 1000) * this.speedRangeIncrease;
        const speedMax = this.baseSpeedMax + Math.floor(this.score / 1000) * this.speedRangeIncrease;
        const speed = Phaser.Math.Between(speedMin, speedMax);

        // Create new Glitchy enemy with random speed
        const glitchyEnemy = new Glitchy(this, spawnX, spawnY, speed);
        this.enemyGroup.add(glitchyEnemy);
    }

    killGlitchyEnemy(bullet, enemy) {
        bullet.destroy();
        enemy.destroy();
        // Add score, sound effects, etc.
        score += 100;
        this.createGlitchyEnemy();
    }

    shootBullet() {
        const bullet = this.physics.add.sprite(this.player.x, this.player.y, 'bullet');
        bullet.setOrigin(0.5, 0.5);
        this.physics.velocityFromAngle(this.player.rotation, 400, bullet.body.velocity);
        this.bulletGroup.add(bullet);
    }
}

class StartScene extends Phaser.Scene {
    constructor() {
        super({ key: 'StartScene' });
    }

    create() {
        this.add.text(400, 300, 'Press SPACE to start', { fontSize: '32px', color: '#ffffff' }).setOrigin(0.5);

        this.input.keyboard.on('keydown-SPACE', () => {
            this.scene.start('MainScene');
        });
    }
}

class GameOverScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameOverScene' });
    }

    create() {
        this.add.text(400, 300, 'Game Over\nPress SPACE to restart', { fontSize: '32px', color: '#ffffff', align: 'center' }).setOrigin(0.5);

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