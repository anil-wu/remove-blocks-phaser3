const config = {
    type: Phaser.AUTO,
    width: 600,
    height: 600,
    backgroundColor: '#2d2d2d',
    parent: 'game-container',
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};

const game = new Phaser.Game(config);

const TILE_SIZE = 70;
const ROWS = 8;
const COLS = 8;
const OFFSET_X = (600 - COLS * TILE_SIZE) / 2 + TILE_SIZE / 2;
const OFFSET_Y = (600 - ROWS * TILE_SIZE) / 2 + TILE_SIZE / 2;
const TILE_COLORS = [0xff0000, 0x00ff00, 0x0000ff, 0xffff00, 0xff00ff, 0x00ffff];

let board = [];
let selectedTile = null;
let canMove = true;

function preload() {
    // Generate textures programmatically
    const graphics = this.make.graphics({ x: 0, y: 0, add: false });
    
    TILE_COLORS.forEach((color, index) => {
        graphics.clear();
        graphics.fillStyle(color, 1);
        graphics.fillRoundedRect(0, 0, TILE_SIZE - 4, TILE_SIZE - 4, 10);
        graphics.generateTexture('tile_' + index, TILE_SIZE - 4, TILE_SIZE - 4);
    });
}

function create() {
    createBoard.call(this);
    this.input.on('pointerdown', onPointerDown, this);
    this.input.on('pointerup', onPointerUp, this);
    // Handle case where mouse is released outside game canvas
    this.input.on('pointerupoutside', onPointerUp, this);
}

function update() {
    // Game loop if needed
}

function createBoard() {
    board = [];
    for (let row = 0; row < ROWS; row++) {
        board[row] = [];
        for (let col = 0; col < COLS; col++) {
            let tileType = Math.floor(Math.random() * TILE_COLORS.length);
            // Prevent initial matches
            while (isMatch(row, col, tileType)) {
                tileType = Math.floor(Math.random() * TILE_COLORS.length);
            }
            createTile.call(this, row, col, tileType);
        }
    }
}

function createTile(row, col, tileType) {
    const x = col * TILE_SIZE + OFFSET_X;
    const y = row * TILE_SIZE + OFFSET_Y;
    
    const tile = this.add.sprite(x, y, 'tile_' + tileType);
    tile.row = row;
    tile.col = col;
    tile.tileType = tileType;
    tile.setInteractive();
    
    board[row][col] = tile;
    return tile;
}

function isMatch(row, col, tileType) {
    // Check horizontal
    if (col >= 2) {
        if (board[row][col - 1].tileType === tileType && board[row][col - 2].tileType === tileType) {
            return true;
        }
    }
    // Check vertical
    if (row >= 2) {
        if (board[row - 1][col].tileType === tileType && board[row - 2][col].tileType === tileType) {
            return true;
        }
    }
    return false;
}

function onPointerDown(pointer) {
    if (!canMove) return;
    
    // Identify which tile was clicked based on coordinates
    // We iterate to find the tile because we are not using gameobjectdown anymore for global swipe logic
    // Or we could use getObjectsUnderPointer if we want
    // But simplest is to just check coordinates or use the board array
    
    // Calculate row/col from pointer
    const col = Math.floor((pointer.x - OFFSET_X + TILE_SIZE / 2) / TILE_SIZE);
    const row = Math.floor((pointer.y - OFFSET_Y + TILE_SIZE / 2) / TILE_SIZE);
    
    if (row >= 0 && row < ROWS && col >= 0 && col < COLS) {
        if (board[row][col]) {
            selectedTile = board[row][col];
            // Visual feedback
            selectedTile.setScale(0.9);
        }
    }
}

function onPointerUp(pointer) {
    if (!selectedTile || !canMove) {
        if (selectedTile) {
            selectedTile.setScale(1);
            selectedTile = null;
        }
        return;
    }

    // Restore scale
    selectedTile.setScale(1);

    const diffX = pointer.x - pointer.downX;
    const diffY = pointer.y - pointer.downY;
    
    // Threshold for swipe
    const SWIPE_THRESHOLD = 20;

    let targetRow = selectedTile.row;
    let targetCol = selectedTile.col;
    let swipeValid = false;

    if (Math.abs(diffX) > Math.abs(diffY)) {
        if (Math.abs(diffX) > SWIPE_THRESHOLD) {
            // Horizontal swipe
            if (diffX > 0) {
                targetCol++;
            } else {
                targetCol--;
            }
            swipeValid = true;
        }
    } else {
        if (Math.abs(diffY) > SWIPE_THRESHOLD) {
            // Vertical swipe
            if (diffY > 0) {
                targetRow++;
            } else {
                targetRow--;
            }
            swipeValid = true;
        }
    }

    if (swipeValid) {
        if (targetRow >= 0 && targetRow < ROWS && targetCol >= 0 && targetCol < COLS) {
            const targetTile = board[targetRow][targetCol];
            if (targetTile) {
                swapTiles.call(this, selectedTile, targetTile, true);
            }
        }
    }
    
    selectedTile = null;
}

