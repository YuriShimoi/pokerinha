class Particle {
  get color() {
    if(!this.colorScheme) return '#ffffff';
    if(typeof this.colorScheme === 'string') return this.colorScheme;
    return this.interpolatedColor();
  }

  constructor(img, pos, direction, speed, size, lifetime, color) {
    this.image = img;
    this.pos = pos;
    this.direction = direction;
    this.speed = speed;
    this.size = size;
    this.lifetime = lifetime;
    this.colorScheme = color;

    this.frame = 0;
  }

  interpolatedColor() {
    return Particle.interpolateColors(this.colorScheme, this.frame, this.lifetime);
  }

  static interpolateColors(colors, time, endTime) {
    let segment = time / endTime * (colors.length - 1);
    let sindex = Math.floor(segment);
    let localT = segment - sindex;
    
    if (sindex >= colors.length - 1) return colors[colors.length - 1];
    
    const colorA = colors[sindex];
    const colorB = colors[sindex + 1];
    
    const part_r = Math.round(parseInt(colorA.slice(1, 3), 16) * (1 - localT) + parseInt(colorB.slice(1, 3), 16) * localT);
    const part_g = Math.round(parseInt(colorA.slice(3, 5), 16) * (1 - localT) + parseInt(colorB.slice(3, 5), 16) * localT);
    const part_b = Math.round(parseInt(colorA.slice(5, 7), 16) * (1 - localT) + parseInt(colorB.slice(5, 7), 16) * localT);
    
    return `#${((1 << 24) + (part_r << 16) + (part_g << 8) + part_b).toString(16).slice(1)}`;
  }
}

class PE {
  static part_img = {};

  static start() {
    let halfmoon = new Image(16, 16);
    halfmoon.src = 'particle/halfmoon.png';
    PE.part_img['halfmoon'] = halfmoon;

    let flame = new Image(16, 16);
    flame.src = 'particle/flame.png';
    PE.part_img['flame'] = flame;
    
    let square = new Image(16, 16);
    square.src = 'particle/square.png';
    PE.part_img['square'] = square;
    
    let circle = new Image(16, 16);
    circle.src = 'particle/circle.png';
    PE.part_img['circle'] = circle;
    
    let bubble = new Image(16, 16);
    bubble.src = 'particle/bubble.png';
    PE.part_img['bubble'] = bubble;
    
    let leaf = new Image(16, 16);
    leaf.src = 'particle/leaf.png';
    PE.part_img['leaf'] = leaf;
    
    let skull = new Image(16, 16);
    skull.src = 'particle/skull.png';
    PE.part_img['skull'] = skull;
    
    let spark = new Image(16, 16);
    spark.src = 'particle/spark.png';
    PE.part_img['spark'] = spark;
    
    let sparkle = new Image(16, 16);
    sparkle.src = 'particle/sparkle.png';
    PE.part_img['sparkle'] = sparkle;
    
    let boulder = new Image(16, 16);
    boulder.src = 'particle/boulder.png';
    PE.part_img['boulder'] = boulder;
    
    let spikes = new Image(16, 16);
    spikes.src = 'particle/spikes.png';
    PE.part_img['spikes'] = spikes;
    
    let sting = new Image(16, 16);
    sting.src = 'particle/sting.png';
    PE.part_img['sting'] = sting;
  }

  static calcDislocation(pos, direction, speed, delta) {
    let dir_radians = direction * (Math.PI / 180);
    
    let disX = Math.cos(dir_radians) * speed * delta;
    let disY = Math.sin(dir_radians) * speed * delta;
    
    return {
      x: Math.round(pos.x + disX),
      y: Math.round(pos.y + disY)
    };
  }

  static get normal() {
    return class ParticleEmitter {
      draw(context, position, initialPos, direction, delta) {
        position = PE.calcDislocation(position, direction, 2, 1);
        context.save();
        context.translate(position.x, position.y);
        context.rotate(direction * Math.PI/180);
        context.translate(-position.x, -position.y);
        context.drawImage(PE.part_img['halfmoon'], 0, 0, 16, 16, position.x-8, position.y-8, 16, 16);
        context.restore();
      }
    };
  }

