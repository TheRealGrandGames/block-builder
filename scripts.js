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
    const musicToggleButton = document.getElementById('musicToggleButton');
    const resourceCountDisplay = document.getElementById('resourceCountDisplay');

    // NEW: Grid Size Control Elements
    const gridWidthInput = document.getElementById('gridWidth');
    const gridHeightInput = document.getElementById('gridHeight');
    const setGridSizeButton = document.getElementById('setGridSizeButton');

    // Change gridSize to gridWidth and gridHeight
    let currentGridWidth = 10; // Default width
    let currentGridHeight = 10; // Default height
    const blockSize = 50;
    let canvasWidth = currentGridWidth * blockSize; // Dynamically calculated
    let canvasHeight = currentGridHeight * blockSize; // Dynamically calculated
    let ctx; // Will be initialized after canvas size is set

    // Hidden canvas context needs to be set after dimensions are known
    // No, it must be gotten with getContext() after the canvas element has been appended to the DOM.
    // We'll set canvas dimensions and get context inside initializeGrid after grid size is finalized.

    let selectedBlockType = 'Grass Block';
    let currentInventoryBlockElement = null;
    let isPainting = false;

    // Grid state array to store block types
    let gridState = []; // Now dynamically sized

    // Object to store resource counts
    const resourceCounts = {};

    // Audio objects for sound effects
    const buttonSound = new Audio('audio/button_click.mp3');
    const fillSound = new Audio('audio/grid_fill.mp3');
    const selectSound = new Audio('audio/inventory_button_click.mp3');
    const categoryOpenSound = new Audio('audio/category_open.mp3');
    const categoryCollapseSound = new Audio('audio/category_collapse.mp3');
    const saveSound = new Audio('audio/save_sound.mp3');

    const allEffectSounds = [
        buttonSound, fillSound, selectSound,
        categoryOpenSound, categoryCollapseSound, saveSound
    ];

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
    let musicEnabled = localStorage.getItem('musicEnabled') === 'false' ? false : true;
    let hasUserInteracted = false;

    function playSound(audioElement) {
        if (soundsEnabled && hasUserInteracted) {
            audioElement.currentTime = 0;
            audioElement.play().catch(e => console.error("Error playing sound effect:", e));
        }
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
                        blockImages[type] = null;
                        resolve();
                    };
                }));
            }
        }

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

    // Modified initializeGrid to accept width and height
    function initializeGrid(width, height) {
        gameGrid.innerHTML = ''; // Clear existing grid
        gameGrid.style.gridTemplateColumns = `repeat(${width}, ${blockSize}px)`;
        gameGrid.style.gridTemplateRows = `repeat(${height}, ${blockSize}px)`;
        gameGrid.style.width = `${width * blockSize}px`; // Set explicit width
        gameGrid.style.height = `${height * blockSize}px`; // Set explicit height

        currentGridWidth = width;
        currentGridHeight = height;

        // Reset gridState and resourceCounts for the new grid
        gridState = Array(width * height).fill('Air');
        for (const key in resourceCounts) {
            delete resourceCounts[key];
        }

        for (let i = 0; i < width * height; i++) {
            const block = document.createElement('div');
            block.classList.add('grid-block');
            block.dataset.index = i;
            block.dataset.type = 'Air';
            // No need to set gridState[i] here as it's already filled with 'Air'

            block.addEventListener('mousedown', (event) => {
                event.preventDefault();
                isPainting = true;
                if (event.button === 0) {
                    placeBlock(block, selectedBlockType);
                } else if (event.button === 2) {
                    destroyBlock(block);
                }
            });

            block.addEventListener('mouseup', (event) => {
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

        document.addEventListener('mouseup', () => {
            isPainting = false;
        });

        // Set hidden canvas dimensions and get context here
        canvasWidth = currentGridWidth * blockSize;
        canvasHeight = currentGridHeight * blockSize;
        hiddenCanvas.width = canvasWidth;
        hiddenCanvas.height = canvasHeight;
        ctx = hiddenCanvas.getContext('2d'); // Get context after setting dimensions

        updateResourceCounts(); // Initial update for resource display
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
        gridState[index] = type;

        const texturePath = blockTypes[type] ? blockTypes[type].texture : 'path/to/default_empty_texture.png';
        gridBlockElement.style.backgroundImage = `url(${texturePath})`;
        gridBlockElement.style.backgroundColor = '';

        if (type !== 'Air') {
            resourceCounts[type] = (resourceCounts[type] || 0) + 1;
        }
        updateResourceCountsDisplay();
    }

    function destroyBlock(gridBlockElement) {
        const oldType = gridBlockElement.dataset.type;
        const index = parseInt(gridBlockElement.dataset.index);

        if (oldType === 'Air') {
            return;
        }

        gridBlockElement.dataset.type = 'Air';
        gridState[index] = 'Air';
        gridBlockElement.style.backgroundColor = '#e0e0e0';
        gridBlockElement.style.backgroundImage = 'none';

        resourceCounts[oldType] = (resourceCounts[oldType] || 0) - 1;
        if (resourceCounts[oldType] <= 0) {
            delete resourceCounts[oldType];
        }
        updateResourceCountsDisplay();
    }

    function clearGrid() {
        const allGridBlocks = document.querySelectorAll('.grid-block');
        allGridBlocks.forEach(block => {
            destroyBlock(block);
        });
        // This loop ensures resourceCounts is clean, but destroyBlock already handles it per block.
        // For a full clear, we can reset the object directly for efficiency if it's large.
        for (const key in resourceCounts) {
            delete resourceCounts[key];
        }
        updateResourceCountsDisplay();
    }

    function fillGrid() {
        const allGridBlocks = document.querySelectorAll('.grid-block');
        allGridBlocks.forEach(block => {
            placeBlock(block, selectedBlockType);
        });
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

    function drawGridToCanvas() {
        ctx.clearRect(0, 0, canvasWidth, canvasHeight); // Use dynamic canvas dimensions

        const gridBlocks = document.querySelectorAll('.grid-block');
        gridBlocks.forEach(blockElement => {
            const type = blockElement.dataset.type;
            const index = parseInt(blockElement.dataset.index);
            // Calculate row and col based on currentGridWidth
            const row = Math.floor(index / currentGridWidth);
            const col = index % currentGridWidth;

            const x = col * blockSize;
            const y = row * blockSize;

            if (type === 'Air') {
                ctx.fillStyle = '#e0e0e0';
                ctx.fillRect(x, y, blockSize, blockSize);
            } else {
                const img = blockImages[type];
                if (img && img.complete) {
                    ctx.drawImage(img, x, y, blockSize, blockSize);
                } else {
                    console.warn(`Texture for ${type} not loaded, drawing placeholder.`);
                    ctx.fillStyle = '#ff00ff';
                    ctx.fillRect(x, y, blockSize, blockSize);
                }
            }
        });
    }

    async function saveCanvasAsPng() {
        if (texturesLoadedPromise) {
            await texturesLoadedPromise;
            console.log("Textures are ready. Proceeding to draw and save.");
        } else {
            console.warn("texturesLoadedPromise was not initialized. Drawing may fail.");
        }

        drawGridToCanvas();

        const dataURL = hiddenCanvas.toDataURL('image/png');

        const a = document.createElement('a');
        a.href = dataURL;
        a.download = 'my_block_design.png';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    }

    savePngButton.addEventListener('click', async () => {
        playSound(buttonSound);
        await saveCanvasAsPng();
        playSound(saveSound);
    });

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
            initializeShuffledPlaylist();
            playBackgroundMusic();
        } else {
            pauseBackgroundMusic();
        }
        playSound(buttonSound);
    });

    function updateResourceCounts() {
        for (const key in resourceCounts) {
            delete resourceCounts[key];
        }

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

    // NEW: Event Listener for Set Grid Size Button
    setGridSizeButton.addEventListener('click', () => {
        playSound(buttonSound);
        const newWidth = parseInt(gridWidthInput.value);
        const newHeight = parseInt(gridHeightInput.value);

        // Input Validation
        if (isNaN(newWidth) || newWidth < 1 || newWidth > 30) {
            alert('Please enter a valid width between 1 and 30.');
            gridWidthInput.value = currentGridWidth; // Reset to current valid value
            return;
        }
        if (isNaN(newHeight) || newHeight < 1 || newHeight > 30) {
            alert('Please enter a valid height between 1 and 30.');
            gridHeightInput.value = currentGridHeight; // Reset to current valid value
            return;
        }

        // Apply new grid size
        initializeGrid(newWidth, newHeight);
    });


    // --- Run Initialization ---
    preloadBlockTextures().then(() => {
        console.log("Initial texture preload complete. Initializing UI.");
        initializeInventory();
        // Call initializeGrid with default values (from HTML input fields)
        initializeGrid(parseInt(gridWidthInput.value), parseInt(gridHeightInput.value));

    }).catch(error => {
        console.error("Error preloading textures:", error);
        initializeInventory();
        // Fallback for grid initialization if textures fail
        initializeGrid(parseInt(gridWidthInput.value), parseInt(gridHeightInput.value));
    });
});
