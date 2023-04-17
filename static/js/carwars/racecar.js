export default class Racecar extends Phaser.Physics.Arcade.Image {
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
            this.throttle -= 0.5 * delta;
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