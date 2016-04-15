// Create the canvas
var canvas = document.createElement("canvas");
var context = canvas.getContext("2d");
canvas.width = 500;
canvas.height = 600;
document.body.appendChild(canvas); //attach canvas to document

// Game objects
var hero, cities, invaders, rinvader, bullets, fire;

// Variables
var score, stage, canvasFrame; 
var invadersFrame, bulletsFrame, fireFrame, rinvaderFrame, fireRate, bulletRate;
var rinvaderReady, gameReady, bulletReady, downReady;
var invadersDir, row, col, maxX, minX, minY;

// Game images
var heroImage = new Image();
heroImage.src = "hero.jpg";
var gameoverImage = new Image();
gameoverImage.src = "gameover.jpg";
var winImage = new Image();
winImage.src = "win.jpg";
var newImage = new Image();
newImage.src = "new.jpg";
var rinvaderImage = new Image();
rinvaderImage.src = "rinvader.jpg";
var invaderImage1 = new Image();
invaderImage1.src = "invader1.jpg";
var invaderImage2 = new Image();
invaderImage2.src = "invader2.jpg";
var invaderImage3 = new Image();
invaderImage3.src = "invader3.jpg";

var init = function() {
	// Hero object
	hero = {
		speed: 512, // movement in pixels per second
		x: canvas.width/2,
		y: canvas.height-20,
		w: 30,
		h: 20,
		life: 5,
		rinvader: 0
	};
	
	// City object
	cities = [];
	var l = 0;
	var t;
	for (var k=0; k<4; k++) {
		for (var i=0; i<3; i++) {
			for (var j=0; j<3; j++) { 
				cities.push({
					x: ((canvas.width/4)-30)/2 + (canvas.width/4)*k + j*10,
					y: canvas.height - i*10 - 60,
					w: 10,
					h: 10,
					type: t
				});
			}
		}
		cities.splice(1-l+k*9,1);
		l++;
		for (var i=0; i<cities.length; i++) {
			if (i == 5 || i == 13 || i == 21 || i == 29) {
				cities[i].type = 1;
			}
			else if (i == 7 || i == 15 || i == 23 || i == 31) {
				cities[i].type = 2;
			}
			else {
				cities[i].type = 0;
			}
		}
		
	}
	
	// Invader object
	invaders = [];
	row = 10;
	col = 5;
	var lv = 1;
	for (var i=0; i<col; i++) {
		if ((i+1) % 2 === 0) {
			lv++;
		}
		for (var j=0; j<row; j++) {
			invaders.push({
				x: 30 + j*30,
				y: 50 + i*50,
				w: 30,
				h: 50,
				level: lv 
			});
		}
	}
	
	// Bullet object
	bullets = [];

	// Fire object
	fire = [];
	
	// Game setting
	score = 0;
	stage = 1;	
	canvasFrame = 0;
	
	// Object speed control (lower the faster)
	invadersFrame = 30;
	bulletsFrame = 5;			
	fireFrame = 5;
	rinvaderFrame = 5;
	fireRate = 0.995; 
	bulletRate = 0.8; 
	
	// Switches
	gameReady = 1;
	rinvaderReady = 0;
	bulletReady = 0;
	downReady = 1;
	invadersDir = 1;
	minX = canvas.width;
	maxX = 0;
	minY = canvas.height
};

// Handling keyboard input
var keysDown = {}	
addEventListener("keydown", function (e) {
	keysDown[e.keyCode] = true;
}, false);
addEventListener("keyup", function (e) {
	delete keysDown[e.keyCode];
}, false);

// Collision detection
var AABB = function(ax,ay,aw,ah,bx,by,bw,bh) {
	return ax < bx+bw && bx < ax+aw && ay < by+bh && by < ay+ah;
};

