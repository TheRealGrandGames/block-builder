document.addEventListener('DOMContentLoaded', () => {
    const gameGrid = document.getElementById('gameGrid');
    const blockInventory = document.getElementById('blockInventory');
    const blockTooltip = document.getElementById('blockTooltip');
    const selectedBlockDisplay = document.getElementById('selectedBlockDisplay');
    const clearGridButton = document.getElementById('clearGridButton');
    const fillGridButton = document.getElementById('fillGridButton');
    // NEW: Get the Save PNG button
    const savePngButton = document.getElementById('savePngButton');
    // NEW: Get the hidden canvas
    const hiddenCanvas = document.getElementById('hiddenCanvas');

    const ctx = hiddenCanvas.getContext('2d'); 
    
    const gridSize = 10;
    let selectedBlockType = 'Grass Block';
    let currentInventoryBlockElement = null;
    let isPainting = false;

    // NEW: Create an Audio object for the click sound
    const buttonSound = new Audio('audio/button_click.mp3'); // Path to your sound file
    const fillSound = new Audio('audio/grid_fill.mp3'); // Path to your fill sound file
    const selectSound = new Audio('audio/inventory_button_click.mp3'); // Path to your fill sound file
    const categoryOpenSound = new Audio('audio/category_open.mp3'); // Path to your fill sound file
    const categoryCollapseSound = new Audio('audio/category_collapse.mp3'); // Path to your fill sound file
    const saveSound = new Audio('audio/save_sound.mp3');


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
            { name: 'Crimson Planks', texture: 'textures/crimson_planks.png' },
            { name: 'Warped Planks', texture: 'textures/warped_planks.png' },
        ],
        Stone: [
            { name: 'Stone', texture: 'textures/stone.png' },
            { name: 'Stone Bricks', texture: 'textures/stone_bricks.png' },
            { name: 'Cracked Stone Bricks', texture: 'textures/cracked_stone_bricks.png' },
            { name: 'Mossy Stone Bricks', texture: 'textures/mossy_stone_bricks.png' },
            { name: 'Chiseled Stone Bricks', texture: 'textures/chiseled_stone_bricks.png' },
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
            { name: 'Diamond Block', texture: 'textures/diamond_block.png' },
            { name: 'Netherite Block', texture: 'textures/netherite_block.png' },
            { name: 'Emerald Block', texture: 'textures/emerald_block.png' },
            { name: 'Lapis Lazuli Block', texture: 'textures/lapis_block.png' },
            
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

    // NEW: Image cache to pre-load textures for canvas drawing
    const blockImages = {};
    let texturesLoadedPromise = null;
    let imagesLoadedCount = 0;
    let totalImagesToLoad = 0;

    // Function to load all textures into Image objects
    function preloadBlockTextures() {
        let imagesToLoad = [];
        for (const type in blockTypes) {
            const blockData = blockTypes[type];
            if (blockData.texture) {
                imagesToLoad.push(new Promise((resolve, reject) => {
                    const img = new Image();
                    img.src = blockData.texture;
                    img.crossOrigin = "Anonymous"; // Important for canvas.toDataURL()
                    img.onload = () => {
                        blockImages[type] = img; // Store the loaded Image object
                        resolve();
                    };
                    img.onerror = () => {
                        console.error(`Failed to load texture: ${blockData.texture}`);
                        // Even if it fails, resolve to not block other images
                        // You might want a fallback image here or handle differently
                        blockImages[type] = null; // Mark as failed or use a placeholder
                        resolve();
                    };
                }));
            }
        }

        // If there are no images to load, resolve immediately
        if (imagesToLoad.length === 0) {
            texturesLoadedPromise = Promise.resolve();
        } else {
            // Wait for all image promises to resolve
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
                    categoryCollapseSound.currentTime = 0; // Rewind to the start
                    categoryCollapseSound.play();
                } else {
                    toggleIcon.textContent = '▼';
                    categoryOpenSound.currentTime = 0; // Rewind to the start
                    categoryOpenSound.play();
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
            selectBlock('Grass', initialGrassBlock);
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

        selectSound.currentTime = 0; // Rewind to the start
        selectSound.play();
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
            placeBlock(block, selectedBlockType); // Use the currently selected block type
        });
    }

    // UPDATED: Event Listener for Clear Grid Button
    clearGridButton.addEventListener('click', () => {
        clearGrid(); // Call the function to clear the grid
        buttonSound.currentTime = 0; // Rewind to the start
        buttonSound.play(); // Play the sound
    });

    fillGridButton.addEventListener('click', () => {
        fillGrid(); // Call the function to fill the grid
        buttonSound.currentTime = 0; // Rewind to the start
        buttonSound.play(); // Play the sound
        fillSound.currentTime = 0; // Rewind to the start
        fillSound.play(); // Play the sound
    });

    // NEW: Function to draw the grid onto the canvas
    function drawGridToCanvas() {
        ctx.clearRect(0, 0, canvasSize, canvasSize); // Clear the canvas

        const gridBlocks = document.querySelectorAll('.grid-block');
        gridBlocks.forEach(blockElement => {
            const type = blockElement.dataset.type;
            const index = parseInt(blockElement.dataset.index);
            const row = Math.floor(index / gridSize);
            const col = index % gridSize;

            const x = col * blockSize;
            const y = row * blockSize;

            if (type === 'Air') {
                ctx.fillStyle = '#e0e0e0'; // Match 'Air' block background color
                ctx.fillRect(x, y, blockSize, blockSize);
            } else {
                const img = blockImages[type];
                if (img && img.complete) { // Ensure image is loaded before drawing
                    ctx.drawImage(img, x, y, blockSize, blockSize);
                } else {
                    // Fallback if image isn't loaded (shouldn't happen with preloading)
                    console.warn(`Texture for ${type} not loaded, drawing placeholder.`);
                    ctx.fillStyle = '#ff00ff'; // Magenta placeholder for missing texture
                    ctx.fillRect(x, y, blockSize, blockSize);
                }
            }
        });
    }

    // NEW: Function to save the canvas as a PNG
    function drawGridToCanvas() {
        // ... (this function remains the same, but now ctx is defined) ...
        ctx.clearRect(0, 0, canvasSize, canvasSize); // Clear the canvas

        const gridBlocks = document.querySelectorAll('.grid-block');
        gridBlocks.forEach(blockElement => {
            const type = blockElement.dataset.type;
            const index = parseInt(blockElement.dataset.index);
            const row = Math.floor(index / gridSize);
            const col = index % gridSize;

            const x = col * blockSize;
            const y = row * blockSize;

            if (type === 'Air') {
                ctx.fillStyle = '#e0e0e0'; // Match 'Air' block background color
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
        // Ensure textures are loaded before drawing
        if (texturesLoadedPromise) {
            await texturesLoadedPromise; // Wait for all images to load
            console.log("Textures are ready. Proceeding to draw and save.");
        } else {
            console.warn("texturesLoadedPromise was not initialized. Drawing may fail.");
            // As a fallback, you might try to re-initiate loading or just draw.
            // For now, it will proceed, but textures might be missing if not loaded.
        }

        drawGridToCanvas(); // Draw the current grid state to the canvas

        const dataURL = hiddenCanvas.toDataURL('image/png');

        const a = document.createElement('a');
        a.href = dataURL;
        a.download = 'my_block_design.png';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    }

    savePngButton.addEventListener('click', async () => {
        buttonSound.currentTime = 0; // Rewind to the start
        buttonSound.play(); // Play the sound
        await saveCanvasAsPng(); // Use await because saveCanvasAsPng is now async
        if (saveSound) {
            saveSound.currentTime = 0;
            saveSound.play();
        }
    });

    // --- Run Initialization ---
    preloadBlockTextures().then(() => {
        console.log("Initial texture preload complete. Initializing UI.");
        initializeInventory();
        initializeGrid();
    }).catch(error => {
        console.error("Error preloading textures:", error);
        // Initialize UI even if textures fail to load, just without images
        initializeInventory();
        initializeGrid();
    });
});
