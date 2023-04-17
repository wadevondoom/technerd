// velocityFromRotation() can be called like a plain function.
const VelocityFromRotation = Phaser.Physics.Arcade.ArcadePhysics.prototype.velocityFromRotation;

class Racecar extends Phaser.Physics.Arcade.Image
{
    throttle = 0;

    configure ()
    {
        this.angle = -90;

        this.body.angularDrag = 120;
        this.body.maxSpeed = 1024;

        this.body.setSize(64, 64, true);
    }

    update (delta, cursorKeys)
    {
        const { left, right, up, down } = cursorKeys;

        if (up.isDown)
        {
            this.throttle += 0.5 * delta;
        }
        else if (down.isDown)
        {
            this.throttle -= 0.5 * delta;
        }

        this.throttle = Phaser.Math.Clamp(this.throttle, -64, 1024);

        if (left.isDown)
        {
            this.body.setAngularAcceleration(-360);
        }
        else if (right.isDown)
        {
            this.body.setAngularAcceleration(360);
        }
        else
        {
            this.body.setAngularAcceleration(0);
        }

        VelocityFromRotation(this.rotation, this.throttle, this.body.velocity);

        this.body.maxAngular = Phaser.Math.Clamp(90 * this.body.speed / 1024, 0, 90);
    }
}

class Example extends Phaser.Scene
{
    preload ()
    {
        this.load.image('ground', '/static/assets/carwars/sprites/ground.png');
        this.load.image('car', '/static/assets/carwars/sprites/two-way.png');
    }

    create ()
    {
        this.ground = this.add.tileSprite(256, 256, 512, 512, 'ground').setScrollFactor(0, 0);

        this.car = new Racecar(this, 256, 512, 'car');
        this.add.existing(this.car);
        this.physics.add.existing(this.car);
        this.car.configure();

        this.cursorKeys = this.input.keyboard.createCursorKeys();

        this.cameras.main.startFollow(this.car);
    }

    update (time, delta)
    {
        const { scrollX, scrollY } = this.cameras.main;

        this.ground.setTilePosition(scrollX, scrollY);

        this.car.update(delta, this.cursorKeys);
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
    scene: [MainScene],
};

const game = new Phaser.Game(config);
