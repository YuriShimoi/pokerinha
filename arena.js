class Arena {
  static pokemon = [];
  static attack = [];

  static canvas = null;
  static context = null;
  static attackCanvas = null;
  static attackContext = null;
  
  static inBattle = false;
  static interval = null;

  static onStop = (winner) => {};
  
  static register(pokemon, img, px, py) {
    let newPkm = {
      id: Arena.pokemon.length,
      alive: true,
      name: pokemon.name,
      stats: pokemon.stats.reduce((acc, s) => ({...acc, [s.name.replaceAll('-', '')]:s.base}), {}),
      types: pokemon.types,
      image: img,
      pos: { x: px, y: py },
      direction: Math.round(Math.random() * 4 - 0.5) * 90 + 45,
      cooldown: { }
    }
    newPkm.stats.maxhp = newPkm.stats.hp;
    newPkm.stats.speed *= 1.2;
    Arena.setCooldown(newPkm);

    Arena.pokemon.push(newPkm);
    Arena.draw(newPkm);
  }

  static clear() {
    Arena.context.clearRect(0, 0, Arena.canvas.width, Arena.canvas.height);
    Arena.attackContext.clearRect(0, 0, Arena.attackCanvas.width, Arena.attackCanvas.height);
  }

  static draw(pkm) {
    Arena.context.save();
    if(pkm.alive) {
      Arena.context.fillStyle = '#d13636';
      Arena.context.fillRect(Math.round(pkm.pos.x)+10, Math.round(pkm.pos.y)+62, 40, 4);
      Arena.context.fillStyle = '#36d142';
      let pkmHp = pkm.stats.hp / pkm.stats.maxhp * 40;
      Arena.context.fillRect(Math.round(pkm.pos.x)+10, Math.round(pkm.pos.y)+62, pkmHp, 4);
    }
    else Arena.context.globalAlpha = 0.5;
    Arena.context.drawImage(pkm.image, 3, 0, 34, 30, Math.round(pkm.pos.x), Math.round(pkm.pos.y), 68, 60);
    Arena.context.restore();
  }

  static drawAttack(atk) {
    atk.draw(Arena.attackContext);
  }

  static calcPos(pos, dir, speed) {
    if(speed === 0) return pos;
    let angleRadians = dir * Math.PI / 180;
    let baseSpeed = speed / 35 < 1? 1: speed / 35;
    let newX = pos.x + baseSpeed * Math.cos(angleRadians);
    let newY = pos.y + baseSpeed * Math.sin(angleRadians);

    return { x: newX, y: newY };
  }

  static isOutOfBounds(position) {
    if(Math.round(position.x) < 0) return 3;
    if((Math.round(position.x) + 60) > 480) return 1;
    if(Math.round(position.y) < 0) return 0;
    if((Math.round(position.y) + 60) > 480) return 2;
    return null;
  }

  static bounceDirection(direction, boundary, chaos = 65) {
    let newdir = 0;
    switch(boundary) {
      case 0:
        newdir = ((direction + 90) % 360) > 270? direction - 90: direction + 90;
        break;
      case 1:
        newdir = (direction + 90) > 360? direction - 90: direction + 90;
        break;
      case 2:
        newdir = (direction + 90) > 180? direction + 90: direction - 90;
        break;
      case 3:
        newdir = (direction + 90) > 270? direction + 90: direction - 90;
        break;
    }
    return ((newdir+360) % 360) + ((Math.random() - 0.5) * chaos);
  }

  static setCooldown(pkm) {
    pkm.cooldown.attack = 2500 - pkm.stats.speed * 7;
    pkm.cooldown.time = Date.now() + pkm.cooldown.attack;
    pkm.cooldown.invulnerable = 0;
  }

  static getPokemonByDistance(pos, maxRadius=null) {
    let hits = [];

    for(let pkm of Arena.pokemon) {
      if(!pkm.alive) continue;
      let cPos = {
        x: pkm.pos.x + 32,
        y: pkm.pos.y + 30
      };
      let distance = Math.sqrt(Math.pow(pos.x - cPos.x, 2) + Math.pow(pos.y - cPos.y, 2));
      if(maxRadius === null || distance <= (maxRadius + 20)) {
        hits.push({ distance: distance, pokemon: pkm });
      }
    }
    return hits.sort((a, b) => a.distance - b.distance).map(hit => hit.pokemon);
  }

  static angleTo(origin, target) {
    const dx = Math.round((target.x - origin.x) * 1000000) / 1000000;
    const dy = Math.round((target.y - origin.y) * 1000000) / 1000000;
    
    const angleRadians = Math.atan2(dy, dx);
    let angleDegrees = angleRadians * (180 / Math.PI);
    
    if (angleDegrees < 0) {
        angleDegrees += 360;
    }
    
    return Math.round(angleDegrees);
}

  static tryAttack(pkm) {
    if(pkm.cooldown.time <= Date.now()) {
      let centeredPosition = {
        x: pkm.pos.x + 32,
        y: pkm.pos.y + 30
      };

      let closest = Arena.getPokemonByDistance(centeredPosition, 200)[1];
      if(!closest) return;

      let aimDir = Arena.angleTo(pkm.pos, closest.pos) + Math.round(Math.random()*60-30);
      aimDir = aimDir < 0? aimDir+360: aimDir > 360? aimDir-360: aimDir;

      let atkType = pkm.types[Math.round(Math.random()*(pkm.types.length - 1))];
      let dmgType = Number(pkm.stats.attack < pkm.stats.specialattack);
      let newAtk = AttackLib[atkType].copy();
      newAtk.parent = pkm.id;
      newAtk.lifeTime += Date.now();
      newAtk.direction = aimDir;
      newAtk.pos = centeredPosition;
      newAtk.damage = {
        type: atkType,
        dmgType: dmgType,
        amount: Math.ceil([pkm.stats.attack, pkm.stats.specialattack][dmgType])
      };

      Arena.attack.push(newAtk);
      pkm.cooldown.time = Date.now() + pkm.cooldown.attack;
    }
  }

  static start() {
    Arena.inBattle = true;
    clearInterval(Arena.interval);
    
    Arena.interval = setInterval(() => {
      Arena.clear();
      for(let a=0; a < Arena.attack.length; a++) {
        let atk = Arena.attack[a];

        if(atk.lifeTime <= Date.now()) {
          Arena.attack.splice(a, 1);
          a--;
          continue;
        }
        atk.pos = Arena.calcPos(atk.pos, atk.direction, atk.speed);

        let hitTargets = Arena.getPokemonByDistance(atk.pos, atk.radius);
        for(let pkm of hitTargets) {
          if(pkm.id !== atk.parent && pkm.alive && pkm.cooldown.invulnerable < Date.now()) {
            const multiplier = Calculator.typeMultiplier(atk.damage.type, pkm.types);
            let defense = [pkm.stats.defense, pkm.stats.specialdefense][atk.damage.dmgType];
            let damage = (atk.damage.amount * multiplier) - defense;
            pkm.stats.hp -= damage <= 0? 1: damage;
            if(pkm.stats.hp <= 0) {
              pkm.stats.hp = 0;
              pkm.alive = false;
            }
            else {
              pkm.cooldown.invulnerable = Date.now() + 1000;
            }
          }
        }

        Arena.drawAttack(atk);
      }

      for(let pkm of Arena.pokemon) {
        if(pkm.alive) {
          let newpos = Arena.calcPos(pkm.pos, pkm.direction, pkm.stats.speed);
          let boundary = Arena.isOutOfBounds(newpos);
          if(boundary !== null) {
            if(Math.random()*100 < 20) {
              let closest = Arena.getPokemonByDistance(pkm.pos, 1200)[1];
              pkm.direction = Arena.angleTo(pkm.pos, closest.pos);
            }
            else {
              pkm.direction = Arena.bounceDirection(pkm.direction, boundary);
            }
          }
          else {
            pkm.pos = newpos;
          }
  
          Arena.tryAttack(pkm);
        }
        Arena.draw(pkm);
      }

      if(Arena.pokemon.filter(p => p.alive).length === 1) {
        Arena.callEnd();
        Arena.inBattle = false;
      }

      if(!Arena.inBattle) {
        clearInterval(Arena.interval);
      }
    }, 1000/60);
  }

  static callEnd() {
    if(Arena.inBattle) {
      Arena.onStop(Arena.pokemon.find(pkm => pkm.alive));
    }
  }
}

