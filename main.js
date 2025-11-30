const $arena = document.getElementById('arena');
const $attackarena = document.getElementById('attack-arena');
const $arenaname = document.getElementById('arena-name');

const $pokemonlist = document.getElementById('pokemon-list');
const $winner = document.getElementById('winner-pokemon');

const $nameinput = document.getElementById('name-input');
const $guessbtn = document.getElementById('guess-btn');

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
  if(random) {
    // let pmkmax = await PokemonAPI.getPokemonCount();
    let pmkmax = 806; // pokemon that has badge img
    let randomUid = Math.round(Math.random() * pmkmax + 1);
    let randomPkm = await PokemonAPI.getPokemon(randomUid);
    pkmList.push(randomPkm);
    $pokemonlist.appendChild(pkmElement(randomPkm));
    return;
  }

  if(!POKEMONNAMES.includes($nameinput.value.toLowerCase())) return;
  let pokemon = await PokemonAPI.getPokemon($nameinput.value.toLowerCase());
  if(pokemon) {
    pkmList.push(pokemon);
    $pokemonlist.appendChild(pkmElement(pokemon));
  }
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
  if(!pkmList.length) return;
  $winner.setAttribute('hidden', true);

  let loads = pkmList.length;
  let pkmimg = [];
  Arena.stop();
  Arena.pokemon = [];
  Arena.attack = [];

  for(let p=0; p < pkmList.length; p++) {
    pkmimg.push(document.createElement('IMG'));
    pkmimg[p].src = pkmList[p].sprite.icon;
    pkmimg[p].onload = () => {
      let rndPos = [Math.round(Math.random() * 400 + 10), Math.round(Math.random() * 400 + 10)];
      Arena.register(pkmList[p], pkmimg[p], rndPos[0], rndPos[1]);
      loads--;
      checkForLoadings();
    };
  }

  const checkForLoadings = () => {
    if(loads > 0) return;
    Arena.start();
  }
}

function endBattle(winner) {
  const pokemon = pkmList.find(pkm => pkm.name === winner.name);
  $winner.removeAttribute('hidden');
  $winner.getElementsByClassName('pkm-sprite')[0].src = pokemon.sprite.animated?? pokemon.sprite.default;
}

$arena.style.backgroundImage = `url(${arenaimg[arenaindex].src})`;
generatePokemonList();
fillDatalist();
Arena.onStop = endBattle;