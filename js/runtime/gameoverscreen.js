import { SCREEN_WIDTH, SCREEN_HEIGHT } from '../render.js';

export default class GameOverScreen {
  constructor() {
    this.visible = false;
    this.score = 0;
    this.level = 1;
    this.kills = 0;
    this.restartBtn = null;
    this.init();
  }

  init() {
    this.layoutButtons();

    wx.onTouchStart((e) => {
      if (!this.visible) return;
      const { clientX: x, clientY: y } = e.touches[0];
      this.handleTouch(x, y);
    });
  }

  layoutButtons() {
    const btnW = 200;
    const btnH = 48;
    this.restartBtn = {
      x: SCREEN_WIDTH / 2 - btnW / 2,
      y: SCREEN_HEIGHT * 0.65,
      width: btnW,
      height: btnH,
    };
  }

  handleTouch(x, y) {
    if (this.restartBtn) {
      const b = this.restartBtn;
      if (x >= b.x && x <= b.x + b.width && y >= b.y && y <= b.y + b.height) {
        return 'restart';
      }
    }
    return null;
  }

  show(score, level, kills) {
    this.score = score;
    this.level = level;
    this.kills = kills;
    this.visible = true;
  }

  hide() {
    this.visible = false;
  }

  render(ctx) {
    if (!this.visible) return;

    ctx.fillStyle = 'rgba(10, 8, 20, 0.85)';
    ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);

    ctx.fillStyle = '#ffe9b0';
    ctx.font = 'bold 32px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('游戏结束', SCREEN_WIDTH / 2, SCREEN_HEIGHT * 0.25);

    ctx.font = '16px Arial';
    ctx.fillStyle = '#d7e0ff';
    ctx.fillText(`击杀: ${this.kills}`, SCREEN_WIDTH / 2, SCREEN_HEIGHT * 0.38);
    ctx.fillText(`等级: ${this.level}`, SCREEN_WIDTH / 2, SCREEN_HEIGHT * 0.45);
    ctx.fillText(`得分: ${this.score}`, SCREEN_WIDTH / 2, SCREEN_HEIGHT * 0.52);
    ctx.textAlign = 'left';

    if (this.restartBtn) {
      const b = this.restartBtn;
      const btnGrad = ctx.createLinearGradient(b.x, b.y, b.x, b.y + b.height);
      btnGrad.addColorStop(0, '#ffe9a0');
      btnGrad.addColorStop(0.6, '#ffb84d');
      btnGrad.addColorStop(1, '#e08a1e');
      ctx.fillStyle = btnGrad;
      ctx.beginPath();
      ctx.roundRect(b.x, b.y, b.width, b.height, 24);
      ctx.fill();

      ctx.fillStyle = '#4a2c08';
      ctx.font = 'bold 18px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('重新开始', b.x + b.width / 2, b.y + b.height / 2 + 6);
      ctx.textAlign = 'left';
    }
  }
}