  static get fire() {
    return class ParticleEmitter {
      draw(context, position, initialPos, direction, delta) {
        if(!this.particleList) this.particleList = [];

        if(delta < 40 && delta%5 == 0) {
          for(let t=0; t < 8; t++) {
            let dirVariancy = Math.random()*20 - 10;
            let posAdjust = PE.calcDislocation(initialPos, direction+dirVariancy, 1, -delta);
            let lifeVariancy = Math.random()*30 - 20;
            this.particleList.push(
              new Particle(
                PE.part_img['square'], posAdjust, direction+dirVariancy,
                1, 16, 80+lifeVariancy,
                ['#ffffec', '#ffc831', '#ff7011', '#d80b0b', '#201f1e']
              )
            );
          }
        }
        
        for(let p=0; p < this.particleList.length; p++) {
          let particle = this.particleList[p];

          const deltaPos = PE.calcDislocation(particle.pos, particle.direction, particle.speed, delta);
          context.save();
          context.drawImage(particle.image, 0, 0, 16, 16, deltaPos.x-8, deltaPos.y-8, particle.size, particle.size);
          context.globalCompositeOperation = 'multiply';
          context.fillStyle = particle.color;
          context.fillRect(deltaPos.x-3, deltaPos.y-3, particle.size-10, particle.size-10);
          context.globalCompositeOperation = 'source-over';
          context.restore();
          
          particle.frame++;
          if(particle.frame > particle.lifetime) {
            this.particleList.splice(p, 1);
            p--;
          }
        }
      }
    };
  }

  static get water() {
    return class ParticleEmitter {
      draw(context, position, initialPos, direction, delta) {
        if(!this.particleList) this.particleList = [];

        if(delta < 50 && delta%8 == 0) {
          for(let t=0; t < 3; t++) {
            let dirVariancy = Math.random()*20 - 10;
            let posAdjust = PE.calcDislocation(initialPos, direction+dirVariancy, 0.95, -delta);
            let lifeVariancy = Math.random()*5;
            this.particleList.push(
              new Particle(
                PE.part_img['bubble'], posAdjust, direction+dirVariancy,
                0.95, 16, 85+lifeVariancy,
                ['#74f3fc', '#ffffff']
              )
            );
          }
        }
        
        for(let p=0; p < this.particleList.length; p++) {
          let particle = this.particleList[p];

          const deltaPos = PE.calcDislocation(particle.pos, particle.direction, particle.speed, delta);
          context.save();
          context.drawImage(particle.image, 0, 0, 16, 16, deltaPos.x-8, deltaPos.y-8, particle.size, particle.size);
          context.globalCompositeOperation = 'source-atop';
          context.fillStyle = particle.color;
          context.fillRect(deltaPos.x-5, deltaPos.y-5, particle.size-6, particle.size-6);
          context.globalCompositeOperation = 'source-over';
          context.restore();
          
          particle.frame++;
          if(particle.frame > particle.lifetime) {
            this.particleList.splice(p, 1);
            p--;
          }
        }
      }
    };
  }

  static get grass() {
    return class ParticleEmitter {
      draw(context, position, initialPos, direction, delta) {
        if(!this.particleList) this.particleList = [];

        if(delta < 30 && delta%4 == 0) {
          for(let t=0; t < 4; t++) {
            let dirVariancy = Math.random()*20 - 10;
            let posAdjust = PE.calcDislocation(initialPos, direction+dirVariancy, 0.9, -delta);
            let lifeVariancy = Math.random()*20 - 10;
            this.particleList.push(
              new Particle(
                PE.part_img['leaf'], posAdjust, direction+dirVariancy,
                0.9, 16, 80+lifeVariancy,
                ['#0bc01a', '#88f747'])
            );
          }
        }
        
        for(let p=0; p < this.particleList.length; p++) {
          let particle = this.particleList[p];

          const deltaPos = PE.calcDislocation(particle.pos, particle.direction, particle.speed, delta);
          context.save();
          context.translate(deltaPos.x, deltaPos.y);
          context.rotate(direction * Math.PI/180);
          context.translate(-deltaPos.x, -deltaPos.y);
          context.drawImage(particle.image, 0, 0, 16, 16, deltaPos.x-8, deltaPos.y-8, particle.size, particle.size);
          context.globalCompositeOperation = 'source-atop';
          context.fillStyle = particle.color;
          context.fillRect(deltaPos.x-6, deltaPos.y-6, particle.size-4, particle.size-4);
          context.globalCompositeOperation = 'source-over';
          context.restore();
          
          particle.frame++;
          if(particle.frame > particle.lifetime) {
            this.particleList.splice(p, 1);
            p--;
          }
        }
      }
    };
  }
  
