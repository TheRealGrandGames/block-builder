document.addEventListener('DOMContentLoaded', () => {
    const gameGrid = document.getElementById('gameGrid');
    const blockInventory = document.getElementById('blockInventory');
    const blockTooltip = document.getElementById('blockTooltip');
    const selectedBlockDisplay = document.getElementById('selectedBlockDisplay');
    const clearGridButton = document.getElementById('clearGridButton');
    const fillGridButton = document.getElementById('fillGridButton');
    const savePngButton = document.getElementById('savePngButton');
    const hiddenCanvas = document.getElementById('hiddenCanvas');
    const soundToggleButton = document.getElementById('soundToggleButton');
    const gridSoundToggleButton = document.getElementById('gridSoundToggleButton');
    const musicToggleButton = document.getElementById('musicToggleButton');
    const resourceCountDisplay = document.getElementById('resourceCountDisplay');

    const gridWidthInput = document.getElementById('gridWidth');
    const gridHeightInput = document.getElementById('gridHeight');
    const setGridSizeButton = document.getElementById('setGridSizeButton');

    // NEW: Undo/Redo buttons
    const undoButton = document.getElementById('undoButton');
    const redoButton = document.getElementById('redoButton');

    // NEW: Import/Export Buttons and File Input
    const importButton = document.getElementById('importButton');
    const exportButton = document.getElementById('exportButton');
    const importFileInput = document.getElementById('importFileInput');

    // NEW: Checkbox for including resources in PNG
    const includeResourcesCheckbox = document.getElementById('includeResourcesCheckbox');

    let currentGridWidth = 10;
    let currentGridHeight = 10;
    const blockSize = 50;
    let canvasWidth;
    let canvasHeight;
    let ctx; // Declare ctx here so it's accessible globally within this scope

    let selectedBlockType = 'Grass Block';
    let currentInventoryBlockElement = null;
    let isPainting = false; // Flag for continuous painting during drag

    let gridState = []; // Represents the current state of the grid

    // NEW: History for Undo/Redo
    let gridHistory = [];
    let historyPointer = -1; // -1 means no states saved yet, or history is empty
    const MAX_HISTORY_STATES = 50; // Limit history to prevent excessive memory usage

    const resourceCounts = {};

    // Audio objects for sound effects
    const buttonSound = new Audio('audio/button_click.mp3');
    const fillSound = new Audio('audio/grid_fill.mp3');
    const selectSound = new Audio('audio/inventory_button_click.mp3');
    const categoryOpenSound = new Audio('audio/category_open.mp3');
    const categoryCollapseSound = new Audio('audio/category_collapse.mp3');
    const saveSound = new Audio('audio/save_sound.mp3');

    // NEW: Block Place and Destroy Sounds (make sure these files exist or point to valid audio)
    const placeBlockSound = new Audio('audio/inventory_button_click.mp3');
    const destroyBlockSound = new Audio('audio/destroy_block.mp3');

    // NEW: Pitch tracking variables for consecutive actions
    let consecutivePlaceCount = 0;
    let consecutiveDestroyCount = 0;
    const maxPitchIncrease = 0.5; // Max additional pitch (e.g., 0.5 means 50% faster)
    const pitchIncrementPerAction = 0.05; // How much pitch increases per consecutive action
    const pitchDecayTime = 200; // Time in ms after which pitch resets if no new action
    let pitchResetTimeout;

    const musicPlaylist = [
        'audio/music/taswell.mp3', 'audio/music/dreiton.mp3', 'audio/music/aria_math.mp3',
        'audio/music/haunt_muskie.mp3', 'audio/music/biome_fest.mp3', 'audio/music/blind_spots.mp3'
    ];

    const backgroundMusic = new Audio();
    backgroundMusic.loop = false;
    backgroundMusic.volume = 0.5;

    let shuffledPlaylistIndices = [];
    let currentShuffledIndex = 0;

    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    function initializeShuffledPlaylist() {
        shuffledPlaylistIndices = Array.from({ length: musicPlaylist.length }, (_, i) => i);
        shuffleArray(shuffledPlaylistIndices);
        currentShuffledIndex = 0;
    }

    if (musicPlaylist.length > 0) {
        initializeShuffledPlaylist();
    }

    backgroundMusic.onended = () => {
        playNextSong();
    };

    let soundsEnabled = localStorage.getItem('soundsEnabled') === 'false' ? false : true;
    let gridSoundsEnabled = localStorage.getItem('gridSoundsEnabled') === 'false' ? false : true;
    let musicEnabled = localStorage.getItem('musicEnabled') === 'false' ? false : true;
    let hasUserInteracted = false;

    // Modified playSound function to handle dynamic pitch
    function playSound(audioElement, isConsecutiveAction = false, actionType = null) {
        if (!soundsEnabled || !hasUserInteracted) {
            return;
        }

        // NEW: Check for gridSoundsEnabled for specific audio elements
        if ((audioElement === placeBlockSound || audioElement === destroyBlockSound) && !gridSoundsEnabled) {
            return; // Don't play if grid sounds are off
        }

        // Clear any existing reset timeout
        clearTimeout(pitchResetTimeout);

        let currentPitch = 1.0;
        if (isConsecutiveAction && actionType) {
            if (actionType === 'place') {
                consecutivePlaceCount = Math.min(consecutivePlaceCount + 1, maxPitchIncrease / pitchIncrementPerAction);
                consecutiveDestroyCount = 0; // Reset other counter
                currentPitch += consecutivePlaceCount * pitchIncrementPerAction;
            } else if (actionType === 'destroy') {
                consecutiveDestroyCount = Math.min(consecutiveDestroyCount + 1, maxPitchIncrease / pitchIncrementPerAction);
                consecutivePlaceCount = 0; // Reset other counter
                currentPitch += consecutiveDestroyCount * pitchIncrementPerAction;
            }
        } else {
            // If not a consecutive action, reset counts for a fresh start
            consecutivePlaceCount = 0;
            consecutiveDestroyCount = 0;
        }

        // Clamp pitch to a reasonable range (e.g., 0.5 to 2.0)
        audioElement.playbackRate = Math.max(0.5, Math.min(2.0, currentPitch));
        audioElement.currentTime = 0;

        audioElement.play().catch(e => console.error("Error playing sound effect:", e));

        // Set a timeout to reset pitch counts if no new action occurs
        pitchResetTimeout = setTimeout(() => {
            consecutivePlaceCount = 0;
            consecutiveDestroyCount = 0;
        }, pitchDecayTime);
    }

    function updateSoundToggleButton() {
        soundToggleButton.textContent = `Sounds: ${soundsEnabled ? 'ON' : 'OFF'}`;
    }

    function updateGridSoundToggleButton() {
        gridSoundToggleButton.textContent = `Grid Sounds: ${gridSoundsEnabled ? 'ON' : 'OFF'}`;
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
        if (musicPlaylist.length === 0) return;

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
    updateGridSoundToggleButton();
    updateMusicToggleButton();

    document.body.addEventListener('click', () => {
        if (!hasUserInteracted) {
            hasUserInteracted = true;
            console.log("User interacted. Audio playback is now permitted.");
            playBackgroundMusic();
        }
    }, { once: true });


    const blockCategories = {
        Natural: [
            { name: 'Grass Block', texture: 'textures/grass.png' },
            { name: 'Moss Block', texture: 'textures/moss_block.png' },
            { name: 'Dirt', texture: 'textures/dirt.png' },
            { name: 'Coarse Dirt', texture: 'textures/coarse_dirt.png' },
            { name: 'Rooted Dirt', texture: 'textures/rooted_dirt.png' },
        ],
        Wood: [
            { name: 'Oak Planks', texture: 'textures/oak_planks.png' },
            { name: 'Spruce Planks', texture: 'textures/spruce_planks.png' },
            { name: 'Birch Planks', texture: 'textures/birch_planks.png' },
            { name: 'Jungle Planks', texture: 'textures/jungle_planks.png' },
            { name: 'Acacia Planks', texture: 'textures/acacia_planks.png' },
            { name: 'Dark Oak Planks', texture: 'textures/dark_oak_planks.png' },
            { name: 'Mangrove Planks', texture: 'textures/mangrove_planks.png' },
            { name: 'Cherry Planks', texture: 'textures/cherry_planks.png' },
            { name: 'Pale Oak Planks', texture: 'textures/pale_oak_planks.png' },
            { name: 'Bamboo Planks', texture: 'textures/bamboo_planks.png' },
            { name: 'Bamboo Mosaic', texture: 'textures/bamboo_mosaic.png' },
            { name: 'Crimson Planks', texture: 'textures/crimson_planks.png' },
            { name: 'Warped Planks', texture: 'textures/warped_planks.png' },
        ],
        Stone: [
            { name: 'Stone', texture: 'textures/stone.png' },
            { name: 'Stone Bricks', texture: 'textures/stone_bricks.png' },
            { name: 'Cracked Stone Bricks', texture: 'textures/cracked_stone_bricks.png' },
            { name: 'Mossy Stone Bricks', texture: 'textures/mossy_stone_bricks.png' },
            { name: 'Chiseled Stone Bricks', texture: 'textures/chiseled_stone_bricks.png' },
            { name: 'Cobblestone', texture: 'textures/cobblestone.png' },
            { name: 'Mossy Cobblestone', texture: 'textures/mossy_cobblestone.png' },
            { name: 'Granite', texture: 'textures/granite.png' },
            { name: 'Polished Granite', texture: 'textures/polished_granite.png' },
            { name: 'Diorite', texture: 'textures/diorite.png' },
            { name: 'Polished Diorite', texture: 'textures/polished_diorite.png' },
            { name: 'Andesite', texture: 'textures/andesite.png' },
            { name: 'Polished Andesite', texture: 'textures/polished_andesite.png' },
        ],
        Minerals: [
            { name: 'Coal Block', texture: 'textures/coal_block.png' },
            { name: 'Iron Block', texture: 'textures/iron_block.png' },
            { name: 'Gold Block', texture: 'textures/gold_block.png' },
            { name: 'Redstone Block', texture: 'textures/redstone_block.png' },
            { name: 'Diamond Block', texture: 'textures/diamond_block.png' },
            { name: 'Netherite Block', texture: 'textures/netherite_block.png' },
            { name: 'Emerald Block', texture: 'textures/emerald_block.png' },
            { name: 'Lapis Lazuli Block', texture: 'textures/lapis_block.png' },
            { name: 'Amethyst Block', texture: 'textures/amethyst_block.png' },
            { name: 'Budding Amethyst', texture: 'textures/budding_amethyst.png' },

            { name: 'Coal Ore', texture: 'textures/coal_ore.png' },
            { name: 'Iron Ore', texture: 'textures/iron_ore.png' },
            { name: 'Copper Ore', texture: 'textures/copper_ore.png' },
            { name: 'Gold Ore', texture: 'textures/gold_ore.png' },
            { name: 'Redstone Ore', texture: 'textures/redstone_ore.png' },
            { name: 'Emerald Ore', texture: 'textures/emerald_ore.png' },
            { name: 'Lapis Lazuli Ore', texture: 'textures/lapis_ore.png' },
            { name: 'Diamond Ore', texture: 'textures/diamond_ore.png' },

        ],
        Liquids: [
            { name: 'Water', texture: 'textures/water.png' },
            { name: 'Lava', texture: 'textures/lava.png' },
        ],
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
                        // Set a placeholder or default if texture fails to load
                        blockImages[type] = null; // Mark as failed or provide a fallback image
                        resolve();
                    };
                }));
            }
        }
        // Also preload checkbox textures
        imagesToLoad.push(new Promise((resolve, reject) => {
            const imgUnchecked = new Image();
            imgUnchecked.src = 'textures/checkbox_unchecked.png';
            imgUnchecked.crossOrigin = "Anonymous";
            imgUnchecked.onload = () => {
                // Not storing in blockImages, just ensuring it's in cache for CSS
                resolve();
            };
            imgUnchecked.onerror = () => {
                console.warn("Failed to load checkbox_unchecked.png");
                resolve(); // Still resolve to not block main loading
            };
        }));
        imagesToLoad.push(new Promise((resolve, reject) => {
            const imgChecked = new Image();
            imgChecked.src = 'textures/checkbox_checked.png';
            imgChecked.crossOrigin = "Anonymous";
            imgChecked.onload = () => {
                // Not storing in blockImages, just ensuring it's in cache for CSS
                resolve();
            };
            imgChecked.onerror = () => {
                console.warn("Failed to load checkbox_checked.png");
                resolve(); // Still resolve to not block main loading
            };
        }));


        if (imagesToLoad.length === 0) {
            texturesLoadedPromise = Promise.resolve();
        } else {
            texturesLoadedPromise = Promise.all(imagesToLoad);
        }

        return texturesLoadedPromise;
    }

    function initializeInventory() {
        blockInventory.innerHTML = '';

        for (const categoryName in blockCategories) {
            const categoryBlocks = blockCategories[categoryName];
            const categoryDiv = document.createElement('div');
            categoryDiv.classList.add('inventory-category');
            const categoryHeader = document.createElement('h3');
            categoryHeader.classList.add('category-header');
            categoryHeader.textContent = categoryName;
            categoryHeader.dataset.category = categoryName;
            const toggleIcon = document.createElement('span');
            toggleIcon.classList.add('toggle-icon');
            toggleIcon.textContent = '▼';
            categoryHeader.appendChild(toggleIcon);
            categoryDiv.appendChild(categoryHeader);
            const categoryContent = document.createElement('div');
            categoryContent.classList.add('category-content');
            categoryContent.dataset.categoryContent = categoryName;
            categoryDiv.appendChild(categoryContent);

            if (categoryName !== Object.keys(blockCategories)[0]) {
                categoryContent.classList.add('collapsed');
                toggleIcon.textContent = '►';
            }

            categoryHeader.addEventListener('click', () => {
                categoryContent.classList.toggle('collapsed');
                if (categoryContent.classList.contains('collapsed')) {
                    toggleIcon.textContent = '►';
                    playSound(categoryCollapseSound);
                } else {
                    toggleIcon.textContent = '▼';
                    playSound(categoryOpenSound);
                }
            });

            categoryBlocks.forEach(blockData => {
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
        }

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

    // Function to apply a given grid state to the actual DOM grid
    function applyState(state) {
        const allGridBlocks = document.querySelectorAll('.grid-block');
        gridState = [...state]; // Update the current gridState to the loaded state

        allGridBlocks.forEach((block, index) => {
            const type = gridState[index];
            block.dataset.type = type;
            const texturePath = blockTypes[type] ? blockTypes[type].texture : null;
            if (texturePath) {
                block.style.backgroundImage = `url(${texturePath})`;
                block.style.backgroundColor = '';
            } else {
                block.style.backgroundImage = 'none';
                block.style.backgroundColor = '#e0e0e0';
            }
        });
        updateResourceCounts(); // Recalculate resource counts after applying a state
    }

    function initializeGrid(width, height, isNewGrid = true, loadedGridState = null) {
        gameGrid.innerHTML = '';
        gameGrid.style.gridTemplateColumns = `repeat(${width}, ${blockSize}px)`;
        gameGrid.style.gridTemplateRows = `repeat(${height}, ${blockSize}px)`;
        gameGrid.style.width = `${width * blockSize}px`;
        gameGrid.style.height = `${height * blockSize}px`;

        currentGridWidth = width;
        currentGridHeight = height;

        // If it's a new grid OR loading from a file, clear history and start fresh
        if (isNewGrid) {
            gridHistory = []; // Clear history
            historyPointer = -1; // Reset pointer
            gridState = Array(width * height).fill('Air'); // Default to empty grid
            for (const key in resourceCounts) {
                delete resourceCounts[key];
            }
            if (loadedGridState) { // If a state is provided (from import)
                gridState = [...loadedGridState]; // Use the loaded state
            }
        }


        for (let i = 0; i < width * height; i++) {
            const block = document.createElement('div');
            block.classList.add('grid-block');
            block.dataset.index = i;
            // Set block type from current gridState, or 'Air' if new grid
            block.dataset.type = gridState[i] || 'Air';

            const texturePath = blockTypes[gridState[i]] ? blockTypes[gridState[i]].texture : null;
            if (texturePath) {
                block.style.backgroundImage = `url(${texturePath})`;
            } else {
                block.style.backgroundColor = '#e0e0e0';
            }


            block.addEventListener('mousedown', (event) => {
                event.preventDefault();
                isPainting = true;
                if (event.button === 0) { // Left-click
                    placeBlock(block, selectedBlockType);
                } else if (event.button === 2) { // Right-click
                    destroyBlock(block);
                }
            });

            block.addEventListener('mouseup', (event) => {
                // When mouseup occurs anywhere, reset painting and pitch counters
                isPainting = false;
                consecutivePlaceCount = 0;
                consecutiveDestroyCount = 0;
                if (pitchResetTimeout) {
                    clearTimeout(pitchResetTimeout);
                }

                // Save state only after a painting session ends
                // This ensures a single undo step for a drag operation
                if (event.button === 0 || event.button === 2) {
                    saveState();
                }


                if (event.button === 1) { // Middle mouse button
                    event.preventDefault();
                    const clickedBlockType = block.dataset.type;
                    if (clickedBlockType && clickedBlockType !== 'Air') {
                        const inventoryElement = document.querySelector(`.inventory-block[data-type="${clickedBlockType}"]`);
                        if (inventoryElement) {
                            selectBlock(clickedBlockType, inventoryElement);
                        } else {
                            console.warn(`Middle-clicked block type "${clickedBlockType}" not found in inventory.`);
                        }
                    }
                }
            });

            block.addEventListener('mouseenter', (event) => {
                // Check if a mouse button is still pressed
                if (isPainting) { // Only paint if isPainting flag is true (set by mousedown)
                    if (event.buttons === 1) { // Left mouse button
                        placeBlock(block, selectedBlockType);
                    } else if (event.buttons === 2) { // Right mouse button
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

        // Global mouseup to stop painting and save state if a drag occurred
        document.addEventListener('mouseup', (event) => {
            if (isPainting && (event.button === 0 || event.button === 2)) {
                saveState(); // Save state only once after continuous drawing
            }
            isPainting = false;
            consecutivePlaceCount = 0;
            consecutiveDestroyCount = 0;
            if (pitchResetTimeout) {
                clearTimeout(pitchResetTimeout);
            }
        });

        canvasWidth = currentGridWidth * blockSize;
        canvasHeight = currentGridHeight * blockSize;
        hiddenCanvas.width = canvasWidth;
        hiddenCanvas.height = canvasHeight;
        ctx = hiddenCanvas.getContext('2d');
        // IMPORTANT: Disable image smoothing for crisp pixel art rendering on canvas
        ctx.imageSmoothingEnabled = false;
        ctx.mozImageSmoothingEnabled = false; // For Firefox
        ctx.webkitImageSmoothingEnabled = false; // For Safari
        ctx.msImageSmoothingEnabled = false; // For Edge/IE

        updateResourceCounts();
        if (isNewGrid && !loadedGridState) { // Only save state for new grid on initial load or size change, unless loading from file
            saveState();
        }
        updateUndoRedoButtonStates(); // Update button states after grid initialization
    }

    function placeBlock(gridBlockElement, type) {
        const oldType = gridBlockElement.dataset.type;
        const index = parseInt(gridBlockElement.dataset.index);

        if (oldType === type) {
            return;
        }

        if (oldType !== 'Air') {
            resourceCounts[oldType] = (resourceCounts[oldType] || 0) - 1;
            if (resourceCounts[oldType] <= 0) {
                delete resourceCounts[oldType];
            }
        }

        gridBlockElement.dataset.type = type;
        gridState[index] = type; // Update the current gridState array

        const texturePath = blockTypes[type] ? blockTypes[type].texture : 'path/to/default_empty_texture.png';
        gridBlockElement.style.backgroundImage = `url(${texturePath})`;
        gridBlockElement.style.backgroundColor = '';

        if (type !== 'Air') {
            resourceCounts[type] = (resourceCounts[type] || 0) + 1;
        }
        updateResourceCountsDisplay();
        // Play sound when placing a block
        playSound(placeBlockSound, isPainting, 'place');
        // Do NOT call saveState() here directly for continuous painting. It's handled on mouseup.
    }

    function destroyBlock(gridBlockElement) {
        const oldType = gridBlockElement.dataset.type;
        const index = parseInt(gridBlockElement.dataset.index);

        if (oldType === 'Air') {
            return;
        }

        gridBlockElement.dataset.type = 'Air';
        gridState[index] = 'Air'; // Update the current gridState array
        gridBlockElement.style.backgroundColor = '#e0e0e0';
        gridBlockElement.style.backgroundImage = 'none';

        resourceCounts[oldType] = (resourceCounts[oldType] || 0) - 1;
        if (resourceCounts[oldType] <= 0) {
            delete resourceCounts[oldType];
        }
        updateResourceCountsDisplay();
        // Play sound when destroying a block
        playSound(destroyBlockSound, isPainting, 'destroy');
        // Do NOT call saveState() here directly for continuous painting. It's handled on mouseup.
    }

    function clearGrid() {
        const allGridBlocks = document.querySelectorAll('.grid-block');
        allGridBlocks.forEach(block => {
            if (block.dataset.type !== 'Air') { // Only 'destroy' if it's not already empty
                destroyBlock(block);
            }
        });
        // Clear resource counts immediately after clearing the grid visually
        for (const key in resourceCounts) {
            delete resourceCounts[key];
        }
        updateResourceCountsDisplay();
        saveState(); // Save state after clear operation
    }

    function fillGrid() {
        const allGridBlocks = document.querySelectorAll('.grid-block');
        allGridBlocks.forEach(block => {
            placeBlock(block, selectedBlockType);
        });
        saveState(); // Save state after fill operation
    }

    clearGridButton.addEventListener('click', () => {
        clearGrid();
        playSound(buttonSound);
    });

    fillGridButton.addEventListener('click', () => {
        fillGrid();
        playSound(buttonSound);
        playSound(fillSound);
    });

    // Save current grid state to history
    function saveState() {
        // If we are not at the end of history (i.e., we have undone some actions),
        // any new action should truncate the "redo" history.
        if (historyPointer < gridHistory.length - 1) {
            gridHistory = gridHistory.slice(0, historyPointer + 1);
        }

        // Deep copy the current gridState to avoid reference issues
        const stateToSave = JSON.parse(JSON.stringify(gridState));
        gridHistory.push(stateToSave);
        historyPointer++;

        // Limit history size
        if (gridHistory.length > MAX_HISTORY_STATES) {
            gridHistory.shift(); // Remove the oldest state
            historyPointer--; // Adjust pointer since oldest state was removed
        }
        updateUndoRedoButtonStates();
        console.log(`State saved. History length: ${gridHistory.length}, Pointer: ${historyPointer}`);
    }

    // Undo action
    function undo() {
        if (historyPointer > 0) {
            playSound(buttonSound); // Play sound for undo
            historyPointer--;
            applyState(gridHistory[historyPointer]);
            updateUndoRedoButtonStates();
            console.log(`Undid. History length: ${gridHistory.length}, Pointer: ${historyPointer}`);
        } else {
            console.log("Cannot undo further.");
        }
    }

    // Redo action
    function redo() {
        if (historyPointer < gridHistory.length - 1) {
            playSound(buttonSound); // Play sound for redo
            historyPointer++;
            applyState(gridHistory[historyPointer]);
            updateUndoRedoButtonStates();
            console.log("Redid. History length: ${gridHistory.length}, Pointer: ${historyPointer}");
        } else {
            console.log("Cannot redo further.");
        }
    }

    // Update undo/redo button disabled states
    function updateUndoRedoButtonStates() {
        undoButton.disabled = (historyPointer <= 0);
        redoButton.disabled = (historyPointer >= gridHistory.length - 1);
    }

    // Event Listeners for new Undo/Redo buttons
    undoButton.addEventListener('click', undo);
    redoButton.addEventListener('click', redo);

    // Export functionality
    function exportGrid() {
        playSound(buttonSound);
        const dataToSave = {
            width: currentGridWidth,
            height: currentGridHeight,
            grid: gridState
        };
        const jsonData = JSON.stringify(dataToSave, null, 2); // Pretty print JSON

        const blob = new Blob([jsonData], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = 'my_design.blockbuilder'; // Default filename
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url); // Clean up the URL object

        playSound(saveSound);
    }

    // Import functionality
    function importGrid(event) {
        playSound(buttonSound);
        const file = event.target.files[0];
        if (!file) {
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const loadedData = JSON.parse(e.target.result);

                if (loadedData && typeof loadedData.width === 'number' && typeof loadedData.height === 'number' && Array.isArray(loadedData.grid)) {
                    // Validate grid size match
                    if (loadedData.width * loadedData.height !== loadedData.grid.length) {
                        alert('Error: Imported file grid dimensions do not match the grid array length.');
                        return;
                    }

                    // Set grid size inputs
                    gridWidthInput.value = loadedData.width;
                    gridHeightInput.value = loadedData.height;

                    // Initialize a new grid with the loaded dimensions and state, clearing history
                    initializeGrid(loadedData.width, loadedData.height, true, loadedData.grid);
                    alert('Grid imported successfully!'); // Use custom modal in production
                } else {
                    alert('Error: Invalid .blockbuilder file format. Missing or incorrect data.'); // Use custom modal
                }
            } catch (error) {
                console.error("Error parsing .blockbuilder file:", error);
                alert('Error: Could not read or parse the .blockbuilder file. It might be corrupted or not a valid JSON.'); // Use custom modal
            } finally {
                // Clear the file input value so the same file can be selected again
                event.target.value = '';
            }
        };
        reader.onerror = () => {
            console.error("FileReader error:", reader.error);
            alert('Error reading file. Please try again.'); // Use custom modal
        };
        reader.readAsText(file);
    }

    // Helper function to draw resource counts onto a canvas context
    function drawResourcesOnCanvas(ctx, startY, canvasWidthPx, resourceCounts, blockTypes, blockImages) {
        let currentY = startY + 20; // Initial padding below the grid

        ctx.font = 'bold 16px Arial'; // Title font
        ctx.fillStyle = '#333';
        ctx.textAlign = 'center'; // Center the title horizontally
        ctx.fillText("Resources Used", canvasWidthPx / 2, currentY);
        currentY += 25; // Space after title

        ctx.font = '14px Arial'; // Item font
        ctx.fillStyle = '#444';

        const RESOURCE_ITEM_HEIGHT = 28; // Height allocated per resource item (image + text)
        const RESOURCE_IMG_SIZE = 24;
        const TEXT_X_OFFSET = RESOURCE_IMG_SIZE + 10; // Text starts after image + small gap

        const sortedBlockTypes = Object.keys(resourceCounts).sort();

        if (sortedBlockTypes.length === 0) {
            ctx.textAlign = 'center';
            ctx.font = 'italic 14px Arial';
            ctx.fillText("No blocks placed yet.", canvasWidthPx / 2, currentY + 15);
            return;
        }

        // Calculate maximum item width to determine a starting X for centering the block of items
        let maxItemContentWidth = 0;
        // Temporarily set font for accurate measurement
        ctx.font = '14px Arial';
        sortedBlockTypes.forEach(type => {
            const count = resourceCounts[type];
            const name = type;
            const quantity = `x${count}`;
            const text = `${name} ${quantity}`;
            const textWidth = ctx.measureText(text).width;
            maxItemContentWidth = Math.max(maxItemContentWidth, RESOURCE_IMG_SIZE + 10 + textWidth);
        });

        // Ensure text is left-aligned within each item's drawing area
        ctx.textAlign = 'left';

        // Calculate starting X to center the block of resource items
        const startXForBlockItems = (canvasWidthPx - maxItemContentWidth) / 2;

        sortedBlockTypes.forEach(type => {
            const count = resourceCounts[type];
            if (count > 0) {
                const blockData = blockTypes[type];
                const img = blockImages[type];
                const name = type;
                const quantity = `x${count}`;

                const itemText = `${name} ${quantity}`;
                // Recalculate text metrics for current item to vertically align
                ctx.font = '14px Arial'; // Re-set font as a safety measure
                const textMetrics = ctx.measureText(itemText);

                let drawX = startXForBlockItems;
                // Calculate y-coordinate to vertically center text within the item's line height
                const textY = currentY + (RESOURCE_ITEM_HEIGHT / 2) + (textMetrics.actualBoundingBoxAscent / 2);

                if (img && img.complete) {
                    ctx.drawImage(img, drawX, currentY + (RESOURCE_ITEM_HEIGHT - RESOURCE_IMG_SIZE) / 2, RESOURCE_IMG_SIZE, RESOURCE_IMG_SIZE);
                } else {
                    // Fallback square if image not loaded or invalid
                    ctx.fillStyle = '#ccc';
                    ctx.fillRect(drawX, currentY + (RESOURCE_ITEM_HEIGHT - RESOURCE_IMG_SIZE) / 2, RESOURCE_IMG_SIZE, RESOURCE_IMG_SIZE);
                    ctx.fillStyle = '#444';
                    ctx.fillText('?', drawX + RESOURCE_IMG_SIZE / 2 - (ctx.measureText('?').width / 2), currentY + (RESOURCE_ITEM_HEIGHT / 2) + (textMetrics.actualBoundingBoxAscent / 2));
                }

                ctx.fillStyle = '#444';
                ctx.fillText(itemText, drawX + TEXT_X_OFFSET, textY);
                currentY += RESOURCE_ITEM_HEIGHT;
            }
        });
        // No return value needed as this is a drawing function
    }

    // Helper to calculate height of resource list for canvas
    function calculateResourceListCanvasHeight() {
        if (!includeResourcesCheckbox.checked) {
            return 0; // No extra height needed if checkbox is not checked
        }
        const numItems = Object.keys(resourceCounts).length;
        if (numItems === 0) {
            return 40; // Height for "No blocks placed yet." title + padding
        }
        // Initial padding + Title height + (number of items * item height)
        return 20 + 25 + (numItems * 28);
    }

    function drawGridToCanvas(targetCtx, targetCanvasWidth, targetCanvasHeight) {
        // Clear only the grid area in the context provided
        targetCtx.clearRect(0, 0, targetCanvasWidth, targetCanvasHeight);

        const gridBlocks = document.querySelectorAll('.grid-block');
        gridBlocks.forEach(blockElement => {
            const type = blockElement.dataset.type;
            const index = parseInt(blockElement.dataset.index);
            const row = Math.floor(index / currentGridWidth);
            const col = index % currentGridWidth;

            const x = col * blockSize;
            const y = row * blockSize;

            if (type === 'Air') {
                targetCtx.fillStyle = '#e0e0e0';
                targetCtx.fillRect(x, y, blockSize, blockSize);
            } else {
                const img = blockImages[type];
                if (img && img.complete) {
                    targetCtx.drawImage(img, x, y, blockSize, blockSize);
                } else {
                    console.warn(`Texture for ${type} not loaded or incomplete, drawing placeholder.`);
                    targetCtx.fillStyle = '#ff00ff'; // Magenta placeholder
                    targetCtx.fillRect(x, y, blockSize, blockSize);
                }
            }
        });
    }


    async function saveCanvasAsPng() {
        playSound(buttonSound);

        if (texturesLoadedPromise) {
            await texturesLoadedPromise;
            console.log("Textures are ready. Proceeding to draw and save.");
        } else {
            console.warn("texturesLoadedPromise was not initialized. Drawing may fail.");
        }

        const includeResources = includeResourcesCheckbox.checked;
        const resourceListHeight = calculateResourceListCanvasHeight();

        // Create a temporary canvas for export that might be taller
        const exportCanvas = document.createElement('canvas');
        const exportCtx = exportCanvas.getContext('2d');

        exportCanvas.width = canvasWidth;
        exportCanvas.height = canvasHeight + resourceListHeight;

        // Disable image smoothing for the export canvas for crisp pixel art
        exportCtx.imageSmoothingEnabled = false;
        exportCtx.mozImageSmoothingEnabled = false;
        exportCtx.webkitImageSmoothingEnabled = false;
        exportCtx.msImageSmoothingEnabled = false;

        // Draw the grid part onto the export canvas
        drawGridToCanvas(exportCtx, canvasWidth, canvasHeight); // Draw grid from (0,0) to (canvasWidth, canvasHeight)

        if (includeResources) {
            // Draw resource list below the grid
            drawResourcesOnCanvas(exportCtx, canvasHeight, canvasWidth, resourceCounts, blockTypes, blockImages);
        }

        const dataURL = exportCanvas.toDataURL('image/png');

        const a = document.createElement('a');
        a.href = dataURL;
        a.download = 'my_block_design.png';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(dataURL); // Clean up the URL object

        playSound(saveSound);
    }

    savePngButton.addEventListener('click', async () => {
        await saveCanvasAsPng();
    });

    soundToggleButton.addEventListener('click', () => {
        soundsEnabled = !soundsEnabled;
        localStorage.setItem('soundsEnabled', soundsEnabled);
        updateSoundToggleButton();
        playSound(buttonSound);
    });

    gridSoundToggleButton.addEventListener('click', () => {
        gridSoundsEnabled = !gridSoundsEnabled; // Toggle the state
        localStorage.setItem('gridSoundsEnabled', gridSoundsEnabled); // Save to localStorage
        updateGridSoundToggleButton(); // Update button text
        playSound(buttonSound); // Play a button click sound (this is not a grid sound, so it plays if `soundsEnabled` is ON)
    });

    musicToggleButton.addEventListener('click', () => {
        musicEnabled = !musicEnabled;
        localStorage.setItem('musicEnabled', musicEnabled);
        updateMusicToggleButton();
        if (musicEnabled) {
            initializeShuffledPlaylist();
            playBackgroundMusic();
        } else {
            pauseBackgroundMusic();
        }
        playSound(buttonSound);
    });

    function updateResourceCounts() {
        // Clear existing counts before recalculating
        for (const key in resourceCounts) {
            delete resourceCounts[key];
        }

        // Iterate through the current gridState to count blocks
        gridState.forEach(blockType => {
            if (blockType !== 'Air') {
                resourceCounts[blockType] = (resourceCounts[blockType] || 0) + 1;
            }
        });
        updateResourceCountsDisplay();
    }

    function updateResourceCountsDisplay() {
        resourceCountDisplay.innerHTML = '';

        const sortedBlockTypes = Object.keys(resourceCounts).sort();

        if (sortedBlockTypes.length === 0) {
            resourceCountDisplay.innerHTML = '<p>No blocks placed yet.</p>';
            return;
        }

        sortedBlockTypes.forEach(type => {
            const count = resourceCounts[type];
            if (count > 0) {
                const resourceItem = document.createElement('div');
                resourceItem.classList.add('resource-item');

                const resourceImage = document.createElement('div');
                resourceImage.classList.add('resource-image');
                const blockData = blockTypes[type];
                if (blockData && blockData.texture) {
                    resourceImage.style.backgroundImage = `url(${blockData.texture})`;
                } else {
                    resourceImage.style.backgroundColor = '#ccc';
                }

                const resourceName = document.createElement('span');
                resourceName.classList.add('resource-name');
                resourceName.textContent = type;

                const resourceQuantity = document.createElement('span');
                resourceQuantity.classList.add('resource-quantity');
                resourceQuantity.textContent = `x${count}`;

                resourceItem.appendChild(resourceImage);
                resourceItem.appendChild(resourceName);
                resourceItem.appendChild(resourceQuantity);
                resourceCountDisplay.appendChild(resourceItem);
            }
        });
    }

    setGridSizeButton.addEventListener('click', () => {
        playSound(buttonSound);
        const newWidth = parseInt(gridWidthInput.value);
        const newHeight = parseInt(gridHeightInput.value);

        const MAX_GRID_SIZE = 35; 

        if (isNaN(newWidth) || newWidth < 1 || newWidth > MAX_GRID_SIZE) {
            // Using a simple alert for now. Consider a custom modal for better UX.
            alert(`Please enter a valid width between 1 and ${MAX_GRID_SIZE}.`);
            gridWidthInput.value = currentGridWidth;
            return;
        }
        if (isNaN(newHeight) || newHeight < 1 || newHeight > MAX_GRID_SIZE) {
            // Using a simple alert for now. Consider a custom modal for better UX.
            alert(`Please enter a valid height between 1 and ${MAX_GRID_SIZE}.`);
            gridHeightInput.value = currentGridHeight;
            return;
        }

        initializeGrid(newWidth, newHeight, true); // Initialize a new grid, saving its state
    });

    // --- NEW: Add Tooltip Handling for Buttons ---
    const toggleButtons = [musicToggleButton, soundToggleButton, gridSoundToggleButton, fillGridButton, clearGridButton, undoButton, redoButton, setGridSizeButton, savePngButton, importButton, exportButton];

    toggleButtons.forEach(button => {
        button.addEventListener('mouseover', (event) => {
            const tooltipText = button.dataset.tooltip;
            if (tooltipText) { // Only show if data-tooltip exists
                blockTooltip.textContent = tooltipText;
                blockTooltip.style.opacity = 1;

                const rect = button.getBoundingClientRect();
                blockTooltip.style.left = `${rect.left + window.scrollX + (rect.width / 2) - (blockTooltip.offsetWidth / 2)}px`;
                blockTooltip.style.top = `${rect.top + window.scrollY - blockTooltip.offsetHeight - 5}px`;
            }
        });

        button.addEventListener('mouseout', () => {
            blockTooltip.style.opacity = 0;
        });
    });
    // --- END NEW TOOLTIP HANDLING ---

    // NEW: Event listeners for import/export buttons
    exportButton.addEventListener('click', exportGrid);
    importButton.addEventListener('click', () => importFileInput.click()); // Trigger hidden file input
    importFileInput.addEventListener('change', importGrid);


    // --- Run Initialization ---
    preloadBlockTextures().then(() => {
        console.log("Initial texture preload complete. Initializing UI.");
        initializeInventory();
        initializeGrid(parseInt(gridWidthInput.value), parseInt(gridHeightInput.value), true); // Initial grid setup, saves first state
        updateUndoRedoButtonStates(); // Set initial button states
    }).catch(error => {
        console.error("Error preloading textures:", error);
        // Fallback if textures fail to load
        initializeInventory();
        initializeGrid(parseInt(gridWidthInput.value), parseInt(gridHeightInput.value), true);
        updateUndoRedoButtonStates();
    });
});
