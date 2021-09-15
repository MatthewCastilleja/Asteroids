// Name any p5.js functions we use in `global` so Glitch can recognize them.
/* global
 *  createCanvas, colorMode, HSB, background, 
 *  width, height, mouseX, mouseY, mouseIsPressed
 *  fill, random, color, stroke
 *  rect, line, arc, ellipse
 *  sqrt, floor, PI
 *  collideCircleCircle
 */


let numAsteroids = 20, asteroids;
let particles;
let ship = [];
let bullets;
let level = 1;
let player1_score = 0;
let player2_score = 0;

let player1_lives, player2_lives;

const bullet_radius = 3;

function setup(){
  //createCanvas(windowWidth, windowHeight);
  createCanvas(800, 600);
  colorMode(HSB, 360, 100, 100);
  
  //init asteroids
  asteroids = [];
  for(let i=0; i<numAsteroids; i++)
    asteroids.push(new Asteroid(level));
  
  //init particles
  particles = [];
  
  //init bullets
  bullets = [];
  
  //init player lives
  player1_lives = player2_lives = 3;
  
  ship = [];
  
  //init ships
  let player1_ship = new Ship(0);
  let player2_ship = new Ship(1);
  ship.push(player1_ship);
  ship.push(player2_ship);
}

function draw(){
  background(10);
  
  for(let s of ship){
    if(!s.dead)
      s.update();          
  }
  
  for(const particle of particles)
    particle.update();
  for(const asteroid of asteroids)
    asteroid.update();
  for(const bullet of bullets)
    bullet.update();
  
  if(asteroids.length == 0) {
    level += 1;
    numAsteroids+=5;
    setup();
  }
  
  printBoard();
  
  if(ship[0].dead && ship[1].dead){
    document.getElementById('reset-container').style.display = 'flex';
    noLoop();
  }
}

function reset(){
  level = 1;
  player1_score = 0;
  player2_score = 0;

  player1_lives = 3;
  player2_lives = 3;

  setup();
  document.getElementById('reset-container').style.display = 'none';
  loop();
}

function printBoard(){
  textSize(35);
  stroke(0);
  fill(255);
  
  text(`LEVEL: ${level}`, 35, 35);
  
  text(`SCORE: ${player1_score}`, 0, height-35);
  text(`LIVES: ${player1_lives}`, 0, height-85);

  text(`SCORE: ${player2_score}`, width-200, height-35);
  text(`LIVES: ${player2_lives}`, width-200, height-85);
}

function keyPressed(){
  //ship 1 uses wasd
  if(key.toLowerCase() == 'w'){ //move forward
    ship[0].thrusting = true;
  } else if(key.toLowerCase() == 'a'){ //rotate left
    ship[0].changeAngle(-0.1);
  } else if(key.toLowerCase() == 'd'){ //rotate right
    ship[0].changeAngle(0.1);
  }
  if(key == 's'){ //shoot
    ship[0].shoot();
  }
  
  if(keyCode == UP_ARROW){ //mvoe forward
    ship[1].thrusting = true;
  } else if(keyCode == RIGHT_ARROW){ //rotate right
    ship[1].changeAngle(0.1);
  } else if(keyCode == LEFT_ARROW){ //rotate left
    ship[1].changeAngle(-0.1);
  }
  if(keyCode == DOWN_ARROW){ //shoot
    ship[1].shoot();
  }
}

function keyReleased(){
  let k = key.toLowerCase();
  if(k == 'w'){
    ship[0].thrusting = false;
  }
  if(k == 'a' || k == 'd'){
    ship[0].changeAngle(0);
  }
  if(keyCode == UP_ARROW){
    ship[1].thrusting = false;
  }
  if(keyCode == LEFT_ARROW || keyCode == RIGHT_ARROW){
    ship[1].changeAngle(0);
  }
}

//remove an object from its array
function deleteFromArray(target, arr){
  for(let i = 0; i < arr.length; i++){
    if(target == arr[i]){
      arr[i] = arr[arr.length-1];
      arr.pop();
      return;
    }
  }
}

//SHIP - GASHON
class Ship{
  constructor(id){
    this.id = id;
    this.pos = createVector(width/2, height/2); //ship initial position
    this.v = createVector(0, 0); //ship velocity
    this.a = createVector(); //acceleration constant
    this.r = 10; //ship size
    this.poly = [createVector(0, -this.r), createVector(-this.r, this.r*2), createVector(this.r, this.r*2)];
    this.heading = 0;
    this.angle = 0;
    this.thursting = false;
    this.lives = 3;
    this.score = 0;
    this.dead = false;
    this.c = color(random(60, 200));
  }
  
