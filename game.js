var canvas = document.createElement("canvas");
var ctx = canvas.getContext("2d");
canvas.width = 512;
canvas.height = 480;
document.body.appendChild(canvas);


//Load graphic resources

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


//Constants

var direction = Object.freeze({UP: "up", DOWN: "down", LEFT: "left", RIGHT: "right"});
var moveKeys = [87, 83, 65, 68];
var shootKeys = [37, 38, 39, 40];

//Classes

function Hero() {
	this.health = 4;
	this.maxspeed = 256;
	this.speed = 0;
	this.x = 0;
	this.y = 0;
	var shotDelay = 300;
	var lastShot = Date.now() - shotDelay;
	this.readyToShoot = function() {
		return Date.now() - lastShot > shotDelay;
	};
	this.shoot = function (bulletCollection, bulletDir) {
		if (this.readyToShoot()){
			bulletCollection[bulletCollection.length] = {dir: bulletDir, x: this.x + 8, y: this.y + 8};
			lastShot = Date.now();
		}
	};
	this.render = function (context) {
		if (heroReady) {
			context.drawImage(heroImage, this.x, this.y);
		}
	};
	this.accelerate = function(delta) {
		if (this.speed < this.maxspeed) {
			this.speed += delta * 800;
		}
	};
};

function Monster() {
	this.x = 0;
	this.y = 0;
}

//Game state objects
var hero = new Hero();
var monster = new Monster();
var monstersCaught = 0;
var heroInvulnTime = 0;
var bullets = [];
var keysDown = {};

addEventListener("keydown", function (e) {
	keysDown[e.keyCode] = true;
}, false);

addEventListener("keyup", function (e) {
	delete keysDown[e.keyCode];
}, false);


var reset = function () {
	monster.x = 32 + (Math.random() * (canvas.width - 64));
	monster.y = 32 + (Math.random() * (canvas.height - 64));
};

//Evalute each bullet for collision, remove if collided
//TODO: Refactor collision logic to common function
var bulletCollision = function() {
	for (var i = 0; i < bullets.length; i++){
		if (
			bullets[i].x <= (monster.x + 24) //Within the right edge
				&& monster.x <= (bullets[i].x + 16)
				&& bullets[i].y <= (monster.y + 24)
				&& monster.y <= (bullets[i].y + 16)
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
	var heroMoving = false;
	if (87 in keysDown && hero.y > 0) { //W
		hero.y -= hero.speed * modifier;
		heroMoving = true;
	}
	if (83 in keysDown && hero.y < canvas.width - 64) { //S
		hero.y += hero.speed * modifier;
		heroMoving = true;
	}
	if (65 in keysDown && hero.x > 0) { //A
		hero.x -= hero.speed * modifier;
		heroMoving = true;
	}
	if (68 in keysDown && hero.x < canvas.width - 32) { //D
		hero.x += hero.speed * modifier;
		heroMoving = true;
	}
	if (heroMoving) { 
		hero.accelerate(modifier);
	} else {
		hero.speed = 0;
	}


	//Shoot keys
	if (38 in keysDown) { // Player holding up
		hero.shoot(bullets, direction.UP);
	}
	if (40 in keysDown) { // Player holding down
		hero.shoot(bullets, direction.DOWN);
	}
	if (37 in keysDown) { // Player holding left
		hero.shoot(bullets, direction.LEFT);
	}
	if (39 in keysDown) { // Player holding right
		hero.shoot(bullets, direction.RIGHT);
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

	//Hero only takes damage periodically (to avoid taking a ton of damage really quickly)
	if (heroInvulnTime > 0){
		heroInvulnTime -= modifier;
		if (heroInvulnTime < 0){
			heroInvulnTime = 0;
		}
	}

	//Collision
	if (bulletCollision()) {
		++monstersCaught;
		reset();
	}

	checkForHeroCollision();
}

var heroInvulnTime = 0;
var checkForHeroCollision = function(){
	if (
		hero.x <= (monster.x + 32)
		&& monster.x <= (hero.x + 32)
		&& hero.y <= (monster.y + 32)
		&& monster.y <= (hero.y + 32)
	) {
		if(heroInvulnTime == 0){
			hero.health = hero.health - 1;
			heroInvulnTime = 0.5;
		}
	}
}

var render = function(){
	if (bgReady) {
		ctx.drawImage(bgImage, 0, 0);
	}
	
	hero.render(ctx);
	
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
	ctx.fillText("Health: " + hero.health, 32, 32);
	ctx.fillText("Invuln:" + heroInvulnTime, 220, 32);
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