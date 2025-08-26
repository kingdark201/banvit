const canvas = document.getElementById('gameCanvas'), ctx = canvas.getContext('2d');
const gameOverlay = document.getElementById('gameOverlay');
const upgradeModal = document.getElementById('upgradeModal');
const levelSelectModal = document.getElementById('levelSelectModal');
const botInfoModal = document.getElementById('botInfoModal');
const resetConfirmModal = document.getElementById('resetConfirmModal');


const playerShootSound = document.getElementById('playerShootSound');
const botShootSound = document.getElementById('botShootSound');
const playerHitSound = document.getElementById('playerHitSound');
const botHitSound = document.getElementById('botHitSound');
const winSound = document.getElementById('winSound');
const loseSound = document.getElementById('loseSound');
const upgradeSound = document.getElementById('upgradeSound');
const buttonClickSound = document.getElementById('buttonClickSound');
const noGoldSound = document.getElementById('noGoldSound');
const eggBreakSound = document.getElementById('eggBreakSound');

const playerImg = new Image();
const botImg = new Image();
const playerBulletImg = new Image();
const botBulletImg = new Image();
const largeBulletImg = new Image();
const healthPackImg = new Image();
const powerUpImg = new Image();
const botBreakImg = new Image();
const bgImg = new Image();
const cloud1Img = new Image();
const cloud2Img = new Image();


let gameState = 'MENU', currentLevel = 1;
let LOGICAL_W = window.innerWidth, LOGICAL_H = window.innerHeight;
let gameData = {
    gold: 0, highestLevelCompleted: 0,
    playerStats: {
        speedLevel: 1,
        fireRateLevel: 1,
        damageLevel: 1,
        hpLevel: 1

    }
};

let particles = [];


const ANIMATION_SQUASH_TIME = 15;
const ANIMATION_STRETCH_TIME = 10;
const ANIMATION_RECOVER_TIME = 20;
const ANIMATION_TOTAL_TIME = ANIMATION_SQUASH_TIME + ANIMATION_STRETCH_TIME + ANIMATION_RECOVER_TIME;
const BASE_PLAYER_HP = 100;
const BASE_PLAYER_DAMAGE = 10;
const BASE_PLAYER_SPEED = 5;
const BASE_PLAYER_FIRERATE_SECONDS = 1;
const BASE_BOT_HP = 30;
const BASE_BOT_DAMAGE = 5;
const BASE_BOT_SPEED = 3;
const BASE_BOT_FIRERATE_SECONDS = 2;

let specialAttacks = [];
let healthPacks = [];
let playerShotCounter = 0;
let botShotCounter = 0;
let powerUps = [];
let powerUpSpawnTimer = 0;
const POWERUP_SPAWN_INTERVAL = 60 * 15;
let clouds = [];
const NUM_CLOUDS = 3;

let isDragging = false;
let lastDragX = 0;
let targetPlayerX = null;
const PLAYER_SPECIAL_SHOT_TRIGGER = 25;
const BOT_SPECIAL_SHOT_TRIGGER = 10;

const assetFolders = [
    'set_1',
    'set_2',
    'set_3',
    'set_4'
];

const assetFileNames = {
    player: 'player.png',
    bot: 'bot.png',
    playerBullet: 'playerGun.png',
    botBullet: 'botGun.png',
    largeBullet: 'botAttack.png',
    healthPack: 'saveHP.png',
    powerUp: 'playerAttack.png',
    botBreak: 'botBreak.png',
    botHitSound: 'bot_hit.mp3'
};

const player = { x: 0, y: 0, width: 60, height: 60, hp: 100, maxHp: 100, speed: 5, bullets: [], fireRate: 60, fireTimer: 0, damage: 10, scaleX: 1, scaleY: 1, isAnimating: false, animationTimer: 0, hasSpecialShot: false };
const bot = { x: 0, y: 0, width: 80, height: 80, hp: 30, maxHp: 30, speed: 3, damage: 5, bullets: [], dir: 1, changeDirTimer: 0, nextDirChange: 120, fireRateFrames: 120, scaleX: 1, scaleY: 1, isAnimating: false, animationTimer: 0 };

function handleDragStart(e) {
    e.preventDefault();
    isDragging = true;
    const currentX = e.clientX || e.touches[0].clientX;
    targetPlayerX = currentX - player.width / 2;
}

