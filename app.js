document.addEventListener('DOMContentLoaded', () => {
    const TETRIS_GAME = document.getElementById('tetrisGame');
    const HEIGHT = 20;
    const WIDTH = 10;
    const MINI_GRID_DIM = 4;
    const START_POSITION = Math.ceil((WIDTH - 4) / 2);
    const N_NEXT_PIECES_VISIBLE = 1;
    const STARTING_TIMER = 1000;
    var score = 0;
    var bestScore = 0;

    document.addEventListener('keydown', newGame);

    // GAME ELEMENTS
    // Grid creation 
    var mainGridSection = createGridSection(HEIGHT, WIDTH, 'main');
    var nextGridSection = createGridSection(MINI_GRID_DIM, MINI_GRID_DIM, 'next');
    var holdGridSection = createGridSection(MINI_GRID_DIM, MINI_GRID_DIM, 'hold');

    nextGridSection.querySelector('.nextGridHeader').innerHTML = 'NEXT';
    holdGridSection.querySelector('.holdGridHeader').innerHTML = 'HOLD';

    scoreDiv = document.createElement('div');
    bestScoreDiv = document.createElement('div');
    scoreDiv.innerHTML = 'SCORE 0';
    bestScoreDiv.innerHTML = 'BEST 0';
    mainGridSection.querySelector('.mainGridHeader').appendChild(scoreDiv);
    mainGridSection.querySelector('.mainGridHeader').appendChild(bestScoreDiv);

    mainGridSection.querySelector('.mainGrid').autofocus = true;

    TETRIS_GAME.appendChild(holdGridSection);
    TETRIS_GAME.appendChild(mainGridSection);
    TETRIS_GAME.appendChild(nextGridSection);
    var blocks = Array.from(mainGridSection.querySelectorAll('.block'));
    var blockLines = Array.from(mainGridSection.querySelectorAll('.blockLine'));

    // Tetrominoes rotations and colors in the main grid
    const tetrominoes = [
        {
            'name': 'i',
            'rotations': [
                [0, 1, 2, 3],
                [1, WIDTH + 1, 2 * WIDTH + 1, 3 * WIDTH + 1],
                [0, 1, 2, 3],
                [2, WIDTH + 2, 2 * WIDTH + 2, 3 * WIDTH + 2],
            ],
            'color': 'cyan'
        },
        {
            'name': 'j',
            'rotations': [
                [0, WIDTH, WIDTH + 1, WIDTH + 2],
                [1, 2, WIDTH + 1, 2 * WIDTH + 1],
                [WIDTH, WIDTH + 1, WIDTH + 2, 2 * WIDTH + 2],
                [1, WIDTH + 1, 2 * WIDTH, 2 * WIDTH + 1],
            ],
            'color': 'blue'
        },
        {
            'name': 'l',
            'rotations': [
                [2, WIDTH, WIDTH + 1, WIDTH + 2],
                [1, WIDTH + 1, 2 * WIDTH + 1, 2 * WIDTH + 2],
                [WIDTH, WIDTH + 1, WIDTH + 2, 2 * WIDTH],
                [0, 1, WIDTH + 1, 2 * WIDTH + 1],
            ],
            'color': 'darkorange'
        },
        {
            'name': 'o',
            'rotations': [
                [1, 2, WIDTH + 1, WIDTH + 2],
                [1, 2, WIDTH + 1, WIDTH + 2],
                [1, 2, WIDTH + 1, WIDTH + 2],
                [1, 2, WIDTH + 1, WIDTH + 2]
            ],
            'color': 'yellow'
        },
        {
            'name': 's',
            'rotations': [
                [2, 3, WIDTH + 1, WIDTH + 2],
                [2, WIDTH + 2, WIDTH + 3, 2 * WIDTH + 3],
                [WIDTH + 2, WIDTH + 3, 2 * WIDTH + 1, 2 * WIDTH + 2],
                [1, WIDTH + 1, WIDTH + 2, 2 * WIDTH + 2],
            ],
            'color': 'lime'
        },
        {
            'name': 't',
            'rotations': [
                [0, 1, 2, WIDTH + 1],
                [2, WIDTH + 1, WIDTH + 2, 2 * WIDTH + 2],
                [WIDTH + 1, 2 * WIDTH, 2 * WIDTH + 1, 2 * WIDTH + 2],
                [0, WIDTH, WIDTH + 1, 2 * WIDTH],
            ],
            'color': 'magenta'
        },
        {
            'name': 'z',
            'rotations': [
                [0, 1, WIDTH + 1, WIDTH + 2],
                [2, WIDTH + 1, WIDTH + 2, 2 * WIDTH + 1],
                [WIDTH, WIDTH + 1, 2 * WIDTH + 1, 2 * WIDTH + 2],
                [1, WIDTH, WIDTH + 1, 2 * WIDTH],
            ],
            'color': 'red'
        }
    ]

    // Init first tetromino
    var tetrominoesStack = randomTetrominoesSet();
    var currentTetromino = tetrominoesStack.shift();
    var currentRotationIndex = 0;
    var currentPosition = START_POSITION;
    var heldTetromino = undefined;
    var canHold = true;

    // Basic game functions
    // Tetromino gestion
    function randomTetrominoesSet() {
        // Fisher-Yates shuffle (actually random)
        let randomSet = JSON.parse(JSON.stringify(tetrominoes)); // Deep copy
        for (let i = randomSet.length - 1; i > 0; i--) {
            let j = Math.floor(Math.random() * i);
            let temp = randomSet[i];
            randomSet[i] = randomSet[j];
            randomSet[j] = temp;
        }
        return randomSet;
    }
    function blockPositions(tetromino = currentTetromino, rotationIndex = currentRotationIndex, position = currentPosition) {
        // If the parameters are not precised, they take the value of the falling tetromino 
        return tetromino.rotations[rotationIndex].map(blockIndex => blockIndex + position);
    }
    function colorize(color = currentTetromino.color) {
        blockPositions().forEach(blockIndex =>
            blocks[blockIndex].style.backgroundColor = color);
    }
    function unColorize() {
        blockPositions().forEach(blockIndex =>
            blocks[blockIndex].style.backgroundColor = '');
    }
    function updateMiniGrid(grid, tetromino) {
        let miniGridBlocks = grid.querySelectorAll('.block');
        Array.from(miniGridBlocks).forEach((block, blockIndex) => {
            // For each block in the mini-grid, check if the index is one of the index of the tetromino being displayed
            let indexInMainGrid = (blockIndex % MINI_GRID_DIM) + WIDTH * Math.floor(blockIndex / MINI_GRID_DIM);
            if (tetromino.rotations[0].includes(indexInMainGrid)) {
                block.style.backgroundColor = tetromino.color;
            } else {
                block.style.backgroundColor = '';
            }
        });
    }
    function unstackNextTetromino() {
        currentTetromino = tetrominoesStack.shift();
        currentRotationIndex = 0;
        currentPosition = START_POSITION;


        if (tetrominoesStack.length < N_NEXT_PIECES_VISIBLE) {
            tetrominoesStack = tetrominoesStack.concat(randomTetrominoesSet());
        }
        updateMiniGrid(nextGridSection, tetrominoesStack[0]);
    }
    function freezeTetromino() {
        blockPositions().forEach(blockIndex =>
            blocks[blockIndex].classList.add('filled'));
    }
    // Grid gestion
    function createGridSection(nLine, nColumn, sectionName) {
        let gridSection = document.createElement('div');
        gridSection.classList.add('gridSection');
        gridSection.classList.add(sectionName + 'GridSection');

        let gridHeader = document.createElement('div');
        gridHeader.classList.add('gridHeader');
        gridHeader.classList.add(sectionName + 'GridHeader');
        gridSection.appendChild(gridHeader);

        let grid = document.createElement('div');
        grid.classList.add('grid');
        grid.classList.add(sectionName + 'Grid');
        gridSection.appendChild(grid);

        for (i = 0; i < nLine; i++) {
            createLine(grid, nColumn);
        }

        return gridSection;
    }
    function resetGrids() {
        Array.from(TETRIS_GAME.querySelectorAll('.block')).forEach(block => {
            block.style.backgroundColor = '';
            block.classList.remove('filled');
        });
    }
    function createLine(grid = mainGridSection.querySelector('.mainGrid'), nColumn = WIDTH) {
        let blockLine = document.createElement('div');
        blockLine.className = 'blockLine';
        grid.insertBefore(blockLine, grid.firstChild);
        for (let i = 0; i < nColumn; i++) {
            let block = document.createElement('div');
            block.className = 'block';
            blockLine.appendChild(block);
        }
    }
    function removeLine(lineIndex) {
        Array.from(blockLines[lineIndex].children).forEach(block => block.parentNode.removeChild(block));
        blockLines[lineIndex].parentNode.removeChild(blockLines[lineIndex]);
    }
    function cleanCompletedLines() {
        let n = 0;
        for (let i = 0; i < HEIGHT; i++) {
            if (blocks.slice(i * WIDTH, (i + 1) * WIDTH).every(block => block.classList.contains('filled'))) {
                removeLine(i);
                createLine();
                blocks = Array.from(mainGridSection.querySelectorAll('.block'));
                blockLines = Array.from(mainGridSection.querySelectorAll('.blockLine'));
                n++;
            }
        }
        return n;
    }
    // Game points mechanics
    function updateScores(nLinesCleared) {
        switch (nLinesCleared) {
            case 0:
                points = 10;
                break;
            case 1:
                points = 50;
                break;
            case 2:
                points = 100;
                break;
            case 3:
                points = 200;
                break;
            case 4:
                points = 500;
                break;
        }
        score += points;
        if (bestScore < score) {
            bestScore = score;
        }
        scoreDiv.innerHTML = 'SCORE ' + score;
        bestScoreDiv.innerHTML = 'BEST ' + bestScore;
    }
    function accelerate() {
        let newTimer = STARTING_TIMER;
        if (score > 1000) {
            newTimer = 800;
        }
        if (score > 2000) {
            newTimer = 600;
        }
        if (score > 3000) {
            newTimer = 400;
        }
        if (score > 4000) {
            newTimer = 200;
        }
        if (score > 5000) {
            newTimer = 100;
        }
        clearInterval(timerId)
        timerId = setInterval(moveDown, newTimer);
    }

    // User functions
    function newGame() {
        resetGrids();
        updateMiniGrid(nextGridSection, tetrominoesStack[0]);

        colorize();

        score = 0;
        scoreDiv.innerHTML = 'SCORE 0';

        document.removeEventListener('keydown', newGame);
        document.addEventListener('keydown', userAction);
        timerId = setInterval(moveDown, STARTING_TIMER);

    }
    function gameOver() {
        clearInterval(timerId);
        document.removeEventListener('keydown', userAction);
        document.addEventListener('keydown', newGame);
    }
    function userAction(event) {
        switch (event.keyCode) {
            case 40:
                moveDown();
                break;
            case 37:
                moveLeft();
                break;
            case 39:
                moveRight();
                break;
            case 38:
                rotate();
                break;
            case 32:
                crash();
                break;
            case 72:
                hold();
                break;
        }
    }
    function moveDown() {
        let isMoving = true; // For the use of the crash() function
        if (blockPositions().every(
            blockIndex =>
                blockIndex < (HEIGHT - 1) * WIDTH && // If the tetromino is not on the last line AND
                !blocks[blockIndex + WIDTH].classList.contains('filled') // All blocks below are not filled
        )) {
            unColorize();
            currentPosition += WIDTH;
            colorize();
        } else {
            isMoving = false;
            freezeTetromino();
            updateScores(cleanCompletedLines());
            unstackNextTetromino();
            if (blockPositions().some(blockIndex => blocks[blockIndex].classList.contains('filled'))) {
                colorize('black');
                gameOver();
            } else {
                colorize();
                accelerate();
                canHold = true;
            }
        }
        return isMoving;
    }
    function moveLeft() {
        if (blockPositions().every(
            blockIndex =>
                blockIndex % WIDTH !== 0 && // If the tetromino is not blocked by the wall AND
                !blocks[blockIndex - 1].classList.contains('filled') // Not blocked by another block
        )) {
            unColorize();
            currentPosition--;
            colorize();
        } else {
            // Play a denied sound
        }
    }
    function moveRight() {
        if (blockPositions().every(
            blockIndex =>
                blockIndex % WIDTH !== WIDTH - 1 && // If the tetromino is not blocked by the wall AND
                !blocks[blockIndex + 1].classList.contains('filled') // Not blocked by another block
        )) {
            unColorize();
            currentPosition++;
            colorize();
        } else {
            // Play a denied sound
        }
    }
    function rotate(shift = 0) {
        let nextRotationIndex = (currentRotationIndex + 1) % currentTetromino.rotations.length; // Overkill but you never know
        let nextBlockPositions = blockPositions(currentTetromino, nextRotationIndex, currentPosition + shift);

        let currentColumns = blockPositions().map(blockPosition => blockPosition % WIDTH);
        let nextColumns = nextBlockPositions.map(blockPosition => blockPosition % WIDTH);

        let columnRange = [...new Set(nextColumns)].length;
        if (currentColumns.some(column => column < columnRange) && nextColumns.some(column => column > WIDTH - columnRange)) {
            // Collision with left wall
            rotate(shift + 1);
            return;
        } else if (currentColumns.some(column => column > WIDTH - columnRange) && nextColumns.some(column => column < columnRange)) {
            // Collision with right wall
            rotate(shift - 1);
            return;
        }

        if (nextBlockPositions.every(blockIndex => !blocks[blockIndex].classList.contains('filled'))) {
            unColorize();
            currentRotationIndex = nextRotationIndex;
            currentPosition += shift;
            colorize();
        }
    }

    function crash() {
        while (moveDown()) { } // If the piece couldn't move , moveDown returned false and the loop stops
    }
    function hold() {
        if (canHold) {
            unColorize();
            if (heldTetromino) {
                // Swap tetrominoes
                let temp = heldTetromino;
                heldTetromino = currentTetromino;
                currentTetromino = temp;
                currentRotationIndex = 0;
                currentPosition = START_POSITION;
            } else {
                heldTetromino = currentTetromino;
                unstackNextTetromino();
            }
            colorize();
            updateMiniGrid(holdGridSection, heldTetromino);
            canHold = false;
        }
    }
});