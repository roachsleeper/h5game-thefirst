let instance;

export default class DataBus {
  monsters = [];
  projectiles = [];
  attackEffects = [];
  skillEffects = [];
  frame = 0;
  isGameOver = false;
  isPaused = false;
  isStarted = false;
  timeLeft = 90;

  constructor() {
    if (instance) return instance;
    instance = this;
  }

  reset() {
    this.monsters = [];
    this.projectiles = [];
    this.attackEffects = [];
    this.skillEffects = [];
    this.frame = 0;
    this.isGameOver = false;
    this.isPaused = false;
    this.timeLeft = 90;
  }

  gameOver() {
    this.isGameOver = true;
  }
}