class Calculator {
  static typeMultiplier(atkType, defTypes) {
    let mult = 1;
    switch(atkType) {
      case 'normal':
        if(defTypes.includes('ghost')) return 0;
        if(defTypes.includes('rock')) mult *= 0.5;
        if(defTypes.includes('steel')) mult *= 0.5;
        break;
      case 'fire':
        if(defTypes.includes('fire')) mult *= 0.5;
        if(defTypes.includes('water')) mult *= 0.5;
        if(defTypes.includes('rock')) mult *= 0.5;
        if(defTypes.includes('dragon')) mult *= 0.5;
        if(defTypes.includes('grass')) mult *= 2;
        if(defTypes.includes('ice')) mult *= 2;
        if(defTypes.includes('bug')) mult *= 2;
        if(defTypes.includes('steel')) mult *= 2;
        break;
      case 'water':
        if(defTypes.includes('water')) mult *= 0.5;
        if(defTypes.includes('grass')) mult *= 0.5;
        if(defTypes.includes('dragon')) mult *= 0.5;
        if(defTypes.includes('fire')) mult *= 2;
        if(defTypes.includes('ground')) mult *= 2;
        if(defTypes.includes('rock')) mult *= 2;
        break;
      case 'grass':
        if(defTypes.includes('fire')) mult *= 0.5;
        if(defTypes.includes('grass')) mult *= 0.5;
        if(defTypes.includes('poison')) mult *= 0.5;
        if(defTypes.includes('flying')) mult *= 0.5;
        if(defTypes.includes('bug')) mult *= 0.5;
        if(defTypes.includes('dragon')) mult *= 0.5;
        if(defTypes.includes('steel')) mult *= 0.5;
        if(defTypes.includes('water')) mult *= 2;
        if(defTypes.includes('ground')) mult *= 2;
        if(defTypes.includes('rock')) mult *= 2;
        break;
      case 'electric':
        if(defTypes.includes('ground')) return 0;
        if(defTypes.includes('grass')) mult *= 0.5;
        if(defTypes.includes('electric')) mult *= 0.5;
        if(defTypes.includes('dragon')) mult *= 0.5;
        if(defTypes.includes('water')) mult *= 2;
        if(defTypes.includes('flying')) mult *= 2;
        break;
      case 'ice':
        if(defTypes.includes('fire')) mult *= 0.5;
        if(defTypes.includes('water')) mult *= 0.5;
        if(defTypes.includes('ice')) mult *= 0.5;
        if(defTypes.includes('steel')) mult *= 0.5;
        if(defTypes.includes('grass')) mult *= 2;
        if(defTypes.includes('ground')) mult *= 2;
        if(defTypes.includes('flying')) mult *= 2;
        if(defTypes.includes('dragon')) mult *= 2;
        break;
      case 'fighting':
        if(defTypes.includes('ghost')) return 0;
        if(defTypes.includes('poison')) mult *= 0.5;
        if(defTypes.includes('flying')) mult *= 0.5;
        if(defTypes.includes('psychic')) mult *= 0.5;
        if(defTypes.includes('bug')) mult *= 0.5;
        if(defTypes.includes('fairy')) mult *= 0.5;
        if(defTypes.includes('normal')) mult *= 2;
        if(defTypes.includes('ice')) mult *= 2;
        if(defTypes.includes('rock')) mult *= 2;
        if(defTypes.includes('dark')) mult *= 2;
        if(defTypes.includes('steel')) mult *= 2;
        break;
      case 'poison':
        if(defTypes.includes('steel')) return 0;
        if(defTypes.includes('poison')) mult *= 0.5;
        if(defTypes.includes('ground')) mult *= 0.5;
        if(defTypes.includes('rock')) mult *= 0.5;
        if(defTypes.includes('ghost')) mult *= 0.5;
        if(defTypes.includes('grass')) mult *= 2;
        if(defTypes.includes('fairy')) mult *= 2;
        break;
      case 'ground':
        if(defTypes.includes('flying')) return 0;
        if(defTypes.includes('grass')) mult *= 0.5;
        if(defTypes.includes('bug')) mult *= 0.5;
        if(defTypes.includes('fire')) mult *= 2;
        if(defTypes.includes('ice')) mult *= 2;
        if(defTypes.includes('rock')) mult *= 2;
        if(defTypes.includes('steel')) mult *= 2;
        break;
      case 'flying':
        if(defTypes.includes('electric')) mult *= 0.5;
        if(defTypes.includes('rock')) mult *= 0.5;
        if(defTypes.includes('steel')) mult *= 0.5;
        if(defTypes.includes('grass')) mult *= 2;
        if(defTypes.includes('fighting')) mult *= 2;
        if(defTypes.includes('bug')) mult *= 2;
        break;
      case 'psychic':
        if(defTypes.includes('dark')) return 0;
        if(defTypes.includes('psychic')) mult *= 0.5;
        if(defTypes.includes('steel')) mult *= 0.5;
        if(defTypes.includes('fighting')) mult *= 2;
        if(defTypes.includes('poison')) mult *= 2;
        break;
      case 'bug':
        if(defTypes.includes('fire')) mult *= 0.5;
        if(defTypes.includes('fighting')) mult *= 0.5;
        if(defTypes.includes('poison')) mult *= 0.5;
        if(defTypes.includes('flying')) mult *= 0.5;
        if(defTypes.includes('ghost')) mult *= 0.5;
        if(defTypes.includes('steel')) mult *= 0.5;
        if(defTypes.includes('fairy')) mult *= 0.5;
        if(defTypes.includes('grass')) mult *= 2;
        if(defTypes.includes('psychic')) mult *= 2;
        if(defTypes.includes('dark')) mult *= 2;
        break;
      case 'rock':
        if(defTypes.includes('fighting')) mult *= 0.5;
        if(defTypes.includes('ground')) mult *= 0.5;
        if(defTypes.includes('steel')) mult *= 0.5;
        if(defTypes.includes('fire')) mult *= 2;
        if(defTypes.includes('ice')) mult *= 2;
        if(defTypes.includes('flying')) mult *= 2;
        if(defTypes.includes('bug')) mult *= 2;
        break;
      case 'ghost':
        if(defTypes.includes('normal')) return 0;
        if(defTypes.includes('dark')) mult *= 0.5;
        if(defTypes.includes('psychic')) mult *= 2;
        if(defTypes.includes('ghost')) mult *= 2;
        break;
      case 'dragon':
        if(defTypes.includes('fairy')) return 0;
        if(defTypes.includes('steel')) mult *= 0.5;
        if(defTypes.includes('dragon')) mult *= 2;
        break;
      case 'dark':
        if(defTypes.includes('fighting')) mult *= 0.5;
        if(defTypes.includes('dark')) mult *= 0.5;
        if(defTypes.includes('fairy')) mult *= 0.5;
        if(defTypes.includes('psychic')) mult *= 2;
        if(defTypes.includes('ghost')) mult *= 2;
        break;
      case 'steel':
        if(defTypes.includes('fire')) mult *= 0.5;
        if(defTypes.includes('water')) mult *= 0.5;
        if(defTypes.includes('electric')) mult *= 0.5;
        if(defTypes.includes('steel')) mult *= 0.5;
        if(defTypes.includes('ice')) mult *= 2;
        if(defTypes.includes('rock')) mult *= 2;
        if(defTypes.includes('fairy')) mult *= 2;
        break;
      case 'fairy':
        if(defTypes.includes('fire')) mult *= 0.5;
        if(defTypes.includes('poison')) mult *= 0.5;
        if(defTypes.includes('steel')) mult *= 0.5;
        if(defTypes.includes('fighting')) mult *= 2;
        if(defTypes.includes('dragon')) mult *= 2;
        if(defTypes.includes('dark')) mult *= 2;
        break;
    }
    return mult;
  }
}

