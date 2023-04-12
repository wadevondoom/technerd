const game = new Phaser.Game(800, 600, Phaser.AUTO, '', {
    preload: preload,
    create: create
});

function preload() {
    game.load.crossOrigin = 'anonymous';
    game.load.image('hello', 'https://lh3.googleusercontent.com/a/AGNmyxbupm7pTkaeYVfETATNXjTfopiK8FYxzmKISuIQRA=s96-c');
}

function create() {
    game.add.sprite(0, 0, 'hello');
}