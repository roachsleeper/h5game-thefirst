import { SCREEN_WIDTH, SCREEN_HEIGHT } from '../render.js';

const MONSTER_WIDTH = 46;
const MONSTER_HEIGHT = 50;
const WALKER_SCALE = 0.7;
const WALKER_WIDTH = 150 * WALKER_SCALE;
const WALKER_HEIGHT = 156 * WALKER_SCALE;
const WALKER_FRAME_INTERVAL = 12;
const WALKER_JUMP_HEIGHT = 8 * 1.5 * 2 * 2;
const WALKER_JUMP_SPEED_MULTIPLIER = 6;
const WALKER_CYCLE_PAUSE = 24;
const WALKER_VERTICAL_OFFSET = WALKER_HEIGHT * 0.1;
const WALKER_FRAME_SOURCES = [
  'images/monster-walker-1.png',
  'images/monster-walker-2.png',
  'images/monster-walker-3.png',
  'images/monster-walker-4.png',
  'images/monster-walker-3.png',
  'images/monster-walker-2.png',
  'images/monster-walker-1.png',
];
const WALKER_FRAME_CROP = {
  x: 280,
  y: 0,
  width: 1000,
  height: 900,
};
const WALKER_FRAME_FEET = [860, 860, 846, 850, 846, 860, 860];
const WALKER_FRAME_BASELINE = 860;
const WALKER_FOOT_OFFSET = 1;
const GROUND_Y = SCREEN_HEIGHT * 0.75;
const ARMORED_SLOW_WIDTH = 150;
const ARMORED_SLOW_HEIGHT = 156;
const ARMORED_SLOW_FOOT_OFFSET = 5;
const ARMORED_SLOW_VERTICAL_OFFSET = 16;
const ARMORED_SLOW_FRAME_INTERVAL = 14;
const ARMORED_SLOW_FRAME_SOURCES = [
  'images/monster-armored-slow-walk-1.png',
  'images/monster-armored-slow-walk-2.png',
  'images/monster-armored-slow-walk-3.png',
  'images/monster-armored-slow-walk-4.png',
];

const FLAME_FAST_WIDTH = 58;
const FLAME_FAST_HEIGHT = 88;
const FLAME_FAST_FRAME_INTERVAL = 6;
const FLAME_FAST_FRAME_SOURCES = [
  'images/monster-flame-fast-walk-1.png',
  'images/monster-flame-fast-walk-2.png',
  'images/monster-flame-fast-walk-3.png',
  'images/monster-flame-fast-walk-4.png',
  'images/monster-flame-fast-walk-5.png',
];

// The supplied frames include transparent padding. These crops keep the
// monster's feet on one baseline and recenter the small horizontal drift.
const FLAME_FAST_FRAME_CROPS = [
  { x: 55, y: 120, width: 338, height: 514 },
  { x: 51, y: 120, width: 338, height: 514 },
  { x: 48, y: 120, width: 338, height: 514 },
  { x: 46, y: 120, width: 338, height: 514 },
  { x: 42, y: 120, width: 338, height: 514 },
];

// All four frames share this source crop so the monster keeps a stable
// baseline even though the supplied images have slightly different padding.
const ARMORED_SLOW_FRAME_CROP = {
  x: 20,
  y: 20,
  width: 1234,
  height: 1234,
};
const ARMORED_SLOW_FRAME_FEET = [1069, 1126, 1104, 1069];
const ARMORED_SLOW_FRAME_BASELINE = 1126;

const armoredSlowFrames = [];
const armoredSlowLoaded = [];
const flameFastFrames = [];
const flameFastLoaded = [];

function chooseLoadedFrame(frames, loaded, requested, previous) {
  if (loaded[requested] && frames[requested] && frames[requested].width > 0) return requested;
  if (loaded[previous] && frames[previous] && frames[previous].width > 0) return previous;
  const firstLoaded = loaded.findIndex((isLoaded, index) => isLoaded && frames[index] && frames[index].width > 0);
  return firstLoaded >= 0 ? firstLoaded : -1;
}
const walkerFrames = [];
const walkerLoaded = [];

