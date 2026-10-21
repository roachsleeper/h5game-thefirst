let instance;

export default class Music {
  startBgmAudio = wx.createInnerAudioContext();
  gameBgmAudio = wx.createInnerAudioContext();
  skillShieldAudio = wx.createInnerAudioContext();
  skillBlastAudio = wx.createInnerAudioContext();
  hitAudio = wx.createInnerAudioContext();
  attackHeiAudio = wx.createInnerAudioContext();
  attackHaAudio = wx.createInnerAudioContext();

  constructor() {
    if (instance) return instance;
    instance = this;

    this.startBgmAudio.loop = true;
    this.gameBgmAudio.loop = true;
    this.startBgmAudio.src = 'audio/bgm_start.wav';
    this.gameBgmAudio.src = 'audio/bgm_game.wav';
    this.skillShieldAudio.src = 'audio/skill_shield.wav';
    this.skillBlastAudio.src = 'audio/skill_blast.wav';
    this.hitAudio.src = 'audio/hit.wav';
    this.attackHeiAudio.src = 'audio/attack_hei.wav';
    this.attackHaAudio.src = 'audio/attack_ha.wav';
    this.hitAudio.volume = 0.58;
    this.attackHeiAudio.volume = 1;
    this.attackHaAudio.volume = 1;
    this.activeBgm = null;
    this.attackVoiceIndex = 0;

    this.playStartBgm();
  }

  switchBgm(nextBgm) {
    if (this.activeBgm === nextBgm) {
      nextBgm.play();
      return;
    }

    if (this.activeBgm) {
      this.activeBgm.pause();
      this.activeBgm.currentTime = 0;
    }

    this.activeBgm = nextBgm;
    nextBgm.play();
  }

  playStartBgm() {
    this.switchBgm(this.startBgmAudio);
  }

  playGameBgm() {
    this.switchBgm(this.gameBgmAudio);
  }

  playOneShot(audio) {
    audio.currentTime = 0;
    audio.play();
  }

  playSkill1() {
    this.playOneShot(this.skillShieldAudio);
  }

  playSkill2() {
    this.playOneShot(this.skillBlastAudio);
  }

  playHit() {
    this.playOneShot(this.hitAudio);
  }

  playAttack() {
    const voice = this.attackVoiceIndex % 2 === 0
      ? this.attackHeiAudio
      : this.attackHaAudio;
    this.attackVoiceIndex++;
    this.playOneShot(voice);
    setTimeout(() => this.playHit(), 35);
  }

  playExplosion() {
    this.playHit();
  }
}
