import * as THREE from 'three';

const scene    = new THREE.Scene();
const camera   = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );
const renderer = new THREE.WebGLRenderer({ antialias: true });

renderer.setSize( window.innerWidth, window.innerHeight );
document.body.appendChild( renderer.domElement );

const firstLayerGeometry  = new THREE.BoxGeometry(0.7, 0.7, 0.7);
const otherLayersGeometry = new THREE.BoxGeometry(0.6, 0.6, 0.6);
const firstLayerMaterial  = new THREE.MeshLambertMaterial({ color: 0xFFFFFF });
const otherLayersMaterial = new THREE.MeshLambertMaterial({ color: 0x444444 });

// BEGIN - GAME OF LIFE STUFF
var gameOfLife = {
  grid: [],
  oldGrids: [],
  ROWS: 30,
  COLS: 30,
  NUMBER_OF_CELLS: 100,
  NUMBER_OF_LEVELS: 20
};

const createBlankGrid = () => {
  let newGrid = [];

  for (let y = 0; y < gameOfLife.ROWS; y++) {
    newGrid.push(new Array(gameOfLife.COLS).fill(0));
  }

  return newGrid;
};

const randRange = (min, max) => { // min and max included 
  return Math.floor(Math.random() * (max - min) + min)
}

const initGrid = () => {
  gameOfLife.grid = createBlankGrid();
  for (var i = 0; i < gameOfLife.NUMBER_OF_CELLS; i++) {
    gameOfLife.grid[randRange(0, gameOfLife.COLS)][randRange(0, gameOfLife.ROWS)] = 1;
  }
};

const countNeighbors = (x, y) => {
  let neighbors = 0;

  for (let dx = -1; dx <= 1; dx++) {
    for (let dy = -1; dy <= 1; dy++) {
      if (dx != 0 || dy != 0) {
        let nx = x + dx;
        let ny = y + dy;
        if ((nx >= 0 && nx < gameOfLife.COLS) &&
            (ny >= 0 && ny < gameOfLife.ROWS)) 
          neighbors += gameOfLife.grid[ny][nx];
      }
    }
  }

  return neighbors;
};
// END - GAME OF LIFE STUFF

let objects = [];

const drawGrid = (grid, level) => {
  let layer = new THREE.Group();

  for (let col = 0; col < gameOfLife.COLS; col++) {
    for (let row = 0; row < gameOfLife.ROWS; row++) {
      if (grid[col][row] === 1) {
        let x = row - gameOfLife.ROWS / 2;
        let y = col - gameOfLife.COLS / 2;
        let cube;
        
        if (level === 0) {
          cube = new THREE.Mesh(firstLayerGeometry, firstLayerMaterial);
        } else {
          cube = new THREE.Mesh(otherLayersGeometry, otherLayersMaterial);
        }

        cube.position.x = x;
        cube.position.y = 10 - level;
        cube.position.z = y;

        layer.add(cube);
      }
    }
  }

  scene.add(layer);
  objects.push(layer);
};

