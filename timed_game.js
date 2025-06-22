document.addEventListener('DOMContentLoaded', () => {
    const gameGrid = document.getElementById('gameGrid');
    const blockInventory = document.getElementById('blockInventory');
    const blockTooltip = document.getElementById('blockTooltip');
    const selectedBlockDisplay = document.getElementById('selectedBlockDisplay');
    const timerDisplay = document.getElementById('timerDisplay');
    const levelDisplay = document.getElementById('levelDisplay');
    const messageDisplay = document.getElementById('messageDisplay');
    const soundToggleButton = document.getElementById('soundToggleButton');
    const musicToggleButton = document.getElementById('musicToggleButton');
    const restartButton = document.getElementById('restartButton');

    const GRID_WIDTH = 10;
    const GRID_HEIGHT = 10;
    const BLOCK_SIZE = 50;
    const INITIAL_TIME = 30; // seconds
    const TIME_BONUS_PER_LEVEL = 5; // seconds added per level
    const SCORE_PER_LEVEL = 100; // points per level completed

    let currentLevel = 1;
    let score = 0;
    let timeLeft = INITIAL_TIME;
    let timerInterval = null;
    let gameActive = false;

    let selectedBlockType = 'Grass Block';
    let currentInventoryBlockElement = null;
    let isPainting = false;

    let playerGridState = []; // What the player has placed
    let targetPattern = []; // The pattern to recreate

    // Audio elements
    const buttonSound = new Audio('audio/button_click.mp3');
    const selectSound = new Audio('audio/inventory_button_click.mp3');
    const placeBlockSound = new Audio('audio/inventory_button_click.mp3'); // Reused from main
    const destroyBlockSound = new Audio('audio/destroy_block.mp3'); // Reused from main
    const successSound = new Audio('audio/level_complete.mp3'); // New sound for level completion
    const failureSound = new Audio('audio/game_over.mp3'); // New sound for game over
    const tickSound = new Audio('audio/tick.mp3'); // New sound for timer ticks

    // Pitch modification for consecutive actions
    let consecutivePlaceCount = 0;
    let consecutiveDestroyCount = 0;
    const maxPitchIncrease = 0.5;
    const pitchIncrementPerAction = 0.05;
    const pitchDecayTime = 200;
    let pitchResetTimeout;

    // Music setup (ensure these paths are correct in your audio folder)
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

    // Expanded Pre-made patterns for the Timed Game (10x10 = 100 blocks)
    const PREMADE_PATTERNS = [
        // Pattern 1: A simple line (Red Wool)
        Array(GRID_WIDTH * GRID_HEIGHT).fill('Air').map((block, i) => {
            const row = Math.floor(i / GRID_WIDTH);
            const col = i % GRID_WIDTH;
            if (row === 4 && col >= 2 && col <= 7) {
                return 'Red Wool';
            }
            return 'Air';
        }),
        // Pattern 2: A small filled square (Blue Wool)
        Array(GRID_WIDTH * GRID_HEIGHT).fill('Air').map((block, i) => {
            const row = Math.floor(i / GRID_WIDTH);
            const col = i % GRID_WIDTH;
            if (row >= 3 && row <= 6 && col >= 3 && col <= 6) {
                return 'Blue Wool';
            }
            return 'Air';
        }),
        // Pattern 3: A diagonal line (Yellow Wool)
        Array(GRID_WIDTH * GRID_HEIGHT).fill('Air').map((block, i) => {
            const row = Math.floor(i / GRID_WIDTH);
            const col = i % GRID_WIDTH;
            if (row === col) {
                return 'Yellow Wool';
            }
            return 'Air';
        }),
        // Pattern 4: Plus sign in the middle (Stone)
        Array(GRID_WIDTH * GRID_HEIGHT).fill('Air').map((block, i) => {
            const row = Math.floor(i / GRID_WIDTH);
            const col = i % GRID_WIDTH;
            const center = GRID_WIDTH / 2;
            if (row === Math.floor(center) || col === Math.floor(center) || col === Math.floor(center) -1 ) {
                return 'Stone';
            }
            return 'Air';
        }),
        // Pattern 5: Corner L-shapes (Bricks)
        Array(GRID_WIDTH * GRID_HEIGHT).fill('Air').map((block, i) => {
            const row = Math.floor(i / GRID_WIDTH);
            const col = i % GRID_WIDTH;
            if ((row < 2 && col < 2 && (row === 0 || col === 0)) ||
                (row < 2 && col >= GRID_WIDTH - 2 && (row === 0 || col === GRID_WIDTH - 1)) ||
                (row >= GRID_HEIGHT - 2 && col < 2 && (row === GRID_HEIGHT - 1 || col === 0)) ||
                (row >= GRID_HEIGHT - 2 && col >= GRID_WIDTH - 2 && (row === GRID_HEIGHT - 1 || col === GRID_WIDTH - 1))
            ) {
                return 'Bricks';
            }
            return 'Air';
        }),
        // Pattern 6: Checkerboard (Grass and Dirt)
        Array(GRID_WIDTH * GRID_HEIGHT).fill('Air').map((block, i) => {
            const row = Math.floor(i / GRID_WIDTH);
            const col = i % GRID_WIDTH;
            if ((row + col) % 2 === 0) {
                return 'Grass Block';
            }
            return 'Dirt';
        }),
        // Pattern 7: Hollow Square (Cobblestone)
        Array(GRID_WIDTH * GRID_HEIGHT).fill('Air').map((block, i) => {
            const row = Math.floor(i / GRID_WIDTH);
            const col = i % GRID_WIDTH;
            if ((row === 2 || row === GRID_HEIGHT - 3) && (col >= 2 && col <= GRID_WIDTH - 3)) {
                return 'Cobblestone';
            }
            if ((col === 2 || col === GRID_WIDTH - 3) && (row >= 2 && row <= GRID_HEIGHT - 3)) {
                return 'Cobblestone';
            }
            return 'Air';
        }),
        // Pattern 8: Waves (Water and Sand)
        Array(GRID_WIDTH * GRID_HEIGHT).fill('Air').map((block, i) => {
            const row = Math.floor(i / GRID_WIDTH);
            const col = i % GRID_WIDTH;
            if (row % 3 === 0) {
                return 'Water';
            } else if (row % 3 === 1) {
                return 'Sand';
            }
            return 'Air';
        }),
        // Pattern 9: Target (Blue Wool, Gold Block, Diamond Block)
        Array(GRID_WIDTH * GRID_HEIGHT).fill('Air').map((block, i) => {
            const row = Math.floor(i / GRID_WIDTH);
            const col = i % GRID_WIDTH;
            const distFromCenter = Math.max(Math.abs(row - (GRID_HEIGHT - 1) / 2), Math.abs(col - (GRID_WIDTH - 1) / 2));
            if (distFromCenter < 2) {
                return 'Block of Diamond';
            } else if (distFromCenter < 4) {
                return 'Block of Gold';
            } else if (distFromCenter < 6) {
                return 'Blue Wool';
            }
            return 'Air';
        }),
        // Pattern 10: Random scattered blocks (Iron Block)
        Array(GRID_WIDTH * GRID_HEIGHT).fill('Air').map((block, i) => {
            if (Math.random() < 0.15) { // 15% chance to place a block
                return 'Block of Iron';
            }
            return 'Air';
        }),
        // Pattern 11: Spiral (Green Wool)
        Array(GRID_WIDTH * GRID_HEIGHT).fill('Air').map((block, i) => {
            const grid = Array(GRID_HEIGHT).fill(0).map(() => Array(GRID_WIDTH).fill('Air'));
            let r_min = 0, r_max = GRID_HEIGHT - 1;
            let c_min = 0, c_max = GRID_WIDTH - 1;
            let count = 0;
            const total = GRID_WIDTH * GRID_HEIGHT;
            let currentBlock = 'Green Wool';

            while (r_min <= r_max && c_min <= c_max) {
                for (let c = c_min; c <= c_max; c++) {
                    grid[r_min][c] = currentBlock;
                    count++;
                }
                r_min++;

                for (let r = r_min; r <= r_max; r++) {
                    grid[r][c_max] = currentBlock;
                    count++;
                }
                c_max--;

                if (r_min <= r_max) {
                    for (let c = c_max; c >= c_min; c--) {
                        grid[r_max][c] = currentBlock;
                        count++;
                    }
                    r_max--;
                }

                if (c_min <= c_max) {
                    for (let r = r_max; r >= r_min; r--) {
                        grid[r][c_min] = currentBlock;
                        count++;
                    }
                    c_min++;
                }
                if (count >= total) break;
            }
            return grid.flat();
        }),
        // Pattern 12: Diagonal Cross (Obsidian)
        Array(GRID_WIDTH * GRID_HEIGHT).fill('Air').map((block, i) => {
            const row = Math.floor(i / GRID_WIDTH);
            const col = i % GRID_WIDTH;
            if (row === col || row + col === GRID_WIDTH - 1) {
                return 'Obsidian';
            }
            return 'Air';
        }),
        // Pattern 13: Border (Glowstone)
        Array(GRID_WIDTH * GRID_HEIGHT).fill('Air').map((block, i) => {
            const row = Math.floor(i / GRID_WIDTH);
            const col = i % GRID_WIDTH;
            if (row === 0 || row === GRID_HEIGHT - 1 || col === 0 || col === GRID_WIDTH - 1) {
                return 'Glowstone';
            }
            return 'Air';
        }),
        // Pattern 14: Scattered Diamonds on Dirt
        Array(GRID_WIDTH * GRID_HEIGHT).fill('Dirt').map((block, i) => {
            if (Math.random() < 0.05) { // 5% chance of diamond
                return 'Block of Diamond';
            }
            return 'Dirt';
        }),
        // Pattern 15: Concentric Circles (using different wools)
        Array(GRID_WIDTH * GRID_HEIGHT).fill('Air').map((block, i) => {
            const row = Math.floor(i / GRID_WIDTH);
            const col = i % GRID_WIDTH;
            const centerX = (GRID_WIDTH - 1) / 2;
            const centerY = (GRID_HEIGHT - 1) / 2;
            const distance = Math.sqrt(Math.pow(row - centerY, 2) + Math.pow(col - centerX, 2));

            if (distance < 2) {
                return 'Red Wool';
            } else if (distance < 4) {
                return 'Yellow Wool';
            } else if (distance < 6) {
                return 'Blue Wool';
            }
            return 'Air';
        })
    ];


    function preloadBlockTextures() {
        let imagesToLoad = [];
        // Loop through all block types to load textures
        for (const category in blockCategories) {
            blockCategories[category].forEach(blockData => {
                if (blockData.texture) {
                    imagesToLoad.push(new Promise((resolve, reject) => {
                        const img = new Image();
                        img.src = blockData.texture;
                        img.crossOrigin = "Anonymous";
                        img.onload = () => {
                            blockImages[blockData.name] = img; // Store image by block name
                            resolve();
                        };
                        img.onerror = () => {
                            console.error(`Failed to load texture: ${blockData.texture}`);
                            blockImages[blockData.name] = null; // Mark as failed
                            resolve();
                        };
                    }));
                }
            });
        }
        // Load button textures
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
    function initializeInventory() {
        blockInventory.innerHTML = '';
        const allBlockTypes = Object.values(blockTypes);
        // Create a single container for all inventory blocks since categories are removed.
        const categoryContent = document.createElement('div');
        categoryContent.classList.add('category-content'); // Re-using class for consistent styling
        // No category header or toggle needed if instructions are removed and no categories are shown.
        blockInventory.appendChild(categoryContent); // Append to the actual blockInventory container

        allBlockTypes.forEach(blockData => {
            const inventoryBlockElement = document.createElement('div');
            inventoryBlockElement.classList.add('inventory-block');
            inventoryBlockElement.dataset.type = blockData.name;
            inventoryBlockElement.dataset.name = blockData.name;
            // Ensure texture loads correctly
            if (blockImages[blockData.name]) {
                inventoryBlockElement.style.backgroundImage = `url(${blockImages[blockData.name].src})`;
            } else {
                // Fallback if texture not loaded (shouldn't happen with preloading)
                inventoryBlockElement.style.backgroundColor = '#ccc';
            }

            inventoryBlockElement.addEventListener('click', () => {
                selectBlock(blockData.name, inventoryBlockElement);
            });

            inventoryBlockElement.addEventListener('mouseover', (event) => {
                const blockName = inventoryBlockElement.dataset.name;
                blockTooltip.textContent = blockName;
                blockTooltip.style.opacity = 1;

                const rect = inventoryBlockElement.getBoundingClientRect();
                blockTooltip.style.left = `${rect.left + window.scrollX}px`;
                blockTooltip.style.top = `${rect.top + window.scrollY - blockTooltip.offsetHeight - 5}px`;
            });

            inventoryBlockElement.addEventListener('mouseout', () => {
                blockTooltip.style.opacity = 0;
            });

            categoryContent.appendChild(inventoryBlockElement);
        });

        const initialGrassBlock = document.querySelector('.inventory-block[data-type="Grass Block"]');
        if (initialGrassBlock) {
            selectBlock('Grass Block', initialGrassBlock);
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

        element.classList.add('selected');
        currentInventoryBlockElement = element;

        playSound(selectSound);
    }

    // Game grid initialization
    function initializeGrid(width, height) {
        gameGrid.innerHTML = '';
        gameGrid.style.gridTemplateColumns = `repeat(${width}, ${BLOCK_SIZE}px)`;
        gameGrid.style.gridTemplateRows = `repeat(${height}, ${BLOCK_SIZE}px)`;
        gameGrid.style.width = `${width * BLOCK_SIZE}px`;
        gameGrid.style.height = `${height * BLOCK_SIZE}px`;

        // Initialize playerGridState to match the new grid size if it changes
        if (playerGridState.length !== width * height) {
            playerGridState = Array(width * height).fill('Air');
        }

        for (let i = 0; i < width * height; i++) {
            const block = document.createElement('div');
            block.classList.add('grid-block');
            block.dataset.index = i;
            block.dataset.type = playerGridState[i] || 'Air'; // Use existing player state or 'Air'
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
                if (gameActive) {
                    checkCompletion();
                }

                if (event.button === 1) { // Middle click
                    event.preventDefault();
                    const clickedBlockType = playerGridState[block.dataset.index];
                    if (clickedBlockType && clickedBlockType !== 'Air') {
                        const inventoryElement = document.querySelector(`.inventory-block[data-type="${clickedBlockType}"]`);
                        if (inventoryElement) {
                            selectBlock(clickedBlockType, inventoryElement);
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
                const blockType = playerGridState[block.dataset.index] || 'Air';
                blockTooltip.textContent = blockType;
                blockTooltip.style.opacity = 1;

                const rect = block.getBoundingClientRect();
                blockTooltip.style.left = `${rect.left + window.scrollX}px`;
                blockTooltip.style.top = `${rect.top + window.scrollY - blockTooltip.offsetHeight - 5}px`;
            });

            block.addEventListener('mouseout', () => {
                blockTooltip.style.opacity = 0;
            });

            gameGrid.appendChild(block);
        }
        updateGridVisuals(); // Initial render of grid based on player and target state

        document.addEventListener('mouseup', (event) => {
            isPainting = false;
            consecutivePlaceCount = 0;
            consecutiveDestroyCount = 0;
            if (pitchResetTimeout) {
                clearTimeout(pitchResetTimeout);
            }
        });
    }

    /**
     * Updates the visual state of all grid blocks based on playerGridState and targetPattern.
     */
    function updateGridVisuals() {
        const gridBlocks = document.querySelectorAll('.grid-block');
        gridBlocks.forEach((blockElement, index) => {
            const playerType = playerGridState[index];
            const targetType = targetPattern[index];

            if (playerType !== 'Air') {
                // If player has placed a block, show it normally (opaque)
                const img = blockImages[playerType];
                if (img) {
                    blockElement.style.backgroundImage = `url(${img.src})`;
                    blockElement.style.backgroundColor = '';
                } else {
                    blockElement.style.backgroundImage = 'none';
                    blockElement.style.backgroundColor = '#e0e0e0';
                }
                blockElement.classList.remove('ghost-block');
            } else if (targetType !== 'Air') {
                // If player hasn't placed a block, but target has one, show it as ghost
                const img = blockImages[targetType];
                if (img) {
                    blockElement.style.backgroundImage = `url(${img.src})`;
                    blockElement.style.backgroundColor = '';
                } else {
                    blockElement.style.backgroundImage = 'none';
                    blockElement.style.backgroundColor = '#e0e0e0';
                }
                blockElement.classList.add('ghost-block');
            } else {
                // Both are 'Air', show empty grid block
                blockElement.style.backgroundImage = 'none';
                blockElement.style.backgroundColor = '#e0e0e0';
                blockElement.classList.remove('ghost-block');
            }
        });
    }


    function placeBlock(gridBlockElement, type) {
        const index = parseInt(gridBlockElement.dataset.index);
        const oldType = playerGridState[index];

        if (oldType === type) {
            return;
        }

        playerGridState[index] = type;
        updateGridVisuals();
        playSound(placeBlockSound, isPainting, 'place');
    }

    function destroyBlock(gridBlockElement) {
        const index = parseInt(gridBlockElement.dataset.index);
        const oldType = playerGridState[index];

        if (oldType === 'Air') {
            return;
        }

        playerGridState[index] = 'Air';
        updateGridVisuals();
        playSound(destroyBlockSound, isPainting, 'destroy');
    }

    // Game logic functions
    function getPatternForLevel(level) {
        const patternIndex = (level - 1) % PREMADE_PATTERNS.length;
        return PREMADE_PATTERNS[patternIndex];
    }

    function clearPlayerGrid() {
        playerGridState = Array(GRID_WIDTH * GRID_HEIGHT).fill('Air');
        updateGridVisuals();
    }

    function checkCompletion() {
        let isComplete = true;
        for (let i = 0; i < playerGridState.length; i++) {
            if (playerGridState[i] !== targetPattern[i]) {
                isComplete = false;
                break;
            }
        }

        if (isComplete) {
            levelComplete();
        }
    }

    function startGame() {
        currentLevel = 1;
        score = 0;
        timeLeft = INITIAL_TIME;
        updateLevelDisplay();
        updateTimerDisplay();
        messageDisplay.textContent = 'Recreate the pattern!';
        gameActive = true;
        startLevel();
    }

    function startLevel() {
        targetPattern = getPatternForLevel(currentLevel);
        clearPlayerGrid();
        updateGridVisuals();
        clearInterval(timerInterval);
        startTimer();
    }

    function nextLevel() {
        playSound(successSound);
        currentLevel++;
        score += SCORE_PER_LEVEL;
        timeLeft = INITIAL_TIME + (TIME_BONUS_PER_LEVEL * (currentLevel -1));
        updateLevelDisplay();
        messageDisplay.textContent = 'Great job! New pattern!';
        gameActive = true;
        startLevel();
    }

    function gameOver() {
        playSound(failureSound);
        clearInterval(timerInterval);
        gameActive = false;
        messageDisplay.textContent = `Game Over! You reached Level ${currentLevel} with a score of ${score}. Click Restart Game to try again.`;
        timerDisplay.style.color = 'var(--text-color)';
    }

    function startTimer() {
        clearInterval(timerInterval);
        timerInterval = setInterval(() => {
            if (timeLeft <= 0) {
                gameOver();
                return;
            }
            timeLeft--;
            updateTimerDisplay();
            if (timeLeft <= 5 && timeLeft > 0) {
                playSound(tickSound);
            }
        }, 1000);
    }

    function updateTimerDisplay() {
        timerDisplay.textContent = `Time: ${timeLeft}s`;
        if (timeLeft <= 10) {
            timerDisplay.style.color = 'red';
        } else if (timeLeft <= 20) {
            timerDisplay.style.color = 'orange';
        } else {
            timerDisplay.style.color = 'var(--text-color)';
        }
    }

    function updateLevelDisplay() {
        levelDisplay.textContent = `Level: ${currentLevel}`;
    }

    function levelComplete() {
        clearInterval(timerInterval);
        gameActive = false;
        messageDisplay.textContent = "Pattern complete! Get ready for the next level...";
        setTimeout(() => {
            nextLevel();
        }, 2000);
    }

    // Event listeners for toggle buttons
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

    restartButton.addEventListener('click', () => {
        playSound(buttonSound);
        startGame();
    });

    // Initial setup
    preloadBlockTextures().then(() => {
        console.log("Timed game textures loaded.");
        initializeInventory();
        initializeGrid(GRID_WIDTH, GRID_HEIGHT);
        musicPlaylist = categorizedMusic["Creative"];
        initializeShuffledPlaylist();
        startGame();
    }).catch(error => {
        console.error("Error loading timed game textures:", error);
        // Even if textures fail, try to initialize to prevent complete blank page
        initializeInventory();
        initializeGrid(GRID_WIDTH, GRID_HEIGHT);
        musicPlaylist = categorizedMusic["Creative"];
        initializeShuffledPlaylist();
        startGame();
    });
});
