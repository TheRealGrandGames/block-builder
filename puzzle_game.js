document.addEventListener('DOMContentLoaded', () => {
    const gameGrid = document.getElementById('gameGrid');
    // Renamed blockInventory to blockInventoryContainer for clarity, and added blockInventoryInner
    const blockInventoryContainer = document.querySelector('.inventory'); // Get the main inventory div
    const blockInventoryInner = document.getElementById('blockInventoryInner'); // This is the actual div for blocks
    const blockTooltip = document.getElementById('blockTooltip');
    const selectedBlockDisplay = document.getElementById('selectedBlockDisplay');
    const puzzleTitleDisplay = document.getElementById('puzzleTitleDisplay');
    const puzzleRulesDisplay = document.getElementById('puzzleRules');
    const scoreDisplay = document.getElementById('scoreDisplay');
    const messageDisplay = document.getElementById('messageDisplay');
    const soundToggleButton = document.getElementById('soundToggleButton');
    const musicToggleButton = document.getElementById('musicToggleButton');
    const checkSolutionButton = document.getElementById('checkSolutionButton');
    const restartPuzzleButton = document.getElementById('restartPuzzleButton');
    const nextPuzzleButton = document.getElementById('nextPuzzleButton');

    const GRID_WIDTH = 10;
    const GRID_HEIGHT = 10;
    const BLOCK_SIZE = 50;

    let currentPuzzleIndex = 0;
    let score = 0;
    let gameActive = false; // Controls overall game state and user interaction

    let selectedBlockType = 'Grass Block';
    let currentInventoryBlockElement = null;
    let isPainting = false;

    let playerGridState = []; // What the player has placed on the editable cells
    let initialGridState = []; // The fixed, initial state of the puzzle grid

    // Audio elements
    const buttonSound = new Audio('audio/button_click.mp3');
    const selectSound = new Audio('audio/inventory_button_click.mp3');
    const placeBlockSound = new Audio('audio/inventory_button_click.mp3');
    const destroyBlockSound = new Audio('audio/destroy_block.mp3');
    const puzzleSolvedSound = new Audio('audio/level_complete.mp3'); // Reuse success sound
    const puzzleFailedSound = new Audio('audio/game_over.mp3'); // Reuse failure sound

    // Pitch modification for consecutive actions (reused from other minigames)
    let consecutivePlaceCount = 0;
    let consecutiveDestroyCount = 0;
    const maxPitchIncrease = 0.5;
    const pitchIncrementPerAction = 0.05;
    const pitchDecayTime = 200;
    let pitchResetTimeout;

    // Music setup (reused from other minigames)
    const categorizedMusic = {
        "All": [
            'audio/music/taswell.mp3', 'audio/music/dreiton.mp3', 'audio/music/aria_math.mp3',
            'audio/music/haunt_muskie.mp3', 'audio/music/biome_fest.mp3', 'audio/music/blind_spots.mp3',
            'audio/music/survival/clark.mp3', 'audio/music/survival/dry_hands.mp3', 'audio/music/survival/haggstrom.mp3',
            'audio/music/survival/key.mp3', 'audio/music/survival/living_mice.mp3', 'audio/music/survival/mice_on_venus.mp3',
            'audio/music/survival/minecraft.mp3', 'audio/music/survival/oxygene.mp3', 'audio/music/survival/subwoofer_lullaby.mp3',
            'audio/music/survival/sweden.mp3', 'audio/music/survival/wet_hands.mp3', 'audio/music/main_menu/beginning_2.mp3',
            'audio/music/main_menu/floating_trees.mp3', 'audio/music/main_menu/moog_city_2.mp3', 'audio/music/main_menu/mutation.mp3',
            'audio/music/underwater/dragon_fish.mp3', 'audio/music/underwater/shuniji.mp3', 'audio/music/underwater/axolotl.mp3',
            'audio/music/nether/dead_voxel.mp3', 'audio/music/nether/concrete_halls.mp3', 'audio/music/nether/warmth.mp3',
            'audio/music/nether/ballad_of_the_cats.mp3', 'audio/music/music_discs/blocks.mp3', 'audio/music/music_discs/cat.mp3',
            'audio/music/music_discs/chirp.mp3', 'audio/music/music_discs/dog.mp3', 'audio/music/music_discs/far.mp3',
            'audio/music/music_discs/mall.mp3', 'audio/music/music_discs/mellohi.mp3', 'audio/music/music_discs/stal.mp3',
            'audio/music/music_discs/strad.mp3', 'audio/music/music_discs/wait.mp3', 'audio/music/music_discs/ward.mp3'
        ],
        "Creative": [
            'audio/music/taswell.mp3', 'audio/music/dreiton.mp3', 'audio/music/aria_math.mp3',
            'audio/music/haunt_muskie.mp3', 'audio/music/biome_fest.mp3', 'audio/music/blind_spots.mp3'
        ],
        "Puzzle": [ // New category for puzzle game specific music
            'audio/music/main_menu/beginning_2.mp3',
            'audio/music/main_menu/floating_trees.mp3',
            'audio/music/taswell.mp3'
        ]
    };
    let musicPlaylist = [];
    const backgroundMusic = new Audio();
    backgroundMusic.loop = false;
    backgroundMusic.volume = 0.5;
    let shuffledPlaylistIndices = [];
    let currentShuffledIndex = 0;

    let soundsEnabled = localStorage.getItem('soundsEnabled') === 'false' ? false : true;
    let musicEnabled = localStorage.getItem('musicEnabled') === 'false' ? false : true;
    let hasUserInteracted = false;

    // Common block definitions (copied from main scripts.js for independence)
    const blockCategories = {
        Natural: [
            { name: 'Grass Block', texture: 'textures/grass.png' },
            { name: 'Dirt', texture: 'textures/dirt.png' },
            { name: 'Sand', texture: 'textures/sand.png' },
            { name: 'Gravel', texture: 'textures/gravel.png' },
            { name: 'Stone', texture: 'textures/stone.png' },
            { name: 'Oak Log', texture: 'textures/oak_log_top.png' },
            { name: 'Oak Planks', texture: 'textures/oak_planks.png' },
            { name: 'Cobblestone', texture: 'textures/cobblestone.png' },
            { name: 'Water', texture: 'textures/water.png' },
            { name: 'Lava', texture: 'textures/lava.png' },
            { name: 'Red Wool', texture: 'textures/red_wool.png' },
            { name: 'Blue Wool', texture: 'textures/blue_wool.png' },
            { name: 'Green Wool', texture: 'textures/green_wool.png' },
            { name: 'Yellow Wool', texture: 'textures/yellow_wool.png' },
            { name: 'Bricks', texture: 'textures/bricks.png' },
            { name: 'Block of Iron', texture: 'textures/iron_block.png' },
            { name: 'Block of Gold', texture: 'textures/gold_block.png' },
            { name: 'Block of Diamond', texture: 'textures/diamond_block.png' },
            { name: 'Glowstone', texture: 'textures/glowstone.png' },
            { name: 'Obsidian', texture: 'textures/obsidian.png' },
            { name: 'Netherrack', texture: 'textures/netherrack.png' },
            { name: 'End Stone', texture: 'textures/end_stone.png' },
            { name: 'Glass', texture: 'textures/glass.png' },
            { name: 'Coal Ore', texture: 'textures/coal_ore.png' },
            { name: 'Iron Ore', texture: 'textures/iron_ore.png' },
            { name: 'Diamond Ore', texture: 'textures/diamond_ore.png' },
            { name: 'Emerald Ore', texture: 'textures/emerald_ore.png' }
        ]
    };
    const blockTypes = {};
    for (const category in blockCategories) {
        blockCategories[category].forEach(block => {
            blockTypes[block.name] = block;
        });
    }
    const blockImages = {};
    let texturesLoadedPromise = null;

    // --- PUZZLE DEFINITIONS ---
    // Each puzzle will have:
    // - title: Displayed title
    // - rules: Array of strings for rules
    // - initialGrid: The starting state of the grid, including fixed blocks.
    // - editableCells: Array of indices that the player CAN modify.
    // - requiredBlocks: { 'BlockType': count } - blocks player must place
    // - solution: The target grid state after player's moves, for validation.
    const PUZZLES = [
        {
            title: "Connect the Dots",
            rules: [
                "Place 'Oak Planks' to connect the two 'Diamond Blocks' diagonally.",
                "Do not place blocks on 'Grass Blocks'."
            ],
            initialGrid: Array(GRID_WIDTH * GRID_HEIGHT).fill('Air').map((_, i) => {
                if (i === 1 * GRID_WIDTH + 1) return 'Diamond Block'; // Top-left diamond
                if (i === 8 * GRID_WIDTH + 8) return 'Diamond Block'; // Bottom-right diamond
                if (i === 0 * GRID_WIDTH + 0 || i === 0 * GRID_WIDTH + 9 ||
                    i === 9 * GRID_WIDTH + 0 || i === 9 * GRID_WIDTH + 9) return 'Grass Block'; // Corners
                return 'Air';
            }),
            editableCells: Array(GRID_WIDTH * GRID_HEIGHT).fill(0).map((_, i) => i).filter(i => {
                return !((i === 1 * GRID_WIDTH + 1) || (i === 8 * GRID_WIDTH + 8) ||
                         (i === 0 * GRID_WIDTH + 0) || (i === 0 * GRID_WIDTH + 9) ||
                         (i === 9 * GRID_WIDTH + 0) || (i === 9 * GRID_WIDTH + 9));
            }),
            requiredBlocks: { 'Oak Planks': 7 },
            solution: Array(GRID_WIDTH * GRID_HEIGHT).fill('Air').map((_, i) => {
                if (i === 1 * GRID_WIDTH + 1) return 'Diamond Block';
                if (i === 8 * GRID_WIDTH + 8) return 'Diamond Block';
                if (i === 0 * GRID_WIDTH + 0 || i === 0 * GRID_WIDTH + 9 ||
                    i === 9 * GRID_WIDTH + 0 || i === 9 * GRID_WIDTH + 9) return 'Grass Block';
                // Diagonal path
                if (i === 2 * GRID_WIDTH + 2 || i === 3 * GRID_WIDTH + 3 ||
                    i === 4 * GRID_WIDTH + 4 || i === 5 * GRID_WIDTH + 5 ||
                    i === 6 * GRID_WIDTH + 6 || i === 7 * GRID_WIDTH + 7) return 'Oak Planks';
                return 'Air';
            }),
            validate: (playerGrid, initialGrid, requiredBlocks) => {
                const solutionGrid = PUZZLES[0].solution;
                for (let i = 0; i < playerGrid.length; i++) {
                    if (PUZZLES[0].editableCells.includes(i)) {
                        // Check if player placed required blocks correctly
                        if (playerGrid[i] !== solutionGrid[i]) {
                            return { passed: false, message: "Incorrect block placement or type." };
                        }
                    } else {
                        // Fixed blocks must remain unchanged
                        if (playerGrid[i] !== initialGrid[i]) {
                             return { passed: false, message: "You altered a fixed block!" };
                        }
                    }
                }

                // Additional check for blocks on Grass (rule specific)
                for (let i = 0; i < playerGrid.length; i++) {
                    if (initialGrid[i] === 'Grass Block' && playerGrid[i] !== 'Grass Block') {
                        return { passed: false, message: "You placed a block on a Grass Block!" };
                    }
                }

                // Check required block counts (this is handled by initial inventory setup)
                // However, if player can destroy blocks, this check is still good.
                const actualPlaced = {};
                playerGrid.forEach((blockType, idx) => {
                    if (PUZZLES[0].editableCells.includes(idx) && blockType !== 'Air') {
                        actualPlaced[blockType] = (actualPlaced[blockType] || 0) + 1;
                    }
                });

                for (const type in requiredBlocks) {
                    if ((actualPlaced[type] || 0) !== requiredBlocks[type]) {
                        return { passed: false, message: `Incorrect count of ${type} placed.` };
                    }
                }

                return { passed: true, message: "Puzzle Solved!" };
            }
        },
        {
            title: "Fill the Gap",
            rules: [
                "Fill the empty 3x3 square in the center with 'Red Wool'.",
                "Do not place blocks outside the designated area.",
                "Do not destroy existing 'Stone' blocks."
            ],
            initialGrid: Array(GRID_WIDTH * GRID_HEIGHT).fill('Air').map((_, i) => {
                const row = Math.floor(i / GRID_WIDTH);
                const col = i % GRID_WIDTH;
                // Create a 5x5 frame of Stone, with a 3x3 empty center
                if ((row >= 2 && row <= 6 && col === 2) || // Left border
                    (row >= 2 && row <= 6 && col === 6) || // Right border
                    (col >= 2 && col <= 6 && row === 2) || // Top border
                    (col >= 2 && col <= 6 && row === 6)) { // Bottom border
                    return 'Stone';
                }
                return 'Air';
            }),
            editableCells: Array(GRID_WIDTH * GRID_HEIGHT).fill(0).map((_, i) => i).filter(i => {
                const row = Math.floor(i / GRID_WIDTH);
                const col = i % GRID_WIDTH;
                // Cells within the 3x3 center
                return row >= 3 && row <= 5 && col >= 3 && col <= 5;
            }),
            requiredBlocks: { 'Red Wool': 9 },
            solution: Array(GRID_WIDTH * GRID_HEIGHT).fill('Air').map((_, i) => {
                const row = Math.floor(i / GRID_WIDTH);
                const col = i % GRID_WIDTH;
                if ((row >= 2 && row <= 6 && col === 2) ||
                    (row >= 2 && row <= 6 && col === 6) ||
                    (col >= 2 && col <= 6 && row === 2) ||
                    (col >= 2 && col <= 6 && row === 6)) {
                    return 'Stone';
                }
                if (row >= 3 && row <= 5 && col >= 3 && col <= 5) {
                    return 'Red Wool';
                }
                return 'Air';
            }),
            validate: (playerGrid, initialGrid, requiredBlocks) => {
                const solutionGrid = PUZZLES[1].solution;
                for (let i = 0; i < playerGrid.length; i++) {
                    if (PUZZLES[1].editableCells.includes(i)) {
                        if (playerGrid[i] !== solutionGrid[i]) {
                            return { passed: false, message: "Incorrect block placed in the gap." };
                        }
                    } else {
                        if (playerGrid[i] !== initialGrid[i]) {
                             return { passed: false, message: "You destroyed or altered a fixed 'Stone' block!" };
                        }
                    }
                }
                const actualPlaced = {};
                playerGrid.forEach((blockType, idx) => {
                    if (PUZZLES[1].editableCells.includes(idx) && blockType !== 'Air') {
                        actualPlaced[blockType] = (actualPlaced[blockType] || 0) + 1;
                    }
                });

                for (const type in requiredBlocks) {
                    if ((actualPlaced[type] || 0) !== requiredBlocks[type]) {
                        return { passed: false, message: `Incorrect count of ${type} placed.` };
                    }
                }
                return { passed: true, message: "Puzzle Solved! The gap is filled." };
            }
        },
        {
            title: "Symmetry Challenge",
            rules: [
                "Complete the pattern to make it symmetrical along the horizontal center line.",
                "Use only 'Yellow Wool' blocks."
            ],
            initialGrid: Array(GRID_WIDTH * GRID_HEIGHT).fill('Air').map((_, i) => {
                const row = Math.floor(i / GRID_WIDTH);
                const col = i % GRID_WIDTH;
                if (row < GRID_HEIGHT / 2) { // Only define blocks in the top half
                    if ((row === 1 && col === 1) || (row === 1 && col === 8) ||
                        (row === 2 && col === 2) || (row === 2 && col === 7)) {
                        return 'Yellow Wool';
                    }
                }
                return 'Air';
            }),
            editableCells: Array(GRID_WIDTH * GRID_HEIGHT).fill(0).map((_, i) => i).filter(i => {
                const row = Math.floor(i / GRID_WIDTH);
                return row >= GRID_HEIGHT / 2; // Only bottom half is editable
            }),
            requiredBlocks: { 'Yellow Wool': 4 },
            solution: Array(GRID_WIDTH * GRID_HEIGHT).fill('Air').map((_, i) => {
                const row = Math.floor(i / GRID_WIDTH);
                const col = i % GRID_WIDTH;
                // Original top half
                if ((row === 1 && col === 1) || (row === 1 && col === 8) ||
                    (row === 2 && col === 2) || (row === 2 && col === 7)) {
                    return 'Yellow Wool';
                }
                // Symmetrical bottom half (row = GRID_HEIGHT - 1 - original_row)
                const mirroredRow = GRID_HEIGHT - 1 - row;
                if ((mirroredRow === 1 && col === 1) || (mirroredRow === 1 && col === 8) ||
                    (mirroredRow === 2 && col === 2) || (mirroredRow === 2 && col === 7)) {
                    return 'Yellow Wool';
                }
                return 'Air';
            }),
            validate: (playerGrid, initialGrid, requiredBlocks) => {
                const solutionGrid = PUZZLES[2].solution;
                let yellowWoolCount = 0;
                for (let i = 0; i < playerGrid.length; i++) {
                    const originalType = initialGrid[i];
                    const placedType = playerGrid[i];
                    const isEditable = PUZZLES[2].editableCells.includes(i);

                    if (isEditable) {
                        if (placedType === 'Yellow Wool') {
                            yellowWoolCount++;
                            if (placedType !== solutionGrid[i]) { // Must match solution for editable cells
                                return { passed: false, message: "Incorrect 'Yellow Wool' placement." };
                            }
                        } else if (placedType !== 'Air') { // Must only place Yellow Wool or Air in editable cells
                            return { passed: false, message: "Only 'Yellow Wool' blocks are allowed in editable areas." };
                        } else if (solutionGrid[i] === 'Yellow Wool' && placedType === 'Air') {
                            return { passed: false, message: "Missing a 'Yellow Wool' block." };
                        }
                    } else {
                        // Fixed blocks must remain unchanged
                        if (placedType !== originalType) {
                            return { passed: false, message: "You altered a fixed block!" };
                        }
                    }
                }
                if (yellowWoolCount !== requiredBlocks['Yellow Wool']) {
                    return { passed: false, message: `You placed ${yellowWoolCount} 'Yellow Wool' blocks, but ${requiredBlocks['Yellow Wool']} are required.` };
                }
                return { passed: true, message: "Symmetry Achieved!" };
            }
        },
        {
            title: "Color Match",
            rules: [
                "Place blocks of the same color next to the existing colored blocks.",
                "Each colored block should be surrounded by blocks of its own color.",
                "Use 'Red Wool' for Red, 'Blue Wool' for Blue, and 'Green Wool' for Green."
            ],
            initialGrid: Array(GRID_WIDTH * GRID_HEIGHT).fill('Air').map((_, i) => {
                const row = Math.floor(i / GRID_WIDTH);
                const col = i % GRID_WIDTH;
                if (row === 2 && col === 2) return 'Red Wool';
                if (row === 5 && col === 5) return 'Blue Wool';
                if (row === 8 && col === 8) return 'Green Wool';
                return 'Air';
            }),
            editableCells: Array(GRID_WIDTH * GRID_HEIGHT).fill(0).map((_, i) => i).filter(i => {
                const initial = PUZZLES[3].initialGrid[i];
                return initial === 'Air'; // All empty cells are editable
            }),
            requiredBlocks: { 'Red Wool': 8, 'Blue Wool': 8, 'Green Wool': 8 }, // To surround 1 central block each
            solution: Array(GRID_WIDTH * GRID_HEIGHT).fill('Air').map((_, i) => {
                const row = Math.floor(i / GRID_WIDTH);
                const col = i % GRID_WIDTH;
                // Red Wool area
                if ((row >= 1 && row <= 3 && col >= 1 && col <= 3)) return 'Red Wool';
                // Blue Wool area
                if ((row >= 4 && row <= 6 && col >= 4 && col <= 6)) return 'Blue Wool';
                // Green Wool area
                if ((row >= 7 && row <= 9 && col >= 7 && col <= 9)) return 'Green Wool';
                return 'Air';
            }),
            validate: (playerGrid, initialGrid, requiredBlocks) => {
                const solutionGrid = PUZZLES[3].solution;
                const actualPlaced = {};
                for (let i = 0; i < playerGrid.length; i++) {
                    const originalType = initialGrid[i];
                    const placedType = playerGrid[i];
                    const isEditable = PUZZLES[3].editableCells.includes(i);

                    if (isEditable) {
                        if (placedType !== solutionGrid[i]) {
                            return { passed: false, message: "Incorrect block type or placement in an editable cell." };
                        }
                        if (placedType !== 'Air') {
                            actualPlaced[placedType] = (actualPlaced[placedType] || 0) + 1;
                        }
                    } else {
                        if (placedType !== originalType) {
                            return { passed: false, message: "You altered a fixed block!" };
                        }
                    }
                }
                for (const type in requiredBlocks) {
                    if ((actualPlaced[type] || 0) !== requiredBlocks[type]) {
                        return { passed: false, message: `Incorrect count of ${type} placed. Required: ${requiredBlocks[type]}, Placed: ${actualPlaced[type] || 0}.` };
                    }
                }
                return { passed: true, message: "Perfect color matching!" };
            }
        },
        {
            title: "Pathway Planner",
            rules: [
                "Create a continuous path of 'Cobblestone' from the 'Stone' block at (0,0) to the 'Obsidian' block at (9,9).",
                "The path must only consist of 'Cobblestone' blocks.",
                "You cannot place blocks on the starting 'Stone' or ending 'Obsidian' blocks."
            ],
            initialGrid: Array(GRID_WIDTH * GRID_HEIGHT).fill('Air').map((_, i) => {
                const row = Math.floor(i / GRID_WIDTH);
                const col = i % GRID_WIDTH;
                if (row === 0 && col === 0) return 'Stone';
                if (row === 9 && col === 9) return 'Obsidian';
                return 'Air';
            }),
            editableCells: Array(GRID_WIDTH * GRID_HEIGHT).fill(0).map((_, i) => i).filter(i => {
                const row = Math.floor(i / GRID_WIDTH);
                const col = i % GRID_WIDTH;
                return !((row === 0 && col === 0) || (row === 9 && col === 9));
            }),
            requiredBlocks: { 'Cobblestone': 17 }, // Example for a simple diagonal + straight path
            solution: null, // Solution is dynamic, validated by connectivity and type
            validate: (playerGrid, initialGrid, requiredBlocks) => {
                // Check fixed blocks
                if (playerGrid[0] !== 'Stone' || playerGrid[99] !== 'Obsidian') {
                    return { passed: false, message: "Starting or ending blocks were altered!" };
                }

                // Check all placed blocks are Cobblestone and within editable cells
                let cobblestoneCount = 0;
                for (let i = 0; i < playerGrid.length; i++) {
                    const isEditable = PUZZLES[4].editableCells.includes(i);
                    if (isEditable) {
                        if (playerGrid[i] !== 'Air' && playerGrid[i] !== 'Cobblestone') {
                            return { passed: false, message: "Only 'Cobblestone' blocks are allowed on the path." };
                        }
                        if (playerGrid[i] === 'Cobblestone') {
                            cobblestoneCount++;
                        }
                    } else if (playerGrid[i] !== initialGrid[i]) {
                        return { passed: false, message: "You altered a fixed block!" };
                    }
                }

                // Check path connectivity using a BFS-like approach
                const startNode = { row: 0, col: 0 };
                const endNode = { row: 9, col: 9 };
                const queue = [{ row: startNode.row, col: startNode.col, path: [`${startNode.row},${startNode.col}`] }];
                const visited = new Set();
                visited.add(`${startNode.row},${startNode.col}`);

                const directions = [[0, 1], [0, -1], [1, 0], [-1, 0]]; // Right, Left, Down, Up

                while (queue.length > 0) {
                    const { row, col } = queue.shift();

                    if (row === endNode.row && col === endNode.col) {
                        // Found a path!
                        if (cobblestoneCount !== requiredBlocks['Cobblestone']) {
                             return { passed: false, message: `Path is correct but placed ${cobblestoneCount} cobblestone blocks instead of ${requiredBlocks['Cobblestone']}.` };
                        }
                        return { passed: true, message: "Path successfully built!" };
                    }

                    for (const [dr, dc] of directions) {
                        const newRow = row + dr;
                        const newCol = col + dc;
                        const newIndex = newRow * GRID_WIDTH + newCol;

                        if (newRow >= 0 && newRow < GRID_HEIGHT && newCol >= 0 && newCol < GRID_WIDTH && !visited.has(`${newRow},${newCol}`)) {
                            const blockType = playerGrid[newIndex];
                            if (blockType === 'Cobblestone' || (newRow === endNode.row && newCol === endNode.col && blockType === 'Obsidian')) {
                                visited.add(`${newRow},${newCol}`);
                                queue.push({ row: newRow, col: newCol });
                            }
                        }
                    }
                }
                return { passed: false, message: "No continuous path found between start and end points." };
            }
        }
    ];

    function preloadBlockTextures() {
        let imagesToLoad = [];
        for (const type in blockTypes) {
            const blockData = blockTypes[type];
            if (blockData.texture) {
                imagesToLoad.push(new Promise((resolve, reject) => {
                    const img = new Image();
                    img.src = blockData.texture;
                    img.crossOrigin = "Anonymous";
                    img.onload = () => {
                        blockImages[type] = img;
                        resolve();
                    };
                    img.onerror = () => {
                        console.error(`Failed to load texture: ${blockData.texture}`);
                        blockImages[type] = null;
                        resolve();
                    };
                }));
            }
        }
        const buttonTextures = [
            'textures/button.png',
            'textures/button_highlighted.png',
            'textures/button_disabled.png'
        ];
        buttonTextures.forEach(src => {
            imagesToLoad.push(new Promise((resolve) => {
                const img = new Image();
                img.src = src;
                img.crossOrigin = "Anonymous";
                img.onload = resolve;
                img.onerror = () => {
                    console.warn(`Failed to load button texture: ${src}`);
                    resolve();
                };
            }));
        });


        if (imagesToLoad.length === 0) {
            texturesLoadedPromise = Promise.resolve();
        } else {
            texturesLoadedPromise = Promise.all(imagesToLoad);
        }

        return texturesLoadedPromise;
    }

    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    function initializeShuffledPlaylist() {
        if (musicPlaylist.length > 0) {
            shuffledPlaylistIndices = Array.from({ length: musicPlaylist.length }, (_, i) => i);
            shuffleArray(shuffledPlaylistIndices);
            currentShuffledIndex = 0;
        } else {
            shuffledPlaylistIndices = [];
            currentShuffledIndex = 0;
            console.warn("No songs in the current music playlist.");
        }
    }

    backgroundMusic.onended = () => {
        playNextSong();
    };

    function playSound(audioElement, isConsecutiveAction = false, actionType = null) {
        if (!soundsEnabled || !hasUserInteracted) {
            return;
        }

        clearTimeout(pitchResetTimeout);

        let currentPitch = 1.0;
        if (isConsecutiveAction && actionType) {
            if (actionType === 'place') {
                consecutivePlaceCount = Math.min(consecutivePlaceCount + 1, maxPitchIncrease / pitchIncrementPerAction);
                consecutiveDestroyCount = 0;
                currentPitch += consecutivePlaceCount * pitchIncrementPerAction;
            } else if (actionType === 'destroy') {
                consecutiveDestroyCount = Math.min(consecutiveDestroyCount + 1, maxPitchIncrease / pitchIncrementPerAction);
                consecutivePlaceCount = 0;
                currentPitch += consecutiveDestroyCount * pitchIncrementPerAction;
            }
        } else {
            consecutivePlaceCount = 0;
            consecutiveDestroyCount = 0;
        }

        audioElement.playbackRate = Math.max(0.5, Math.min(2.0, currentPitch));
        audioElement.currentTime = 0;

        audioElement.play().catch(e => console.error("Error playing sound effect:", e));

        pitchResetTimeout = setTimeout(() => {
            consecutivePlaceCount = 0;
            consecutiveDestroyCount = 0;
        }, pitchDecayTime);
    }

    function updateSoundToggleButton() {
        soundToggleButton.textContent = `Sounds: ${soundsEnabled ? 'ON' : 'OFF'}`;
    }

    function playBackgroundMusic() {
        if (musicEnabled && musicPlaylist.length > 0 && hasUserInteracted) {
            const songToPlayIndex = shuffledPlaylistIndices[currentShuffledIndex];
            const songPath = musicPlaylist[songToPlayIndex];
            const expectedSrc = new URL(songPath, window.location.href).href;

            if (backgroundMusic.src !== expectedSrc || backgroundMusic.paused) {
                backgroundMusic.src = songPath;
                backgroundMusic.load();
                console.log(`Loading and attempting to play: ${songPath}`);
            }

            backgroundMusic.play().catch(e => {
                console.warn("Autoplay of background music prevented. User interaction needed (after initial gesture):", e);
            });
        } else {
            backgroundMusic.pause();
        }
    }

    function pauseBackgroundMusic() {
        backgroundMusic.pause();
    }

    function playNextSong() {
        if (musicPlaylist.length === 0) {
            pauseBackgroundMusic();
            return;
        }

        currentShuffledIndex++;

        if (currentShuffledIndex >= shuffledPlaylistIndices.length) {
            initializeShuffledPlaylist();
        }

        playBackgroundMusic();
    }

    function updateMusicToggleButton() {
        musicToggleButton.textContent = `Music: ${musicEnabled ? 'ON' : 'OFF'}`;
    }

    updateSoundToggleButton();
    updateMusicToggleButton();

    document.body.addEventListener('click', () => {
        if (!hasUserInteracted) {
            hasUserInteracted = true;
            console.log("User interacted. Audio playback is now permitted.");
            playBackgroundMusic();
        }
    }, { once: true });

    // Inventory functions
    function initializeInventory(requiredBlocks) {
        console.log("Initializing inventory with required blocks:", requiredBlocks);
        blockInventoryInner.innerHTML = ''; // Clear the inner div (block-items)

        // Display only required blocks
        for (const type in requiredBlocks) {
            const count = requiredBlocks[type];
            if (count > 0) {
                const blockData = blockTypes[type];
                if (!blockData) {
                    console.warn(`Block type "${type}" not found in blockTypes definitions. Skipping.`);
                    continue;
                }

                const inventoryBlockElement = document.createElement('div');
                inventoryBlockElement.classList.add('inventory-block');
                inventoryBlockElement.dataset.type = blockData.name;
                inventoryBlockElement.dataset.name = blockData.name;
                console.log(`Creating inventory block for: ${blockData.name}`);

                if (blockImages[blockData.name]) {
                    inventoryBlockElement.style.backgroundImage = `url(${blockImages[blockData.name].src})`;
                    inventoryBlockElement.style.backgroundColor = '';
                } else {
                    inventoryBlockElement.style.backgroundColor = '#ccc'; // Fallback color
                    console.warn(`Texture not loaded for ${blockData.name}, using fallback color.`);
                }
                
                // Add a visual counter for required blocks
                const counterSpan = document.createElement('span');
                counterSpan.classList.add('inventory-block-count');
                counterSpan.textContent = count;
                inventoryBlockElement.appendChild(counterSpan);
                inventoryBlockElement.dataset.count = count; // Store count in dataset

                inventoryBlockElement.addEventListener('click', () => {
                    selectBlock(blockData.name, inventoryBlockElement);
                });

                inventoryBlockElement.addEventListener('mouseover', (event) => {
                    const blockName = inventoryBlockElement.dataset.name;
                    blockTooltip.textContent = `${blockName} (x${inventoryBlockElement.dataset.count})`;
                    blockTooltip.style.opacity = 1;

                    const rect = inventoryBlockElement.getBoundingClientRect();
                    blockTooltip.style.left = `${rect.left + window.scrollX}px`;
                    blockTooltip.style.top = `${rect.top + window.scrollY - blockTooltip.offsetHeight - 5}px`;
                });

                inventoryBlockElement.addEventListener('mouseout', () => {
                    blockTooltip.style.opacity = 0;
                });

                blockInventoryInner.appendChild(inventoryBlockElement); // Append to the inner div
                console.log(`Appended inventory block for ${blockData.name}`);
            }
        }
        // Select the first available block by default
        const firstBlockInInventory = blockInventoryInner.querySelector('.inventory-block');
        if (firstBlockInInventory) {
            selectBlock(firstBlockInInventory.dataset.type, firstBlockInInventory);
        } else {
            selectedBlockType = 'Air'; // If no blocks required, select Air
            selectedBlockDisplay.style.backgroundImage = 'none';
            selectedBlockDisplay.style.backgroundColor = '#e0e0e0';
            selectedBlockDisplay.dataset.type = 'None';
            console.log("No blocks available in inventory for selection.");
        }
    }

    function selectBlock(type, element) {
        if (currentInventoryBlockElement) {
            currentInventoryBlockElement.classList.remove('selected');
        }
        selectedBlockType = type;

        const selectedBlockData = blockTypes[type];
        if (selectedBlockData && blockImages[type]) {
            selectedBlockDisplay.style.backgroundImage = `url(${blockImages[type].src})`;
            selectedBlockDisplay.style.backgroundColor = '';
            selectedBlockDisplay.dataset.type = type;
        } else {
            selectedBlockDisplay.style.backgroundImage = 'none';
            selectedBlockDisplay.style.backgroundColor = '#e0e0e0';
            selectedBlockDisplay.dataset.type = 'None';
        }

        if (element) { // Element might be null if 'Air' is selected programmatically
            element.classList.add('selected');
            currentInventoryBlockElement = element;
        } else {
            currentInventoryBlockElement = null; // Clear selected element
        }

        playSound(selectSound);
    }

    // Game grid initialization
    function initializeGrid() {
        console.log("Initializing game grid.");
        gameGrid.innerHTML = '';
        gameGrid.style.gridTemplateColumns = `repeat(${GRID_WIDTH}, ${BLOCK_SIZE}px)`;
        gameGrid.style.gridTemplateRows = `repeat(${GRID_HEIGHT}, ${BLOCK_SIZE}px)`;
        gameGrid.style.width = `${GRID_WIDTH * BLOCK_SIZE}px`;
        gameGrid.style.height = `${GRID_HEIGHT * BLOCK_SIZE}px`;
        console.log(`Grid dimensions set: ${GRID_WIDTH * BLOCK_SIZE}x${GRID_HEIGHT * BLOCK_SIZE}`);

        for (let i = 0; i < GRID_WIDTH * GRID_HEIGHT; i++) {
            const block = document.createElement('div');
            block.classList.add('grid-block');
            block.dataset.index = i;
            block.dataset.type = 'Air'; // Will be set by updateGridVisuals based on initial/player state
            // Initial styling for empty blocks, will be updated by updateGridVisuals
            block.style.backgroundColor = '#e0e0e0'; 
            block.style.backgroundImage = 'none';

            block.addEventListener('mousedown', (event) => {
                if (!gameActive) return;
                event.preventDefault();
                isPainting = true;
                if (event.button === 0) { // Left click
                    placeBlock(block, selectedBlockType);
                } else if (event.button === 2) { // Right click
                    destroyBlock(block);
                }
            });

            block.addEventListener('mouseup', (event) => {
                isPainting = false;
                consecutivePlaceCount = 0;
                consecutiveDestroyCount = 0;
                if (pitchResetTimeout) {
                    clearTimeout(pitchResetTimeout);
                }
                if (event.button === 1) { // Middle click
                    event.preventDefault();
                    // Get type from player's grid state if editable, otherwise fixed block
                    const index = parseInt(block.dataset.index);
                    const isEditable = PUZZLES[currentPuzzleIndex].editableCells.includes(index);
                    const clickedBlockType = isEditable ? playerGridState[index] : initialGridState[index];
                    
                    if (clickedBlockType && clickedBlockType !== 'Air') {
                        const inventoryElement = blockInventoryInner.querySelector(`.inventory-block[data-type="${clickedBlockType}"]`);
                        if (inventoryElement) {
                            selectBlock(clickedBlockType, inventoryElement);
                        } else {
                             console.warn(`Middle-clicked block type "${clickedBlockType}" not found in current inventory elements.`);
                        }
                    }
                }
            });

            block.addEventListener('mouseenter', (event) => {
                if (!gameActive) return;
                if (isPainting) {
                    if (event.buttons === 1) {
                        placeBlock(block, selectedBlockType);
                    } else if (event.buttons === 2) {
                        destroyBlock(block);
                    }
                }
            });

            block.addEventListener('contextmenu', (event) => {
                event.preventDefault();
            });

            block.addEventListener('mouseover', (event) => {
                const index = parseInt(block.dataset.index);
                const isEditable = PUZZLES[currentPuzzleIndex].editableCells.includes(index);
                const blockType = isEditable ? playerGridState[index] : initialGridState[index];
                
                blockTooltip.textContent = blockType || 'Air'; // Show 'Air' if empty
                blockTooltip.style.opacity = 1;

                const rect = block.getBoundingClientRect();
                blockTooltip.style.left = `${rect.left + window.scrollX}px`;
                blockTooltip.style.top = `${rect.top + window.scrollY - blockTooltip.offsetHeight - 5}px`;
            });

            block.addEventListener('mouseout', () => {
                blockTooltip.style.opacity = 0;
            });

            gameGrid.appendChild(block);
            // console.log(`Appended grid block at index ${i}`); // Too many logs, remove for performance
        }
        console.log("Finished appending all grid blocks.");
    }

    /**
     * Updates the visual state of all grid blocks based on initialGridState and playerGridState.
     */
    function updateGridVisuals() {
        const gridBlocks = document.querySelectorAll('.grid-block');
        gridBlocks.forEach((blockElement, index) => {
            const initialType = initialGridState[index];
            const playerType = playerGridState[index];
            const isEditable = PUZZLES[currentPuzzleIndex].editableCells.includes(index);

            let typeToShow = initialType;
            blockElement.classList.remove('fixed-block'); // Reset fixed class

            if (isEditable) {
                // For editable cells, show what the player has placed
                typeToShow = playerType;
            } else {
                // For fixed cells, show initial state and add 'fixed-block' class
                blockElement.classList.add('fixed-block');
            }

            const img = blockImages[typeToShow];
            if (typeToShow && typeToShow !== 'Air') {
                if (img) {
                    blockElement.style.backgroundImage = `url(${img.src})`;
                    blockElement.style.backgroundColor = '';
                } else {
                    blockElement.style.backgroundImage = 'none';
                    blockElement.style.backgroundColor = '#ccc'; // Fallback color for missing texture
                }
            } else {
                blockElement.style.backgroundImage = 'none';
                blockElement.style.backgroundColor = '#e0e0e0';
            }
            blockElement.dataset.type = typeToShow; // Update dataset for consistency
        });
        console.log("Grid visuals updated.");
    }

    function placeBlock(gridBlockElement, type) {
        const index = parseInt(gridBlockElement.dataset.index);
        const isEditable = PUZZLES[currentPuzzleIndex].editableCells.includes(index);

        if (!isEditable) {
            messageDisplay.textContent = "You cannot place blocks on fixed parts of the puzzle!";
            playSound(puzzleFailedSound); // Indicate an error
            return;
        }

        const oldType = playerGridState[index];
        if (oldType === type) {
            return;
        }

        // Update the count for the old block type in inventory (if applicable)
        if (oldType !== 'Air') {
            const oldBlockInventoryElement = blockInventoryInner.querySelector(`.inventory-block[data-type="${oldType}"]`);
            if (oldBlockInventoryElement) {
                let currentCount = parseInt(oldBlockInventoryElement.dataset.count);
                currentCount++;
                oldBlockInventoryElement.dataset.count = currentCount;
                oldBlockInventoryElement.querySelector('.inventory-block-count').textContent = currentCount;
            }
        }

        // Update the count for the new block type in inventory
        if (type !== 'Air') {
            const newBlockInventoryElement = blockInventoryInner.querySelector(`.inventory-block[data-type="${type}"]`);
            if (newBlockInventoryElement) {
                let currentCount = parseInt(newBlockInventoryElement.dataset.count);
                if (currentCount > 0) {
                    currentCount--;
                    newBlockInventoryElement.dataset.count = currentCount;
                    newBlockInventoryElement.querySelector('.inventory-block-count').textContent = currentCount;
                } else {
                    messageDisplay.textContent = `No more '${type}' blocks left in inventory!`;
                    playSound(puzzleFailedSound);
                    return; // Prevent placing if no blocks left
                }
            }
        }

        // Update player's internal grid state
        playerGridState[index] = type;
        updateGridVisuals(); // Refresh visuals for all blocks
        playSound(placeBlockSound, isPainting, 'place');
        messageDisplay.textContent = ''; // Clear previous messages
    }

    function destroyBlock(gridBlockElement) {
        const index = parseInt(gridBlockElement.dataset.index);
        const isEditable = PUZZLES[currentPuzzleIndex].editableCells.includes(index);

        if (!isEditable) {
            messageDisplay.textContent = "You cannot destroy fixed blocks!";
            playSound(puzzleFailedSound); // Indicate an error
            return;
        }

        const oldType = playerGridState[index];
        if (oldType === 'Air') {
            return;
        }

        // Increment the count of the block being destroyed in inventory
        if (oldType !== 'Air') {
            const oldBlockInventoryElement = blockInventoryInner.querySelector(`.inventory-block[data-type="${oldType}"]`);
            if (oldBlockInventoryElement) {
                let currentCount = parseInt(oldBlockInventoryElement.dataset.count);
                currentCount++;
                oldBlockInventoryElement.dataset.count = currentCount;
                oldBlockInventoryElement.querySelector('.inventory-block-count').textContent = currentCount;
            }
        }

        // Update player's internal grid state
        playerGridState[index] = 'Air';
        updateGridVisuals(); // Refresh visuals for all blocks
        playSound(destroyBlockSound, isPainting, 'destroy');
        messageDisplay.textContent = ''; // Clear previous messages
    }

    // Game logic functions
    function loadPuzzle(puzzleIndex) {
        const puzzle = PUZZLES[puzzleIndex];
        if (!puzzle) {
            gameOver();
            return;
        }

        puzzleTitleDisplay.textContent = `Puzzle: #${puzzleIndex + 1}`;
        puzzleRulesDisplay.innerHTML = puzzle.rules.map(rule => `<li>${rule}</li>`).join('');
        console.log(`Loaded Puzzle: ${puzzle.title}`);
        
        // Initialize playerGridState from initialGrid, but only editable parts
        initialGridState = [...puzzle.initialGrid];
        playerGridState = Array(GRID_WIDTH * GRID_HEIGHT).fill('Air'); // Start with all Air for player
        
        // Copy fixed blocks from initialGrid to playerGridState, and mark editable cells
        for (let i = 0; i < initialGridState.length; i++) {
            if (!puzzle.editableCells.includes(i)) {
                playerGridState[i] = initialGridState[i]; // Fixed blocks are part of player's initial grid state too
            }
        }

        initializeInventory(puzzle.requiredBlocks); // Update inventory based on required blocks for this puzzle
        updateGridVisuals(); // Render initial grid (fixed blocks and empty editable areas)
        messageDisplay.textContent = 'Solve the puzzle!';
        gameActive = true;
        checkSolutionButton.disabled = false;
        nextPuzzleButton.style.display = 'none'; // Hide next button until solved
    }

    function checkSolution() {
        if (!gameActive) return;

        playSound(buttonSound);
        const currentPuzzle = PUZZLES[currentPuzzleIndex];
        const validationResult = currentPuzzle.validate(playerGridState, initialGridState, currentPuzzle.requiredBlocks);

        if (validationResult.passed) {
            score += 100; // Example score for solving
            updateScoreDisplay();
            messageDisplay.textContent = validationResult.message + " Well done!";
            playSound(puzzleSolvedSound);
            gameActive = false; // Pause interaction
            checkSolutionButton.disabled = true;
            nextPuzzleButton.style.display = 'inline-block'; // Show next button
        } else {
            messageDisplay.textContent = "Incorrect: " + validationResult.message;
            playSound(puzzleFailedSound);
            score = Math.max(0, score - 20); // Penalty for incorrect attempt
            updateScoreDisplay();
        }
    }

    function restartPuzzle() {
        playSound(buttonSound);
        loadPuzzle(currentPuzzleIndex); // Reload current puzzle
        messageDisplay.textContent = 'Puzzle restarted!';
    }

    function nextPuzzle() {
        playSound(buttonSound);
        currentPuzzleIndex++;
        if (currentPuzzleIndex < PUZZLES.length) {
            loadPuzzle(currentPuzzleIndex);
        } else {
            gameOver();
        }
    }

    function gameOver() {
        gameActive = false;
        messageDisplay.textContent = `All puzzles completed! Your final score: ${score}. Click Restart Puzzle to play from the beginning.`;
        checkSolutionButton.disabled = true;
        nextPuzzleButton.style.display = 'none';
    }

    function updateScoreDisplay() {
        scoreDisplay.textContent = `Score: ${score}`;
    }

    // Event listeners
    soundToggleButton.addEventListener('click', () => {
        soundsEnabled = !soundsEnabled;
        localStorage.setItem('soundsEnabled', soundsEnabled);
        updateSoundToggleButton();
        playSound(buttonSound);
    });

    musicToggleButton.addEventListener('click', () => {
        musicEnabled = !musicEnabled;
        localStorage.setItem('musicEnabled', musicEnabled);
        updateMusicToggleButton();
        if (musicEnabled) {
            playBackgroundMusic();
        } else {
            pauseBackgroundMusic();
        }
        playSound(buttonSound);
    });

    checkSolutionButton.addEventListener('click', checkSolution);
    restartPuzzleButton.addEventListener('click', restartPuzzle);
    nextPuzzleButton.addEventListener('click', nextPuzzle);


    // Initial setup
    preloadBlockTextures().then(() => {
        console.log("Puzzle game textures loaded.");
        initializeGrid(); // Initialize grid structure once
        musicPlaylist = categorizedMusic["Puzzle"]; // Specific music for puzzle game
        initializeShuffledPlaylist();
        loadPuzzle(currentPuzzleIndex); // Load the first puzzle
    }).catch(error => {
        console.error("Error loading puzzle game textures:", error);
        // Fallback initialization - attempt to run even if textures fail
        initializeGrid();
        musicPlaylist = categorizedMusic["Puzzle"];
        initializeShuffledPlaylist();
        loadPuzzle(currentPuzzleIndex);
    });
});
