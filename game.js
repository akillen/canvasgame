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
var moveKeys = Object.freeze([87, 83, 65, 68]);
var shootKeys = Object.freeze([37, 38, 39, 40]);

//Classes

function Bullet(flyDirection, x, y) {
	this.dir = flyDirection;
	this.x = x;
	this.y = y;
	var speed = 280;
	this.move = function(modifier){
		if (this.dir == direction.UP) {
			this.y -= speed * modifier;
		}
		if (this.dir == direction.DOWN) {
			this.y += speed * modifier;
		}
		if (this.dir == direction.LEFT) {
			this.x -= speed * modifier;
		}
		if (this.dir == direction.RIGHT) {
			this.x += speed * modifier;
		}
	};
}

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
			bulletCollection[bulletCollection.length] = new Bullet(bulletDir, this.x + 8, this.y + 8);
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

	this.move = function(directions, modifier){
		if (directions[direction.UP] && hero.y > 0) {
			hero.y -= hero.speed * modifier;
		}
		if (directions[direction.DOWN] && hero.y < canvas.width - 32) {
			hero.y += hero.speed * modifier;
		}
		if (directions[direction.LEFT] && hero.x > 0) {
			hero.x -= hero.speed * modifier;
		}
		if (directions[direction.RIGHT] && hero.x < canvas.width - 32) {
			hero.x += hero.speed * modifier;
		}
	};
};

function Monster() {
	this.x = 0;
	this.y = 0;
	var maxspeed = 150;
	this.moveTowards = function(target, modifier){
		if (target.x > this.x)
			this.x += maxspeed * modifier;
		if (target.x < this.x)
			this.x -= maxspeed * modifier;
		if (target.y > this.y)
			this.y += maxspeed * modifier;
		if (target.y < this.y)
			this.y -= maxspeed * modifier;
	};
}

//Game state objects
var hero = new Hero();
var monster = new Monster();
var monstersCaught = 0;
var heroInvulnTime = 0;
var bullets = [];
var keysDown = {};
var gameOver = false;

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

var removeOutOfScopeBullets = function(){
	for (var i = 0; i < bullets.length; i++){
		if (
			bullets[i].x < -16
			|| bullets[i].x > canvas.width + 16
			|| bullets[i].y < -16
			|| bullets[i].y > canvas.height + 16
				
		) {
			bullets.splice(i, 1);
		}
	}
}

//Update game objects
var update = function (modifier) {
	//Movement
	var directions = {};
	var heroMoving = false;
	if (87 in keysDown) {
		directions[direction.UP] = true;
		heroMoving = true;
	}
	if (83 in keysDown) { //S
		directions[direction.DOWN] = true;
		heroMoving = true;
	}
	if (65 in keysDown) { //A
		directions[direction.LEFT] = true;
		heroMoving = true;
	}
	if (68 in keysDown) { //D
		directions[direction.RIGHT] = true;
		heroMoving = true;
	}
	if (heroMoving) { 
		hero.accelerate(modifier);
	} else {
		hero.speed = 0;
	}

	hero.move(directions, modifier);
	directions = {};

	monster.moveTowards(hero, modifier);

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
		bullets[i].move(modifier);
	}

	//Hero only takes damage periodically (to avoid taking a ton of damage really quickly)
	if (heroInvulnTime > 0){
		heroInvulnTime -= modifier;
		if (heroInvulnTime < 0){
			heroInvulnTime = 0;
		}
	}

	//Collision
	//Refactor to support more the one monster
	if (bulletCollision()) {
		++monstersCaught;
		reset();
	}

	checkForHeroCollision();

	removeOutOfScopeBullets();

	gameOver = (hero.health == 0);
}

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

	//Debug output
	ctx.font = "16px Helvetica";
	ctx.fillText("Invuln:" + heroInvulnTime, 220, 32);
	ctx.fillText("Bullets:" + bullets.length, 220, 50);

	if (gameOver){
		ctx.font = "24px Helvetica";
		ctx.textAlign = "center";
		ctx.textBaseline = "center";
		ctx.fillText("GAME OVER", canvas.width/2, canvas.height/2);
	}
};

var main = function () {
	if (!gameOver){
		var now = Date.now();
		var delta = now - then;

		update(delta / 1000);
		render();

		then = now;

		requestAnimationFrame(main);
	}
};

var w = window;
requestAnimationFrame = w.requestAnimationFrame || w.webkitRequestAnimationFrame || w.msRequestAnimationFrame || w.mozRequestAnimationFrame;

var then = Date.now();
reset();
hero.x = canvas.width / 2;
hero.y = canvas.height / 2;
main();