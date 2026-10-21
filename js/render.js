GameGlobal.canvas = wx.createCanvas();

const windowInfo = wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync();

canvas.width = windowInfo.screenWidth;
canvas.height = windowInfo.screenHeight;

const ctx = canvas.getContext('2d');
ctx.roundRect = function (x, y, w, h, r) {
  if (typeof r === 'number') r = [r, r, r, r];
  if (!Array.isArray(r)) r = [0, 0, 0, 0];
  if (w < 2 * r[0]) r[0] = w / 2;
  if (h < 2 * r[1]) r[1] = h / 2;
  if (w < 2 * r[2]) r[2] = w / 2;
  if (h < 2 * r[3]) r[3] = h / 2;
  this.moveTo(x + r[0], y);
  this.lineTo(x + w - r[1], y);
  this.quadraticCurveTo(x + w, y, x + w, y + r[1]);
  this.lineTo(x + w, y + h - r[2]);
  this.quadraticCurveTo(x + w, y + h, x + w - r[2], y + h);
  this.lineTo(x + r[3], y + h);
  this.quadraticCurveTo(x, y + h, x, y + h - r[3]);
  this.lineTo(x, y + r[0]);
  this.quadraticCurveTo(x, y, x + r[0], y);
  return this;
};

export const SCREEN_WIDTH = windowInfo.screenWidth;
export const SCREEN_HEIGHT = windowInfo.screenHeight;
