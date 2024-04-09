import * as THREE from 'three';

const scene    = new THREE.Scene();
const camera   = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );
const renderer = new THREE.WebGLRenderer();

renderer.setSize( window.innerWidth, window.innerHeight );
document.body.appendChild( renderer.domElement );

const geometry = new THREE.BoxGeometry(0.6, 0.6, 0.6);
const material = new THREE.MeshBasicMaterial({ color: 0xaaaaaa });

// BEGIN - GAME OF LIFE STUFF
var gameOfLife = {
  grid: [],
  oldGrids: [],
  ROWS: 20,
  COLS: 20,
  NUMBER_OF_CELLS: 50,
  NUMBER_OF_LEVELS: 30
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

let rotation = 0;

const drawGrid = (grid, level) => {
  let layer = new THREE.Group();

  for (let col = 0; col < gameOfLife.COLS; col++) {
    for (let row = 0; row < gameOfLife.ROWS; row++) {
      if (grid[col][row] === 1) {
        let x = row - gameOfLife.ROWS / 2;
        let y = col - gameOfLife.COLS / 2;
        let cube = new THREE.Mesh(geometry, material);

        cube.position.x = x;
        cube.position.y = 10 - level;
        cube.position.z = y;

        layer.add(cube);
      }
    }
  }

  layer.rotation.y = rotation * 0.02 * level;
  scene.add(layer);
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


const main = () => {
  initGrid();  
};

camera.position.z = 32;
camera.position.y = -5;

main();

let clock = new THREE.Clock();
let delta = 0;
let interval = 1 / 30;

function animate() {
	requestAnimationFrame( animate );
  delta += clock.getDelta();

  if (delta  > interval) {
    // draw cubes 
    drawGrid(gameOfLife.grid, 0);
    for (let level = 1; level <= gameOfLife.oldGrids.length; level++) {
      drawGrid(gameOfLife.oldGrids[gameOfLife.oldGrids.length - level], level);
    }
    applyGameOfLifeRules();

    renderer.render( scene, camera );

    // rotate the layers
    rotation += 0.01;

    // remove all cubes from scene
    for(let i = scene.children.length - 1; i >= 0; i--) { 
      scene.remove(scene.children[i]); 
    }

    delta = delta % interval;
  }
}

animate();