class Attack {
  static draw_collision = false;

  constructor(parent, pos, direction, speed, damage, lifeTime, radius, emitters=[]) {
    this.parent = parent;

    this.pos = pos;
    this.initialPos = null;
    this.direction = direction;
    this.speed = speed;

    this.damage = damage?? {};
    this.lifeTime = lifeTime;
    this.radius = radius;

    this.delta = 0;
    this.emitters = emitters.map(emt => new emt());
    this.emittersRegister = [...emitters];
  }

  copy() {
    return new Attack(
      this.parent,
      {...this.pos},
      this.direction,
      this.speed,
      this.damage,
      this.lifeTime,
      this.radius,
      this.emittersRegister
    );
  }

  draw(context) {
    if(this.initialPos === null) this.initialPos = {...this.pos};

    // since attack canvas is half the size of pokemon canvas
    let halfPos = {
      x: this.pos.x/2,
      y: this.pos.y/2
    };

    let halfInitPos = {
      x: Math.round(this.initialPos.x/2),
      y: Math.round(this.initialPos.y/2)
    };
    
    if(Attack.draw_collision) {
      context.fillStyle = '#ff000033';
      context.beginPath();
      context.arc(halfPos.x, halfPos.y, this.radius/2, 0 , 2 * Math.PI);
      context.fill();
    }
    for(let emitter of this.emitters) {
      emitter.draw(context, halfPos, halfInitPos, this.direction, this.delta++);
    }
  }
}

