import Racecar from "./racecar";

// velocityFromRotation() can be called like a plain function.
const VelocityFromRotation = Phaser.Physics.Arcade.ArcadePhysics.prototype.velocityFromRotation;

class MainScene extends Phaser.Scene
{
    constructor() {
        super({ key: 'MainScene' });
    }

    preload ()
    {
        this.load.image('ground', '/static/assets/carwars/sprites/ground.jpg');
        this.load.image('car', '/static/assets/carwars/sprites/hunter.png');
    }

    create ()
    {
        this.ground = this.add.tileSprite(512, 512, 1024, 1024, 'ground').setScrollFactor(0, 0);

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
