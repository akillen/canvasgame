var canvas = document.createElement("canvas");
var ctx = canvas.getContext("2d");
canvas.width = 512;
canvas.height = 480;
document.body.appendChild(canvas);

var bgReady = false;
var bgImage = new Image();
bgImage.onload = function() {
	bgReady = true;
};
bgImage.src = "images/background.png";

var heroReady = false;
var heroImage = new Image();
heroImage.onload = function(){
	heroReady = true;
};
heroImage.src = "images/hero.png";

var monsterReady = false;
var monsterImage = new Image();
monsterImage.onload = function(){
	monsterReady = true;
};
monsterImage.src = "images/monster.png";

var bulletReady = false;
var bulletImage = new Image();
bulletImage.onload = function(){
	bulletReady = true;
}
bulletImage.src = "images/bullet.png";

var direction = Object.freeze({UP: "up", DOWN: "down", LEFT: "left", RIGHT: "right"});

var shotDelay = 300;
var lastShot = Date.now() - shotDelay;


var hero = {
	speed: 256,
	x: 0,
	y: 0,
	shotDelay: 300,
	lastShot: Date.now() - this.shotDelay,
	readyToShoot: function() {
		return Date.now() - this.lastShot > shotDelay;
	},
	shoot: function (bulletDir) {
		if (this.readyToShoot()){
			bullets[bullets.length] = {dir: bulletDir, x: this.x + 8, y: this.y + 8};
			this.lastShot = Date.now();
		}
	}
};

var monster = {
	x: 0,
	y: 0
};

var monstersCaught = 0;

var bullets = [];

var moveKeys = [87, 83, 65, 68];
var shootKeys = [37, 38, 39, 40];

var keysDown = {};

addEventListener("keydown", function (e) {
	keysDown[e.keyCode] = true;
}, false);

addEventListener("keyup", function (e) {
	delete keysDown[e.keyCode];
}, false);


var reset = function () {
	monster.x = 32 + (Math.random() * (canvas.width - 64));
	monster.y = 32 + (Math.random() * (canvas.width - 64));
};

var bulletCollision = function() {
	for (var i = 0; i < bullets.length; i++){
		if (
			bullets[i].x <= (monster.x + 24)
				&& monster.x <= (bullets[i].x + 24)
				&& bullets[i].y <= (monster.y + 24)
				&& monster.y <= (bullets[i].y + 24)
		) {
			bullets.splice(i, 1);
			return true;
		}
	}
	return false;
};

var addBullet = function (flyDirection, x, y) {
	bullets[bullets.length] = {dir: flyDirection, x: x, y: y};
};

//Update game objects
var update = function (modifier) {
	//Movement
	if (87 in keysDown && hero.y > 0) { //W
		hero.y -= hero.speed * modifier;
	}
	if (83 in keysDown && hero.y < canvas.width - 64) { //S
		hero.y += hero.speed * modifier;
	}
	if (65 in keysDown && hero.x > 0) { //A
		hero.x -= hero.speed * modifier;
	}
	if (68 in keysDown && hero.x < canvas.width - 32) { //D
		hero.x += hero.speed * modifier;
	}

	//Shoot keys
	if (38 in keysDown) { // Player holding up
		hero.shoot(direction.UP);
	}
	if (40 in keysDown) { // Player holding down
		hero.shoot(direction.DOWN);
	}
	if (37 in keysDown) { // Player holding left
		hero.shoot(direction.LEFT);
	}
	if (39 in keysDown) { // Player holding right
		hero.shoot(direction.RIGHT);
	}

	//Move each bullet
	for (var i = 0; i < bullets.length; i++){
		if (bullets[i].dir == "up") {
			bullets[i].y -= 280 * modifier;
		}
		if (bullets[i].dir == "down") {
			bullets[i].y += 280 * modifier;
		}
		if (bullets[i].dir == "left") {
			bullets[i].x -= 280 * modifier;
		}
		if (bullets[i].dir == "right") {
			bullets[i].x += 280 * modifier;
		}
	}
	//Collision
	if (bulletCollision()) {
		++monstersCaught;
		reset();
	}
}

var render = function(){
	if (bgReady) {
		ctx.drawImage(bgImage, 0, 0);
	}
	if (heroReady) {
		ctx.drawImage(heroImage, hero.x, hero.y);
	}
	if (monsterReady) {
		ctx.drawImage(monsterImage, monster.x, monster.y);	
	}

	if (bulletReady) {
		for (var i = 0; i < bullets.length; i++){
			ctx.drawImage(bulletImage, bullets[i].x, bullets[i].y);
		}
	}

	ctx.fillStyle = "rgb(250,250,250)";
	ctx.font = "24px Helvetica";
	ctx.textAlign = "left";
	ctx.textBaseline = "top";
	ctx.fillText("Monsters caught: " + monstersCaught, 32, 32);
};

var main = function () {
	var now = Date.now();
	var delta = now - then;

	update(delta / 1000);
	render();

	then = now;

	requestAnimationFrame(main);
};

var w = window;
requestAnimationFrame = w.requestAnimationFrame || w.webkitRequestAnimationFrame || w.msRequestAnimationFrame || w.mozRequestAnimationFrame;

var then = Date.now();
reset();
hero.x = canvas.width / 2;
hero.y = canvas.height / 2;
main();