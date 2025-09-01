Combat-Only Technical Requirements (Phaser + TypeScript)



이 문서는 핵심 전투 로직만 구현하기 위한 \*\*명세서(MD)\*\*입니다.

Claude Code/VSCode에 그대로 전달하여 프로젝트를 생성·구현하세요.

(성장/장비/정령/저장/경제/보스/오프라인 보상 등 비전투 요소는 모두 제외)



0\. 범위(Scope)



필수: 자동 전진 카메라, 적 스폰, 타깃팅, 투사체 발사, 피격/사망, 간단한 HUD(DPS/HP), 최소 충돌 판정.



비포함: 인벤토리/가챠/강화/정령/보스/스테이지 UI/저장.



목표 FPS: 데스크톱/모바일 웹 60fps(저사양 30fps 허용).



1\. 기술 스택 / 런타임



언어: TypeScript



엔진: Phaser 3 (Arcade Physics)



번들러: Vite



Node: LTS v18+



2\. 프로젝트 생성 스크립트

npm create vite@latest webgame-combat -- --template vanilla-ts

cd webgame-combat

npm i

npm i phaser



3\. 디렉터리 구조 (전투에 필요한 최소)

webgame-combat/

├─ index.html

├─ src/

│  ├─ main.ts

│  ├─ scenes/

│  │  └─ GameScene.ts

│  ├─ systems/

│  │  ├─ SpawnSystem.ts

│  │  ├─ CombatSystem.ts

│  │  └─ UISystem.ts

│  ├─ types/

│  │  └─ combat.d.ts

│  └─ const/

│     └─ balance.ts

├─ tsconfig.json

├─ vite.config.ts

└─ package.json



4\. 전투 핵심 요구사항

4.1 카메라/월드



카메라는 오른쪽(+x)으로 등속 스크롤한다.



camera.scrollX += RUN\_SPEED \* dt;



플레이어는 화면 좌측 35% 지점에 고정(x는 카메라 기준 고정, y만 지상선 위 고정).



배경은 단색 또는 1~2 레이어 파랄랙스(선택). 성능에 영향 없도록 단순 구현.



4.2 플레이어



스탯: atk, as, crit, critMul, hp, def (초기값은 balance.ts 참조)



이동: 실제 좌표는 카메라 기준 고정, 물리 바디 필요 없음(충돌은 투사체/적만).



사망: hp <= 0이면 사망 상태로 전환, 1초 후 자동 리스폰(HP 풀 충전, 카메라 좌표 유지).



4.3 적(Enemies)



적은 화면 우측 외곽에서 스폰되어 좌측(-x)으로 이동한다.



종류는 1종으로 시작: hp, def, speed, contactDamage



화면 밖 좌측으로 벗어나면 제거.



피격 시 데미지 수치 이펙트(텍스트) 0.3s 떠오름(선택).



4.4 스폰(Spawn)



SpawnSystem이 \*\*고정 간격(기본 1.6초)\*\*으로 적을 스폰한다.



스폰 밀도는 현재 경과 시간에 따라 소폭 증가(최대치 제한).



동시 적 수 상한: 20마리. 상한 도달 시 스폰 일시 정지.



4.5 타깃팅(Targeting)



CombatSystem은 화면 내에서 가장 가까운 적을 1마리 선택한다.



타깃이 없으면 발사하지 않는다.



4.6 공격/투사체(Projectile)



공격 주기: period = 1 / as



발사 시



풀에서 투사체를 가져와 타깃 방향으로 속도를 설정.



투사체는 충돌 시 단일 적에게만 피해를 주고 즉시 소멸.



투사체 최대 동시 수 상한: 30 (풀링 사용).



4.7 피해 공식(Damage Formula)



raw = max(1, atk \* skillMul - enemyDef)



치명타: 확률 crit, 배수 critMul → damage = floor( raw \* (isCrit ? critMul : 1) )



플레이어→적만 구현(적의 원거리 공격 없음). 접촉 시 플레이어가 contactDamage만큼 피해.



4.8 HUD (최소)



HP Bar(플레이어)



DPS 표시: 최근 3초 평균(이동 평균)



적 카운트: 현재 필드 내 적 수



5\. 데이터/상수 (balance.ts)

export const RUN\_SPEED = 90;        // 카메라 스크롤 속도(px/s)

export const SPAWN\_INTERVAL\_BASE = 1.6;

export const SPAWN\_INTERVAL\_MIN = 0.9;

export const MAX\_ENEMIES = 20;

export const PROJECTILE\_SPEED = 420;

export const MAX\_PROJECTILES = 30;



export const PLAYER\_BASE = {

&nbsp; atk: 12, as: 1.8, crit: 0.15, critMul: 2.0, hp: 120, def: 2

};



export const ENEMY\_BASE = {

&nbsp; hp: 40, def: 1, speed: 55, contactDamage: 8

};



6\. 타입/인터페이스 (types/combat.d.ts)

export type StatBlock = {

&nbsp; atk: number; as: number; crit: number; critMul: number;

&nbsp; hp: number; def: number;

};



export type Enemy = {

&nbsp; sprite: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;

&nbsp; hp: number; def: number; speed: number; contactDamage: number;

};



export type Projectile = Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;



export type DamageEvent = {

&nbsp; amount: number; crit: boolean; target: Enemy;

};



7\. 시스템 사양

7.1 SpawnSystem.ts



책임