  static get electric() {
    return class ParticleEmitter {
      draw(context, position, initialPos, direction, delta) {
        if(!this.particleList) this.particleList = [];

        if(delta < 10 && delta%3 == 0) {
          for(let t=0; t < 2; t++) {
            let dirVariancy = Math.random()*10 - 5;
            let posAdjust = PE.calcDislocation(initialPos, direction+dirVariancy, 1.5, -delta);
            let lifeVariancy = -Math.random()*25;
            this.particleList.push(
              new Particle(
                PE.part_img['spark'], posAdjust, direction+dirVariancy,
                1.5, 16, 90+lifeVariancy,
                ['#ffd902', '#feffc7', '#ffd902', '#feffc7']
              )
            );
          }
        }
        
        for(let p=0; p < this.particleList.length; p++) {
          let particle = this.particleList[p];

          const deltaPos = PE.calcDislocation(particle.pos, particle.direction, particle.speed, delta);
          context.save();
          context.translate(deltaPos.x, deltaPos.y);
          context.rotate(direction * Math.PI/180);
          context.translate(-deltaPos.x, -deltaPos.y);
          context.drawImage(particle.image, 0, 0, 16, 16, deltaPos.x-8, deltaPos.y-8, particle.size, particle.size);
          context.globalCompositeOperation = 'source-atop';
          context.fillStyle = particle.color;
          context.fillRect(deltaPos.x-5, deltaPos.y-5, particle.size-6, particle.size-6);
          context.globalCompositeOperation = 'source-over';
          context.restore();
          
          particle.frame++;
          if(particle.frame > particle.lifetime) {
            this.particleList.splice(p, 1);
            p--;
          }
        }
      }
    };
  }

  static get ice() {
    return class ParticleEmitter {
      draw(context, position, initialPos, direction, delta) {
        if(!this.particleList) this.particleList = [];

        if(delta < 100 && delta%6 == 0) {
          position = PE.calcDislocation(position, 90+Math.random()*16-8, Math.random()*4-2, 1);
          let lifeVariancy = -Math.random()*5;
          this.particleList.push(
            new Particle(
              PE.part_img['spikes'], position, -90, 0, 16, 30+lifeVariancy,
              ['#a0f1ff', '#cbf7ff', '#aceff1'][Math.round(Math.random()*2)]
            )
          );
        }
        
        for(let p=0; p < this.particleList.length; p++) {
          let particle = this.particleList[p];

          const deltaPos = PE.calcDislocation(particle.pos, particle.direction, particle.speed, delta);
          context.save();
          context.drawImage(particle.image, 0, 0, 16, 16, deltaPos.x-8, deltaPos.y-8, particle.size, particle.size);
          context.globalCompositeOperation = 'source-atop';
          context.fillStyle = particle.color;
          context.fillRect(deltaPos.x-5, deltaPos.y-5, particle.size-6, particle.size-6);
          context.globalCompositeOperation = 'source-over';
          context.restore();
          
          particle.frame++;
          if(particle.frame > particle.lifetime) {
            this.particleList.splice(p, 1);
            p--;
          }
        }
      }
    };
  }

