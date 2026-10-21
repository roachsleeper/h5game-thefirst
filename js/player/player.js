import { SCREEN_WIDTH, SCREEN_HEIGHT } from '../render.js';
import {
  drawHero,
  drawHeroAttack,
  drawMaskedHero,
  drawMaskedHeroAttack,
  drawMaskedHeroCharge,
  drawMaskedHeroChargeRelease,
  HERO_FACE_RATIO,
  HERO_ATK_FIST,
  SHIELD_IMPACT_TOTAL_TICKS,
  BLAST_IMPACT_TOTAL_TICKS
} from '../runtime/draw.js';

const PLAYER_WIDTH = 36;
const PLAYER_HEIGHT = 60;
const GROUND_Y = SCREEN_HEIGHT * 0.75;
const SPRITE_HEIGHT = 84;
const MASKED_SPRITE_HEIGHT = 84;
const SPRITE_BOTTOM = GROUND_Y + 2;
const PLAYER_FIXED_X = SCREEN_WIDTH / 2;
const ATTACK_RANGE = 110;
const ATTACK_COOLDOWN_FRAMES = 12;
const ATTACK_ANIM_TICKS = 12;
const RED_GOLD_ATTACK_ANIM_TICKS = 24;
const ATTACK_EFFECT_TICKS = 8;
const ATTACK_EFFECT_DELAY = 2;
const SKILL1_COOLDOWN_FRAMES = 900;
const SKILL2_COOLDOWN_FRAMES = 1800;
const INVINCIBLE_FRAMES = 120;
const SKILL1_HEAL = 20;
const PUSH_RANGE = 160;
const RANGED_PROJECTILE_SPEED = 8;
const RANGED_PROJECTILE_LIFE = 90;
const CHARGE_MIN_FRAMES = 10;
const CHARGE_MAX_FRAMES = 60;
const CHARGE_FRAME_TICKS = 6;

export default class Player {
  constructor() {
    this.x = PLAYER_FIXED_X;
    this.y = GROUND_Y - PLAYER_HEIGHT;
    this.width = PLAYER_WIDTH;
    this.height = PLAYER_HEIGHT;
    this.hp = 100;
    this.maxHp = 100;
    this.level = 1;
    this.atk = 10;
    this.kills = 0;
    this.attackCooldown = 0;
    this.atkAnimTimer = 0;
    this.attackAnimTicks = ATTACK_ANIM_TICKS;
    this.chargeReleaseActive = false;
    this.atkAnimDir = 'right';
    this.skill1Cooldown = 0;
    this.skill2Cooldown = 0;
    this.invincibleTimer = 0;
    this.attackMode = 'melee';
    this.isCharging = false;
    this.chargeDirection = null;
    this.chargeFrames = 0;
    this.attackCdMult = 1;
    this.rangeBonus = 0;
    this.skillCdMult = 1;
    this.maskBonusHp = 0;
    this.maskBonusAtk = 0;
    this.isActive = true;
    this.visible = true;
  }

  reset() {
    this.hp = 100 + this.maskBonusHp;
    this.maxHp = 100 + this.maskBonusHp;
    this.level = 1;
    this.atk = 10 + this.maskBonusAtk;
    this.kills = 0;
    this.attackCooldown = 0;
    this.atkAnimTimer = 0;
    this.attackAnimTicks = ATTACK_ANIM_TICKS;
    this.chargeReleaseActive = false;
    this.skill1Cooldown = 0;
       this.skill2Cooldown = 0;
    this.invincibleTimer = 0;
    this.cancelCharge();
    this.isActive = true;
    this.visible = true;
  }

  getSkill1Cooldown() {
    return Math.max(300, Math.round((SKILL1_COOLDOWN_FRAMES - this.kills * 18) * this.skillCdMult));
  }

  getSkill2Cooldown() {
    return Math.max(600, Math.round((SKILL2_COOLDOWN_FRAMES - this.kills * 30) * this.skillCdMult));
  }

  setAttackMode(mode) {
    this.attackMode = mode || 'melee';
    this.cancelCharge();
  }

