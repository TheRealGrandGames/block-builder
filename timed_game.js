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

    const GRID_WIDTH = 15;
    const GRID_HEIGHT = 15;
    const BLOCK_SIZE = 40; // Smaller block size for larger grid
    const INITIAL_TIME = 30; // seconds
    const MIN_BLOCKS_PER_PATTERN = 10;
    const MAX_BLOCKS_PER_PATTERN = 30; // Max blocks to generate
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

    // Music setup
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
        ] // Limiting for simplicity in minigame, could be more specific
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
        // Reduced categories for simplicity in minigame inventory
    };
    const blockTypes = {};
    for (const category in blockCategories) {
        blockCategories[category].forEach(block => {
            blockTypes[block.name] = block;
        });
    }
    const blockImages = {};
    let texturesLoadedPromise = null;

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
        // Preload button textures needed for these game pages
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
        // Only one category for simplicity in minigame
        const categoryDiv = document.createElement('div');
        categoryDiv.classList.add('inventory-category');
        const categoryContent = document.createElement('div');
        categoryContent.classList.add('category-content');
        categoryDiv.appendChild(categoryContent);

        allBlockTypes.forEach(blockData => {
            const inventoryBlockElement = document.createElement('div');
            inventoryBlockElement.classList.add('inventory-block');
            inventoryBlockElement.dataset.type = blockData.name;
            inventoryBlockElement.dataset.name = blockData.name;
            inventoryBlockElement.style.backgroundImage = `url(${blockData.texture})`;

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

        blockInventory.appendChild(categoryDiv);

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
        if (selectedBlockData) {
            selectedBlockDisplay.style.backgroundImage = `url(${selectedBlockData.texture})`;
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

        playerGridState = Array(width * height).fill('Air');

        for (let i = 0; i < width * height; i++) {
            const block = document.createElement('div');
            block.classList.add('grid-block');
            block.dataset.index = i;
            block.dataset.type = 'Air';
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
                    const clickedBlockType = block.dataset.type;
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
                const blockType = block.dataset.type;
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

    function placeBlock(gridBlockElement, type) {
        const oldType = gridBlockElement.dataset.type;
        const index = parseInt(gridBlockElement.dataset.index);

        if (oldType === type) {
            return;
        }

        gridBlockElement.dataset.type = type;
        playerGridState[index] = type;

        const texturePath = blockTypes[type] ? blockTypes[type].texture : null;
        if (texturePath) {
            gridBlockElement.style.backgroundImage = `url(${texturePath})`;
            gridBlockElement.style.backgroundColor = '';
        } else {
            gridBlockElement.style.backgroundImage = 'none';
            gridBlockElement.style.backgroundColor = '#e0e0e0';
        }
        playSound(placeBlockSound, isPainting, 'place');
    }

    function destroyBlock(gridBlockElement) {
        const oldType = gridBlockElement.dataset.type;
        const index = parseInt(gridBlockElement.dataset.index);

        if (oldType === 'Air') {
            return;
        }

        gridBlockElement.dataset.type = 'Air';
        playerGridState[index] = 'Air';
        gridBlockElement.style.backgroundColor = '#e0e0e0';
        gridBlockElement.style.backgroundImage = 'none';
        playSound(destroyBlockSound, isPainting, 'destroy');
    }

    // Game logic functions
    function generateRandomPattern() {
        targetPattern = Array(GRID_WIDTH * GRID_HEIGHT).fill('Air');
        const availableBlocks = Object.keys(blockTypes);
        const numBlocksToPlace = Math.floor(Math.random() * (MAX_BLOCKS_PER_PATTERN - MIN_BLOCKS_PER_PATTERN + 1)) + MIN_BLOCKS_PER_PATTERN;

        let placedCount = 0;
        while (placedCount < numBlocksToPlace) {
            const randomIndex = Math.floor(Math.random() * (GRID_WIDTH * GRID_HEIGHT));
            const randomBlockType = availableBlocks[Math.floor(Math.random() * availableBlocks.length)];

            if (targetPattern[randomIndex] === 'Air') {
                targetPattern[randomIndex] = randomBlockType;
                placedCount++;
            }
        }
        displayTargetPattern();
    }

    function displayTargetPattern() {
        const gridBlocks = document.querySelectorAll('.grid-block');
        gridBlocks.forEach((block, index) => {
            const type = targetPattern[index];
            const texturePath = blockTypes[type] ? blockTypes[type].texture : null;

            if (type !== 'Air') {
                block.classList.add('ghost-block'); // Add ghost effect
                if (texturePath) {
                    block.style.backgroundImage = `url(${texturePath})`;
                    block.style.backgroundColor = '';
                }
            } else {
                block.classList.remove('ghost-block');
                block.style.backgroundImage = 'none';
                block.style.backgroundColor = '#e0e0e0';
            }
        });
    }

    function clearPlayerGrid() {
        const gridBlocks = document.querySelectorAll('.grid-block');
        gridBlocks.forEach((block, index) => {
            block.classList.remove('ghost-block'); // Ensure no ghost class remains
            block.dataset.type = 'Air';
            playerGridState[index] = 'Air';
            block.style.backgroundColor = '#e0e0e0';
            block.style.backgroundImage = 'none';
        });
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
        clearPlayerGrid();
        generateRandomPattern();
        startTimer();
    }

    function nextLevel() {
        playSound(successSound);
        currentLevel++;
        score += SCORE_PER_LEVEL;
        timeLeft += TIME_BONUS_PER_LEVEL; // Add time for completing level
        updateLevelDisplay();
        messageDisplay.textContent = 'Great job! New pattern!';
        clearPlayerGrid();
        generateRandomPattern();
    }

    function gameOver() {
        playSound(failureSound);
        clearInterval(timerInterval);
        gameActive = false;
        messageDisplay.textContent = `Game Over! You reached Level ${currentLevel} with a score of ${score}.`;
        // Optionally, display a restart button or link back to main
    }

    function startTimer() {
        clearInterval(timerInterval); // Clear any existing timer
        timerInterval = setInterval(() => {
            if (timeLeft <= 0) {
                gameOver();
                return;
            }
            timeLeft--;
            updateTimerDisplay();
            if (timeLeft <= 5 && timeLeft > 0) { // Play tick sound for last 5 seconds
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
            timerDisplay.style.color = 'var(--text-color)'; // Default
        }
    }

    function updateLevelDisplay() {
        levelDisplay.textContent = `Level: ${currentLevel}`;
    }

    function levelComplete() {
        clearInterval(timerInterval);
        gameActive = false; // Temporarily pause game logic
        messageDisplay.textContent = "Pattern complete! Get ready for the next level...";
        setTimeout(() => {
            gameActive = true;
            nextLevel();
            startTimer();
        }, 2000); // Wait 2 seconds before next level
    }

    // Event listeners for toggle buttons (copied from main scripts.js for consistency)
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

    // Initial setup
    preloadBlockTextures().then(() => {
        console.log("Timed game textures loaded.");
        initializeInventory();
        initializeGrid(GRID_WIDTH, GRID_HEIGHT);
        musicPlaylist = categorizedMusic["Creative"]; // Specific music for minigame
        initializeShuffledPlaylist();

        // Start game automatically after textures load and initial setup
        startGame();
    }).catch(error => {
        console.error("Error loading timed game textures:", error);
        // Fallback initialization
        initializeInventory();
        initializeGrid(GRID_WIDTH, GRID_HEIGHT);
        musicPlaylist = categorizedMusic["Creative"];
        initializeShuffledPlaylist();
        startGame();
    });
});
