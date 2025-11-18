class PokemonClass {
  constructor(raw) {
    this.raw = raw;
  }

  get id() {
    return this.raw.id;
  }

  get name() {
    return this.raw.name;
  }

  get sprite() {
    let defaultsprite = this.raw.sprites['front_default'];
    if('generation-v' in this.raw.sprites.versions
    && 'black-white' in this.raw.sprites.versions['generation-v']
    && 'front_default' in this.raw.sprites.versions['generation-v']['black-white']
    && this.raw.sprites.versions['generation-v']['black-white']['front_default'] !== null) {
      defaultsprite = this.raw.sprites.versions['generation-v']['black-white']['front_default'];
    }
    let animatedsprite = '';
    if('generation-v' in this.raw.sprites.versions
    && 'black-white' in this.raw.sprites.versions['generation-v']
    && 'animated' in this.raw.sprites.versions['generation-v']['black-white']) {
      animatedsprite = this.raw.sprites.versions['generation-v']['black-white']['animated']['front_default']??defaultsprite;
    }
    let iconsprite = '';
    if('generation-vii' in this.raw.sprites.versions
    && 'icons' in this.raw.sprites.versions['generation-vii']
    && 'front_default' in this.raw.sprites.versions['generation-vii']['icons']) {
      iconsprite = this.raw.sprites.versions['generation-vii']['icons']['front_default'];
    }
    let drawsprite = '';
    if('official-artwork' in this.raw.sprites.other
    && 'front_default' in this.raw.sprites.other['official-artwork']) {
      drawsprite = this.raw.sprites.other['official-artwork']['front_default'];
    }
    let svgsprite = '';
    if('dream_world' in this.raw.sprites.other
    && 'front_default' in this.raw.sprites.other['dream_world']) {
      svgsprite = this.raw.sprites.other['dream_world']['front_default'];
    }
    let sprite3D = '';
    if('home' in this.raw.sprites.other
    && 'front_default' in this.raw.sprites.other['home']) {
      sprite3D = this.raw.sprites.other['home']['front_default'];
    }
    let sprite3Danimated = '';
    if('showdown' in this.raw.sprites.other
    && 'front_default' in this.raw.sprites.other['showdown']) {
      sprite3Danimated = this.raw.sprites.other['showdown']['front_default'];
    }
    return {
      'default': defaultsprite,
      'animated': animatedsprite,
      'icon': iconsprite,
      'draw': drawsprite,
      'svg': svgsprite,
      '3d': sprite3D,
      '3d_animated': sprite3Danimated
    }
  }

  get types() {
    return this.raw.types.map(t => t.type.name);
  }

  get typeBadges() {
    return this.raw.types.map(t => {
      const tnumber = t.type.url.split('/').at(-2);
      return `${PokemonAPI.TYPEBASEURL}${tnumber}.png`;
    });
  }

  get stats() {
    return this.raw.stats.map((s, i) => ({
      'name': s.stat.name,
      'base': s.base_stat,
      'effort': s.effort,
      'id': Number(i)
    }));
  }

  colorPalette(sprite=this.sprite.default) {
    return sprite;
  }
}

class PokemonAPI {
  // https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/types/generation-vii/lets-go-pikachu-lets-go-eevee/
  static TYPEBASEURL = 'typebadges/';
  static MISSINGNOB64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGAAAABgCAMAAADVRocKAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAPUExURRgQEP///4BwmPCwiAAAAOCvPXUAAAAFdFJOU/////8A+7YOUwAAAAlwSFlzAAAOwwAADsMBx2+oZAAAABh0RVh0U29mdHdhcmUAUGFpbnQuTkVUIDUuMS44G2nqqAAAALZlWElmSUkqAAgAAAAFABoBBQABAAAASgAAABsBBQABAAAAUgAAACgBAwABAAAAAgAAADEBAgAQAAAAWgAAAGmHBAABAAAAagAAAAAAAABgAAAAAQAAAGAAAAABAAAAUGFpbnQuTkVUIDUuMS44AAMAAJAHAAQAAAAwMjMwAaADAAEAAAABAAAABaAEAAEAAACUAAAAAAAAAAIAAQACAAQAAABSOTgAAgAHAAQAAAAwMTAwAAAAAKuAIRNTnjgoAAACTUlEQVRoQ+2WSbIjIQxEa/D9z9w51Vag+LBqsiaMwnoaKOzrt1kHMNQBDHUAQx3AUAcw1H8GuO77fp4bx6NBpku1APAPv3RuRKZL9QHyrdEegGMXZwMAThW+APf6HrxJwf43ZHC9PlgkYjJdqgV4XovRbwG4RGoB/a8HXK9rRAafmS7VK5GWUIQ0Ml2ql0HWj25bmhzX70VtKNEXOhPhmelSPYBCf1/41iDTpXol8muA4rAbG5qM0L8SsUYbXjSFj4s5YJTpUi2A3jCdTiPTpXoAVoi+de0okUqjrUKcTJdqAejVF+44M12ql0Gq47fhmvpuMwNGTohTyXSpOQCiphi9nOu+sskMnUGzydCXRKylWgAVHkuJ5eERa6kO4HZrX7wOewBY/6iNhvK/sAdqMWXCpgzgkjVCkcghKdZScwCtHf+b0KHnyhI5/hsZSEoA+cRaag7AXQ61eR6vUGewfhVhDwIFXfhaHWupOYDi5amb44diLTUJiGs9vuezsAdxif/Vjp/CxhFrqTmAmowDcheoa+UyZdFZI64i/7PGmlpYogDgXgn448oS2b/6yys1Wr4X3dxO8XDLwYm1VAsgeR3piLVUF6DQ5R6KtdRkDz7ZMUfsdKylWhkQQAaWkn4UYi3VBTh6vnMYxlpqGkDHRnjMj7GWmu6BG+tnNoup704D5FkQJuAkYi3V6IG86gpjz+8BUVpF6HSspRo9kG/mkeHKEjn0EATQLdZS0z0Q4cskqFhLzQH+oAMY6gCGOoChDmCoAxjqAIY6gIF+v39Nz4UK8uys8wAAAABJRU5ErkJggg==';

  static async getPokemon(uid) {
    return await fetch(`https://pokeapi.co/api/v2/pokemon/${uid}`, {
      method: 'GET'
    }).then(res => {
      return res.json();
    }).then(info => {
      return new PokemonClass(info);
    });
  }

  static async getList(offset=0, limit=100) {
    return await fetch(`https://pokeapi.co/api/v2/pokemon?offset=${offset}&limit=${limit}`, {
      method: 'GET'
    }).then(res => {
      return res.json();
    });
  }

  static getMissingNo() {
    return new PokemonClass({
      name: 'missingNo',
      sprites: {
        versions: { 'generation-v': { 'black-white': { front_default: PokemonAPI.MISSINGNOB64 } } },
        other: {}
      },
      types: [],
      stats: []
    });
  }

  static async getPokemonCount() {
    return 1025;
    // the code below works, removed to reduce API requests

    // return await fetch('https://pokeapi.co/api/v2/pokemon/', {
    //   method: 'GET'
    // }).then(res => {
    //   return res.json();
    // }).then(info => {
    //   return info.count;
    // });
  }
}