  static get fighting() {
    return class ParticleEmitter {
      draw(context, position, initialPos, direction, delta) {
        let centerpos = PE.calcDislocation(position, direction, 8, 1);
        context.save();
        context.translate(centerpos.x, centerpos.y);
        context.rotate(direction * Math.PI/180);
        context.translate(-centerpos.x, -centerpos.y);
        context.drawImage(PE.part_img['halfmoon'], 0, 0, 16, 16, centerpos.x-8, centerpos.y-8, 16, 16);
        context.restore();

        let leftpos = PE.calcDislocation(position, direction-90, 6, 1);
        context.save();
        context.translate(leftpos.x, leftpos.y);
        context.rotate(direction * Math.PI/180);
        context.translate(-leftpos.x, -leftpos.y);
        context.drawImage(PE.part_img['halfmoon'], 0, 0, 16, 16, leftpos.x-8, leftpos.y-8, 16, 16);
        context.restore();

        let rightpos = PE.calcDislocation(position, direction+75, 8, 1);
        context.save();
        context.translate(rightpos.x, rightpos.y);
        context.rotate(direction * Math.PI/180);
        context.translate(-rightpos.x, -rightpos.y);
        context.drawImage(PE.part_img['halfmoon'], 0, 0, 16, 16, rightpos.x-8, rightpos.y-8, 16, 16);
        context.restore();
      }
    };
  }

  static get poison() {
    return class ParticleEmitter {
      draw(context, position, initialPos, direction, delta) {
        if(!this.particleList) this.particleList = [];

        if(delta < 40 && delta%4 == 0) {
          for(let t=0; t < 8; t++) {
            let dirVariancy = Math.random()*20 - 10;
            let posAdjust = PE.calcDislocation(initialPos, direction+dirVariancy, 1, -delta);
            let lifeVariancy = Math.random()*25 - 10;
            this.particleList.push(
              new Particle(
                PE.part_img['square'], posAdjust, direction+dirVariancy,
                1, 6, 80+lifeVariancy,
                ['#8d4cb8', '#965187', '#4a3166']
              )
            );
          }
        }

        if(delta < 110 && delta%12 == 0) {
          let dirVariancy = Math.random()*40 - 20;
          let lifeVariancy = -Math.random()*5;
          this.particleList.push(
            new Particle(
              PE.part_img['skull'], position, direction+dirVariancy, 0.1, 8, 20+lifeVariancy,
              ['#f8e9ff', '#dfbeff']
            )
          );
        }
        
        for(let p=0; p < this.particleList.length; p++) {
          let particle = this.particleList[p];

          const deltaPos = PE.calcDislocation(particle.pos, particle.direction, particle.speed, delta);
          context.save();
          context.drawImage(particle.image, 0, 0, 16, 16, deltaPos.x-8, deltaPos.y-8, 16, 16);
          context.globalCompositeOperation = 'multiply';
          context.fillStyle = particle.color;
          context.fillRect(deltaPos.x-particle.size/2, deltaPos.y-particle.size/2, particle.size, particle.size);
          context.globalCompositeOperation = 'source-over';
          context.restore();
          
          particle.frame++;
          if(particle.frame > particle.lifetime) {
            this.particleList.splice(p, 1);
            p--;
          }
        }
      }
    };
  }

  static get ground() {
    return class ParticleEmitter {
      draw(context, position, initialPos, direction, delta) {
        if(!this.particleList) this.particleList = [];

        if(delta < 16 && delta%8 == 0) {
          for(let angle=0; angle < 360; angle+=20) {
            let dirAdjust = direction + angle + (15*Math.round(delta/8));
            let posAdjust = PE.calcDislocation(initialPos, dirAdjust, 3, -delta);
            this.particleList.push(new Particle(PE.part_img['halfmoon'], posAdjust, dirAdjust, 3, 16, 15, '#c5c5c5'));
          }
        }
        
        for(let p=0; p < this.particleList.length; p++) {
          let particle = this.particleList[p];

          const deltaPos = PE.calcDislocation(particle.pos, particle.direction, particle.speed, delta);
          context.save();
          context.translate(deltaPos.x, deltaPos.y);
          context.rotate(particle.direction * Math.PI/180);
          context.translate(-deltaPos.x, -deltaPos.y);
          context.drawImage(particle.image, 0, 0, 16, 16, deltaPos.x-8, deltaPos.y-8, particle.size, particle.size);
          context.globalCompositeOperation = 'source-atop';
          context.fillStyle = particle.color;
          context.fillRect(deltaPos.x-8, deltaPos.y-8, particle.size, particle.size);
          context.globalCompositeOperation = 'source-over';
          context.restore();
          
          particle.frame++;
          if(particle.frame > particle.lifetime) {
            this.particleList.splice(p, 1);
            p--;
          }
        }
      }
    };
  }