// Update position of all objects
var update = function (elapsedTime) {
	canvasFrame++;
	
	if (37 in keysDown) { // Player holding left
		hero.x -= hero.speed * elapsedTime;
		if (hero.x < hero.w) {
			hero.x = hero.w;
		}
	}
	if (39 in keysDown) { // Player holding right
		hero.x += hero.speed * elapsedTime;
		if (hero.x > canvas.width - 2*hero.w) {
			hero.x = canvas.width - 2*hero.w;
		}
	}
	
	// <rinvader Update>
	if (canvasFrame % rinvaderFrame == 0) {
		if(Math.random() <= 0.8 && rinvaderReady == 0 && invaders.length <= 0.6*row*col) {
			rinvaderReady = 1;
			rinvader = {
				x: 30,
				y: 0,
				w: 30,
				h: 50
			};
		} 
		if (rinvaderReady == 1) {
			rinvader.x += 10;
			if (rinvader.x >= canvas.width-30) {
				rinvaderReady = 0;
			}
		}
	}
	
	// <Fire Update>
	if (canvasFrame % fireFrame === 0) {		
		if (fire.length !== 0 ) {
			for (var i=0; i<fire.length; i++) {
				a = fire[i];
				// If fire reach the end of screen
				if (a.y > canvas.height) {
					fire.splice(i,1);
				}
				// If fire hit cities
				if (cities.length != 0) {
					for (var j=0; j<cities.length; j++) {
						b = cities[j];
						if (AABB(a.x,a.y,a.w,a.h,b.x,b.y,b.w,b.h)) {
							fire.splice(i,1);
							cities.splice(j,1);
						}
					}
				}
				// If fire hit hero
				if (AABB(a.x,a.y,a.w,a.h,hero.x,hero.y,hero.w,hero.h)) {
					fire.splice(i,1);
					hero.life--;
					if (hero.life == 0) {
						gameover();
					}
					hero.x = canvas.width/2;
					hero.y = canvas.height-30;
				}
				// Let fire move down
				a.y += 5;
			}
		}
	}
	
	// <Bullet Update>
	if (canvasFrame % bulletsFrame === 0) {
		// If at least one bullets is fired by pressing space bar
		if (bullets.length !== 0) { 
			for (var i=0; i<bullets.length; i++) {
				a = bullets[i];
				// If bullets reach the end of screen
				if (a.y < 0) {
					bullets.splice(i,1);
				}
				// If bullets hit rinvader
				if (rinvaderReady==1) {
					if (AABB(a.x,a.y,a.w,a.h,rinvader.x,rinvader.y,rinvader.w,rinvader.h)) {
						bullets.splice(i,1);
						rinvaderReady = 0;
						score += 1000;
						hero.rinvader++;
						if (hero.rinvader > 4) {
							hero.rinvader = 4;
						}
					}
				}
				// If bullets hit cities
				if (cities.length != 0) {
					for (var j=0; j<cities.length; j++) {
						b = cities[j];
						if (AABB(a.x,a.y,a.w,a.h,b.x,b.y,b.w,b.h)) {
							bullets.splice(i,1);
							bulletReady = 1;
						}
					}
				}
				// If bullets hit any invader
				for (var j=0; j<invaders.length; j++) {
					b = invaders[j];
					if (AABB(a.x,a.y,a.w,a.h,b.x,b.y,b.w,b.h)) {
						bullets.splice(i,1);
						bulletReady = 1;
						invaders.splice(j,1);
						if (b.level == 1) {	
							score += 300;
						}
						else if (b.level == 2) {	
							score += 200;
						}
						else {	
							score += 100;
						}
					}
				}
				// Let bullets move up
				a.y -= 20;
				minY = Math.min(minY, a.y);
				if (minY < canvas.height*bulletRate || bulletReady == 1) {
					minY = canvas.height;
				}
				bulletReady = 0;
			}
		}
	}
	
	// <Invaders Update>
	if (canvasFrame % invadersFrame == 0) {
		// At least one invader reach bottom
		for (var i=0; i<invaders.length; i++) {
			if (invaders[i].y > canvas.height - 130) {
				gameover();
			}
		}
		// If all invaders are killed
		if (invaders.length == 0) {
			var keepscore = score;
			var keeprinvader = hero.rinvader;
			var keepstage = stage;
			init();
			score = keepscore;
			hero.rinvader = keeprinvader;
			stage = keepstage;
		}
		else if (invaders.length <= row*col && invaders.length > 0.5*row*col) {
			invadersFrame = 20;
		}
		else if (invaders.length <= 0.5*row*col && invaders.length > 0.2*row*col) {
			invadersFrame = 15;
		}
		else if (invaders.length <= 0.2*row*col && invaders.length > 0) {
			invadersFrame = 10;
		}
			
		// Randomly shoot fire
		for (var i=0; i<invaders.length; i++) {
			a = invaders[i];
			for (var j=0; j<invaders.length; j++) {
				b = invaders[j];
				if (AABB(a.x,a.y,a.w,51,b.x,b.y,b.w,b.h)) {
					a = b;
				}
			}
			if (Math.random() >= fireRate) {
				fire.push({
					x: a.x+(a.h/2),
					y: a.y+a.h,
					w: 2,
					h: 6
				});
			}
		}
					
		//	If reaches right side of screen
		if (maxX >= (canvas.width-60)) {
			if (downReady == 1) {
				// Move down
				for (var i=0; i<invaders.length; i++) {
					invaders[i].y += 20;
				}
				downReady--;
			}
			else {
				// Change direction and move left
				invadersDir = -1;
				for (var i=0; i<invaders.length; i++) {
					invaders[i].x -= 10;			
				}	
				maxX = 0;			
				downReady++;
			}
		}	
		// If reaches left side of screen
		else if (minX <= 30) {
			if (downReady == 1) {
				// Move down
				for (var i=0; i<invaders.length; i++) {
					invaders[i].y += 20;
				}
				downReady--;
			}
			else {
				// Change direction and move right
				invadersDir = 1;
				for (var i=0; i<invaders.length; i++) {
					invaders[i].x += 10;
				}
				minX = canvas.width;
				downReady++;
			}
		}
		//If not either end of screen
		else {	
			for (var i=0; i<invaders.length; i++) {
				invaders[i].x += 10*invadersDir;
				maxX = Math.max(maxX, invaders[i].x);
				minX = Math.min(minX, invaders[i].x);
			}
		}
	}
};

