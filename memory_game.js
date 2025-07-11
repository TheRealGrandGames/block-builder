document.addEventListener('DOMContentLoaded', () => {
    const gameGrid = document.getElementById('gameGrid');
    const blockInventory = document.getElementById('blockInventory');
    const blockTooltip = document.getElementById('blockTooltip');
    const selectedBlockDisplay = document.getElementById('selectedBlockDisplay');
    const statusDisplay = document.getElementById('statusDisplay');
    const countdownDisplay = document.getElementById('countdownDisplay');
    const levelDisplay = document.getElementById('levelDisplay');
    const scoreDisplay = document.getElementById('scoreDisplay');
    const soundToggleButton = document.getElementById('soundToggleButton');
    const musicToggleButton = document.getElementById('musicToggleButton');
    const submitButton = document.getElementById('submitButton');
    const restartButton = document.getElementById('restartButton');
    const revealPatternButton = document.getElementById('revealPatternButton');

    const GRID_WIDTH = 10;
    const GRID_HEIGHT = 10;
    const BLOCK_SIZE = 50;
    const MEMORIZE_TIME = 3; // seconds
    const REVEAL_COST = 300; // points
    const REVEAL_DURATION = 3000; // milliseconds (3 seconds)
    const SCORE_PER_LEVEL = 150; // points per level completed

    let currentLevel = 1;
    let score = 0;
    let countdownTimer = null;
    let gamePhase = 'memorize'; // 'memorize' or 'recreate'
    let gameActive = false; // Controls overall game state and user interaction

    let selectedBlockType = 'Grass Block';
    let currentInventoryBlockElement = null;
    let isPainting = false;

    let playerGridState = []; // What the player has placed
    let targetPattern = []; // The pattern to recreate

    // Audio elements
    const buttonSound = new Audio('audio/button_click.mp3');
    const selectSound = new Audio('audio/inventory_button_click.mp3');
    const placeBlockSound = new Audio('audio/inventory_button_click.mp3');
    const destroyBlockSound = new Audio('audio/destroy_block.mp3');
    const memorizeStartSound = new Audio('audio/memorize_start.mp3');
    const recreateStartSound = new Audio('audio/recreate_start.mp3');
    const roundCompleteSound = new Audio('audio/level_complete.mp3');
    const gameOverSound = new Audio('audio/game_over.mp3');
    const submitSound = new Audio('audio/button_click.mp3');
    const revealSound = new Audio('audio/level_complete.mp3');

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
        "Main Menu": [
            'audio/music/main_menu/beginning_2.mp3', 'audio/music/main_menu/floating_trees.mp3',
            'audio/music/main_menu/moog_city_2.mp3', 'audio/music/main_menu/mutation.mp3'
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

    // Expanded Pre-made patterns for the Memory Game (10x10 = 100 blocks)
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
            if (row === Math.floor(center) || col === Math.floor(center) || col === Math.floor(center) - 1 ) {
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
            const centerX = (GRID_WIDTH - 1) / 2;
            const centerY = (GRID_HEIGHT - 1) / 2;
            const distance = Math.sqrt(Math.pow(row - centerY, 2) + Math.pow(col - centerX, 2));

            if (distance < 2) {
                return 'Block of Diamond';
            } else if (distance < 4) {
                return 'Block of Gold';
            } else if (distance < 6) {
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
            block.dataset.type = 'Air'; // Will be set by updateGridVisuals

            block.addEventListener('mousedown', (event) => {
                if (!gameActive || gamePhase === 'memorize') return;
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
                // No auto-checkCompletion here, only on submit
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
                if (!gameActive || gamePhase === 'memorize') return;
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
     * Updates the visual state of all grid blocks based on game phase and reveal state.
     * @param {boolean} showTargetTemporarily If true, during recreate phase, shows target pattern as ghost blocks.
     */
    function updateGridVisuals(showTargetTemporarily = false) {
        const gridBlocks = document.querySelectorAll('.grid-block');
        gridBlocks.forEach((blockElement, index) => {
            const playerType = playerGridState[index]; // What player has placed
            const targetType = targetPattern[index];   // What the target pattern has

            if (gamePhase === 'memorize') {
                // During memorize, always show the target pattern solid
                const typeToShow = targetType;
                const img = blockImages[typeToShow];
                if (typeToShow && typeToShow !== 'Air') {
                    blockElement.classList.remove('hidden-block', 'ghost-block');
                    if (img) {
                        blockElement.style.backgroundImage = `url(${img.src})`;
                        blockElement.style.backgroundColor = '';
                    } else {
                        blockElement.style.backgroundImage = 'none';
                        blockElement.style.backgroundColor = '#e0e0e0';
                    }
                } else {
                    blockElement.classList.remove('hidden-block', 'ghost-block');
                    blockElement.style.backgroundImage = 'none';
                    blockElement.style.backgroundColor = '#e0e0e0';
                }
            } else if (gamePhase === 'recreate') {
                if (showTargetTemporarily) {
                    // During temporary reveal, show player's blocks solid, target as ghost where player hasn't placed
                    if (playerType && playerType !== 'Air') {
                        // Player has placed a block, show it opaque
                        const img = blockImages[playerType];
                        blockElement.classList.remove('hidden-block', 'ghost-block');
                        if (img) {
                            blockElement.style.backgroundImage = `url(${img.src})`;
                            blockElement.style.backgroundColor = '';
                        } else {
                            blockElement.style.backgroundImage = 'none';
                            blockElement.style.backgroundColor = '#e0e0e0';
                        }
                    } else if (targetType && targetType !== 'Air') {
                        // Player hasn't placed, but target has, show target as ghost
                        const img = blockImages[targetType];
                        blockElement.classList.remove('hidden-block');
                        blockElement.classList.add('ghost-block'); // Make it transparent
                        if (img) {
                            blockElement.style.backgroundImage = `url(${img.src})`;
                            blockElement.style.backgroundColor = '';
                        } else {
                            blockElement.style.backgroundImage = 'none';
                            blockElement.style.backgroundColor = '#e0e0e0';
                        }
                    } else {
                        // Both are 'Air', show empty grid block
                        blockElement.classList.remove('ghost-block');
                        blockElement.classList.add('hidden-block'); // Ensure it's hidden (empty)
                        blockElement.style.backgroundImage = 'none';
                        blockElement.style.backgroundColor = '#e0e0e0';
                    }
                } else {
                    // Normal recreate phase: only show player's blocks, hide target
                    const typeToShow = playerType;
                    const img = blockImages[typeToShow];
                    if (typeToShow && typeToShow !== 'Air') {
                        blockElement.classList.remove('hidden-block', 'ghost-block');
                        if (img) {
                            blockElement.style.backgroundImage = `url(${img.src})`;
                            blockElement.style.backgroundColor = '';
                        } else {
                            blockElement.style.backgroundImage = 'none';
                            blockElement.style.backgroundColor = '#e0e0e0';
                        }
                    } else {
                        blockElement.classList.remove('ghost-block');
                        blockElement.classList.add('hidden-block'); // Hide block
                        blockElement.style.backgroundImage = 'none';
                        blockElement.style.backgroundColor = '#e0e0e0';
                    }
                }
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
        updateGridVisuals(false); // Update visual after placing, not showing ghost during normal play
        playSound(placeBlockSound, isPainting, 'place');
    }

    function destroyBlock(gridBlockElement) {
        const index = parseInt(gridBlockElement.dataset.index);
        const oldType = playerGridState[index];

        if (oldType === 'Air') {
            return;
        }

        playerGridState[index] = 'Air';
        updateGridVisuals(false); // Update visual after destroying, not showing ghost during normal play
        playSound(destroyBlockSound, isPainting, 'destroy');
    }

    // Game logic functions
    function getPatternForLevel(level) {
        const patternIndex = (level - 1) % PREMADE_PATTERNS.length;
        return PREMADE_PATTERNS[patternIndex];
    }

    function clearPlayerGrid() {
        playerGridState = Array(GRID_WIDTH * GRID_HEIGHT).fill('Air');
        // Do not call updateGridVisuals here directly, phases will handle it.
    }

    function checkCompletion() {
        if (gamePhase !== 'recreate') {
            statusDisplay.textContent = "Not in recreation phase!";
            return;
        }
        playSound(submitSound);
        let isMatch = true;
        for (let i = 0; i < playerGridState.length; i++) {
            if (playerGridState[i] !== targetPattern[i]) {
                isMatch = false;
                break;
            }
        }

        if (isMatch) {
            levelComplete();
        } else {
            statusDisplay.textContent = 'Incorrect! Try again.';
        }
    }

    function updateScoreDisplay() {
        scoreDisplay.textContent = `Score: ${score}`;
    }

    function startGame() {
        currentLevel = 1;
        score = 0;
        updateLevelDisplay();
        updateScoreDisplay();
        gameActive = true;
        nextRound();
        submitButton.disabled = false;
        revealPatternButton.disabled = false;
    }

    function nextRound() {
        clearInterval(countdownTimer);
        targetPattern = getPatternForLevel(currentLevel);
        clearPlayerGrid(); // Clears internal player state, not visuals yet
        memorizationPhase();
    }

    function memorizationPhase() {
        gamePhase = 'memorize';
        statusDisplay.textContent = 'Memorize!';
        countdownDisplay.textContent = MEMORIZE_TIME;
        updateGridVisuals(false); // Show target pattern solid for memorization
        submitButton.disabled = true;
        revealPatternButton.disabled = true;

        playSound(memorizeStartSound);

        let currentCountdown = MEMORIZE_TIME;
        countdownTimer = setInterval(() => {
            currentCountdown--;
            countdownDisplay.textContent = currentCountdown;
            if (currentCountdown <= 0) {
                clearInterval(countdownTimer);
                recreationPhase();
            }
        }, 1000);
    }

    function recreationPhase() {
        gamePhase = 'recreate';
        statusDisplay.textContent = 'Recreate!';
        countdownDisplay.textContent = '';
        updateGridVisuals(false); // Hide target pattern, show only player's blocks
        submitButton.disabled = false;
        revealPatternButton.disabled = false;
        playSound(recreateStartSound);
    }

    function levelComplete() {
        gameActive = false;
        clearInterval(countdownTimer);
        playSound(roundCompleteSound);

        statusDisplay.textContent = `Level ${currentLevel} Complete!`;
        score += SCORE_PER_LEVEL;
        currentLevel++;
        updateScoreDisplay();

        setTimeout(() => {
            gameActive = true;
            nextRound();
        }, 2000);
    }

    function gameOver() {
        gameActive = false;
        clearInterval(countdownTimer);
        playSound(gameOverSound);
        statusDisplay.textContent = `Game Over! You reached Level ${currentLevel} with a score of ${score}. Click Restart Game to play again.`;
        countdownDisplay.textContent = '';
        submitButton.disabled = true;
        revealPatternButton.disabled = true;
    }

    function updateLevelDisplay() {
        levelDisplay.textContent = `Level: ${currentLevel}`;
    }

    // Function for revealing pattern temporarily
    function revealPatternTemporarily() {
        if (!gameActive || gamePhase === 'memorize') {
            statusDisplay.textContent = "Can only reveal during recreation!";
            return;
        }

        if (score < REVEAL_COST) {
            statusDisplay.textContent = "Not enough points to reveal pattern! Need " + REVEAL_COST + " pts.";
            return;
        }

        score -= REVEAL_COST;
        updateScoreDisplay();
        playSound(revealSound);
        statusDisplay.textContent = `Revealing pattern! (-${REVEAL_COST} pts)`;
        revealPatternButton.disabled = true;
        submitButton.disabled = true;

        updateGridVisuals(true); // Show player blocks opaque, target as ghost

        setTimeout(() => {
            updateGridVisuals(false); // Revert to normal recreate display
            statusDisplay.textContent = 'Recreate!';
            revealPatternButton.disabled = false;
            submitButton.disabled = false;
        }, REVEAL_DURATION);
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

    submitButton.addEventListener('click', () => checkCompletion());
    restartButton.addEventListener('click', startGame);
    revealPatternButton.addEventListener('click', revealPatternTemporarily);


    // Initial setup
    preloadBlockTextures().then(() => {
        console.log("Memory game textures loaded.");
        initializeInventory();
        initializeGrid(GRID_WIDTH, GRID_HEIGHT);
        musicPlaylist = categorizedMusic["Main Menu"];
        initializeShuffledPlaylist();
        startGame();
    }).catch(error => {
        console.error("Error loading memory game textures:", error);
        initializeInventory();
        initializeGrid(GRID_WIDTH, GRID_HEIGHT);
        musicPlaylist = categorizedMusic["Main Menu"];
        initializeShuffledPlaylist();
        startGame();
    });
});