  update(){
    if(this.thrusting){
      this.thrust();  
    }
    this.display();
    this.checkTurn();
    this.checkBorder();
    this.checkAsteroids(); //check collision with asteroid
    this.pos.add(this.v); //add vel to position
    this.v.mult(0.99); //degrade velcocity
    
  }
  
  display(){
    push();
    translate(this.pos.x, this.pos.y);
    rotate(this.heading);
    noStroke();
    fill(this.c);
    
    beginShape();
    for (const { x, y } of this.poly)  vertex(x, y);
    endShape(CLOSE);
    
    pop(); //reset translate??
    
  }
  
  thrust(){
    this.a = p5.Vector.fromAngle(this.heading + 1.5*PI);
    line(this.a.x, this.a.y, 0, 0);
    this.v.add(this.a.mult(0.15));
  }
  
  shoot(){
    let new_bullet = new Bullet(this.pos, this.heading + 1.5*PI, this);
    bullets.push(new_bullet);
  }
  
  changeAngle(ang){
    this.angle = ang;
  }
  
  checkTurn(){
    this.heading += this.angle;
  }
  
  addScore(){
    if(this.id == 0){
      player1_score++;
    } else{
      player2_score++;
    }
  }
  
  decreaseLife(){
    if(this.id == 0){
      player1_lives--;
    } else{
      player2_lives--;
    }
  }
  
  respawn(count = 0){
    if(count >= 1000) console.log("Cannot Respawn");
    
    this.pos = createVector(random(0, width), random(0, height));
    for(const asteroid of asteroids){ //respawn ship away from any asteroid
      if(collideCircleCircle(asteroid.x, asteroid.y, asteroid.radius*2, this.pos.x, this.pos.y, abs(this.poly[0].y*2))){
          this.pos = createVector(random(0, width), random(0, height));
          this.respawn(count++);
          return
        } 
      }
  }
  
  checkAsteroids(){ //check collision between asteroid and ship
    for(const asteroid of asteroids){
      let hit = collideCircleCircle(asteroid.x, asteroid.y, asteroid.radius*2, this.pos.x, this.pos.y, abs(this.poly[0].y*2));
      if( hit ){
        for(let i=0; i< 100; i++){
          particles.push(new Particle(this.pos.x, this.pos.y, 5));
        }
        if(this.lives > 0){
          this.lives--;
          this.decreaseLife();
          this.respawn(); //respawn
        } else{
          //search and remove from array
          this.dead = true;
        }
      }
    }
  }
  
  //wrap to other side at collision with screen border
  checkBorder(){
    if(this.pos.x < 0){
      this.pos.x = width;
    } else if(this.pos.x > width){
      this.pos.x = 0;
    } else if(this.pos.y < 0){
      this.pos.y = height;
    } else if(this.pos.y > height){
      this.pos.y = 0;
    } 
  }

}

//Bullets - Gashon
class Bullet{
  constructor(position_, angle_, ship_){
    this.pos = position_.copy();
    this.v =  p5.Vector.fromAngle(angle_).copy().mult(6);
    this.r = bullet_radius;
    this.ship_ = ship_;
  }
  update(){
    this.display();
    this.move();
    this.checkCollision();
    this.checkOffScreen();
  }
  display(){
    ellipse(this.pos.x, this.pos.y, this.r*2);
  }
  move(){
    this.pos.add(this.v);
  }
  checkOffScreen(){ //delete bullet if it goes offscreen
    if(this.pos.x < 0 || this.pos.x > width || this.pos.y < 0 || this.pos.y > height){
      deleteFromArray(this, bullets);
    }
  }
  //call .hit() for the asteroid
  checkCollision(){
    //after collision, remove bullet and render asteroid hit
    for(const asteroid of asteroids){
      if(collideCircleCircle(this.pos.x, this.pos.y, this.r*2, asteroid.x, asteroid.y, asteroid.radius*2)){
        asteroid.hit();
        this.ship_.addScore();
        deleteFromArray(this, bullets);
        return;
      }
    }
  }
}