function loadWalkerFrames() {
  if (walkerFrames.length) return;

  WALKER_FRAME_SOURCES.forEach((src, index) => {
    const img = wx.createImage();
    img.onload = () => { walkerLoaded[index] = true; };
    img.src = src;
    walkerFrames.push(img);
    walkerLoaded.push(false);
  });
}

loadWalkerFrames();

function loadArmoredSlowFrames() {
  if (armoredSlowFrames.length) return;

  ARMORED_SLOW_FRAME_SOURCES.forEach((src, index) => {
    const img = wx.createImage();
    img.onload = () => { armoredSlowLoaded[index] = true; };
    img.src = src;
    armoredSlowFrames.push(img);
    armoredSlowLoaded.push(false);
  });
}

loadArmoredSlowFrames();

function loadFlameFastFrames() {
  if (flameFastFrames.length) return;

  FLAME_FAST_FRAME_SOURCES.forEach((src, index) => {
    const img = wx.createImage();
    img.onload = () => { flameFastLoaded[index] = true; };
    img.src = src;
    flameFastFrames.push(img);
    flameFastLoaded.push(false);
  });
}

loadFlameFastFrames();

export default class Monster {
  constructor(type = 'coral') {
    this.type = type;
    this.width = type === 'coral'
      ? WALKER_WIDTH
      : type === 'armoredSlow'
      ? ARMORED_SLOW_WIDTH
      : type === 'flameFast' ? FLAME_FAST_WIDTH : MONSTER_WIDTH;
    this.height = type === 'coral'
      ? WALKER_HEIGHT
      : type === 'armoredSlow'
      ? ARMORED_SLOW_HEIGHT
      : type === 'flameFast' ? FLAME_FAST_HEIGHT : MONSTER_HEIGHT;
    this.isActive = true;
    this.visible = true;
  }

  init(playerLevel, spawnSide = null) {
    const side = spawnSide || (Math.random() < 0.5 ? 'left' : 'right');
    if (side === 'left') {
      this.x = -this.width - Math.random() * 60;
    } else {
      this.x = SCREEN_WIDTH + Math.random() * 60;
    }
    this.y = GROUND_Y - this.height + (
      this.type === 'armoredSlow'
        ? ARMORED_SLOW_VERTICAL_OFFSET
        : this.type === 'coral' ? WALKER_VERTICAL_OFFSET : 0
    );
    const hpBonus = this.type === 'armoredSlow' ? 22 : 0;
    this.hp = 20 + playerLevel * 5 + hpBonus;
    this.maxHp = 20 + playerLevel * 5;
    this.maxHp += hpBonus;
    this.speed = this.type === 'armoredSlow'
      ? 0.24 + Math.random() * 0.12
      : this.type === 'flameFast'
        ? 1.35 + Math.random() * 0.25
        : 0.6 + Math.random() * 0.6;
    this.hitFlashTimer = 0;
    this.hitVelocity = 0;
    this.contactAttackCooldown = 0;
    const animationInterval = this.type === 'coral'
      ? WALKER_FRAME_INTERVAL
      : this.type === 'flameFast'
      ? FLAME_FAST_FRAME_INTERVAL
      : ARMORED_SLOW_FRAME_INTERVAL;
    this.animationOffset = Math.floor(Math.random() * animationInterval);
    this.animationTimer = 0;
    this.animationFrame = 0;
    this.lastWalkerFrame = 0;
    this.lastArmoredSlowFrame = 0;
    this.lastFlameFastFrame = 0;
    this.jumpOffset = 0;
    this.isWalkerCyclePause = false;
    this.isMoving = false;
    this.flipX = side === 'right';
    this.isActive = true;
    this.visible = true;
  }