const AttackLib = {
  'normal': new Attack(0, {x:0, y:0}, 0, 80, null, 1600, 20, [PE.normal]),
  'fire': new Attack(0, {x:0, y:0}, 0, 55, null, 1800, 20, [PE.fire]),
  'water': new Attack(0, {x:0, y:0}, 0, 50, null, 2200, 20, [PE.water]),
  'grass': new Attack(0, {x:0, y:0}, 0, 50, null, 1800, 20, [PE.grass]),
  'electric': new Attack(0, {x:0, y:0}, 0, 100, null, 1400, 15, [PE.electric]),
  'ice': new Attack(0, {x:0, y:0}, 0, 80, null, 1500, 15, [PE.ice]),
  'fighting': new Attack(0, {x:0, y:0}, 0, 60, null, 2000, 30, [PE.fighting]),
  'poison': new Attack(0, {x:0, y:0}, 0, 50, null, 1900, 20, [PE.poison]),
  'ground': new Attack(0, {x:0, y:0}, 0, 0, null, 400, 85, [PE.ground]),
  'flying': new Attack(0, {x:0, y:0}, 0, 110, null, 1100, 20, [PE.flying]),
  'psychic': new Attack(0, {x:0, y:0}, 0, 70, null, 1600, 22, [PE.psychic]),
  'bug': new Attack(0, {x:0, y:0}, 0, 100, null, 1200, 12, [PE.bug]),
  'rock': new Attack(0, {x:0, y:0},  0, 80, null, 1400, 15, [PE.rock]),
  'ghost': new Attack(0, {x:0, y:0}, 0, 0, null, 1000, 70, [PE.ghost]),
  'dragon': new Attack(0, {x:0, y:0}, 0, 120, null, 1200, 15, [PE.dragon]),
  'dark': new Attack(0, {x:0, y:0}, 0, 70, null, 1700, 23, [PE.dark]),
  'steel': new Attack(0, {x:0, y:0}, 0, 80, null, 1600, 20, [PE.normal]),
  'fairy': new Attack(0, {x:0, y:0}, 0, 70, null, 1600, 22, [PE.fairy])
};