const { Engine, Render, Body, Events, Runner, World, Bodies } = Matter;

const cellsHorizontal = 14;
const cellsVertical = 10;

const width = window.innerWidth;
const height = window.innerHeight;

const unitLengthX = width / cellsHorizontal;
const unitLengthY = width / cellsVertical;

const engine = Engine.create();
engine.world.gravity.y = 0;

const { world } = engine;

const render = Render.create({
  element: document.body,
  engine: engine,
  options: {
    wireframes: false,
    width,
    height,
  },
});

Render.run(render);
Runner.run(Runner.create(), engine);

// Walls
const walls = [
  Bodies.rectangle(width / 2, 0, width, 5, { isStatic: true }),
  Bodies.rectangle(width / 2, height, width, 5, { isStatic: true }),
  Bodies.rectangle(0, height / 2, 5, height, { isStatic: true }),
  Bodies.rectangle(width, height / 2, 5, height, { isStatic: true }),
];

World.add(world, walls);

const shuffle = (arr) => {
  let counter = arr.length;

  while (counter > 0) {
    const index = Math.floor(Math.random() * counter);
    counter--;

    const temp = arr[counter];
    arr[counter] = arr[index];
    arr[index] = temp;
  }

  return arr;
};

const grid = Array(cellsVertical)
  .fill(false)
  .map(() => Array(cellsHorizontal).fill(false));

const verticals = Array(cellsVertical)
  .fill(false)
  .map(() => Array(cellsHorizontal - 1).fill(false));

const horizontals = Array(cellsVertical - 1)
  .fill(false)
  .map(() => Array(cellsHorizontal).fill(false));

const startRow = Math.floor(Math.random() * cellsVertical);
const startCol = Math.floor(Math.random() * cellsHorizontal);

const recurseThroughCells = (row = 1, col = 1) => {
  // If I visited the cell at the [row, col], then return
  if (grid[row][col]) {
    return;
  }
  // Mark this cell as being visited
  grid[row][col] = true;

  // Assemble randomly ordered list for neighbors
  const neighbors = shuffle([
    [row - 1, col, "up"],
    [row, col + 1, "right"],
    [row + 1, col, "down"],
    [row, col - 1, "left"],
  ]);

  // for each neighbor...
  for (let neighbor of neighbors) {
    const [nextRow, nextCol, direction] = neighbor;
    // see if the neighbor is out of bounds .
    if (
      nextRow < 0 ||
      nextRow >= cellsVertical ||
      nextCol < 0 ||
      nextCol >= cellsHorizontal
    ) {
      continue;
    }

    // if we visited this neighbor continue to the next one
    if (grid[nextRow][nextCol]) {
      continue;
    }

    // Remove a wall from either horizontals or verticals
    if (direction === "left") {
      verticals[row][col - 1] = true;
    } else if (direction === "right") {
      verticals[row][col] = true;
    } else if (direction === "up") {
      horizontals[row - 1][col] = true;
    } else if (direction === "down") {
      horizontals[row][col] = true;
    }

    recurseThroughCells(nextRow, nextCol);
  }

  // visit the next cell.
};

recurseThroughCells(startRow, startCol);

// drawing horizontal walls on the maze
horizontals.forEach((row, rowIdx) => {
  row.forEach((open, openIdx) => {
    if (open) {
      return;
    }
    const wall = Bodies.rectangle(
      openIdx * unitLengthX + unitLengthX / 2,
      rowIdx * unitLengthY + unitLengthY,
      unitLengthX,
      5,
      {
        isStatic: true,
        label: "wall",
        render: {
          fillStyle: "#02a9f7",
        },
      }
    );
    World.add(world, wall);
  });
});

// drawing vertical walls on the maze
verticals.forEach((row, rowIdx) => {
  row.forEach((open, openIdx) => {
    if (open) {
      return;
    }
    const wall = Bodies.rectangle(
      openIdx * unitLengthX + unitLengthX,
      rowIdx * unitLengthY + unitLengthY / 2,
      5,
      unitLengthY,
      {
        isStatic: true,
        label: "wall",
        render: {
          fillStyle: "#02a9f7",
        },
      }
    );
    World.add(world, wall);
  });
});

// Goal
const goal = Bodies.rectangle(
  width - unitLengthX / 2,
  height - unitLengthY / 2,
  unitLengthX * 0.7,
  unitLengthY * 0.7,
  { isStatic: true, label: "goal", render: { fillStyle: "red" } }
);
World.add(world, goal);

// Ball
const ballRadius = Math.min(unitLengthX, unitLengthY) / 4;
const ball = Bodies.circle(unitLengthX / 2, unitLengthY / 2, ballRadius, {
  label: "ball",
  render: {
    fillStyle: "red",
  },
});

World.add(world, ball);

document.addEventListener("keydown", (e) => {
  const { x, y } = ball.velocity;

  if (e.keyCode === 87) {
    Body.setVelocity(ball, { x, y: y - 5 });
  }

  if (e.keyCode === 68) {
    Body.setVelocity(ball, { x: x + 5, y });
  }

  if (e.keyCode === 83) {
    Body.setVelocity(ball, { x, y: y + 5 });
  }

  if (e.keyCode === 65) {
    Body.setVelocity(ball, { x: x - 5, y });
  }
});

// Win Condition
Events.on(engine, "collisionStart", (e) => {
  e.pairs.forEach((collision) => {
    const labels = ["ball", "goal"];
    if (
      labels.includes(collision.bodyA.label) &&
      labels.includes(collision.bodyB.label)
    ) {
      world.gravity.y = 1;
      document.querySelector(".winner").classList.remove("hidden");
      world.bodies.forEach((item) => {
        if (item.label === "wall") {
          Body.setStatic(item, false);
        }
      });
    }
  });
});