  setAttackAnimationProfile(maskId) {
    this.attackAnimTicks = maskId === 'redGold'
      ? RED_GOLD_ATTACK_ANIM_TICKS
      : ATTACK_ANIM_TICKS;
  }

  getChargeProgress() {
    return Math.min(1, this.chargeFrames / CHARGE_MAX_FRAMES);
  }

  getChargeRange() {
    return ATTACK_RANGE + 80 + this.getChargeProgress() * 170;
  }

  beginCharge(direction) {
    if (this.attackMode !== 'charge' || this.attackCooldown > 0 || this.isCharging) return false;
    this.isCharging = true;
    this.chargeDirection = direction;
    this.chargeFrames = 0;
    return true;
  }

  releaseCharge(monsters, attackEffects) {
    if (!this.isCharging) return false;

    const direction = this.chargeDirection || 'right';
    const frames = this.chargeFrames;
    const ratio = Math.min(1, frames / CHARGE_MAX_FRAMES);
    this.cancelCharge();
    if (frames < CHARGE_MIN_FRAMES) return false;

    const range = ATTACK_RANGE + 80 + ratio * 170;
    const damage = this.atk * (1 + ratio * 1.2);
    return this.performMeleeAttack(direction, monsters, attackEffects, range, damage, ratio);
  }

  cancelCharge() {
    this.isCharging = false;
    this.chargeDirection = null;
    this.chargeFrames = 0;
  }

  attack(direction, monsters, attackEffects, projectiles) {
    if (this.attackMode === 'charge') return false;
    if (this.attackMode === 'ranged') {
      return this.fireProjectile(direction, attackEffects, projectiles);
    }
    return this.performMeleeAttack(direction, monsters, attackEffects, ATTACK_RANGE + this.rangeBonus, this.atk, 0);
  }

  fireProjectile(direction, attackEffects, projectiles) {
    if (this.attackCooldown > 0 || !projectiles) return false;

    const sign = direction === 'left' ? -1 : 1;
    projectiles.push({
      type: 'ranged',
      direction,
      x: this.x + sign * 24,
      y: this.y + this.height * 0.38,
      speed: RANGED_PROJECTILE_SPEED,
      damage: this.atk,
      life: RANGED_PROJECTILE_LIFE,
      radius: 6,
    });

    attackEffects.push({
      type: direction,
      timer: 5,
      life: 5,
      delay: 0,
      hits: [],
    });
    this.atkAnimDir = direction;
    this.atkAnimTimer = ATTACK_ANIM_TICKS;
    this.attackCooldown = Math.max(5, Math.round(ATTACK_COOLDOWN_FRAMES * this.attackCdMult));
    return true;
  }

  performMeleeAttack(direction, monsters, attackEffects, range, damage, chargeRatio) {
    if (this.attackCooldown > 0) return;

    const fist = HERO_ATK_FIST[direction];
    const effect = {
      type: direction,
      timer: ATTACK_EFFECT_TICKS + ATTACK_EFFECT_DELAY,
      life: ATTACK_EFFECT_TICKS,
      delay: ATTACK_EFFECT_DELAY,
      range: range,
      fx: this.x + fist.dx * SPRITE_HEIGHT,
      fy: SPRITE_BOTTOM - SPRITE_HEIGHT * (1 - fist.dy),
      charged: chargeRatio > 0,
      chargeRatio,
      hits: []
    };
    attackEffects.push(effect);

    let attackLeft, attackRight;
    if (direction === 'left') {
      attackLeft = this.x - range;
      attackRight = this.x - 10;
    } else {
      attackLeft = this.x + 10;
      attackRight = this.x + range;
    }

    for (let i = monsters.length - 1; i >= 0; i--) {
      const m = monsters[i];
      const mLeft = m.x;
      const mRight = m.x + m.width;
      if (mRight > attackLeft && mLeft < attackRight) {
        effect.hits.push({
          x: m.x + m.width / 2,
          y: m.y + m.height / 2
        });
        m.hitFlashTimer = 8;
        m.hitVelocity = direction === 'left' ? -5.5 : 5.5;
        m.hp -= damage;
        if (m.hp <= 0) {
          monsters.splice(i, 1);
          this.kills++;
          if (this.kills % 2 === 0) {
            this.levelUp();
          }
        }
      }
    }

    this.atkAnimDir = direction;
    this.chargeReleaseActive = chargeRatio > 0;
    this.atkAnimTimer = this.attackAnimTicks;
    this.attackCooldown = Math.max(4, Math.round((chargeRatio > 0 ? 20 : ATTACK_COOLDOWN_FRAMES) * this.attackCdMult));
    return true;
  }