  update(player, databus) {
    if (this.hitFlashTimer > 0) this.hitFlashTimer--;
    if (this.contactAttackCooldown > 0) this.contactAttackCooldown--;

    let isMoving = false;

    if (this.type === 'coral') {
      this.animationTimer++;
      const cycleLength = WALKER_FRAME_INTERVAL * WALKER_FRAME_SOURCES.length;
      const cyclePosition = this.animationTimer % (cycleLength + WALKER_CYCLE_PAUSE);
      this.isWalkerCyclePause = cyclePosition >= cycleLength;

      if (this.isWalkerCyclePause) {
        this.animationFrame = WALKER_FRAME_SOURCES.length - 1;
        this.jumpOffset = 0;
      } else {
        this.animationFrame = Math.floor(cyclePosition / WALKER_FRAME_INTERVAL);
      }

      if (!this.isWalkerCyclePause && this.animationFrame === 3) {
        this.jumpOffset = -WALKER_JUMP_HEIGHT;
      } else if (!this.isWalkerCyclePause && this.animationFrame !== 3) {
        this.jumpOffset = 0;
      }
    }

    if (this.hitVelocity) {
      this.x += this.hitVelocity;
      this.hitVelocity *= 0.68;
      if (Math.abs(this.hitVelocity) < 0.25) this.hitVelocity = 0;
      isMoving = true;
    }

    if (this.type === 'flameFast') {
      this.animationFrame = Math.floor(
        ((databus.frame + this.animationOffset) / FLAME_FAST_FRAME_INTERVAL)
      ) % FLAME_FAST_FRAME_SOURCES.length;
      // Keep the original flame motion frequency unchanged.
      this.floatOffset = Math.sin((databus.frame + this.animationOffset) * 0.16) * 1.5;
    } else if (this.type === 'armoredSlow') {
      this.animationFrame = Math.floor(
        ((databus.frame + this.animationOffset) / ARMORED_SLOW_FRAME_INTERVAL)
      ) % ARMORED_SLOW_FRAME_SOURCES.length;
    }

    const mCenterX = this.x + this.width / 2;
    const distance = Math.abs(mCenterX - player.x);
    const contactDistance = player.width / 2 + this.width / 2 + 5;

    if (distance > contactDistance) {
      const dx = player.x - mCenterX;
      const canMove = this.type !== 'coral'
        || (!this.isWalkerCyclePause && this.animationFrame === 3);
      if (canMove && dx > 0) {
        this.x += this.type === 'coral'
          ? this.speed * WALKER_JUMP_SPEED_MULTIPLIER
          : this.speed;
        isMoving = true;
      } else if (canMove && dx < 0) {
        this.x -= this.type === 'coral'
          ? this.speed * WALKER_JUMP_SPEED_MULTIPLIER
          : this.speed;
        isMoving = true;
      }
    } else if (player.invincibleTimer <= 0 && this.contactAttackCooldown <= 0) {
      player.hp = Math.max(0, player.hp - 8);
      this.contactAttackCooldown = 45;
      if (player.hp <= 0) return 'dead';
    }

    if (this.type === 'coral') {
      this.isMoving = isMoving;
    }
    return null;
  }

  render(ctx) {
    if (this.type === 'flameFast') {
      this.renderFlameFast(ctx);
      return;
    }

    if (this.type === 'armoredSlow') {
      this.renderArmoredSlow(ctx);
      return;
    }

    this.renderWalker(ctx);
  }

  renderWalker(ctx) {
    const requestedFrame = this.animationFrame || 0;
    const frameIndex = chooseLoadedFrame(walkerFrames, walkerLoaded, requestedFrame, this.lastWalkerFrame);
    if (frameIndex >= 0) this.lastWalkerFrame = frameIndex;
    const img = frameIndex >= 0 ? walkerFrames[frameIndex] : null;
    const x = Math.round(this.x);
    const y = Math.round(this.y);
    const hpPercent = Math.max(0, Math.min(1, this.hp / this.maxHp));
    const frameShift = (
      (WALKER_FRAME_BASELINE - WALKER_FRAME_FEET[frameIndex])
      / WALKER_FRAME_CROP.height
    ) * this.height;
    const drawY = y + WALKER_FOOT_OFFSET + frameShift + (this.jumpOffset || 0);

    ctx.save();
    ctx.imageSmoothingEnabled = false;

    ctx.fillStyle = '#142039';
    ctx.fillRect(x, y - 10, this.width, 6);
    ctx.fillStyle = hpPercent > 0.35 ? '#56c96b' : '#dd5547';
    ctx.fillRect(x + 1, y - 9, Math.max(1, (this.width - 2) * hpPercent), 4);

    if (img && frameIndex >= 0 && walkerLoaded[frameIndex] && img.width) {
      ctx.save();
      ctx.translate(this.flipX ? x + this.width : x, drawY);
      ctx.scale(this.flipX ? -1 : 1, 1);
      ctx.drawImage(
        img,
        WALKER_FRAME_CROP.x,
        WALKER_FRAME_CROP.y,
        WALKER_FRAME_CROP.width,
        WALKER_FRAME_CROP.height,
        0,
        0,
        this.width,
        this.height
      );
      ctx.restore();
    }

    ctx.restore();
  }

