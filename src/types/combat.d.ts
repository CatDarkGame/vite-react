export type StatBlock = {
  atk: number; 
  as: number; 
  crit: number; 
  critMul: number;
  hp: number; 
  def: number;
};

export type Enemy = {
  sprite: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
  hp: number; 
  def: number; 
  speed: number; 
  contactDamage: number;
};

export type Projectile = Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;

export type DamageEvent = {
  amount: number; 
  crit: boolean; 
  target: Enemy;
};