function swapTiles(tile1, tile2, check) {
    canMove = false;
    
    // Swap positions in array
    const tempRow = tile1.row;
    const tempCol = tile1.col;
    
    board[tile1.row][tile1.col] = tile2;
    board[tile2.row][tile2.col] = tile1;
    
    tile1.row = tile2.row;
    tile1.col = tile2.col;
    tile2.row = tempRow;
    tile2.col = tempCol;

    // Animate swap
    this.tweens.add({
        targets: tile1,
        x: tile1.col * TILE_SIZE + OFFSET_X,
        y: tile1.row * TILE_SIZE + OFFSET_Y,
        duration: 250
    });

    this.tweens.add({
        targets: tile2,
        x: tile2.col * TILE_SIZE + OFFSET_X,
        y: tile2.row * TILE_SIZE + OFFSET_Y,
        duration: 250,
        onComplete: () => {
            if (check) {
                const matches = getMatches();
                if (matches.length > 0) {
                    removeMatches.call(this, matches);
                } else {
                    swapTiles.call(this, tile1, tile2, false);
                }
            } else {
                // Just swapped back
                canMove = true;
            }
        }
    });
}

function getMatches() {
    let matches = [];
    
    // Check horizontal matches
    for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLS - 2; col++) {
            const tile1 = board[row][col];
            const tile2 = board[row][col + 1];
            const tile3 = board[row][col + 2];
            
            if (tile1 && tile2 && tile3 && tile1.tileType === tile2.tileType && tile1.tileType === tile3.tileType) {
                matches.push(tile1, tile2, tile3);
            }
        }
    }
    
    // Check vertical matches
    for (let col = 0; col < COLS; col++) {
        for (let row = 0; row < ROWS - 2; row++) {
            const tile1 = board[row][col];
            const tile2 = board[row + 1][col];
            const tile3 = board[row + 2][col];
            
            if (tile1 && tile2 && tile3 && tile1.tileType === tile2.tileType && tile1.tileType === tile3.tileType) {
                matches.push(tile1, tile2, tile3);
            }
        }
    }
    
    return matches;
}

function removeMatches(matches) {
    // Unique matches
    const uniqueMatches = [...new Set(matches)];
    
    this.tweens.add({
        targets: uniqueMatches,
        scaleX: 0,
        scaleY: 0,
        duration: 300,
        onComplete: () => {
            uniqueMatches.forEach(tile => {
                if (board[tile.row][tile.col] === tile) {
                    board[tile.row][tile.col] = null;
                }
                tile.destroy();
            });
            fillBoard.call(this);
        }
    });
}

function fillBoard() {
    // Drop existing tiles
    for (let col = 0; col < COLS; col++) {
        for (let row = ROWS - 1; row >= 0; row--) {
            if (board[row][col] === null) {
                // Find nearest tile above
                for (let k = row - 1; k >= 0; k--) {
                    if (board[k][col] !== null) {
                        board[row][col] = board[k][col];
                        board[k][col] = null;
                        board[row][col].row = row;
                        
                        this.tweens.add({
                            targets: board[row][col],
                            y: row * TILE_SIZE + OFFSET_Y,
                            duration: 300
                        });
                        break;
                    }
                }
            }
        }
    }
    
    // Create new tiles for remaining null spots
    // We wait a bit to ensure drops are started/calculated
    // Actually, we can just calculate what's missing
    
    setTimeout(() => {
        let hasNew = false;
        for (let col = 0; col < COLS; col++) {
            for (let row = 0; row < ROWS; row++) {
                if (board[row][col] === null) {
                    let tileType = Math.floor(Math.random() * TILE_COLORS.length);
                    const tile = createTile.call(this, row, col, tileType);
                    tile.y = OFFSET_Y - TILE_SIZE * 2; // Start well above
                    
                    this.tweens.add({
                        targets: tile,
                        y: row * TILE_SIZE + OFFSET_Y,
                        duration: 500,
                        ease: 'Bounce.easeOut'
                    });
                    hasNew = true;
                }
            }
        }
        
        if (hasNew) {
            setTimeout(() => {
                const matches = getMatches();
                if (matches.length > 0) {
                    removeMatches.call(this, matches);
                } else {
                    canMove = true;
                }
            }, 600);
        } else {
            // Should not happen if we called fillBoard, but just in case
            canMove = true;
        }
        
    }, 300);
}
