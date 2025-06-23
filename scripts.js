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
    const resetGridSizeButton = document.getElementById('resetGridSizeButton');

    const undoButton = document.getElementById('undoButton');
    const redoButton = document.getElementById('redoButton');

    const importButton = document.getElementById('importButton');
    const exportButton = document.getElementById('exportButton');
    const importFileInput = document.getElementById('importFileInput');

    const includeResourcesCheckbox = document.getElementById('includeResourcesCheckbox');
    const themeSelect = document.getElementById('theme-select');
    const musicCategorySelect = document.getElementById('musicCategorySelect');

    // NEW: Move Grid Buttons
    const moveGridUpButton = document.getElementById('moveGridUpButton');
    const moveGridDownButton = document.getElementById('moveGridDownButton');
    const moveGridLeftButton = document.getElementById('moveGridLeftButton');
    const moveGridRightButton = document.getElementById('moveGridRightButton');

    let currentGridWidth = 10;
    let currentGridHeight = 10;
    const blockSize = 50;
    let canvasWidth;
    let canvasHeight;
    let ctx;

    let selectedBlockType = 'Grass Block';
    let currentInventoryBlockElement = null;
    let isPainting = false;

    let gridState = [];

    let gridHistory = [];
    let historyPointer = -1;
    const MAX_HISTORY_STATES = 50;

    const resourceCounts = {};

    const buttonSound = new Audio('audio/button_click.mp3');
    const fillSound = new Audio('audio/grid_fill.mp3');
    const selectSound = new Audio('audio/inventory_button_click.mp3');
    const categoryOpenSound = new Audio('audio/category_open.mp3');
    const categoryCollapseSound = new Audio('audio/category_collapse.mp3');
    const saveSound = new Audio('audio/save_sound.mp3');
    const moveSound = new Audio('audio/move_grid.mp3'); // New sound for grid movements

    const placeBlockSound = new Audio('audio/inventory_button_click.mp3');
    const destroyBlockSound = new Audio('audio/destroy_block.mp3');

    let consecutivePlaceCount = 0;
    let consecutiveDestroyCount = 0;
    const maxPitchIncrease = 0.5;
    const pitchIncrementPerAction = 0.05;
    const pitchDecayTime = 200;
    let pitchResetTimeout;

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
        ],
        "Creative": [
            'audio/music/taswell.mp3', 'audio/music/dreiton.mp3', 'audio/music/aria_math.mp3',
            'audio/music/haunt_muskie.mp3', 'audio/music/biome_fest.mp3', 'audio/music/blind_spots.mp3'
        ],
        "Survival": [
            'audio/music/survival/clark.mp3', 'audio/music/survival/dry_hands.mp3', 'audio/music/survival/haggstrom.mp3',
            'audio/music/survival/key.mp3', 'audio/music/survival/living_mice.mp3', 'audio/music/survival/mice_on_venus.mp3',
            'audio/music/survival/minecraft.mp3', 'audio/music/survival/oxygene.mp3', 'audio/music/survival/subwoofer_lullaby.mp3',
            'audio/music/survival/sweden.mp3', 'audio/music/survival/wet_hands.mp3'
        ],
        "Underwater": [
            'audio/music/underwater/dragon_fish.mp3', 'audio/music/underwater/shuniji.mp3', 'audio/music/underwater/axolotl.mp3'
        ],
        "Nether": [
            'audio/music/nether/dead_voxel.mp3', 'audio/music/nether/concrete_halls.mp3', 'audio/music/nether/warmth.mp3',
            'audio/music/nether/ballad_of_the_cats.mp3'
        ],
        "Music Discs": [
            'audio/music/music_discs/blocks.mp3', 'audio/music/music_discs/cat.mp3', 'audio/music/music_discs/chirp.mp3',
            'audio/music/music_discs/dog.mp3', 'audio/music/music_discs/far.mp3', 'audio/music/music_discs/mall.mp3',
            'audio/music/music_discs/mellohi.mp3', 'audio/music/music_discs/stal.mp3', 'audio/music/music_discs/strad.mp3',
            'audio/music/music_discs/wait.mp3', 'audio/music/music_discs/ward.mp3'
        ]
    };

    let musicPlaylist = [];

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

    let soundsEnabled = localStorage.getItem('soundsEnabled') === 'false' ? false : true;
    let gridSoundsEnabled = localStorage.getItem('gridSoundsEnabled') === 'false' ? false : true;
    let musicEnabled = localStorage.getItem('musicEnabled') === 'false' ? false : true;
    let hasUserInteracted = false;

    function playSound(audioElement, isConsecutiveAction = false, actionType = null) {
        if (!soundsEnabled || !hasUserInteracted) {
            return;
        }

        if ((audioElement === placeBlockSound || audioElement === destroyBlockSound) && !gridSoundsEnabled) {
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

    function updateMusicPlaylist() {
        const selectedCategory = musicCategorySelect.value;
        musicPlaylist = categorizedMusic[selectedCategory] || [];
        initializeShuffledPlaylist();
        playBackgroundMusic();
        localStorage.setItem('selectedMusicCategory', selectedCategory);
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
            { name: 'Pale Moss Block', texture: 'textures/pale_moss_block.png' },
            { name: 'Podzol', texture: 'textures/podzol_top.png' },
            { name: 'Mycelium', texture: 'textures/mycelium_top.png' },

            { name: 'Mushroom Stem', texture: 'textures/mushroom_stem.png' },
            { name: 'Brown Mushroom Block', texture: 'textures/brown_mushroom_block.png' },
            { name: 'Red Mushroom Block', texture: 'textures/red_mushroom_block.png' },
            
            { name: 'Dirt', texture: 'textures/dirt.png' },
            { name: 'Dirt Path', texture: 'textures/dirt_path_top.png' },
            { name: 'Coarse Dirt', texture: 'textures/coarse_dirt.png' },
            { name: 'Farmland', texture: 'textures/farmland.png' },
            { name: 'Rooted Dirt', texture: 'textures/rooted_dirt.png' },
            { name: 'Mangrove Roots', texture: 'textures/mangrove_roots_top.png' },
            { name: 'Muddy Mangrove Roots', texture: 'textures/muddy_mangrove_roots_top.png' },
            { name: 'Mud', texture: 'textures/mud.png' },
            { name: 'Clay', texture: 'textures/clay.png' },
            { name: 'Gravel', texture: 'textures/gravel.png' },
            { name: 'Suspicious Gravel', texture: 'textures/suspicious_gravel_0.png' },
            { name: 'Sand', texture: 'textures/sand.png' },
            { name: 'Suspicious Sand', texture: 'textures/suspicious_sand_0.png' },
            { name: 'Red Sand', texture: 'textures/red_sand.png' },
            { name: 'Snow', texture: 'textures/snow.png' },
            { name: 'Powder Snow', texture: 'textures/powder_snow.png' },
            { name: 'Ice', texture: 'textures/ice.png' },
            { name: 'Packed Ice', texture: 'textures/packed_ice.png' },
            { name: 'Blue Ice', texture: 'textures/blue_ice.png' },

            { name: 'Pumpkin', texture: 'textures/pumpkin_top.png' },
            { name: 'Melon', texture: 'textures/melon_top.png' },
            
            { name: 'Resin Block', texture: 'textures/resin_block.png' },

            { name: 'Hay Bale', texture: 'textures/hay_block_top.png' },

            { name: 'Slime Block', texture: 'textures/slime_block.png' },
            { name: 'Honey Block', texture: 'textures/honey_block_top.png' },

            { name: 'Honeycomb Block', texture: 'textures/honeycomb_block.png' },

            { name: 'Bee Nest', texture: 'textures/bee_nest_top.png' },

            { name: 'Ochre Froglight', texture: 'textures/ochre_froglight_top.png' },
            { name: 'Verdant Froglight', texture: 'textures/verdant_froglight_top.png' },
            { name: 'Pearlescent Froglight', texture: 'textures/pearlescent_froglight_top.png' },

            { name: 'Sculk', texture: 'textures/sculk.png' },

            { name: 'Dried Kelp Block', texture: 'textures/dried_kelp_top.png' },
            
            { name: 'Tube Coral Block', texture: 'textures/tube_coral_block.png' },
            { name: 'Brain Coral Block', texture: 'textures/brain_coral_block.png' },
            { name: 'Bubble Coral Block', texture: 'textures/bubble_coral_block.png' },
            { name: 'Fire Coral Block', texture: 'textures/fire_coral_block.png' },
            { name: 'Horn Coral Block', texture: 'textures/horn_coral_block.png' },

            { name: 'Dead Tube Coral Block', texture: 'textures/dead_tube_coral_block.png' },
            { name: 'Dead Brain Coral Block', texture: 'textures/dead_brain_coral_block.png' },
            { name: 'Dead Bubble Coral Block', texture: 'textures/dead_bubble_coral_block.png' },
            { name: 'Dead Fire Coral Block', texture: 'textures/dead_fire_coral_block.png' },
            { name: 'Dead Horn Coral Block', texture: 'textures/dead_horn_coral_block.png' },

            { name: 'Sponge', texture: 'textures/sponge.png' },
            { name: 'Wet Sponge', texture: 'textures/wet_sponge.png' },
            
            { name: 'Obsidian', texture: 'textures/obsidian.png' },
            { name: 'Crying Obsidian', texture: 'textures/crying_obsidian.png' },
            { name: 'Bone Block', texture: 'textures/bone_block_top.png' },
            { name: 'Crimson Nylium', texture: 'textures/crimson_nylium.png' },
            { name: 'Nether Wart Block', texture: 'textures/nether_wart_block.png' },
            { name: 'Warped Nylium', texture: 'textures/warped_nylium.png' },
            { name: 'Warped Wart Block', texture: 'textures/warped_wart_block.png' },
            { name: 'Shroomlight', texture: 'textures/shroomlight.png' },
            { name: 'Soul Sand', texture: 'textures/soul_sand.png' },
            { name: 'Soul Soil', texture: 'textures/soul_soil.png' },
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

            { name: 'Oak Log', texture: 'textures/oak_log_top.png' },
            { name: 'Spruce Log', texture: 'textures/spruce_log_top.png' },
            { name: 'Birch Log', texture: 'textures/birch_log_top.png' },
            { name: 'Jungle Log', texture: 'textures/jungle_log_top.png' },
            { name: 'Acacia Log', texture: 'textures/acacia_log_top.png' },
            { name: 'Dark Oak Log', texture: 'textures/dark_oak_log_top.png' },
            { name: 'Mangrove Log', texture: 'textures/mangrove_log_top.png' },
            { name: 'Cherry Log', texture: 'textures/cherry_log_top.png' },
            { name: 'Pale Oak Log', texture: 'textures/pale_oak_log_top.png' },
            { name: 'Bamboo Block', texture: 'textures/bamboo_block_top.png' },
            { name: 'Crimson Stem', texture: 'textures/crimson_stem.png' },
            { name: 'Warped Stem', texture: 'textures/warped_stem.png' },

            { name: 'Stripped Oak Log', texture: 'textures/stripped_oak_log_top.png' },
            { name: 'Stripped Spruce Log', texture: 'textures/stripped_spruce_log_top.png' },
            { name: 'Stripped Birch Log', texture: 'textures/stripped_birch_log_top.png' },
            { name: 'Stripped Jungle Log', texture: 'textures/stripped_jungle_log_top.png' },
            { name: 'Stripped Acacia Log', texture: 'textures/stripped_acacia_log_top.png' },
            { name: 'Stripped Dark Oak Log', texture: 'textures/stripped_dark_oak_log_top.png' },
            { name: 'Stripped Mangrove Log', texture: 'textures/stripped_mangrove_log_top.png' },
            { name: 'Stripped Cherry Log', texture: 'textures/stripped_cherry_log_top.png' },
            { name: 'Stripped Pale Oak Log', texture: 'textures/stripped_pale_oak_log_top.png' },
            { name: 'Stripped Bamboo Block', texture: 'textures/stripped_bamboo_block_top.png' },
            { name: 'Stripped Crimson Stem', texture: 'textures/stripped_crimson_stem_top.png' },
            { name: 'Stripped Warped Stem', texture: 'textures/stripped_warped_stem_top.png' },

            { name: 'Oak Wood', texture: 'textures/oak_log.png' },
            { name: 'Spruce Wood', texture: 'textures/spruce_log.png' },
            { name: 'Birch Wood', texture: 'textures/birch_log.png' },
            { name: 'Jungle Wood', texture: 'textures/jungle_log.png' },
            { name: 'Acacia Wood', texture: 'textures/acacia_log.png' },
            { name: 'Dark Oak Wood', texture: 'textures/dark_oak_log.png' },
            { name: 'Mangrove Wood', texture: 'textures/mangrove_log.png' },
            { name: 'Cherry Wood', texture: 'textures/cherry_log.png' },
            { name: 'Pale Oak Wood', texture: 'textures/pale_oak_log.png' },
            { name: 'Bamboo Wood', texture: 'textures/bamboo_block.png' },
            { name: 'Crimson Wood', texture: 'textures/crimson_stem.png' },
            { name: 'Warped Wood', texture: 'textures/warped_stem.png' },

            { name: 'Stripped Oak Wood', texture: 'textures/stripped_oak_log.png' },
            { name: 'Stripped Spruce Wood', texture: 'textures/stripped_spruce_log.png' },
            { name: 'Stripped Birch Wood', texture: 'textures/stripped_birch_log.png' },
            { name: 'Stripped Jungle Wood', texture: 'textures/stripped_jungle_log.png' },
            { name: 'Stripped Acacia Wood', texture: 'textures/stripped_acacia_log.png' },
            { name: 'Stripped Dark Oak Wood', texture: 'textures/stripped_dark_oak_log.png' },
            { name: 'Stripped Mangrove Wood', texture: 'textures/stripped_mangrove_log.png' },
            { name: 'Stripped Cherry Wood', texture: 'textures/stripped_cherry_log.png' },
            { name: 'Stripped Pale Oak Wood', texture: 'textures/stripped_pale_oak_log.png' },
            { name: 'Stripped Bamboo Wood', texture: 'textures/stripped_bamboo_block.png' },
            { name: 'Stripped Crimson Wood', texture: 'textures/stripped_crimson_stem.png' },
            { name: 'Stripped Warped Wood', texture: 'textures/stripped_warped_stem.png' },
        ],
        Stone: [
            { name: 'Stone', texture: 'textures/stone.png' },
            { name: 'Stone Bricks', texture: 'textures/stone_bricks.png' },
            { name: 'Cracked Stone Bricks', texture: 'textures/cracked_stone_bricks.png' },
            { name: 'Mossy Stone Bricks', texture: 'textures/mossy_stone_bricks.png' },
            { name: 'Chiseled Stone Bricks', texture: 'textures/chiseled_stone_bricks.png' },
            { name: 'Cobblestone', texture: 'textures/cobblestone.png' },
            { name: 'Mossy Cobblestone', texture: 'textures/mossy_cobblestone.png' },
            { name: 'Smooth Stone', texture: 'textures/smooth_stone.png' },

            { name: 'Deepslate', texture: 'textures/deepslate_top.png' },
            { name: 'Deepslate Bricks', texture: 'textures/deepslate_bricks.png' },
            { name: 'Cracked Deepslate Bricks', texture: 'textures/cracked_deepslate_bricks.png' },
            { name: 'Deepslate Tiles', texture: 'textures/deepslate_tiles.png' },
            { name: 'Cracked Deepslate Tiles', texture: 'textures/cracked_deepslate_tiles.png' },
            { name: 'Chiseled Deepslate', texture: 'textures/chiseled_deepslate.png' },
            { name: 'Polished Deepslate', texture: 'textures/polished_deepslate.png' },
            { name: 'Cobbled Deepslate', texture: 'textures/cobbled_deepslate.png' },
            { name: 'Reinforced Deepslate', texture: 'textures/reinforced_deepslate_top.png' },

            { name: 'Sandstone', texture: 'textures/sandstone_top.png' },
            { name: 'Red Sandstone', texture: 'textures/red_sandstone_top.png' },
            
            { name: 'Granite', texture: 'textures/granite.png' },
            { name: 'Polished Granite', texture: 'textures/polished_granite.png' },
            { name: 'Diorite', texture: 'textures/diorite.png' },
            { name: 'Polished Diorite', texture: 'textures/polished_diorite.png' },
            { name: 'Andesite', texture: 'textures/andesite.png' },
            { name: 'Polished Andesite', texture: 'textures/polished_andesite.png' },

            { name: 'Dripstone Block', texture: 'textures/dripstone_block.png' },

            { name: 'Calcite', texture: 'textures/calcite.png' },

            { name: 'Tuff', texture: 'textures/tuff.png' },
            { name: 'Tuff Bricks', texture: 'textures/tuff_bricks.png' },
            { name: 'Chiseled Tuff Bricks', texture: 'textures/chiseled_tuff_bricks_top.png' },
            { name: 'Chiseled Tuff', texture: 'textures/chiseled_tuff_top.png' },
            { name: 'Polished Tuff', texture: 'textures/polished_tuff.png' },

            { name: 'Basalt', texture: 'textures/basalt_top.png' },
            { name: 'Polished Basalt', texture: 'textures/polished_basalt_top.png' },
            { name: 'Smooth Basalt', texture: 'textures/smooth_basalt.png' },

            { name: 'Bedrock', texture: 'textures/bedrock.png' },
            
            { name: 'Netherrack', texture: 'textures/netherrack.png' },
            { name: 'Magma Block', texture: 'textures/magma.png' },
            { name: 'Glowstone', texture: 'textures/glowstone.png' },

            { name: 'Blackstone', texture: 'textures/blackstone_top.png' },
            { name: 'Polished Blackstone', texture: 'textures/polished_blackstone.png' },
            { name: 'Polished Blackstone Bricks', texture: 'textures/polished_blackstone_bricks.png' },
            { name: 'Chiseled Polished Blackstone', texture: 'textures/chiseled_polished_blackstone.png' },
            { name: 'Gilded Blackstone', texture: 'textures/gilded_blackstone.png' },
            
            { name: 'End Stone', texture: 'textures/end_stone.png' },
            { name: 'End Stone Bricks', texture: 'textures/end_stone_bricks.png' },
        ],
        Construction: [
            { name: 'Bricks', texture: 'textures/bricks.png' },

            { name: 'Packed Mud', texture: 'textures/packed_mud.png' },
            { name: 'Mud Bricks', texture: 'textures/mud_bricks.png' },
            
            { name: 'Resin Bricks', texture: 'textures/resin_bricks.png' },
            
            { name: 'Chiseled Resin Bricks', texture: 'textures/chiseled_resin_bricks.png' },

            { name: 'Redstone Lamp', texture: 'textures/redstone_lamp.png' },
            
            { name: 'Prismarine', texture: 'textures/prismarine.png' },
            { name: 'Prismarine Bricks', texture: 'textures/prismarine_bricks.png' },
            { name: 'Dark Prismarine', texture: 'textures/dark_prismarine.png' },
            { name: 'Sea Lantern', texture: 'textures/sea_lantern.png' },
            
            { name: 'Nether Bricks', texture: 'textures/nether_bricks.png' },
            { name: 'Cracked Nether Bricks', texture: 'textures/cracked_nether_bricks.png' },
            { name: 'Chiseled Nether Bricks', texture: 'textures/chiseled_nether_bricks.png' },

            { name: 'Red Nether Bricks', texture: 'textures/red_nether_bricks.png' },

            { name: 'Purpur Block', texture: 'textures/purpur_block.png' },
            { name: 'Purpur Pillar', texture: 'textures/purpur_pillar_top.png' },
        ],
        Colorful: [
            { name: 'White Wool', texture: 'textures/white_wool.png' },
            { name: 'Light Gray Wool', texture: 'textures/light_gray_wool.png' },
            { name: 'Gray Wool', texture: 'textures/gray_wool.png' },
            { name: 'Black Wool', texture: 'textures/black_wool.png' },
            { name: 'Brown Wool', texture: 'textures/brown_wool.png' },
            { name: 'Red Wool', texture: 'textures/red_wool.png' },
            { name: 'Orange Wool', texture: 'textures/orange_wool.png' },
            { name: 'Yellow Wool', texture: 'textures/yellow_wool.png' },
            { name: 'Lime Wool', texture: 'textures/lime_wool.png' },
            { name: 'Green Wool', texture: 'textures/green_wool.png' },
            { name: 'Cyan Wool', texture: 'textures/cyan_wool.png' },
            { name: 'Light Blue Wool', texture: 'textures/light_blue_wool.png' },
            { name: 'Blue Wool', texture: 'textures/blue_wool.png' },
            { name: 'Purple Wool', texture: 'textures/purple_wool.png' },
            { name: 'Magenta Wool', texture: 'textures/magenta_wool.png' },
            { name: 'Pink Wool', texture: 'textures/pink_wool.png' },
        ],
        Minerals: [
            { name: 'Block of Coal', texture: 'textures/coal_block.png' },
            { name: 'Block of Raw Iron', texture: 'textures/raw_iron_block.png' },
            { name: 'Block of Iron', texture: 'textures/iron_block.png' },
            { name: 'Block of Raw Copper', texture: 'textures/raw_copper_block.png' },
            
            { name: 'Block of Copper', texture: 'textures/copper_block.png' },
            { name: 'Exposed Copper Block', texture: 'textures/exposed_copper.png' },
            { name: 'Weathered Copper Block', texture: 'textures/weathered_copper.png' },
            { name: 'Oxidized Copper Block', texture: 'textures/oxidized_copper.png' },

            { name: 'Cut Copper', texture: 'textures/cut_copper.png' },
            { name: 'Exposed Cut Copper', texture: 'textures/exposed_cut_copper.png' },
            { name: 'Weathered Cut Copper', texture: 'textures/weathered_cut_copper.png' },
            { name: 'Oxidized Cut Copper', texture: 'textures/oxidized_cut_copper.png' },

            { name: 'Chiseled Copper', texture: 'textures/chiseled_copper.png' },
            { name: 'Exposed Chiseled Copper Block', texture: 'textures/exposed_chiseled_copper.png' },
            { name: 'Weathered Chiseled Copper Block', texture: 'textures/weathered_chiseled_copper.png' },
            { name: 'Oxidized Chiseled Copper Block', texture: 'textures/oxidized_chiseled_copper.png' },

            { name: 'Copper Bulb', texture: 'textures/copper_bulb.png' },
            { name: 'Exposed Copper Bulb', texture: 'textures/exposed_copper_bulb.png' },
            { name: 'Weathered Copper Bulb', texture: 'textures/weathered_copper_bulb.png' },
            { name: 'Oxidized Copper Bulb', texture: 'textures/oxidized_copper_bulb.png' },

            { name: 'Copper Grate', texture: 'textures/copper_grate.png' },
            { name: 'Exposed Copper Grate', texture: 'textures/exposed_copper_grate.png' },
            { name: 'Weathered Copper Grate', texture: 'textures/weather_copper_grate.png' },
            { name: 'Oxidized Copper Grate', texture: 'textures/oxidized_copper_grate.png' },
            
            { name: 'Block of Raw Gold', texture: 'textures/raw_gold_block.png' },
            { name: 'Block of Gold', texture: 'textures/gold_block.png' },
            { name: 'Block of Redstone', texture: 'textures/redstone_block.png' },
            { name: 'Block of Emerald', texture: 'textures/emerald_block.png' },
            { name: 'Block of Lapis Lazuli', texture: 'textures/lapis_block.png' },
            { name: 'Block of Diamond', texture: 'textures/diamond_block.png' },
            
            { name: 'Block of Quartz', texture: 'textures/quartz_block_top.png' },
            { name: 'Chiseled Quartz Block', texture: 'textures/chiseled_quartz_block_top.png' },
            { name: 'Quartz Bricks', texture: 'textures/quartz_bricks.png' },
            { name: 'Quartz Pillar', texture: 'textures/quartz_pillar_top.png' },
            { name: 'Smooth Quartz Block', texture: 'textures/quartz_block_bottom.png' },
            
            { name: 'Block of Netherite', texture: 'textures/netherite_block.png' },
            { name: 'Block of Amethyst', texture: 'textures/amethyst_block.png' },
            { name: 'Budding Amethyst', texture: 'textures/budding_amethyst.png' },

            { name: 'Coal Ore', texture: 'textures/coal_ore.png' },
            { name: 'Iron Ore', texture: 'textures/iron_ore.png' },
            { name: 'Copper Ore', texture: 'textures/copper_ore.png' },
            { name: 'Gold Ore', texture: 'textures/gold_ore.png' },
            { name: 'Redstone Ore', texture: 'textures/redstone_ore.png' },
            { name: 'Emerald Ore', texture: 'textures/emerald_ore.png' },
            { name: 'Lapis Lazuli Ore', texture: 'textures/lapis_ore.png' },
            { name: 'Diamond Ore', texture: 'textures/diamond_ore.png' },

            { name: 'Deepslate Coal Ore', texture: 'textures/deepslate_coal_ore.png' },
            { name: 'Deepslate Iron Ore', texture: 'textures/deepslate_iron_ore.png' },
            { name: 'Deepslate Copper Ore', texture: 'textures/deepslate_copper_ore.png' },
            { name: 'Deepslate Gold Ore', texture: 'textures/deepslate_gold_ore.png' },
            { name: 'Deepslate Redstone Ore', texture: 'textures/deepslate_redstone_ore.png' },
            { name: 'Deepslate Emerald Ore', texture: 'textures/deepslate_emerald_ore.png' },
            { name: 'Deepslate Lapis Lazuli Ore', texture: 'textures/deepslate_lapis_ore.png' },
            { name: 'Deepslate Diamond Ore', texture: 'textures/deepslate_diamond_ore.png' },

            { name: 'Nether Quartz Ore', texture: 'textures/nether_quartz_ore.png' },
            { name: 'Nether Gold Ore', texture: 'textures/nether_gold_ore.png' },
            { name: 'Ancient Debris', texture: 'textures/ancient_debris_top.png' },
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
        imagesToLoad.push(new Promise((resolve, reject) => {
            const imgUnchecked = new Image();
            imgUnchecked.src = 'textures/checkbox_unchecked.png';
            imgUnchecked.crossOrigin = "Anonymous";
            imgUnchecked.onload = () => {
                resolve();
            };
            imgUnchecked.onerror = () => {
                console.warn("Failed to load checkbox_unchecked.png");
                resolve();
            };
        }));
        imagesToLoad.push(new Promise((resolve, reject) => {
            const imgChecked = new Image();
            imgChecked.src = 'textures/checkbox_checked.png';
            imgChecked.crossOrigin = "Anonymous";
            imgChecked.onload = () => {
                resolve();
            };
            imgChecked.onerror = () => {
                console.warn("Failed to load checkbox_checked.png");
                resolve();
            };
        }));
        // Preload background textures for themes
        const backgroundTextures = [
            'textures/netherrack.png',
            'textures/end_stone.png',
            'textures/water.png',
            'textures/grass.png',
            'textures/button.png',
            'textures/button_highlighted.png', // Ensure button textures are preloaded
            'textures/button_disabled.png', // Ensure button textures are preloaded
            'textures/cave_theme_bg.png',
            'textures/reef_theme_bg.png'
        ];
        backgroundTextures.forEach(src => {
            imagesToLoad.push(new Promise((resolve) => {
                const img = new Image();
                img.src = src;
                img.crossOrigin = "Anonymous";
                img.onload = resolve;
                img.onerror = () => {
                    console.warn(`Failed to load background texture: ${src}`);
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
                
                const img = blockImages[blockData.name];
                if (img) {
                    inventoryBlockElement.style.backgroundImage = `url(${img.src})`;
                    inventoryBlockElement.style.backgroundColor = '';
                } else {
                    inventoryBlockElement.style.backgroundColor = '#ccc'; // Fallback color
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
        if (selectedBlockData && blockImages[type]) {
            selectedBlockDisplay.style.backgroundImage = `url(${blockImages[type].src})`;
            selectedBlockDisplay.style.backgroundColor = '';
            selectedBlockDisplay.dataset.type = type;
        } else {
            selectedBlockDisplay.style.backgroundImage = 'none';
            selectedBlockDisplay.style.backgroundColor = '#e0e0e0';
            selectedBlockDisplay.dataset.type = 'None';
        }

        if (element) {
            element.classList.add('selected');
            currentInventoryBlockElement = element;
        } else {
            currentInventoryBlockElement = null;
        }

        playSound(selectSound);
    }

    function applyState(state) {
        const allGridBlocks = document.querySelectorAll('.grid-block');
        gridState = [...state]; // Update internal gridState

        allGridBlocks.forEach((block, index) => {
            const type = gridState[index]; // Get type from the state
            block.dataset.type = type; // Update dataset attribute

            const texturePath = blockTypes[type] ? blockTypes[type].texture : null;
            if (texturePath && blockImages[type]) { // Check if image object exists
                block.style.backgroundImage = `url(${blockImages[type].src})`;
                block.style.backgroundColor = ''; // Ensure background color is cleared
            } else {
                // This means 'type' is 'Air' or an unknown block
                block.style.backgroundColor = '#e0e0e0'; // Set default color for 'Air'
                block.style.backgroundImage = 'none'; // Ensure no image is shown
            }
        });
        updateResourceCounts();
    }

    function initializeGrid(width, height, isNewGrid = true, loadedGridState = null) {
        gameGrid.innerHTML = '';
        gameGrid.style.gridTemplateColumns = `repeat(${width}, ${blockSize}px)`;
        gameGrid.style.gridTemplateRows = `repeat(${height}, ${blockSize}px)`;
        gameGrid.style.width = `${width * blockSize}px`;
        gameGrid.style.height = `${height * blockSize}px`;

        currentGridWidth = width;
        currentGridHeight = height;

        if (isNewGrid) {
            gridHistory = []; // Always clear history for a new or imported grid
            historyPointer = -1;
            gridState = Array(width * height).fill('Air'); // Default to Air
            for (const key in resourceCounts) {
                delete resourceCounts[key];
            }
            if (loadedGridState) {
                gridState = [...loadedGridState]; // If importing, set gridState to loaded data
            }
        }


        for (let i = 0; i < width * height; i++) {
            const block = document.createElement('div');
            block.classList.add('grid-block');
            block.dataset.index = i;
            // Set initial type and style based on the (potentially loaded) gridState
            const type = gridState[i] || 'Air'; // Use gridState[i] directly
            block.dataset.type = type;

            const img = blockImages[type];
            if (type !== 'Air' && img) {
                block.style.backgroundImage = `url(${img.src})`;
                block.style.backgroundColor = '';
            } else {
                block.style.backgroundColor = '#e0e0e0';
                block.style.backgroundImage = 'none';
            }


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
                isPainting = false;
                consecutivePlaceCount = 0;
                consecutiveDestroyCount = 0;
                if (pitchResetTimeout) {
                    clearTimeout(pitchResetTimeout);
                }

                if (event.button === 0 || event.button === 2) {
                    saveState();
                }


                if (event.button === 1) {
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

        document.addEventListener('mouseup', (event) => {
            if (isPainting && (event.button === 0 || event.button === 2)) {
                saveState();
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
        ctx.imageSmoothingEnabled = false;
        ctx.mozImageSmoothingEnabled = false;
        ctx.webkitImageSmoothingEnabled = false;
        ctx.msImageSmoothingEnabled = false;

        updateResourceCounts();
        updateUndoRedoButtonStates();
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

        const img = blockImages[type];
        if (type !== 'Air' && img) {
            gridBlockElement.style.backgroundImage = `url(${img.src})`;
            gridBlockElement.style.backgroundColor = '';
        } else {
            gridBlockElement.style.backgroundImage = 'none';
            gridBlockElement.style.backgroundColor = '#e0e0e0';
        }


        if (type !== 'Air') {
            resourceCounts[type] = (resourceCounts[type] || 0) + 1;
        }
        updateResourceCountsDisplay();
        playSound(placeBlockSound, isPainting, 'place');
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
        playSound(destroyBlockSound, isPainting, 'destroy');
    }

    function clearGrid() {
        for (const key in resourceCounts) {
            delete resourceCounts[key];
        }
        updateResourceCountsDisplay();

        const allGridBlocks = document.querySelectorAll('.grid-block');
        allGridBlocks.forEach(block => {
            const index = parseInt(block.dataset.index);
            block.dataset.type = 'Air';
            gridState[index] = 'Air';
            block.style.backgroundColor = '#e0e0e0';
            block.style.backgroundImage = 'none';
        });
        saveState();
    }

    function fillGrid() {
        const allGridBlocks = document.querySelectorAll('.grid-block');
        for (const key in resourceCounts) {
            delete resourceCounts[key];
        }

        allGridBlocks.forEach(block => {
            const index = parseInt(block.dataset.index);
            const currentBlockType = block.dataset.type;
            
            if (currentBlockType !== selectedBlockType) {
                block.dataset.type = selectedBlockType;
                gridState[index] = selectedBlockType;

                const img = blockImages[selectedBlockType];
                if (selectedBlockType !== 'Air' && img) {
                    block.style.backgroundImage = `url(${img.src})`;
                    block.style.backgroundColor = '';
                } else {
                    block.style.backgroundImage = 'none';
                    block.style.backgroundColor = '#e0e0e0';
                }
                resourceCounts[selectedBlockType] = (resourceCounts[selectedBlockType] || 0) + 1;
            }
        });
        updateResourceCountsDisplay();
        saveState();
    }

    // NEW: Function to move grid contents
    function moveGrid(direction) {
        playSound(moveSound);
        const newGridState = Array(currentGridWidth * currentGridHeight).fill('Air');
        
        for (let i = 0; i < gridState.length; i++) {
            const blockType = gridState[i];
            if (blockType === 'Air') continue;

            const oldRow = Math.floor(i / currentGridWidth);
            const oldCol = i % currentGridWidth;

            let newRow = oldRow;
            let newCol = oldCol;

            switch (direction) {
                case 'up':
                    newRow = oldRow - 1;
                    break;
                case 'down':
                    newRow = oldRow + 1;
                    break;
                case 'left':
                    newCol = oldCol - 1;
                    break;
                case 'right':
                    newCol = oldCol + 1;
                    break;
            }

            // Check if new position is within bounds
            if (newRow >= 0 && newRow < currentGridHeight &&
                newCol >= 0 && newCol < currentGridWidth) {
                const newIndex = newRow * currentGridWidth + newCol;
                newGridState[newIndex] = blockType;
            }
        }
        applyState(newGridState);
        saveState();
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

    // NEW: Event listeners for move grid buttons
    moveGridUpButton.addEventListener('click', () => moveGrid('up'));
    moveGridDownButton.addEventListener('click', () => moveGrid('down'));
    moveGridLeftButton.addEventListener('click', () => moveGrid('left'));
    moveGridRightButton.addEventListener('click', () => moveGrid('right'));


    function saveState() {
        if (historyPointer < gridHistory.length - 1) {
            gridHistory = gridHistory.slice(0, historyPointer + 1);
        }

        const stateToSave = JSON.parse(JSON.stringify(gridState));
        gridHistory.push(stateToSave);
        historyPointer++;

        if (gridHistory.length > MAX_HISTORY_STATES) {
            gridHistory.shift();
            historyPointer--;
        }
        updateUndoRedoButtonStates();
        console.log(`State saved. History length: ${gridHistory.length}, Pointer: ${historyPointer}`);
    }

    function undo() {
        if (historyPointer > 0) {
            playSound(buttonSound);
            historyPointer--;
            applyState(gridHistory[historyPointer]);
            updateUndoRedoButtonStates();
            console.log(`Undid. History length: ${gridHistory.length}, Pointer: ${historyPointer}`);
        } else {
            console.log("Cannot undo further.");
        }
    }

    function redo() {
        if (historyPointer < gridHistory.length - 1) {
            playSound(buttonSound);
            historyPointer++;
            applyState(gridHistory[historyPointer]);
            updateUndoRedoButtonStates();
            console.log("Redid. History length: ${gridHistory.length}, Pointer: ${historyPointer}");
        } else {
            console.log("Cannot redo further.");
        }
    }

    function updateUndoRedoButtonStates() {
        undoButton.disabled = (historyPointer <= 0);
        redoButton.disabled = (historyPointer >= gridHistory.length - 1);
    }

    undoButton.addEventListener('click', undo);
    redoButton.addEventListener('click', redo);

    function exportGrid() {
        playSound(buttonSound);
        const dataToSave = {
            width: currentGridWidth,
            height: currentGridHeight,
            grid: gridState
        };
        const jsonData = JSON.stringify(dataToSave, null, 2);

        const blob = new Blob([jsonData], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = 'my_design.blockbuilder';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        playSound(saveSound);
    }

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
                    if (loadedData.width * loadedData.height !== loadedData.grid.length) {
                        alert('Error: Imported file grid dimensions do not match the grid array length.');
                        return;
                    }
                    
                    gridWidthInput.value = loadedData.width;
                    gridHeightInput.value = loadedData.height;

                    initializeGrid(loadedData.width, loadedData.height, true, loadedData.grid);
                    
                    saveState();

                    alert('Grid imported successfully!');
                } else {
                    alert('Error: Invalid .blockbuilder file format. Missing or incorrect data.');
                }
            } catch (error) {
                console.error("Error parsing .blockbuilder file:", error);
                alert('Error: Could not read or parse the .blockbuilder file. It might be corrupted or not a valid JSON.');
            } finally {
                event.target.value = '';
            }
        };
        reader.onerror = () => {
            console.error("FileReader error:", reader.error);
            alert('Error reading file. Please try again.');
        };
        reader.readAsText(file);
    }

    function drawResourcesOnCanvas(ctx, startY, canvasWidthPx, resourceCounts, blockTypes, blockImages) {
        let currentY = startY + 20;

        ctx.font = 'bold 16px Arial';
        ctx.fillStyle = '#333';
        ctx.textAlign = 'center';
        ctx.fillText("Resources Used", canvasWidthPx / 2, currentY);
        currentY += 25;

        ctx.font = '14px Arial';
        ctx.fillStyle = '#444';

        const RESOURCE_ITEM_HEIGHT = 28;
        const RESOURCE_IMG_SIZE = 24;
        const TEXT_X_OFFSET = RESOURCE_IMG_SIZE + 10;

        const sortedBlockTypes = Object.keys(resourceCounts).sort();

        if (sortedBlockTypes.length === 0) {
            ctx.textAlign = 'center';
            ctx.font = 'italic 14px Arial';
            ctx.fillText("No blocks placed yet.", canvasWidthPx / 2, currentY + 15);
            return;
        }

        let maxItemContentWidth = 0;
        ctx.font = '14px Arial';
        sortedBlockTypes.forEach(type => {
            const count = resourceCounts[type];
            const name = type;
            const quantity = `x${count}`;
            const text = `${name} ${quantity}`;
            const textWidth = ctx.measureText(text).width;
            maxItemContentWidth = Math.max(maxItemContentWidth, RESOURCE_IMG_SIZE + 10 + textWidth);
        });

        ctx.textAlign = 'left';

        const startXForBlockItems = (canvasWidthPx - maxItemContentWidth) / 2;

        sortedBlockTypes.forEach(type => {
            const count = resourceCounts[type];
            if (count > 0) {
                const blockData = blockTypes[type];
                const img = blockImages[type];
                const name = type;
                const quantity = `x${count}`;

                const itemText = `${name} ${quantity}`;
                ctx.font = '14px Arial';
                const textMetrics = ctx.measureText(itemText);

                let drawX = startXForBlockItems;
                const textY = currentY + (RESOURCE_ITEM_HEIGHT / 2) + (textMetrics.actualBoundingBoxAscent / 2);

                if (img && img.complete) {
                    ctx.drawImage(img, drawX, currentY + (RESOURCE_ITEM_HEIGHT - RESOURCE_IMG_SIZE) / 2, RESOURCE_IMG_SIZE, RESOURCE_IMG_SIZE);
                } else {
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
    }

    function calculateResourceListCanvasHeight() {
        if (!includeResourcesCheckbox.checked) {
            return 0;
        }
        const numItems = Object.keys(resourceCounts).length;
        if (numItems === 0) {
            return 40;
        }
        return 20 + 25 + (numItems * 28);
    }

    function drawGridToCanvas(targetCtx, targetCanvasWidth, targetCanvasHeight) {
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
                    targetCtx.fillStyle = '#ff00ff';
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

        const exportCanvas = document.createElement('canvas');
        const exportCtx = exportCanvas.getContext('2d');

        exportCanvas.width = canvasWidth;
        exportCanvas.height = canvasHeight + resourceListHeight;

        exportCtx.imageSmoothingEnabled = false;
        exportCtx.mozImageSmoothingEnabled = false;
        exportCtx.webkitImageSmoothingEnabled = false;
        exportCtx.msImageSmoothingEnabled = false;

        drawGridToCanvas(exportCtx, canvasWidth, canvasHeight);

        if (includeResources) {
            drawResourcesOnCanvas(exportCtx, canvasHeight, canvasWidth, resourceCounts, blockTypes, blockImages);
        }

        const dataURL = exportCanvas.toDataURL('image/png');

        const a = document.createElement('a');
        a.href = dataURL;
        a.download = 'my_block_design.png';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(dataURL);

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
        gridSoundsEnabled = !gridSoundsEnabled;
        localStorage.setItem('gridSoundsEnabled', gridSoundsEnabled);
        updateGridSoundToggleButton();
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

    musicCategorySelect.addEventListener('change', () => {
        updateMusicPlaylist();
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

    setGridSizeButton.addEventListener('click', () => {
        playSound(buttonSound);
        const newWidth = parseInt(gridWidthInput.value);
        const newHeight = parseInt(gridHeightInput.value);

        const MAX_GRID_SIZE = 35; 

        if (isNaN(newWidth) || newWidth < 1 || newWidth > MAX_GRID_SIZE) {
            alert(`Please enter a valid width between 1 and ${MAX_GRID_SIZE}.`);
            gridWidthInput.value = currentGridWidth;
            return;
        }
        if (isNaN(newHeight) || newHeight < 1 || newHeight > MAX_GRID_SIZE) {
            alert(`Please enter a valid height between 1 and ${MAX_GRID_SIZE}.`);
            gridHeightInput.value = currentGridHeight;
            return;
        }

        initializeGrid(newWidth, newHeight, true);
        saveState();
    });

    resetGridSizeButton.addEventListener('click', () => {
        playSound(buttonSound);
        gridWidthInput.value = 10;
        gridHeightInput.value = 10;
        initializeGrid(10, 10, true);
        saveState();
    });


    const toggleButtons = [musicToggleButton, soundToggleButton, gridSoundToggleButton, fillGridButton, clearGridButton, undoButton, redoButton, setGridSizeButton, resetGridSizeButton, savePngButton, importButton, exportButton, musicCategorySelect, moveGridUpButton, moveGridDownButton, moveGridLeftButton, moveGridRightButton];

    toggleButtons.forEach(button => {
        button.addEventListener('mouseover', (event) => {
            const tooltipText = button.dataset.tooltip;
            if (tooltipText) {
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

    exportButton.addEventListener('click', exportGrid);
    importButton.addEventListener('click', () => importFileInput.click());
    importFileInput.addEventListener('change', importGrid);


    // Theme selection logic
    function applyTheme(themeName) {
        const body = document.body;
        body.classList.remove('theme-light', 'theme-dark', 'theme-overworld', 'theme-nether', 'theme-end', 'theme-cave', 'theme-ocean', 'theme-reef');
        body.classList.add(`theme-${themeName}`);
        localStorage.setItem('selectedTheme', themeName);
    }

    themeSelect.addEventListener('change', (event) => {
        applyTheme(event.target.value);
        playSound(buttonSound);
    });

    const savedTheme = localStorage.getItem('selectedTheme') || 'light';
    themeSelect.value = savedTheme;
    applyTheme(savedTheme);


    preloadBlockTextures().then(() => {
        console.log("Initial texture preload complete. Initializing UI.");
        initializeInventory();
        initializeGrid(parseInt(gridWidthInput.value), parseInt(gridHeightInput.value), true);
        saveState();
        updateUndoRedoButtonStates();

        const savedMusicCategory = localStorage.getItem('selectedMusicCategory') || 'All';
        musicCategorySelect.value = savedMusicCategory;
        updateMusicPlaylist();

    }).catch(error => {
        console.error("Error preloading textures:", error);
        initializeInventory();
        initializeGrid(parseInt(gridWidthInput.value), parseInt(gridHeightInput.value), true);
        saveState();
        updateUndoRedoButtonStates();
        
        const savedMusicCategory = localStorage.getItem('selectedMusicCategory') || 'All';
        musicCategorySelect.value = savedMusicCategory;
        updateMusicPlaylist();
    });
});
