const $arena = document.getElementById('arena');
const $attackArena = document.getElementById('attack-arena');

Arena.canvas = $arena;
Arena.context = $arena.getContext('2d');
Arena.context.imageSmoothingEnabled = false;

Arena.attackCanvas = $attackArena;
Arena.attackContext = $attackArena.getContext('2d');
Arena.attackContext.imageSmoothingEnabled = false;

const $clock = document.getElementById('clock');
const $attack = document.getElementById('attack');
const $direction = document.getElementById('direction');

let clockInterval = null;

for(let atk in AttackLib) {
  let option = document.createElement('OPTION');
  option.innerHTML = atk;
  option.value = atk;
  $attack.appendChild(option);
}

function resetClockUpdate() {
  clearInterval(clockInterval);

  clockInterval = setInterval(() => {
    let newAtk = AttackLib[$attack.value].copy();
    newAtk.lifeTime += Date.now();
    newAtk.direction = Number($direction.value);
    newAtk.pos = { x: 240, y: 240 };
    Arena.attack.push(newAtk);
  }, Number($clock.value));

  Arena.start();
}

resetClockUpdate();