적 풀 관리/스폰 타이밍/상한 관리/화면 외 제거.



공용 API



class SpawnSystem {

&nbsp; constructor(scene: Phaser.Scene, enemies: Phaser.Physics.Arcade.Group);

&nbsp; update(dt: number): void;

}





동작



내부 타이머 t += dt, interval = clamp(SPAWN\_INTERVAL\_BASE - time\*0.002, SPAWN\_INTERVAL\_MIN, SPAWN\_INTERVAL\_BASE)



enemies.countActive(true) < MAX\_ENEMIES일 때만 스폰.



스폰 위치: (camera.worldView.right + 32, groundY)



7.2 CombatSystem.ts



책임



타깃 선택, 공격 주기, 투사체 풀/발사, 충돌 시 피해 계산, DPS 집계.



공용 API



class CombatSystem {

&nbsp; constructor(

&nbsp;   scene: Phaser.Scene,

&nbsp;   playerStats: StatBlock,

&nbsp;   projectiles: Phaser.Physics.Arcade.Group,

&nbsp;   enemies: Phaser.Physics.Arcade.Group

&nbsp; );

&nbsp; update(dt: number): void;

&nbsp; getDPS(): number; // 최근 3초 평균 DPS

}





내부 규칙



매 프레임 타깃 탐색(화면 안 + 활성). 최단 거리 1체.



attackTimer >= 1/as면 발사 → 투사체 속도 PROJECTILE\_SPEED.



충돌 시 calcDamage(playerStats, enemy.def) 적용, 적 hp<=0 → 제거.



DPS 계산: 최근 3초 동안 누적 피해 / 3.



유틸



export function calcDamage(attacker: StatBlock, enemyDef: number, skillMul=1): number;



7.3 UISystem.ts



책임



HP Bar, DPS Text, Enemy Count Text



공용 API



class UISystem {

&nbsp; constructor(scene: Phaser.Scene, combat: CombatSystem, playerStats: StatBlock, enemies: Phaser.Physics.Arcade.Group);

&nbsp; update(): void; // 텍스트/바 갱신

}



8\. GameScene 요구사항 (단일 씬)



preload



도형 텍스처 2종 생성: player, enemy, projectile (generateTexture or graphics)



create



물리 세계(중력 0)



groups: enemies, projectiles (max size 사전 설정)



systems 생성: spawn, combat, ui



플레이어 스탯 초기화, HP 세팅



colliders:



projectiles vs enemies → onHit: 피해 적용/투사체 소멸



playerBody(선택) vs enemies → 접촉 피해 적용



update(time, delta)



camera.scrollX += RUN\_SPEED \* dt



spawn.update(dt), combat.update(dt), ui.update()



좌측 화면 밖 적/투사체 제거(성능 정리)



9\. 수락 기준(Acceptance Criteria)



게임 실행 시 플레이어가 입력 없이 화면 좌측 35% 지점에서 고정되고, 카메라는 우측으로 지속 전진한다.



적이 1.6초 간격(최소 0.9초)으로 우측에서 등장해 좌측으로 이동한다. 동시 적 수는 20을 넘지 않는다.



타깃이 화면 안에 있을 때, 플레이어는 초당 AS회의 주기로 투사체를 발사한다.



투사체는 충돌 시 한 적에게만 피해를 주고 즉시 소멸한다.



데미지는 max(1, atk\*skillMul - def)에 치명타 확률/배수가 반영되어 계산된다.



적 체력이 0 이하가 되면 즉시 제거된다.



HUD에 플레이어 HP, 최근 3초 평균 DPS, 현재 적 수가 표시된다.



60초 이상 방치해도 프리즈/메모리 누수가 관찰되지 않는다(객체 풀 재사용).



10\. 성능/품질 가이드



풀링: 적/투사체는 Group의 createMultiple 또는 커스텀 풀 사용. destroy() 대신 비활성화/재사용.



Draw Call 최소화: 단색/간단 텍스처 사용, 텍스트 업데이트 빈도 제한(0.2s 간격).



물리 충돌: Arcade AABB만 사용, 투사체 vs 적만 체크(원형/다각형 충돌 금지).



11\. 디버그 옵션



?debug=1 쿼리로



물리 debug=true



스폰 간격/상한 값을 HUD에 표시



12\. 실행/빌드

npm run dev      # http://localhost:5173

npm run build    # dist/ 산출

npm run preview



13\. 구현 체크리스트 (Claude Code용 TODO)



&nbsp;Vite + TS + Phaser 설치 및 부트스트랩



&nbsp;balance.ts 상수 정의



&nbsp;types/combat.d.ts 인터페이스 정의



&nbsp;SpawnSystem.ts 작성: 타이머, 상한, 화면 밖 정리



&nbsp;CombatSystem.ts 작성: 타깃팅, 발사, 충돌, 피해, DPS



&nbsp;UISystem.ts 작성: HP/DPS/적 수 HUD



&nbsp;GameScene.ts 작성: preload/create/update, 카메라 전진



&nbsp;main.ts/index.html 최소 골격



&nbsp;성능 검증(60초 방치), 디버그 옵션



14\. 후속 확장(비구현, 인터페이스만 고려)



보스 게이트(제한시간), 장비/스킬, 환생/스테이지, 저장: 본 명세 범위 외.



본 전투 골격 위에 시스템을 모듈로 추가할 수 있도록 의존 방향은

Scene → Systems(Spawn/Combat/UI)로 유지.