function handleDragMove(e) {
    if (!isDragging || gameState !== 'PLAYING') return;
    e.preventDefault();
    const currentX = e.clientX || e.touches[0].clientX;
    targetPlayerX = currentX - player.width / 2;
}

function handleDragEnd(e) {
    e.preventDefault();
    isDragging = false;
    targetPlayerX = null;
}

function warmUpAudio() {
    const allSounds = [
        playerShootSound, botShootSound, playerHitSound, botHitSound,
        winSound, loseSound, upgradeSound, buttonClickSound, noGoldSound,
        eggBreakSound
    ];

    allSounds.forEach(sound => {
        if (sound) {
            sound.volume = 0;
            sound.play();
            sound.pause();
            sound.currentTime = 0;
            sound.volume = 1;
        }
    });
}

function initializeClouds() {
    clouds = [];
    for (let i = 0; i < NUM_CLOUDS; i++) {
        const img = Math.random() > 0.5 ? cloud1Img : cloud2Img;
        const width = Math.random() * 100 + 80;
        const height = width * (img.naturalHeight / img.naturalWidth || 1);
        clouds.push({
            img: img,
            x: Math.random() * LOGICAL_W,
            y: Math.random() * (LOGICAL_H / 2 - 50),
            width: width,
            height: height,
            speed: Math.random() * 0.5 + 0.1,
            originalX: Math.random() * LOGICAL_W
        });
    }
}



function loadAssetsForLevel(level) {
    const virtualLevel = ((level - 1) % 40) + 1;
    const tierIndex = Math.min(assetFolders.length - 1, Math.floor((virtualLevel - 1) / 10));
    const currentFolder = assetFolders[tierIndex];

    playerImg.src = `images/${currentFolder}/${assetFileNames.player}`;
    botImg.src = `images/${currentFolder}/${assetFileNames.bot}`;
    playerBulletImg.src = `images/${currentFolder}/${assetFileNames.playerBullet}`;
    botBulletImg.src = `images/${currentFolder}/${assetFileNames.botBullet}`;
    largeBulletImg.src = `images/${currentFolder}/${assetFileNames.largeBullet}`;
    healthPackImg.src = `images/${currentFolder}/${assetFileNames.healthPack}`;
    powerUpImg.src = `images/${currentFolder}/${assetFileNames.powerUp}`;
    botBreakImg.src = `images/${currentFolder}/${assetFileNames.botBreak}`;
    const soundSrc = `images/${currentFolder}/${assetFileNames.botHitSound}`;
    
    if (!botHitSound.src.endsWith(soundSrc)) {
        botHitSound.src = soundSrc;
        botHitSound.load(); 
    }
    
    bgImg.src = 'images/background.png';
    cloud1Img.src = 'images/cloud1.png';
    cloud2Img.src = 'images/cloud2.png';
}

function playSound(soundElement, volume = 1) {
    if (soundElement) {
        soundElement.currentTime = 0;
        soundElement.volume = volume;
        soundElement.play().catch(e => console.log("Lỗi phát âm thanh:", e));
    }
}

function createExplosion(x, y, color) {
    const particleCount = 20;
    for (let i = 0; i < particleCount; i++) {
        particles.push({ x: x, y: y, vx: (Math.random() - 0.5) * 5, vy: (Math.random() - 0.5) * 5, size: Math.random() * 5 + 2, color: color, lifespan: 60 });
    }
}

function spawnHealthPack() {
    healthPacks.push({
        x: Math.random() * (LOGICAL_W - 60),
        y: -80,
        width: 50,
        height: 50,
        speed: 3
    });
}

function spawnSpecialAttack() {
    specialAttacks.push({

        x: player.x + (player.width / 2) - 40,
        y: -100,
        width: 60,
        height: 60,
        speed: 5,
        angle: 0,
        rotationSpeed: 0.05
    });
}

function spawnPowerUp() {
    powerUps.push({
        x: Math.random() * (LOGICAL_W - 60),
        y: -70,
        width: 60,
        height: 60,
        speed: 4,
        angle: 0,
        rotationSpeed: 0.04
    });
}