  static get flying() {
    return class ParticleEmitter {
      draw(context, position, initialPos, direction, delta) {
        let centerpos = PE.calcDislocation(position, direction, 3, 1);
        context.save();
        context.translate(centerpos.x, centerpos.y);
        context.rotate(direction * Math.PI/180);
        context.translate(-centerpos.x, -centerpos.y);
        context.drawImage(PE.part_img['halfmoon'], 0, 0, 16, 16, centerpos.x-8, centerpos.y-8, 16, 16);
        context.restore();

        let leftpos = PE.calcDislocation(position, direction-90, 3, 1);
        context.save();
        context.translate(leftpos.x, leftpos.y);
        context.rotate(direction * Math.PI/180);
        context.translate(-leftpos.x, -leftpos.y);
        context.drawImage(PE.part_img['halfmoon'], 0, 0, 16, 16, leftpos.x-8, leftpos.y-8, 16, 16);
        context.restore();

        let rightpos = PE.calcDislocation(position, direction+90, 3, 1);
        context.save();
        context.translate(rightpos.x, rightpos.y);
        context.rotate(direction * Math.PI/180);
        context.translate(-rightpos.x, -rightpos.y);
        context.drawImage(PE.part_img['halfmoon'], 0, 0, 16, 16, rightpos.x-8, rightpos.y-8, 16, 16);
        context.restore();
      }
    };
  }

  static get psychic() {
    return class ParticleEmitter {
      draw(context, position, initialPos, direction, delta) {
        if(!this.particleList) this.particleList = [];

        if(delta < 90 && delta%8 == 0) {
          let dirVariancy = Math.random()*40 - 20;
          let posAdjust = PE.calcDislocation(position, direction+dirVariancy, 1, -delta);
          let lifeVariancy = -Math.random()*5;
          this.particleList.push(
            new Particle(
              PE.part_img['circle'], posAdjust, direction+dirVariancy, 1, 14, 20+lifeVariancy,
              ['#f7a4ff', ['#d365ff', '#c36aff', '#f25fff'][Math.round(Math.random()*2)]]
            )
          );

          this.particleList.push(
            new Particle(
              PE.part_img['sparkle'], position, direction+dirVariancy, 0.15, 4, 20+lifeVariancy,
              ['#fff59e', '#ffffff']
            )
          );
        }
        
        for(let p=0; p < this.particleList.length; p++) {
          let particle = this.particleList[p];

          const deltaPos = PE.calcDislocation(particle.pos, particle.direction, particle.speed, delta);
          context.save();
          context.drawImage(particle.image, 0, 0, 16, 16, deltaPos.x-8, deltaPos.y-8, 16, 16);
          context.globalCompositeOperation = 'source-atop';
          context.fillStyle = particle.color;
          context.fillRect(deltaPos.x-particle.size/2, deltaPos.y-particle.size/2, particle.size, particle.size);
          context.globalCompositeOperation = 'source-over';
          context.restore();
          
          particle.frame++;
          if(particle.frame > particle.lifetime) {
            this.particleList.splice(p, 1);
            p--;
          }
        }
      }
    };
  }
  
  static get bug() {
    return class ParticleEmitter {
      draw(context, position, initialPos, direction, delta) {
        if(!this.particleList) this.particleList = [];

        if(delta < 10 && delta%3 == 0) {
          for(let t=0; t < 2; t++) {
            let dirVariancy = Math.random()*8 - 5;
            let posAdjust = PE.calcDislocation(initialPos, direction+dirVariancy, 1.5, -delta);
            let lifeVariancy = -Math.random()*40;
            this.particleList.push(
              new Particle(
                PE.part_img['sting'], posAdjust, direction+dirVariancy,
                1.5, 16, 85+lifeVariancy,
                ['#f3c5ff', '#ffffff'][Math.round(Math.random())]
              )
            );
          }
        }
        
        for(let p=0; p < this.particleList.length; p++) {
          let particle = this.particleList[p];

          const deltaPos = PE.calcDislocation(particle.pos, particle.direction, particle.speed, delta);
          context.save();
          context.translate(deltaPos.x, deltaPos.y);
          context.rotate(direction * Math.PI/180);
          context.translate(-deltaPos.x, -deltaPos.y);
          context.drawImage(particle.image, 0, 0, 16, 16, deltaPos.x-8, deltaPos.y-8, particle.size, particle.size);
          context.globalCompositeOperation = 'source-atop';
          context.fillStyle = particle.color;
          context.fillRect(deltaPos.x-5, deltaPos.y, particle.size-6, particle.size-15);
          context.globalCompositeOperation = 'source-over';
          context.restore();
          
          particle.frame++;
          if(particle.frame > particle.lifetime) {
            this.particleList.splice(p, 1);
            p--;
          }
        }
      }
    };
  }
  