// Draw all objects on screen	
var render = function () {
	context.clearRect(0,0,canvas.width,canvas.height);
	 // Aside
	context.beginPath();	
	context.moveTo(0,canvas.height-80);
	context.lineTo(30,canvas.height-80);
	context.moveTo(30,canvas.height-80);
	context.lineTo(30,canvas.height);
	context.moveTo(canvas.width,canvas.height-80);
	context.lineTo(canvas.width-30,canvas.height-80);
	context.moveTo(canvas.width-30,canvas.height-80);
	context.lineTo(canvas.width-30,canvas.height);
	context.strokeStyle="#00ff00";
	context.stroke();
	// Death line
	context.beginPath();
	context.moveTo(0,canvas.height-80);
	context.lineTo(canvas.width-30,canvas.height-80);
	context.strokeStyle="#c0c0c0";
	context.stroke();
	// Draw hero
	context.drawImage(heroImage, 10, 20, 44, 24, hero.x, hero.y, hero.w, hero.h);
	for (var i=0; i<hero.life-1; i++) {
		context.drawImage(heroImage, 10, 20, 44, 24,0, canvas.height-hero.h*(i+1), hero.w, hero.h);
	}
	// Draw invaders
	for (var i=0; i<invaders.length; i++) {
		if (invaders[i].level == 1) {
			context.drawImage(invaderImage1, invaders[i].x, invaders[i].y, 30, 50);
		}
		else if (invaders[i].level == 2) {
			context.drawImage(invaderImage2, invaders[i].x, invaders[i].y, 30, 50);
		}
		else {
			context.drawImage(invaderImage3, invaders[i].x, invaders[i].y, 30, 50);
		}
	}
	// Draw bullets
	for (var i=0; i<bullets.length; i++) {
		context.fillStyle = "#FFFAF0";
		context.fillRect(bullets[i].x,bullets[i].y,bullets[i].w,bullets[i].h);
	}
	// Draw fire
	for (var i=0; i<fire.length; i++) {
		context.fillStyle = "#FF0000";
		context.fillRect(fire[i].x,fire[i].y,fire[i].w,fire[i].h);
	}	
	// Draw red invader
	if (rinvaderReady == 1) {
		context.drawImage(rinvaderImage, rinvader.x, rinvader.y, 30, 50);
	}
	for (var i=0; i<hero.rinvader; i++) {
		context.drawImage(rinvaderImage, canvas.width-hero.w, canvas.height-hero.h*(i+1), hero.w, hero.h);
	}
	// Draw cities
	for (var i=0; i<cities.length; i++) {
		if (cities[i].type == 1) {
		    context.beginPath();
			context.arc(cities[i].x+cities[i].w, cities[i].y+cities[i].h, cities[i].w, Math.PI, Math.PI*1.5, false);
			context.lineTo(cities[i].x+cities[i].w, cities[i].y+cities[i].h);
			context.closePath();
			context.fill();
		}
		else if (cities[i].type == 2) {
			context.beginPath();
			context.arc(cities[i].x, cities[i].y+cities[i].h, cities[i].w, Math.PI*1.5, 0, false);
			context.lineTo(cities[i].x, cities[i].y+cities[i].h);
			context.closePath();
			context.fill();
		}
		else {
			context.fillStyle = "#008000";
			context.fillRect(cities[i].x,cities[i].y,cities[i].w,cities[i].h);
		}
	}
};
	
var gameover = function() {
	hero.life = 0;
	gameReady = 1;
	context.clearRect(0,0,canvas.width,canvas.height);
	context.drawImage(gameoverImage,0,0,canvas.width,canvas.height);
};

var newScreen = function() {
	context.drawImage(newImage,0,0,canvas.width,canvas.height);
};

// Recursive main execution		
var then = Date.now();
var main = function () {
	var now = Date.now();
	var delta = now - then;
	
	update(delta / 1000);
	render();
				
	then = now;
	
	document.getElementById("invaders").innerHTML = invaders.length;
	document.getElementById("score").innerHTML = score;
	document.getElementById("stage").innerHTML = stage;
	document.getElementById("life").innerHTML = hero.life;
	
	if (hero.life != 0) {
		requestAnimationFrame(main);
	}
	else {
		gameover();
	}
};
				
// Cross-browser support for requestAnimationFrame
var w = window;
requestAnimationFrame = w.requestAnimationFrame || w.webkitRequestAnimationFrame || w.msRequestAnimationFrame || w.mozRequestAnimationFrame;

init();
newScreen();
$(document).keypress(function (e) {
    if (e.which == 13 && gameReady == 1) { // Player holding enter 
		init();
		gameReady = 0;
        main();
    }
	if (e.which == 32 && minY == canvas.height) { // Player holding space
		bullets.push({
			x: hero.x + (hero.w/2),
			y: hero.y,
			w: 2,
			h: 6
		});
	}
	if (e.which == 8) { // Player holding backspace
		//hero.life = 5;
		init();
		gameReady = 0;
	}
});	