function updateUI() {
    document.getElementById('playerGold').textContent = gameData.gold;
    document.getElementById('currentLevelDisplay').textContent = currentLevel;
    const botHpFill = document.getElementById('botHPFill');
    const botHpText = document.getElementById('botHPText');
    const botHpPercent = (bot.hp / bot.maxHp) * 100;
    botHpFill.style.width = `${botHpPercent}%`;
    botHpText.textContent = `${Math.ceil(bot.hp)} / ${bot.maxHp}`;
}


function calculateUpgradeCost(level) {
    return level * 100;
}

function drawEntity(entity, img) {
    if (!img.complete || img.naturalHeight === 0) return;
    ctx.save();
    ctx.translate(entity.x + entity.width / 2, entity.y + entity.height / 2);
    ctx.scale(entity.scaleX, entity.scaleY);
    ctx.drawImage(img, -entity.width / 2, -entity.height / 2, entity.width, entity.height);
    ctx.restore();
}


function fitCanvasToScreen() {
    const dpr = window.devicePixelRatio || 1;
    const screenWidth = window.innerWidth; const screenHeight = window.innerHeight;
    LOGICAL_W = screenWidth; LOGICAL_H = screenHeight;
    canvas.style.width = screenWidth + 'px'; canvas.style.height = screenHeight + 'px';
    canvas.width = Math.floor(screenWidth * dpr); canvas.height = Math.floor(screenHeight * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (gameState === 'MENU') { player.x = LOGICAL_W / 2 - player.width / 2; player.y = LOGICAL_H - 150; }
}


function saveData() { localStorage.setItem('shootingGameData', JSON.stringify(gameData)); }
function loadData() {
    const savedData = localStorage.getItem('shootingGameData');
    if (savedData) {
        gameData = JSON.parse(savedData);
        if (!gameData.playerStats) gameData.playerStats = {};
        if (!gameData.playerStats.speedLevel) gameData.playerStats.speedLevel = 1;
        if (!gameData.playerStats.fireRateLevel) gameData.playerStats.fireRateLevel = 1;
        if (!gameData.playerStats.damageLevel) gameData.playerStats.damageLevel = 1;
        if (!gameData.playerStats.hpLevel) gameData.playerStats.hpLevel = 1;

        if (gameData.playerStats.shotLevel) delete gameData.playerStats.shotLevel;
    }
    currentLevel = gameData.highestLevelCompleted + 1;
}

function playButtonClick() { playSound(buttonClickSound, 0.5); }

function configureLevel(level) {
    loadAssetsForLevel(level);
    playerShotCounter = 0;
    botShotCounter = 0;
    specialAttacks = [];
    healthPacks = [];
    powerUps = [];
    powerUpSpawnTimer = 0;
    player.hasSpecialShot = false;
    initializeClouds();

    player.maxHp = BASE_PLAYER_HP + (gameData.playerStats.hpLevel - 1) * 20;
    player.hp = player.maxHp;
    player.damage = BASE_PLAYER_DAMAGE + (gameData.playerStats.damageLevel - 1) * 5;
    player.speed = BASE_PLAYER_SPEED + (gameData.playerStats.speedLevel - 1) * 0.5;
    const fireRateMultiplier = 1 + (gameData.playerStats.fireRateLevel - 1) * 0.10;
    const fireRateInSeconds = BASE_PLAYER_FIRERATE_SECONDS / fireRateMultiplier;
    player.fireRate = fireRateInSeconds * 60;
    player.bullets = [];
    player.x = LOGICAL_W / 2 - player.width / 2;
    player.y = LOGICAL_H - 150;
    bot.maxHp = Math.round(BASE_BOT_HP * Math.pow(1.20, level - 1));
    bot.hp = bot.maxHp;
    bot.damage = parseFloat((BASE_BOT_DAMAGE * Math.pow(1.10, level - 1)).toFixed(2));
    bot.speed = BASE_BOT_SPEED + (level - 1) * 0.2;
    const botFireRateInSeconds = Math.max(0.25, BASE_BOT_FIRERATE_SECONDS - (level - 1) * 0.05);
    bot.fireRateFrames = botFireRateInSeconds * 60;
    bot.bullets = [];
    bot.x = LOGICAL_W / 2 - bot.width / 2;
    bot.y = 80;
    updateUI();
}

function startGame(level) {
    playButtonClick();
    currentLevel = level; gameState = 'PLAYING';
    configureLevel(level);
    gameOverlay.style.display = 'none';
}

function showOverlay(type, details = {}) {
    gameState = 'MENU';
    const titleEl = document.getElementById('overlayTitle');
    const textEl = document.getElementById('overlayText');
    const mainActionBtn = document.getElementById('btnMainAction');

    switch (type) {
        case 'start':
            titleEl.textContent = "Bắn Vịt";
            textEl.textContent = `Sẵn sàng cho màn ${currentLevel}?`;
            mainActionBtn.textContent = "Tiếp Tục";
            mainActionBtn.onclick = () => {
                warmUpAudio();
                startGame(currentLevel);
            }
            break;
        case 'win':
            playSound(winSound, 0.7);
            titleEl.textContent = "Chiến Thắng!";
            textEl.textContent = `Bạn nhận được ${details.gold}🟡.`;
            mainActionBtn.textContent = "Màn Kế Tiếp";
            mainActionBtn.onclick = () => startGame(currentLevel + 1);
            break;
        case 'lose':
            playSound(loseSound, 0.7);
            titleEl.textContent = "Thất Bại!";
            textEl.textContent = "Hãy thử lại và nâng cấp sức mạnh nhé.";
            mainActionBtn.textContent = "Chơi Lại";
            mainActionBtn.onclick = () => startGame(currentLevel);
            break;
    }
    gameOverlay.style.display = 'flex';
}

function openUpgradeModal() {
    playButtonClick();
    const currentHP = BASE_PLAYER_HP + (gameData.playerStats.hpLevel - 1) * 20;
    const currentDamage = BASE_PLAYER_DAMAGE + (gameData.playerStats.damageLevel - 1) * 5;
    const currentSpeed = BASE_PLAYER_SPEED + (gameData.playerStats.speedLevel - 1) * 0.5;
    const fireRateMultiplier = 1 + (gameData.playerStats.fireRateLevel - 1) * 0.10;
    const fireRateInSeconds = BASE_PLAYER_FIRERATE_SECONDS / fireRateMultiplier;
    const shotsPerSecond = 1 / fireRateInSeconds;
    let shotCount = 1;

    if (shotsPerSecond >= 5) shotCount = 5;
    else if (shotsPerSecond >= 3.5) shotCount = 4;
    else if (shotsPerSecond >= 2.5) shotCount = 3;
    else if (shotsPerSecond >= 1.5) shotCount = 2;

    document.getElementById('currentHP').textContent = `${currentHP} (+20)`;
    document.getElementById('currentDamage').textContent = `${currentDamage} (+5)`;
    document.getElementById('currentSpeed').textContent = `${currentSpeed.toFixed(1)} (+0.5)`;
    document.getElementById('currentFireRate').textContent = `${shotsPerSecond.toFixed(2)}/s (${shotCount} tia)`;
    document.querySelector('#upgradeHP .cost').textContent = `(${calculateUpgradeCost(gameData.playerStats.hpLevel)}🟡)`;
    document.querySelector('#upgradeDamage .cost').textContent = `(${calculateUpgradeCost(gameData.playerStats.damageLevel)}🟡)`;
    document.querySelector('#upgradeSpeed .cost').textContent = `(${calculateUpgradeCost(gameData.playerStats.speedLevel)}🟡)`;
    document.querySelector('#upgradeFireRate .cost').textContent = `(${calculateUpgradeCost(gameData.playerStats.fireRateLevel)}🟡)`;
    upgradeModal.style.display = 'flex';
}


function buyUpgrade(stat) {
    playButtonClick();
    const statKey = stat + 'Level';
    const cost = calculateUpgradeCost(gameData.playerStats[statKey]);
    if (gameData.gold >= cost) {
        gameData.gold -= cost;
        gameData.playerStats[statKey]++;
        playSound(upgradeSound);
    } else {
        playSound(noGoldSound);
        alert("Không đủ 🟡!");
        return;
    }
    saveData();
    updateUI();
    openUpgradeModal();
}

function openLevelSelectModal() {
    playButtonClick();
    const grid = document.getElementById('levelGrid');
    grid.innerHTML = '';
    for (let i = 1; i <= gameData.highestLevelCompleted + 1; i++) {
        const button = document.createElement('button');
        button.textContent = i;
        button.className = 'level-button';
        if (i <= gameData.highestLevelCompleted) { button.classList.add('unlocked'); }
        button.onclick = () => { levelSelectModal.style.display = 'none'; startGame(i); }
        grid.appendChild(button);
    }
    levelSelectModal.style.display = 'flex';
}

function openBotInfoModal() {
    playButtonClick();
    document.getElementById('botInfoTitle').textContent = `Thông tin Bot - Màn ${currentLevel}`;
    document.getElementById('botInfoHP').textContent = bot.maxHp;
    document.getElementById('botInfoDamage').textContent = bot.damage;
    document.getElementById('botInfoSpeed').textContent = bot.speed.toFixed(1);
    const shotsPerSecond = (60 / bot.fireRateFrames).toFixed(1);
    document.getElementById('botInfoFireRate').textContent = `${shotsPerSecond}/s`;
    botInfoModal.style.display = 'flex';
}

function openResetConfirmModal() {
    playButtonClick();
    resetConfirmModal.style.display = 'flex';
}

function executeReset() {
    playButtonClick();
    localStorage.removeItem('shootingGameData');
    window.location.reload();
}


document.getElementById('btnUpgrades').onclick = openUpgradeModal;
document.getElementById('closeUpgradeModal').onclick = () => { playButtonClick(); upgradeModal.style.display = 'none'; };
document.getElementById('upgradeSpeed').onclick = () => buyUpgrade('speed');
document.getElementById('upgradeFireRate').onclick = () => buyUpgrade('fireRate');
document.getElementById('upgradeDamage').onclick = () => buyUpgrade('damage');
document.getElementById('upgradeHP').onclick = () => buyUpgrade('hp');
document.getElementById('btnLevelSelect').onclick = openLevelSelectModal;
document.getElementById('closeLevelSelectModal').onclick = () => { playButtonClick(); levelSelectModal.style.display = 'none'; };
document.getElementById('btnBotInfo').onclick = openBotInfoModal;
document.getElementById('closeBotInfoModal').onclick = () => { playButtonClick(); botInfoModal.style.display = 'none'; };
document.getElementById('btnReset').onclick = openResetConfirmModal;
document.getElementById('btnCancelReset').onclick = () => { playButtonClick(); resetConfirmModal.style.display = 'none'; };
document.getElementById('btnConfirmReset').onclick = executeReset;

canvas.addEventListener('mousedown', handleDragStart);
window.addEventListener('mousemove', handleDragMove); 
window.addEventListener('mouseup', handleDragEnd);
canvas.addEventListener('mouseleave', handleDragEnd); 

canvas.addEventListener('touchstart', handleDragStart, { passive: false });
canvas.addEventListener('touchmove', handleDragMove, { passive: false });
canvas.addEventListener('touchend', handleDragEnd, { passive: false });
canvas.addEventListener('touchcancel', handleDragEnd, { passive: false });

let botShootTimer = 0;
function handleEntityAnimation(entity, shootFunction, sound) {
    if (entity.isAnimating) {
        entity.animationTimer++;
        const timer = entity.animationTimer;
        if (timer <= ANIMATION_SQUASH_TIME) {
            const progress = timer / ANIMATION_SQUASH_TIME;
            entity.scaleY = 1 - 0.1 * progress; entity.scaleX = 1 + 0.1 * progress;
        } else if (timer === ANIMATION_SQUASH_TIME + 1) {
            shootFunction(); playSound(sound, 0.5);
        } else if (timer <= ANIMATION_SQUASH_TIME + ANIMATION_STRETCH_TIME) {
            const progress = (timer - ANIMATION_SQUASH_TIME) / ANIMATION_STRETCH_TIME;
            entity.scaleY = 0.9 + 0.2 * progress; entity.scaleX = 1.1 - 0.2 * progress;
        } else if (timer < ANIMATION_TOTAL_TIME) {
            const progress = (timer - (ANIMATION_SQUASH_TIME + ANIMATION_STRETCH_TIME)) / ANIMATION_RECOVER_TIME;
            entity.scaleY = 1.1 - 0.1 * progress; entity.scaleX = 0.9 + 0.1 * progress;
        } else {
            entity.isAnimating = false; entity.animationTimer = 0;
            entity.scaleX = 1; entity.scaleY = 1;
        }
    }
}

function update() {
    if (gameState !== 'PLAYING') return;
    powerUpSpawnTimer++;
    if (powerUpSpawnTimer >= POWERUP_SPAWN_INTERVAL) {
        spawnPowerUp();
        powerUpSpawnTimer = 0;
    }
    if (targetPlayerX !== null) {
        const dx = targetPlayerX - player.x;
        if (Math.abs(dx) <= player.speed) {
            player.x = targetPlayerX;
        } else {
            player.x += player.speed * Math.sign(dx);
        }
        player.x = Math.max(0, Math.min(LOGICAL_W - player.width, player.x));
    }
    player.fireTimer++;
    if (player.fireTimer >= player.fireRate && !player.isAnimating) {
        player.isAnimating = true; player.animationTimer = 0; player.fireTimer = 0;
    }
    handleEntityAnimation(player, shootPlayer, playerShootSound);
    bot.changeDirTimer++;
    if (bot.changeDirTimer > bot.nextDirChange) {
        bot.dir = Math.random() > 0.5 ? 1 : -1; bot.changeDirTimer = 0;
    }
    bot.x += bot.speed * bot.dir;
    if (bot.x <= 0) { bot.x = 0; bot.dir = 1; }
    if (bot.x + bot.width >= LOGICAL_W) { bot.x = LOGICAL_W - bot.width; bot.dir = -1; }

    botShootTimer++;
    if (botShootTimer > bot.fireRateFrames && !bot.isAnimating) {
        bot.isAnimating = true; bot.animationTimer = 0; botShootTimer = 0;
    }
    handleEntityAnimation(bot, shootBot, botShootSound);
    player.bullets.forEach(b => b.y -= b.speed);
    player.bullets = player.bullets.filter(b => b.y + b.height > 0);
    healthPacks.forEach(hp => hp.y += hp.speed);
    specialAttacks.forEach(sa => {
        sa.y += sa.speed;
        sa.angle += sa.rotationSpeed;
    });

    powerUps.forEach(p => {
        p.y += p.speed;
        p.angle += p.rotationSpeed;
    });

    healthPacks = healthPacks.filter(hp => hp.y < LOGICAL_H);
    specialAttacks = specialAttacks.filter(sa => sa.y < LOGICAL_H);
    powerUps = powerUps.filter(p => p.y < LOGICAL_H);

    player.bullets.forEach(b => {
        if (isColliding(b, bot)) {
            createExplosion(b.x + b.width / 2, b.y, '#ff8503ff');
            const damageDealt = b.isSpecial ? player.damage * 10 : player.damage;
            bot.hp = Math.max(0, bot.hp - damageDealt);
            b.y = -9999;
            playSound(botHitSound, 0.4);
        }
    });

    bot.bullets.forEach(b => {
        if (b.isBroken) {
            const FADE_DURATION = 2000;
            const elapsedTime = Date.now() - b.breakTime;
            if (elapsedTime >= FADE_DURATION) {
                b.toRemove = true;
            } else {
                b.alpha = 1 - (elapsedTime / FADE_DURATION);
            }
        } else {
            b.x += b.vx;
            b.y += b.vy;
            const groundLevelY = player.y + player.height + 8 + 14;
            if ((b.y + b.height) >= groundLevelY) {
                b.isBroken = true;
                b.breakTime = Date.now();
                createExplosion(b.x + b.width / 2, b.y + b.height, '#ff8503ff');
                playSound(eggBreakSound, 0.5);
            } else {
                const hitZoneTop = player.y;
                const hitZoneBottom = player.y + 10;
                const horizontalMatch = b.x < player.x + player.width && b.x + b.width > player.x;
                const verticalMatch = (b.y + b.height) >= hitZoneTop && (b.y + b.height) <= hitZoneBottom;
                if (horizontalMatch && verticalMatch) {
                    createExplosion(b.x + b.width / 2, b.y + b.height, '#ff0202ff');
                    player.hp -= bot.damage;
                    b.toRemove = true;
                    playSound(playerHitSound, 0.5);
                }
            }
        }
    });

    bot.bullets = bot.bullets.filter(b => {
        if (b.toRemove) return false;
        if (!b.isBroken && (b.y > LOGICAL_H || b.y < -100 || b.x < -100 || b.x > LOGICAL_W + 100)) return false;
        return true;
    });

    healthPacks.forEach(hp => {
        if (isColliding(hp, player)) {
            const healingAmount = player.hp * 0.20;
            player.hp = Math.min(player.maxHp, player.hp + healingAmount);
            hp.y = LOGICAL_H + 9999;
            playSound(upgradeSound, 0.6);
        }
    });
    specialAttacks.forEach(sa => {
        if (isColliding(sa, player)) {
            const specialDamage = bot.damage * 1.20;
            player.hp -= specialDamage;
            sa.y = LOGICAL_H + 9999;
            createExplosion(sa.x + sa.width / 2, sa.y + sa.height, '#9400d3');
            playSound(playerHitSound, 0.8);
        }
    });

    powerUps.forEach(p => {
        if (isColliding(p, player)) {
            player.hasSpecialShot = true;
            p.y = LOGICAL_H + 9999;
            playSound(upgradeSound, 0.8);
        }
    });

    clouds.forEach(cloud => {
        cloud.x += cloud.speed;
        if (cloud.x > LOGICAL_W) {
            cloud.x = -cloud.width;
            cloud.y = Math.random() * (LOGICAL_H / 2 - 50);
        }
    });

    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx; p.y += p.vy; p.lifespan--;
        if (p.lifespan <= 0) { particles.splice(i, 1); }
    }
    updateUI();
    if (bot.hp <= 0) {
        gameState = 'GAMEOVER';
        let goldEarned = 0;
        if (currentLevel > gameData.highestLevelCompleted) {
            goldEarned = 50 + (currentLevel * 10);
            gameData.highestLevelCompleted = currentLevel;
        } else {
            goldEarned = 10 + (currentLevel * 2);
        }
        gameData.gold += goldEarned;
        updateUI(); saveData();
        showOverlay('win', { gold: goldEarned });
    } else if (player.hp <= 0) {
        gameState = 'GAMEOVER';
        showOverlay('lose');
    }
}

