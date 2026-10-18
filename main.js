const $arena = document.getElementById('arena');
const $attackarena = document.getElementById('attack-arena');
const $arenaname = document.getElementById('arena-name');

const $pokemonlist = document.getElementById('pokemon-list');
const $winner = document.getElementById('winner-pokemon');
const $winnertitle = document.getElementById('winner-title');
const $ranking = document.getElementById('ranking');

const $nameinput = document.getElementById('name-input');
const $startbtn = document.getElementById('startgame');
const $speedbtn = document.getElementById('speed');

Arena.canvas = $arena;
Arena.context = $arena.getContext('2d');
Arena.context.imageSmoothingEnabled = false;

Arena.attackCanvas = $attackarena;
Arena.attackContext = $attackarena.getContext('2d');
Arena.attackContext.imageSmoothingEnabled = false;

const arenaimg = [
  { name: 'Vazio', src: 'arena/default.png' },
  { name: 'Planície', src: 'arena/grass.png' },
  { name: 'Floresta', src: 'arena/forest.png' },
  { name: 'Montanha', src: 'arena/rock.png' },
  { name: 'Deserto', src: 'arena/sand.png' },
];
let arenaindex = 1;

let pkmList = [];

function pkmDelete(pid) {
  pkmList.splice(pkmList.findIndex(pkm => pkm.id === pid), 1);
  $pokemonlist.querySelector(`.pokemon-container[pid='${pid}']`).remove();
}

function fillDatalist() {
  const $datalist = document.getElementById('hintList');
  POKEMONNAMES.forEach(pkm => {
    const option = document.createElement('OPTION');
    option.value = pkm;
    option.innerHTML = pkm;
    $datalist.appendChild(option);
  });
}

async function addNewPokemon(random=false) {
  let uid = null;
  if(random) {
    // let pmkmax = await PokemonAPI.getPokemonCount();
    let pmkmax = 806; // pokemon that has badge img
    uid = Math.floor(Math.random() * pmkmax) + 1;
  }
  else {
    const name = $nameinput.value.trim().toLowerCase();
    if(!POKEMONNAMES.includes(name)) return inputError();
    uid = name;
  }

  let pokemon = null;
  try {
    pokemon = await PokemonAPI.getPokemon(uid);
  }
  catch {
    return inputError();
  }
  pkmList.push(pokemon);
  $pokemonlist.appendChild(pkmElement(pokemon));
  if(!random) $nameinput.value = '';
}

// shakes the input when the name is unknown or the API didn't answer
function inputError() {
  $nameinput.classList.remove('error');
  void $nameinput.offsetWidth;
  $nameinput.classList.add('error');
}

function pkmElement(pokemon) {
  const pkmDiv = document.createElement('DIV');
  pkmDiv.classList.add('pokemon-container');
  pkmDiv.setAttribute('pid', pokemon.id);

  const pkmInfo = document.createElement('DIV');
  pkmInfo.classList.add('pokemon-info');

  let pkmName = document.createElement('SPAN');
  pkmName.innerHTML = pokemon.name;
  pkmName.classList.add('pkm-name');
  pkmInfo.appendChild(pkmName);
  
  let pkmRmv = document.createElement('BUTTON');
  pkmRmv.classList.add('pkm-remove');
  pkmRmv.onclick = () => pkmDelete(pokemon.id);
  pkmInfo.appendChild(pkmRmv);

  let pkmBackground = document.createElement('DIV');
  pkmBackground.classList.add('pkm-background');
  pkmInfo.appendChild(pkmBackground);

  const pkmStats = pokemon.stats.reduce((acc, s) => ({...acc, [s.name.replaceAll('-', '')]:s.base}), {});
  let pkmHp = document.createElement('SPAN');
  pkmHp.style.width = `${pkmStats.hp/3}px`;
  pkmHp.style.backgroundColor = '#04dd28';
  pkmHp.classList.add('pkm-stats');
  pkmInfo.appendChild(pkmHp);
  let pkmAtk = document.createElement('SPAN');
  pkmAtk.style.width = `${(pkmStats.attack > pkmStats.specialattack?pkmStats.attack: pkmStats.specialattack)/3}px`;
  pkmAtk.style.backgroundColor = '#f51b38';
  pkmAtk.classList.add('pkm-stats');
  pkmInfo.appendChild(pkmAtk);
  let pkmDef = document.createElement('SPAN');
  pkmDef.style.width = `${(pkmStats.defense > pkmStats.specialdefense?pkmStats.defense: pkmStats.specialdefense)/3}px`;
  pkmDef.style.backgroundColor = '#1b81f5';
  pkmDef.classList.add('pkm-stats');
  pkmInfo.appendChild(pkmDef);
  let pkmSpd = document.createElement('SPAN');
  pkmSpd.style.width = `${pkmStats.speed/3}px`;
  pkmSpd.style.backgroundColor = '#fbff05';
  pkmSpd.classList.add('pkm-stats');
  pkmInfo.appendChild(pkmSpd);

  pkmDiv.appendChild(pkmInfo);

  const pkmImg = document.createElement('IMG');
  pkmImg.src = pokemon.sprite.default;
  pkmDiv.appendChild(pkmImg);

  return pkmDiv;
}