  useSkill1(monsters, skillEffects) {
    if (this.skill1Cooldown > 0) return false;
    this.skill1Cooldown = this.getSkill1Cooldown();
    this.invincibleTimer = INVINCIBLE_FRAMES;
    this.hp = Math.min(this.maxHp, this.hp + SKILL1_HEAL);

    for (const m of monsters) {
      const mCenterX = m.x + m.width / 2;
      const dx = mCenterX - this.x;
      if (Math.abs(dx) < PUSH_RANGE) {
        if (dx >= 0) {
          m.x = this.x + PUSH_RANGE - m.width / 2;
        } else {
          m.x = this.x - PUSH_RANGE - m.width / 2;
        }
        if (m.x < -m.width) m.x = -m.width;
        if (m.x > SCREEN_WIDTH) m.x = SCREEN_WIDTH;
      }
    }

    skillEffects.push({
      type: 'shield',
      timer: SHIELD_IMPACT_TOTAL_TICKS,
      life: SHIELD_IMPACT_TOTAL_TICKS
    });
    return true;
  }

  useSkill2(monsters, skillEffects) {
    if (this.skill2Cooldown > 0) return false;
    this.skill2Cooldown = this.getSkill2Cooldown();
    const damage = 40 + this.level * 10;
    for (let i = monsters.length - 1; i >= 0; i--) {
      monsters[i].hp -= damage;
      if (monsters[i].hp <= 0) {
        monsters.splice(i, 1);
        this.kills++;
        if (this.kills % 2 === 0) this.levelUp();
      }
    }
    skillEffects.push({
      type: 'blast',
      timer: BLAST_IMPACT_TOTAL_TICKS,
      life: BLAST_IMPACT_TOTAL_TICKS
    });
    return true;
  }

  levelUp() {
    this.level++;
    this.maxHp += 20;
    this.hp = this.maxHp;
    this.atk += 5;
  }

  update() {
    if (this.attackCooldown > 0) this.attackCooldown--;
    if (this.atkAnimTimer > 0) this.atkAnimTimer--;
    if (this.atkAnimTimer <= 0) this.chargeReleaseActive = false;
    if (this.skill1Cooldown > 0) this.skill1Cooldown--;
    if (this.skill2Cooldown > 0) this.skill2Cooldown--;
    if (this.invincibleTimer > 0) this.invincibleTimer--;
    if (this.isCharging) {
      // Keep the timer running so the charge pose can loop after reaching
      // maximum power; getChargeProgress() still clamps the power at 100%.
      this.chargeFrames++;
    }
  }

  getAtkFrame() {
    if (this.atkAnimTimer <= 0) return -1;
    const t = this.attackAnimTicks - this.atkAnimTimer;
    const speed = this.attackAnimTicks / ATTACK_ANIM_TICKS;
    if (t < 2 * speed) return 1;
    if (t < 8 * speed) return 2;
    if (t < 11 * speed) return 3;
    return 0;
  }

  getChargeFrame() {
    if (!this.isCharging) return 0;
    return Math.floor(this.chargeFrames / CHARGE_FRAME_TICKS) % 5;
  }

