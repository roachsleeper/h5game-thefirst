import { SCREEN_WIDTH, SCREEN_HEIGHT } from '../render.js';

const SCENE_COUNT = 5;

export default class Scene {
  constructor() {
    this.bgImages = [];
    this.groundY = SCREEN_HEIGHT * 0.75;
    this.cameraX = 0;
    this.worldWidth = SCREEN_WIDTH * SCENE_COUNT;
    this.scenes = [];
    this.loadScenes();
  }

  loadScenes() {
    const colors = [
      { sky: '#1a1e2c', ground: '#2d3449', stars: true },
      { sky: '#2c1a1e', ground: '#493436', stars: true },
      { sky: '#1a2c1e', ground: '#2d4934', stars: false },
      { sky: '#1e1a2c', ground: '#362d49', stars: true },
      { sky: '#1a2c2c', ground: '#2d4945', stars: false },
    ];

    const treeColors = ['#2a5a3a', '#3a6a4a', '#1a4a2a'];
    const buildingColors = ['#4a5a7a', '#5a6a8a', '#3a4a6a'];

    for (let i = 0; i < SCENE_COUNT; i++) {
      const scene = {
        x: i * SCREEN_WIDTH,
        width: SCREEN_WIDTH,
        color: colors[i % colors.length],
        trees: [],
        buildings: [],
        items: [],
      };

      const treeCount = 2 + Math.floor(Math.random() * 3);
      for (let t = 0; t < treeCount; t++) {
        scene.trees.push({
          x: scene.x + 60 + Math.random() * (SCREEN_WIDTH - 160),
          height: 40 + Math.random() * 40,
          color: treeColors[Math.floor(Math.random() * treeColors.length)],
        });
      }

      const buildingCount = Math.random() < 0.5 ? 1 + Math.floor(Math.random() * 2) : 0;
      for (let b = 0; b < buildingCount; b++) {
        scene.buildings.push({
          x: scene.x + 80 + Math.random() * (SCREEN_WIDTH - 200),
          width: 50 + Math.random() * 40,
          height: 60 + Math.random() * 50,
          color: buildingColors[Math.floor(Math.random() * buildingColors.length)],
        });
      }

      scene.items.push({
        x: scene.x + SCREEN_WIDTH * 0.3 + Math.random() * SCREEN_WIDTH * 0.4,
        type: Math.random() < 0.5 ? 'chest' : 'sign',
      });

      this.scenes.push(scene);
    }
  }

  getSceneIndexAtWorldX(worldX) {
    return Math.max(0, Math.min(SCENE_COUNT - 1, Math.floor(worldX / SCREEN_WIDTH)));
  }

  getCurrentScene(worldX) {
    return this.scenes[this.getSceneIndexAtWorldX(worldX)];
  }

  render(ctx, playerWorldX) {
    this.cameraX = Math.max(0, Math.min(playerWorldX - SCREEN_WIDTH / 2, this.worldWidth - SCREEN_WIDTH));
    const sceneIndex = this.getSceneIndexAtWorldX(playerWorldX);
    const scene = this.scenes[sceneIndex];

    const bgGrad = ctx.createLinearGradient(0, 0, 0, SCREEN_HEIGHT);
    bgGrad.addColorStop(0, scene.color.sky);
    bgGrad.addColorStop(1, scene.color.ground);
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);

    if (scene.color.stars) {
      ctx.fillStyle = '#ffffff';
      for (let i = 0; i < 40; i++) {
        const sx = ((i * 173 + sceneIndex * 50) % SCREEN_WIDTH);
        const sy = ((i * 97) % (SCREEN_HEIGHT * 0.4));
        ctx.globalAlpha = 0.4 + 0.3 * Math.sin(i + Date.now() * 0.001);
        ctx.beginPath();
        ctx.arc(sx, sy, 1 + (i % 2), 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }

    for (let i = sceneIndex - 1; i <= sceneIndex + 1; i++) {
      if (i < 0 || i >= SCENE_COUNT) continue;
      const s = this.scenes[i];
      const offsetX = s.x - this.cameraX;

      for (const b of s.buildings) {
        ctx.fillStyle = b.color;
        ctx.fillRect(offsetX + b.x, this.groundY - b.height, b.width, b.height);
        ctx.fillStyle = '#ffd966';
        for (let wy = 0; wy < 3; wy++) {
          for (let wx = 0; wx < 2; wx++) {
            ctx.fillRect(offsetX + b.x + 8 + wx * 20, this.groundY - b.height + 10 + wy * 18, 8, 10);
          }
        }
      }

      for (const t of s.trees) {
        ctx.fillStyle = '#4a3520';
        ctx.fillRect(offsetX + t.x - 5, this.groundY - t.height * 0.4, 10, t.height * 0.4);
        ctx.fillStyle = t.color;
        ctx.beginPath();
        ctx.moveTo(offsetX + t.x, this.groundY - t.height);
        ctx.lineTo(offsetX + t.x - 20, this.groundY - t.height * 0.4);
        ctx.lineTo(offsetX + t.x + 20, this.groundY - t.height * 0.4);
        ctx.closePath();
        ctx.fill();
      }

      for (const item of s.items) {
        const ix = offsetX + item.x;
        if (item.type === 'chest') {
          ctx.fillStyle = '#8a5a2a';
          ctx.fillRect(ix - 12, this.groundY - 16, 24, 16);
          ctx.fillStyle = '#ffd966';
          ctx.fillRect(ix - 3, this.groundY - 12, 6, 8);
        } else {
          ctx.fillStyle = '#6a4a2a';
          ctx.fillRect(ix - 2, this.groundY - 30, 4, 30);
          ctx.fillStyle = '#c8a86a';
          ctx.fillRect(ix - 15, this.groundY - 40, 30, 14);
          ctx.fillStyle = '#4a3520';
          ctx.font = '10px Arial';
          ctx.textAlign = 'center';
          ctx.fillText('!', ix, this.groundY - 30);
          ctx.textAlign = 'left';
        }
      }
    }

    ctx.fillStyle = scene.color.ground;
    ctx.fillRect(0, this.groundY, SCREEN_WIDTH, SCREEN_HEIGHT - this.groundY);
    ctx.fillStyle = 'rgba(255,255,255,0.1)';
    for (let i = 0; i < SCREEN_WIDTH; i += 30) {
      ctx.fillRect(i, this.groundY + 2, 15, 3);
    }

    ctx.fillStyle = '#9aa9d1';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`场景 ${sceneIndex + 1}/${SCENE_COUNT}`, SCREEN_WIDTH / 2, 24);
    ctx.fillText('拖动移动角色', SCREEN_WIDTH / 2, SCREEN_HEIGHT - 16);
    ctx.textAlign = 'left';
  }
}
