export const RUN_SPEED = 90;        // 카메라 스크롤 속도(px/s)
export const SPAWN_INTERVAL_BASE = 1.6;
export const SPAWN_INTERVAL_MIN = 0.9;
export const MAX_ENEMIES = 20;
export const PROJECTILE_SPEED = 420;
export const MAX_PROJECTILES = 30;

export const PLAYER_BASE = {
  atk: 12, 
  as: 1.8, 
  crit: 0.15, 
  critMul: 2.0, 
  hp: 120, 
  def: 2
};

export const ENEMY_BASE = {
  hp: 40, 
  def: 1, 
  speed: 55, 
  contactDamage: 8
};