  static get rock() {
    return class ParticleEmitter {
      draw(context, position, initialPos, direction, delta) {
        if(!this.particleList) this.particleList = [];

        if(delta === 0) {
          let dirVariancy = Math.random()*4 - 2;
          this.particleList.push(
            new Particle(
              PE.part_img['boulder'], initialPos, direction+dirVariancy,
              1.2, 16, 85,
              ['#332e2a', '#1b1917', '#383737', '#222222'][Math.round(Math.random()*3)]
            )
          );
        }
        
        for(let p=0; p < this.particleList.length; p++) {
          let particle = this.particleList[p];

          const deltaPos = PE.calcDislocation(particle.pos, particle.direction, particle.speed, delta);
          context.save();
          context.drawImage(particle.image, 0, 0, 16, 16, deltaPos.x-8, deltaPos.y-8, particle.size, particle.size);
          context.globalCompositeOperation = 'source-atop';
          context.fillStyle = particle.color;
          context.fillRect(deltaPos.x-6, deltaPos.y-6, particle.size-4, particle.size-4);
          context.globalCompositeOperation = 'source-over';
          context.restore();
          
          particle.frame++;
          if(particle.frame > particle.lifetime) {
            this.particleList.splice(p, 1);
            p--;
          }
        }
      }
    };
  }
  
  static get ghost() {
    return class ParticleEmitter {
      draw(context, position, initialPos, direction, delta) {
        if(!this.particleList) this.particleList = [];

        if(delta < 20 && delta%12 == 0) {
          for(let angle=0; angle < 360; angle+=30) {
            let dirAdjust = direction + angle + (15*Math.round(delta/8));
            let lifeVariancy = -Math.random()*5;
            this.particleList.push(
              new Particle(
                PE.part_img['sparkle'], initialPos, dirAdjust,
                0.5, 8, 30+lifeVariancy,
                '#590daf'
              )
            );
          }
        }
        if(delta === 0) {
          for(let angle=0; angle < 360; angle+=40) {
            let dirAdjust = direction + angle + (15*Math.round(delta/8));
            let outerPos = PE.calcDislocation(initialPos, dirAdjust, 23, 1);
            let outerDir = direction + angle + 80;
            this.particleList.push(
              new Particle(
                PE.part_img['flame'], outerPos, outerDir,
                0.3, 10, 50,
                '#8012fd'
              )
            );
          }
        }
        
        for(let p=0; p < this.particleList.length; p++) {
          let particle = this.particleList[p];

          const deltaPos = PE.calcDislocation(particle.pos, particle.direction, particle.speed, delta);
          context.save();
          context.drawImage(particle.image, 0, 0, 16, 16, deltaPos.x-8, deltaPos.y-8, 16, 16);
          context.globalCompositeOperation = 'source-atop';
          context.fillStyle = particle.color;
          context.fillRect(deltaPos.x-particle.size/2, deltaPos.y-particle.size/2, particle.size, particle.size);
          context.globalCompositeOperation = 'source-over';
          context.restore();
          
          particle.frame++;
          if(particle.frame > particle.lifetime) {
            this.particleList.splice(p, 1);
            p--;
          }
        }
      }
    };
  }
  
