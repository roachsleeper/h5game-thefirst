import { SCREEN_WIDTH, SCREEN_HEIGHT } from '../render.js';

export default class PauseScreen {
  constructor() {
    this.visible = false;
    this.resumeBtn = null;
    this.restartBtn = null;
    this.init();
  }

  init() {
    this.layoutButtons();
  }

  layoutButtons() {
    const btnW = 200;
    const btnH = 48;
    const centerX = SCREEN_WIDTH / 2 - btnW / 2;

    this.resumeBtn = {
      x: centerX,
      y: SCREEN_HEIGHT * 0.4,
      width: btnW,
      height: btnH,
    };

    this.restartBtn = {
      x: centerX,
      y: SCREEN_HEIGHT * 0.4 + 64,
      width: btnW,
      height: btnH,
    };
  }

  handleTouch(x, y) {
    if (this.resumeBtn) {
      const b = this.resumeBtn;
      if (x >= b.x && x <= b.x + b.width && y >= b.y && y <= b.y + b.height) {
        return 'resume';
      }
    }
    if (this.restartBtn) {
      const b = this.restartBtn;
      if (x >= b.x && x <= b.x + b.width && y >= b.y && y <= b.y + b.height) {
        return 'restart';
      }
    }
    return null;
  }

  render(ctx) {
    if (!this.visible) return;

    ctx.fillStyle = 'rgba(10, 8, 20, 0.88)';
    ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);

    ctx.fillStyle = '#ffe9b0';
    ctx.font = 'bold 32px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('游戏暂停', SCREEN_WIDTH / 2, SCREEN_HEIGHT * 0.28);
    ctx.textAlign = 'left';

    const drawBtn = (btn, text, bgColor, textColor) => {
      ctx.fillStyle = bgColor;
      ctx.beginPath();
      ctx.roundRect(btn.x, btn.y, btn.width, btn.height, 24);
      ctx.fill();

      ctx.fillStyle = textColor;
      ctx.font = 'bold 18px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(text, btn.x + btn.width / 2, btn.y + btn.height / 2 + 6);
      ctx.textAlign = 'left';
    };

    drawBtn(this.resumeBtn, '继续游戏', '#6ecf6e', '#1a3a1a');
    drawBtn(this.restartBtn, '返回梳妆台', '#ffb84d', '#4a2c08');

    ctx.fillStyle = '#8d7fb8';
    ctx.font = '13px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('点击按钮继续', SCREEN_WIDTH / 2, SCREEN_HEIGHT * 0.82);
    ctx.textAlign = 'left';
  }
}
