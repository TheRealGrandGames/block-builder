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

    const gridSize = 10;
    const blockSize = 50;
    const canvasSize = gridSize * blockSize;
    const ctx = hiddenCanvas.getContext('2d');

    hiddenCanvas.width = canvasSize;
    hiddenCanvas.height = canvasSize;

    let selectedBlockType = 'Grass Block';
    let currentInventoryBlockElement = null;
    let isPainting = false;

    // Audio objects for sound effects
    const buttonSound = new Audio('audio/button_click.mp3');
    const fillSound = new Audio('audio/grid_fill.mp3');
    const selectSound = new Audio('audio/inventory_button_click.mp3');
    const categoryOpenSound = new Audio('audio/category_open.mp3');
    const categoryCollapseSound = new Audio('audio/category_collapse.mp3');
    const saveSound = new Audio('audio/save_sound.mp3');

    // All sound effects in one array (optional, but good for management)
    const allEffectSounds = [
        buttonSound,
        fillSound,
        selectSound,
        categoryOpenSound,
        categoryCollapseSound,
        saveSound
    ];

    // NEW: Music Playlist
    // IMPORTANT: Update these paths to your actual music files!
    const musicPlaylist = [
        'audio/taswell.mp3',
        'audio/dreiton.mp3',
        'audio/aria_math.mp3',
        'audio/haunt_muskie.mp3'
    ];

    // NEW: Music Audio object - ONE object to manage multiple songs
    const backgroundMusic = new Audio();
    backgroundMusic.loop = false; // We'll manage looping through the playlist manually
    backgroundMusic.volume = 0.5; // Adjust volume (0.0 to 1.0)

    // Load saved song index, default to 0 if not found
    let currentSongIndex = parseInt(localStorage.getItem('currentSongIndex') || '0', 10);
    // Ensure index is valid in case playlist changes
    if (currentSongIndex >= musicPlaylist.length || currentSongIndex < 0) {
        currentSongIndex = 0;
    }

    // NEW: Event listener for when a song ends - plays the next in the playlist
    backgroundMusic.onended = () => {
        playNextSong();
    };

    // Initialize sound effects state from localStorage
    let soundsEnabled = localStorage.getItem('soundsEnabled') === 'false' ? false : true;
    // Initialize music state from localStorage
    let musicEnabled = localStorage.getItem('musicEnabled') === 'false' ? false : true;

    // Function to play a sound effect if sounds are enabled
    function playSound(audioElement) {
        if (soundsEnabled) {
            audioElement.currentTime = 0; // Rewind to the start for effects
            audioElement.play().catch(e => console.error("Error playing sound effect:", e));
        }
    }

    // Function to update the sound toggle button's text
    function updateSoundToggleButton() {
        soundToggleButton.textContent = `Sounds: ${soundsEnabled ? 'ON' : 'OFF'}`;
    }

    // NEW: Function to play the current song in the playlist
    function playBackgroundMusic() {
        if (musicEnabled && musicPlaylist.length > 0) {
            // Check if the current source is already loaded/playing the correct song
            // We compare the absolute path returned by `Audio.src`
            const expectedSrc = new URL(musicPlaylist[currentSongIndex], window.location.href).href;

            if (backgroundMusic.src !== expectedSrc || backgroundMusic.paused) {
                backgroundMusic.src = musicPlaylist[currentSongIndex];
                backgroundMusic.load(); // Load the new source
                console.log(`Loading and attempting to play: ${musicPlaylist[currentSongIndex]}`);
            }

            // Attempt to play. This might be blocked by browser autoplay policies
            backgroundMusic.play().catch(e => {
                console.warn("Autoplay of background music prevented. User interaction needed:", e);
                // The music will likely start after the first user click on the page.
            });
        } else {
            backgroundMusic.pause();
        }
    }

    // NEW: Function to pause background music
    function pauseBackgroundMusic() {
        backgroundMusic.pause();
    }

    // NEW: Function to play the next song in the playlist
    function playNextSong() {
        if (musicPlaylist.length === 0) return; // No songs to play

        currentSongIndex = (currentSongIndex + 1) % musicPlaylist.length; // Cycle to the next song
        localStorage.setItem('currentSongIndex', currentSongIndex); // Save the new index
        playBackgroundMusic(); // Play the newly selected song
    }

    // Function to update the music toggle button's text
    function updateMusicToggleButton() {
        musicToggleButton.textContent = `Music: ${musicEnabled ? 'ON' : 'OFF'}`;
    }

    // Call these immediately to set initial button text
    updateSoundToggleButton();
    updateMusicToggleButton();


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

    function initializeGrid() {
        for (let i = 0; i < gridSize * gridSize; i++) {
            const block = document.createElement('div');
            block.classList.add('grid-block');
            block.dataset.index = i;
            block.dataset.type = 'Air';

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
    }

    function placeBlock(gridBlockElement, type) {
        if (type === 'Air') {
            destroyBlock(gridBlockElement);
            return;
        }
        gridBlockElement.dataset.type = type;
        const texturePath = blockTypes[type] ? blockTypes[type].texture : 'path/to/default_empty_texture.png';
        gridBlockElement.style.backgroundImage = `url(${texturePath})`;
    }

    function destroyBlock(gridBlockElement) {
        gridBlockElement.dataset.type = 'Air';
        gridBlockElement.style.backgroundColor = '#e0e0e0';
        gridBlockElement.style.backgroundImage = 'none';
    }

    function clearGrid() {
        const allGridBlocks = document.querySelectorAll('.grid-block');
        allGridBlocks.forEach(block => {
            destroyBlock(block);
        });
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
        ctx.clearRect(0, 0, canvasSize, canvasSize);

        const gridBlocks = document.querySelectorAll('.grid-block');
        gridBlocks.forEach(blockElement => {
            const type = blockElement.dataset.type;
            const index = parseInt(blockElement.dataset.index);
            const row = Math.floor(index / gridSize);
            const col = index % gridSize;

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

    // Sound effects toggle button event listener
    soundToggleButton.addEventListener('click', () => {
        soundsEnabled = !soundsEnabled;
        localStorage.setItem('soundsEnabled', soundsEnabled);
        updateSoundToggleButton();
        playSound(buttonSound);
    });

    // Music toggle button event listener
    musicToggleButton.addEventListener('click', () => {
        musicEnabled = !musicEnabled;
        localStorage.setItem('musicEnabled', musicEnabled);
        updateMusicToggleButton();
        if (musicEnabled) {
            playBackgroundMusic(); // Start playing the current song in the playlist
        } else {
            pauseBackgroundMusic(); // Pause it
        }
    });


    // --- Run Initialization ---
    preloadBlockTextures().then(() => {
        console.log("Initial texture preload complete. Initializing UI.");
        initializeInventory();
        initializeGrid();

        // Attempt to play background music on initial load
        // This will honor the 'musicEnabled' setting and currentSongIndex from localStorage
        // Note: Browsers often prevent autoplay until a user interaction.
        // The music might only start after the first click on the page.
        playBackgroundMusic();

    }).catch(error => {
        console.error("Error preloading textures:", error);
        initializeInventory();
        initializeGrid();
    });
});