async function generatePokemonList(amount=4) {
  if(amount === -1) amount = pkmList.length;

  $pokemonlist.innerHTML = '';
  pkmList = [];

  for(let p=0; p < amount; p++) {
    await addNewPokemon(true);
  }
}

function changeArena(dir=1) {
  arenaindex = arenaindex + dir < 0? arenaimg.length-1: arenaindex + dir >= arenaimg.length? 0: arenaindex + dir;

  $arenaname.innerHTML = arenaimg[arenaindex].name;
  $arena.style.backgroundImage = `url(${arenaimg[arenaindex].src})`;
}

function startBattle() {
  if(pkmList.length < 2) return inputError();
  $winner.setAttribute('hidden', true);

  let loads = pkmList.length;
  Arena.stop();
  Arena.pokemon = [];
  Arena.attack = [];
  Arena.clock = 0;
  $startbtn.disabled = true;

  const checkForLoadings = () => {
    if(--loads > 0) return;
    $startbtn.disabled = false;
    Arena.start();
  };

  for(const pokemon of pkmList) {
    // newer pokemon have no gen-vii icon: fall back to the front sprite, then to MissingNo
    const sources = [pokemon.sprite.icon, pokemon.sprite.default, PokemonAPI.MISSINGNOB64].filter(Boolean);
    const img = document.createElement('IMG');
    img.onload = () => {
      img.dataset.icon = String(img.src === pokemon.sprite.icon);
      let rndPos = [Math.round(Math.random() * 400 + 10), Math.round(Math.random() * 400 + 10)];
      Arena.register(pokemon, img, rndPos[0], rndPos[1]);
      checkForLoadings();
    };
    img.onerror = () => {
      sources.shift();
      if(sources.length) img.src = sources[0];
      else checkForLoadings();
    };
    img.src = sources[0];
  }
}

function endBattle(winner, ranking) {
  $winner.removeAttribute('hidden');
  $winnertitle.innerHTML = winner? 'Vencedor!': 'Empate!';
  const $sprite = $winner.getElementsByClassName('pkm-sprite')[0];
  if(winner) $sprite.src = winner.source.sprite.animated || winner.source.sprite.default;
  $sprite.hidden = !winner;

  // podium: winner first, then in reverse knock-out order
  $ranking.innerHTML = '';
  ranking.slice(0, 3).forEach((entry, i) => {
    const $li = document.createElement('LI');
    const $icon = document.createElement('IMG');
    $icon.src = entry.pokemon.image.src;
    $li.appendChild($icon);
    const $name = document.createElement('SPAN');
    $name.innerHTML = `${i + 1}º ${entry.pokemon.name}`;
    $li.appendChild($name);
    $ranking.appendChild($li);
  });
}

function toggleSpeed() {
  Arena.speed = Arena.speed === 1? 2: 1;
  $speedbtn.innerHTML = `${Arena.speed}x`;
  $speedbtn.classList.toggle('fast', Arena.speed > 1);
}

$arena.style.backgroundImage = `url(${arenaimg[arenaindex].src})`;
generatePokemonList();
fillDatalist();
Arena.onStop = endBattle;