  render(ctx, selectedMask, drawMaskFn, suppressBody = false) {
    const atkFrame = this.getAtkFrame();
    const hasMaskedCharacter = selectedMask && selectedMask !== 'none';
    const spriteHeight = hasMaskedCharacter ? MASKED_SPRITE_HEIGHT : SPRITE_HEIGHT;
    let faceX = this.x;
    let heroDrawn = false;
    if (suppressBody) {
      // The skill frame is rendered by drawSkillEffects after this method.
      // Mark the body as drawn so the fallback placeholder is not rendered.
      heroDrawn = true;
    } else if (this.isCharging && selectedMask === 'goldArmor') {
      heroDrawn = drawMaskedHeroCharge(
        ctx,
        this.x,
        SPRITE_BOTTOM,
        spriteHeight,
        selectedMask,
        this.getChargeFrame(),
        this.chargeDirection || 'right'
      );
    } else if (atkFrame >= 0) {
      const atkInfo = hasMaskedCharacter
        ? (selectedMask === 'goldArmor' && this.chargeReleaseActive
          ? (drawMaskedHeroChargeRelease(
            ctx,
            this.x,
            SPRITE_BOTTOM,
            spriteHeight,
            selectedMask,
            this.atkAnimDir
          ) ? { faceDx: 0 } : null)
          : drawMaskedHeroAttack(ctx, this.x, SPRITE_BOTTOM, spriteHeight, selectedMask, this.atkAnimDir, atkFrame))
        : drawHeroAttack(ctx, this.x, SPRITE_BOTTOM, SPRITE_HEIGHT, this.atkAnimDir, atkFrame);
      if (atkInfo) {
        heroDrawn = true;
        faceX = this.x + atkInfo.faceDx;
      }
    }
    if (!heroDrawn) {
      heroDrawn = hasMaskedCharacter
        ? drawMaskedHero(ctx, this.x, SPRITE_BOTTOM, spriteHeight, selectedMask)
        : drawHero(ctx, this.x, SPRITE_BOTTOM, SPRITE_HEIGHT);
    }

    if (!heroDrawn) {
      ctx.shadowColor = '#6ec8ff';
      ctx.shadowBlur = 16;
      ctx.fillStyle = '#5b8cff';
      ctx.beginPath();
      ctx.roundRect(this.x - this.width / 2, this.y, this.width, this.height, 10);
      ctx.fill();

      ctx.fillStyle = '#b0c4ff';
      ctx.beginPath();
      ctx.ellipse(this.x, this.y + 12, 16, 14, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#3a5fbb';
      ctx.fillRect(this.x - 10, this.y + 30, 20, 8);

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(this.x - 6, this.y + 12, 4, 0, Math.PI * 2);
      ctx.arc(this.x + 6, this.y + 12, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#3a5fbb';
      ctx.beginPath();
      ctx.arc(this.x - 6, this.y + 12, 2, 0, Math.PI * 2);
      ctx.arc(this.x + 6, this.y + 12, 2, 0, Math.PI * 2);
      ctx.fill();
    }

    const faceY = heroDrawn
      ? SPRITE_BOTTOM - spriteHeight * (1 - HERO_FACE_RATIO)
      : this.y + 12;
    const hpBarY = heroDrawn ? SPRITE_BOTTOM - spriteHeight - 10 : this.y - 20;

    if (hasMaskedCharacter && !heroDrawn) {
      drawMaskFn(ctx, faceX, faceY, 1.15, selectedMask);
    }

    ctx.shadowBlur = 0;
    const playerHpPercent = this.hp / this.maxHp;
    ctx.fillStyle = '#2a1a1a';
    ctx.fillRect(this.x - 30, hpBarY, 60, 8);
    ctx.fillStyle = playerHpPercent > 0.5 ? '#4cd964' : '#ffcc00';
    ctx.fillRect(this.x - 30, hpBarY, 60 * playerHpPercent, 8);

    if (this.invincibleTimer > 0) {
      const pulse = 0.5 + 0.25 * Math.sin(Date.now() * 0.02);
      ctx.strokeStyle = `rgba(110, 200, 255, ${pulse})`;
      ctx.lineWidth = 3;
      ctx.shadowColor = '#6ec8ff';
      ctx.shadowBlur = 20;
      ctx.beginPath();
      ctx.arc(this.x, this.y + PLAYER_HEIGHT / 2, 52, 0, Math.PI * 2);
      ctx.stroke();
      ctx.shadowBlur = 0;
    }
  }
}