function draw() {
    ctx.clearRect(0, 0, LOGICAL_W, LOGICAL_H);
    if (bgImg.complete && bgImg.naturalHeight !== 0) {
        ctx.drawImage(bgImg, 0, 0, LOGICAL_W, LOGICAL_H);
    } else {
        ctx.fillStyle = '#87CEEB';
        ctx.fillRect(0, 0, LOGICAL_W, LOGICAL_H);
    }

    clouds.forEach(cloud => {
        if (cloud.img.complete && cloud.img.naturalHeight !== 0) {
            ctx.drawImage(cloud.img, cloud.x, cloud.y, cloud.width, cloud.height);
        }
    });

    drawEntity(player, playerImg);
    drawEntity(bot, botImg);
    const playerBottom = player.y + player.height;
    const pBarW = player.width + 20, pBarH = 14;
    const pBarX = player.x + (player.width - pBarW) / 2, pBarY = playerBottom + 8;
    const pFillW = (player.hp / player.maxHp) * pBarW;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)'; ctx.fillRect(pBarX, pBarY, pBarW, pBarH);
    ctx.fillStyle = '#4ade80'; ctx.fillRect(pBarX, pBarY, pFillW > 0 ? pFillW : 0, pBarH);
    ctx.fillStyle = '#fff'; ctx.font = 'bold 11px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(`${Math.max(0, Math.ceil(player.hp))} / ${player.maxHp}`, pBarX + pBarW / 2, pBarY + pBarH / 2 + 1);

    player.bullets.forEach(b => { if (playerBulletImg.complete) ctx.drawImage(playerBulletImg, b.x, b.y, b.width, b.height); });
    bot.bullets.forEach(b => {
        const imgToDraw = b.isBroken ? botBreakImg : botBulletImg;
        if (imgToDraw.complete && imgToDraw.naturalHeight !== 0) {
            ctx.globalAlpha = b.alpha;
            ctx.drawImage(imgToDraw, b.x, b.y, b.width, b.height);
            ctx.globalAlpha = 1.0;
        }
    });

    healthPacks.forEach(hp => {
        if (healthPackImg.complete) ctx.drawImage(healthPackImg, hp.x, hp.y, hp.width, hp.height);
    });
    specialAttacks.forEach(sa => {
        if (largeBulletImg.complete) {
            ctx.save();
            ctx.translate(sa.x + sa.width / 2, sa.y + sa.height / 2);
            ctx.rotate(sa.angle);
            ctx.drawImage(largeBulletImg, -sa.width / 2, -sa.height / 2, sa.width, sa.height);
            ctx.restore();
        }
    });
    powerUps.forEach(p => {
        if (powerUpImg.complete) {
            ctx.save();
            ctx.translate(p.x + p.width / 2, p.y + p.height / 2);
            ctx.rotate(p.angle);
            ctx.drawImage(powerUpImg, -p.width / 2, -p.height / 2, p.width, p.height);
            ctx.restore();
        }
    });

    particles.forEach(p => {
        ctx.globalAlpha = p.lifespan / 60; ctx.fillStyle = p.color; ctx.fillRect(p.x, p.y, p.size, p.size);
    });
    ctx.globalAlpha = 1.0;
}