  renderArmoredSlow(ctx) {
    const requestedFrame = this.animationFrame || 0;
    const frameIndex = chooseLoadedFrame(armoredSlowFrames, armoredSlowLoaded, requestedFrame, this.lastArmoredSlowFrame);
    if (frameIndex >= 0) this.lastArmoredSlowFrame = frameIndex;
    const img = frameIndex >= 0 ? armoredSlowFrames[frameIndex] : null;
    const x = Math.round(this.x);
    const y = Math.round(this.y);
    const cx = x + this.width / 2;
    const hpPercent = Math.max(0, Math.min(1, this.hp / this.maxHp));
    const frameShift = (
      (ARMORED_SLOW_FRAME_BASELINE - ARMORED_SLOW_FRAME_FEET[frameIndex])
      / ARMORED_SLOW_FRAME_CROP.height
    ) * this.height;
    const drawY = y + ARMORED_SLOW_FOOT_OFFSET + frameShift;
    ctx.save();
    ctx.imageSmoothingEnabled = false;

    ctx.fillStyle = '#142039';
    ctx.fillRect(x, y - 10, this.width, 6);
    ctx.fillStyle = hpPercent > 0.35 ? '#56c96b' : '#dd5547';
    ctx.fillRect(x + 1, y - 9, Math.max(1, (this.width - 2) * hpPercent), 4);

    if (img && frameIndex >= 0 && armoredSlowLoaded[frameIndex] && img.width) {
      ctx.globalAlpha = this.hitFlashTimer > 0 ? 0.72 : 1;
      ctx.save();
      ctx.translate(this.flipX ? x + this.width : x, drawY);
      ctx.scale(this.flipX ? -1 : 1, 1);
      ctx.drawImage(
        img,
        ARMORED_SLOW_FRAME_CROP.x,
        ARMORED_SLOW_FRAME_CROP.y,
        ARMORED_SLOW_FRAME_CROP.width,
        ARMORED_SLOW_FRAME_CROP.height,
        0,
        0,
        this.width,
        this.height
      );
      ctx.restore();
    }

    ctx.restore();
  }

  renderFlameFast(ctx) {
    const requestedFrame = this.animationFrame || 0;
    const frameIndex = chooseLoadedFrame(flameFastFrames, flameFastLoaded, requestedFrame, this.lastFlameFastFrame);
    if (frameIndex >= 0) this.lastFlameFastFrame = frameIndex;
    const img = frameIndex >= 0 ? flameFastFrames[frameIndex] : null;
    const crop = FLAME_FAST_FRAME_CROPS[frameIndex];
    const x = Math.round(this.x);
    const baseY = Math.round(this.y);
    const y = Math.round(this.y + (this.floatOffset || 0));
    const cx = x + this.width / 2;
    const hpPercent = Math.max(0, Math.min(1, this.hp / this.maxHp));

    ctx.save();
    ctx.imageSmoothingEnabled = false;

    ctx.fillStyle = '#142039';
    ctx.fillRect(x, y - 10, this.width, 6);
    ctx.fillStyle = hpPercent > 0.35 ? '#56c96b' : '#dd5547';
    ctx.fillRect(x + 1, y - 9, Math.max(1, (this.width - 2) * hpPercent), 4);

    if (img && frameIndex >= 0 && flameFastLoaded[frameIndex] && img.width) {
      ctx.globalAlpha = this.hitFlashTimer > 0 ? 0.72 : 1;
      ctx.save();
      ctx.translate(this.flipX ? x + this.width : x, y);
      ctx.scale(this.flipX ? -1 : 1, 1);
      ctx.drawImage(
        img,
        crop.x,
        crop.y,
        crop.width,
        crop.height,
        0,
        0,
        this.width,
        this.height
      );
      ctx.restore();
    }

    ctx.restore();
  }
}