  static get dragon() {
    return class ParticleEmitter {
      draw(context, position, initialPos, direction, delta) {
        context.save();
        context.translate(position.x, position.y);
        context.rotate(direction * Math.PI/180);
        context.translate(-position.x, -position.y);
        context.drawImage(PE.part_img['circle'], 0, 0, 16, 16, position.x-8, position.y-8, 16, 16);
        context.drawImage(PE.part_img['bubble'], 0, 0, 16, 16, position.x-8, position.y-8, 16, 16);
        context.drawImage(PE.part_img['sparkle'], 0, 0, 16, 16, position.x-8, position.y-8, 16, 16);
        context.globalCompositeOperation = 'source-atop';
        context.fillStyle = Particle.interpolateColors(['#bf35ffff', '#d17bf8ff', '#640092ff','#de9dfcff'], delta, 60);
        context.fillRect(position.x-8, position.y-8, 16, 16);
        context.globalCompositeOperation = 'source-over';
        context.restore();
      }
    };
  }
  
  static get dark() {
    return class ParticleEmitter {
      draw(context, position, initialPos, direction, delta) {
        if(!this.particleList) this.particleList = [];

        if(delta < 95 && delta%9 == 0) {
          for(let t=0; t < 3; t++) {
            let dirVariancy = Math.random()*60 - 30;
            position = PE.calcDislocation(position, direction, 1, 1);
            let posAdjust = PE.calcDislocation(position, direction+dirVariancy, 1, -delta);
            let lifeVariancy = -Math.random()*5;
            this.particleList.push(
              new Particle(
                PE.part_img['circle'], posAdjust, direction+dirVariancy, 1, 14, 20+lifeVariancy,
                ['#3f1044', ['#6f1294', '#6b2f94', '#92089e'][Math.round(Math.random()*2)]]
              )
            );
            this.particleList.push(
              new Particle(
                PE.part_img['bubble'], posAdjust, direction+dirVariancy,
                1, 10, 20+lifeVariancy, '#3f1044'
              )
            );
          }
        }
        
        for(let p=0; p < this.particleList.length; p++) {
          let particle = this.particleList[p];

          const deltaPos = PE.calcDislocation(particle.pos, particle.direction, particle.speed, delta);
          context.save();
          context.drawImage(particle.image, 0, 0, 16, 16, deltaPos.x-8, deltaPos.y-8, 16, 16);
          context.globalCompositeOperation = 'source-atop';
          context.fillStyle = particle.color;
          context.fillRect(deltaPos.x-particle.size/2, deltaPos.y-particle.size/2, particle.size, particle.size);
          context.globalCompositeOperation = 'source-over';
          context.restore();
          
          particle.frame++;
          if(particle.frame > particle.lifetime) {
            this.particleList.splice(p, 1);
            p--;
          }
        }
      }
    };
  }
  
  static get steel() {}
  
  static get fairy() {
    return class ParticleEmitter {
      draw(context, position, initialPos, direction, delta) {
        if(!this.particleList) this.particleList = [];

        if(delta < 90 && delta%8 == 0) {
          let dirVariancy = Math.random()*40 - 20;
          let posAdjust = PE.calcDislocation(position, direction+dirVariancy, 1, -delta);
          let lifeVariancy = -Math.random()*5;
          this.particleList.push(
            new Particle(
              PE.part_img['circle'], posAdjust, direction+dirVariancy, 1, 14, 20+lifeVariancy,
              ['#abfff8', ['#71ffe7', '#49ffb9', '#82ffc5'][Math.round(Math.random()*2)]]
            )
          );

          this.particleList.push(
            new Particle(
              PE.part_img['sparkle'], position, direction+dirVariancy, 0.15, 4, 20+lifeVariancy,
              ['#fde2ff']
            )
          );
        }
        
        for(let p=0; p < this.particleList.length; p++) {
          let particle = this.particleList[p];

          const deltaPos = PE.calcDislocation(particle.pos, particle.direction, particle.speed, delta);
          context.save();
          context.drawImage(particle.image, 0, 0, 16, 16, deltaPos.x-8, deltaPos.y-8, 16, 16);
          context.globalCompositeOperation = 'source-atop';
          context.fillStyle = particle.color;
          context.fillRect(deltaPos.x-particle.size/2, deltaPos.y-particle.size/2, particle.size, particle.size);
          context.globalCompositeOperation = 'source-over';
          context.restore();
          
          particle.frame++;
          if(particle.frame > particle.lifetime) {
            this.particleList.splice(p, 1);
            p--;
          }
        }
      }
    };
  }
}

PE.start();