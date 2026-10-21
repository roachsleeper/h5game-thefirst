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
    const btnW = 220;
    const btnH = 48;
    const centerX = SCREEN_WIDTH / 2 - btnW / 2;
    const panelY = (SCREEN_HEIGHT - 270) / 2;

    this.resumeBtn = {
      x: centerX,
      y: panelY + 112,
      width: btnW,
      height: btnH,
    };

    this.restartBtn = {
      x: centerX,
      y: panelY + 172,
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

    ctx.save();
    ctx.fillStyle = 'rgba(7, 8, 19, 0.86)';
    ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);

    const panelW = 360;
    const panelH = 270;
    const panelX = (SCREEN_WIDTH - panelW) / 2;
    const panelY = (SCREEN_HEIGHT - panelH) / 2;
    const panelGradient = ctx.createLinearGradient(panelX, panelY, panelX, panelY + panelH);
    panelGradient.addColorStop(0, '#202b4a');
    panelGradient.addColorStop(1, '#11182e');
    ctx.fillStyle = panelGradient;
    ctx.beginPath();
    ctx.roundRect(panelX, panelY, panelW, panelH, 20);
    ctx.fill();
    ctx.strokeStyle = 'rgba(237, 189, 107, 0.65)';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = '#ffe9b0';
    ctx.font = 'bold 32px Microsoft YaHei, Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('游戏暂停', SCREEN_WIDTH / 2, panelY + 48);
    ctx.fillStyle = '#aab5d2';
    ctx.font = '14px Microsoft YaHei, Arial';
    ctx.fillText('当前进度已暂停，准备好后继续', SCREEN_WIDTH / 2, panelY + 78);

    const drawBtn = (btn, text, bgColor, textColor) => {
      ctx.fillStyle = bgColor;
      ctx.beginPath();
      ctx.roundRect(btn.x, btn.y, btn.width, btn.height, 24);
      ctx.fill();

      ctx.fillStyle = textColor;
      ctx.font = 'bold 17px Microsoft YaHei, Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(text, btn.x + btn.width / 2, btn.y + btn.height / 2);
    };

    drawBtn(this.resumeBtn, '继续游戏', '#6ecf6e', '#1a3a1a');
    drawBtn(this.restartBtn, '返回首页', '#ffb84d', '#4a2c08');

    ctx.fillStyle = '#8d7fb8';
    ctx.font = '13px Microsoft YaHei, Arial';
    ctx.textAlign = 'center';
    ctx.fillText('按 P 或 Esc 也可以继续游戏', SCREEN_WIDTH / 2, panelY + panelH - 22);
    ctx.restore();
  }
}