// ASTEROID - MATTHEW
class Asteroid {
  constructor(level, x = random(0, width), y = 0, radius = random(30, 40)) {
    this.x = x;
    this.y = y;
    this.radius = radius;//random(25, 30);
    this.xVel = random(-level, level);
    this.yVel = random(-level, level);
    this.angle = random(2*PI);
    this.alpha = this.xVel * PI/100;
    this.craterColors = [random(40,60), random(40,60), random(40,60)];
  }
  
  update() {
    this.move();
    this.display();
    for(const asteroid of asteroids)
      if(asteroid != this)
        this.collideWith(asteroid);
  }
  
  display() {
    fill(0, 0, 100, .5);
    stroke(0, 0, 100);
    ellipse(this.x, this.y, this.radius*2);
    fill(0, 0, this.craterColors[0]);
    ellipse(this.x+cos(this.angle)*this.radius*.75, this.y+sin(this.angle)*this.radius*.75, this.radius/8);
    fill(0, 0, this.craterColors[1]);
    ellipse(this.x+cos(this.angle-2*PI/3)*this.radius*.5, this.y+sin(this.angle-2*PI/3)*this.radius*.5, this.radius/4);
    fill(0, 0, this.craterColors[2]);
    ellipse(this.x+cos(this.angle-4*PI/3)*this.radius*.25, this.y+sin(this.angle-4*PI/3)*this.radius*.25, this.radius/2);
  }
  
  move() {
    this.x += this.xVel;
    this.y += this.yVel;
    
    if(this.x - this.radius > width)
      this.x = -this.radius;
    else if(this.x + this.radius < 0)
      this.x = width + this.radius;
    else if(this.y - this.radius > height)
      this.y = -this.radius;
    else if(this.y + this.radius < 0)
      this.y = height + this.radius;
    
    this.angle += this.alpha;
    this.alpha = this.xVel * PI / 100;
  }
  
  // If it hits another asteroid,
  // Get the vector between the two circles and scale it down so that the magnitude
  // is the same as the magnitude of the velocity vector. Then add this to the original
  // velocity vector. Then scale the new vector up to the original magnitude of the first
  // velocity vector.
  collideWith(asteroid) {
    if(collideCircleCircle(this.x, this.y, this.radius*2, asteroid.x, asteroid.y, asteroid.radius*2)) {
      let yDiff = this.y - asteroid.y;
      let xDiff = this.x - asteroid.x;
      let magnitudeVels = sqrt(this.xVel**2 + this.yVel**2);
      let magnitudeDiff = sqrt(xDiff**2 + yDiff**2);
      let xAdded = this.xVel + xDiff * (magnitudeVels/magnitudeDiff);
      let yAdded = this.yVel + yDiff * (magnitudeVels/magnitudeDiff);
      let magnitudeAdded = sqrt(xAdded**2 + yAdded**2);
      
      this.xVel = xAdded * (magnitudeVels/magnitudeAdded);
      this.yVel = yAdded * (magnitudeVels/magnitudeAdded);
    }
  }
  
  hit() {
    if(this.radius > 30)
      this.split();
    else
      this.explode();
  }
  
  split() {
    asteroids.push(new Asteroid(level, this.x, this.y, this.radius/2));
    asteroids.push(new Asteroid(level, this.x, this.y, this.radius/2));
    asteroids.splice(asteroids.indexOf(this), 1);
  }
  
  explode() {
    for(let i=0; i<100; i++)
      particles.push(new Particle(this.x, this.y, this.radius));
    asteroids.splice(asteroids.indexOf(this), 1);
  }
}

// PARTICLE - MATTHEW
class Particle {
  constructor(x, y, radius) {
    this.x = x + random(-radius, radius);
    this.y = y + random(-radius, radius);
    this.angle = random(2*PI);
    this.magnitude = random(3);
    this.xVel = this.magnitude * cos(this.angle);
    this.yVel = this.magnitude * sin(this.angle);
    this.frames = 60;
  }
  
  update() {
    this.move();
    this.draw();
    if(this.frames <= 0)
      particles.splice(particles.indexOf(this), 1);
  }
  
  move() {
    this.x += this.xVel;
    this.y += this.yVel;
  }
  
  draw() {
    this.frames -= 1;
    fill(random(50), 100, 100);
    stroke(random(50), 100, 100);
    ellipse(this.x, this.y, 3);
  }
}