const applyGameOfLifeRules = () => {
  /*
    These simple rules are as follows: 
    1. If the cell is alive, then it stays alive if:
     it has either 2 or 3 live neighbors; 
    2. If the cell is dead, then it springs to life only:
     it has 3 live neighbors.
  */
  let newGrid = createBlankGrid();

  for (let y = 0; y < gameOfLife.ROWS; y++) {
    for (let x = 0; x < gameOfLife.COLS; x++) {
      let neighbors = countNeighbors(x, y);
      if (gameOfLife.grid[y][x] === 1) { // if the cell is live => rule #1
        if (neighbors === 2 || neighbors === 3) {
          newGrid[y][x] = 1;
        } else {
          newGrid[y][x] = 0;
        }
      } else { // if the cell is dead => rule #2
        if (neighbors === 3) {
          newGrid[y][x] = 1;
        }
      }
    }
  }

  // counting live cells
  let liveCells = 0;
  for (let y = 0; y < gameOfLife.ROWS; y++) {
    for (let x = 0; x < gameOfLife.COLS; x++) {
      if(newGrid[y][x] === 1) liveCells++;
    }
  }

  // if there are few cells, create some random 
  if (liveCells < gameOfLife.NUMBER_OF_CELLS / 2) {
    let delta = gameOfLife.NUMBER_OF_CELLS / 2 - liveCells;
    for (var i = 0; i < delta; i++) {
      newGrid[randRange(0, gameOfLife.COLS)][randRange(0, gameOfLife.ROWS)] = 1;
    }
  }

  gameOfLife.oldGrids.push(gameOfLife.grid);
  if (gameOfLife.oldGrids.length > gameOfLife.NUMBER_OF_LEVELS) {
    gameOfLife.oldGrids.shift();
  }
  gameOfLife.grid = newGrid;
};

let light1, light2, light3, light4;

const main = () => {
  camera.position.z = 25;
  camera.position.y = 40;
  camera.rotation.x = -Math.PI / 3;

  //lights
  scene.add(new THREE.HemisphereLight(0xffffff, 0x000000, 2.0));

  const sphere = new THREE.SphereGeometry( 0.5, 16, 8 );

  light1 = new THREE.PointLight( 0xff0040, 400 );
  light1.add( new THREE.Mesh( sphere, new THREE.MeshBasicMaterial( { color: 0xff0040 } ) ) );
  scene.add( light1 );

  light2 = new THREE.PointLight( 0x0040ff, 400 );
  light2.add( new THREE.Mesh( sphere, new THREE.MeshBasicMaterial( { color: 0x0040ff } ) ) );
  scene.add( light2 );

  light3 = new THREE.PointLight( 0x80ff80, 400 );
  light3.add( new THREE.Mesh( sphere, new THREE.MeshBasicMaterial( { color: 0x80ff80 } ) ) );
  scene.add( light3 );

  light4 = new THREE.PointLight( 0xffaa00, 400 );
  light4.add( new THREE.Mesh( sphere, new THREE.MeshBasicMaterial( { color: 0xffaa00 } ) ) );
  scene.add( light4 );  

  initGrid();  
};


main();

let clock = new THREE.Clock();
let delta = 0;
let interval = 1 / 30;

function animate() {
	requestAnimationFrame( animate );
  delta += clock.getDelta();

  if (delta  > interval) {
    // clear the objects array
    objects = [];
    // draw cubes 
    drawGrid(gameOfLife.grid, 0);
    for (let level = 1; level <= gameOfLife.oldGrids.length; level++) {
      drawGrid(gameOfLife.oldGrids[gameOfLife.oldGrids.length - level], level);
    }
    applyGameOfLifeRules();

    renderer.render( scene, camera );

    // remove all cubes from scene
    objects.forEach((layer) => scene.remove(layer));

    // reset the delta time
    delta = delta % interval;
  }

  const time = Date.now() * 0.0005;

  light1.position.x = Math.sin( time * 0.7 ) * 30;
  light1.position.y = Math.cos( time * 0.5 ) * 40;
  light1.position.z = Math.cos( time * 0.3 ) * 30;

  light2.position.x = Math.cos( time * 0.3 ) * 30;
  light2.position.y = Math.sin( time * 0.5 ) * 40;
  light2.position.z = Math.sin( time * 0.7 ) * 30;

  light3.position.x = Math.sin( time * 0.7 ) * 30;
  light3.position.y = Math.cos( time * 0.3 ) * 40;
  light3.position.z = Math.sin( time * 0.5 ) * 30;

  light4.position.x = Math.sin( time * 0.3 ) * 30;
  light4.position.y = Math.cos( time * 0.7 ) * 40;
  light4.position.z = Math.sin( time * 0.5 ) * 30;
}

animate();