function loop() { update(); draw(); requestAnimationFrame(loop); }

function init() {
    fitCanvasToScreen();
    loadData();
    initializeClouds();
    configureLevel(currentLevel);
    updateUI();
    showOverlay('start');
    loop();
}

const keys = {};
window.addEventListener('keydown', e => { keys[e.code] = true; });
window.addEventListener('keyup', e => { keys[e.code] = false; });
function isColliding(a, b) { return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y; }
function bindButton(el, keyName) {
    el.addEventListener('touchstart', e => { e.preventDefault(); keys[keyName] = true; }, { passive: false });
    el.addEventListener('touchend', e => { e.preventDefault(); keys[keyName] = false; }, { passive: false });
    el.addEventListener('mousedown', e => { e.preventDefault(); keys[keyName] = true; });
    window.addEventListener('mouseup', e => { if (keys[keyName]) { keys[keyName] = false; } });
    el.addEventListener('touchcancel', e => { keys[keyName] = false; }, { passive: false });
}


window.addEventListener('resize', fitCanvasToScreen);

function shootPlayer() {
    if (player.hasSpecialShot) {
        const bulletWidth = 20 * 10;
        const bulletHeight = 20 * 10;
        const bulletSpeed = 10;
        const centerX = player.x + player.width / 2;
        const shootY = player.y + player.height / 2 - (player.height / 2) * player.scaleY - 20;

        player.bullets.push({
            x: centerX - bulletWidth / 2,
            y: shootY,
            width: bulletWidth,
            height: bulletHeight,
            speed: bulletSpeed,
            isSpecial: true
        });

        player.hasSpecialShot = false;
        return;
    }

    const fireRateInSeconds = player.fireRate / 60;
    const shotsPerSecond = 1 / fireRateInSeconds;
    let shotCount = 1;
    if (shotsPerSecond >= 5) shotCount = 5;
    else if (shotsPerSecond >= 3.5) shotCount = 4;
    else if (shotsPerSecond >= 2.5) shotCount = 3;
    else if (shotsPerSecond >= 1.5) shotCount = 2;
    const bulletWidth = 30;
    const bulletHeight = 30;
    const bulletSpeed = 8;
    const bulletSpacing = 25;
    const centerX = player.x + player.width / 2;
    const shootY = player.y + player.height / 2 - (player.height / 2) * player.scaleY - 20;
    const totalWidthOfGroup = (shotCount - 1) * bulletSpacing;
    const startX = centerX - totalWidthOfGroup / 2;

    for (let i = 0; i < shotCount; i++) {
        const bulletX = startX + (i * bulletSpacing) - (bulletWidth / 2);
        player.bullets.push({ x: bulletX, y: shootY, width: bulletWidth, height: bulletHeight, speed: bulletSpeed });
    }

    playerShotCounter += shotCount;
    if (playerShotCounter >= PLAYER_SPECIAL_SHOT_TRIGGER) {
        spawnHealthPack();
        playerShotCounter = 0;
    }
}


function shootBot() {
    const bulletSpeed = 4.5;
    const startX = bot.x + bot.width / 2;
    const startY = bot.y + bot.height / 2 + (bot.height / 2) * bot.scaleY;
    const targetX = player.x + player.width / 2;
    const targetY = player.y + player.height / 2;
    const dx = targetX - startX;
    const dy = targetY - startY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const velocityX = (dx / distance) * bulletSpeed;
    const velocityY = (dy / distance) * bulletSpeed;
    bot.bullets.push({
        x: startX - 10,
        y: startY,
        width: 30,
        height: 30,
        vx: velocityX,
        vy: velocityY,
        isBroken: false,
        alpha: 1.0
    });
    botShotCounter++;
    if (botShotCounter >= BOT_SPECIAL_SHOT_TRIGGER) {
        spawnSpecialAttack();
        botShotCounter = 0;
    }
}

init();