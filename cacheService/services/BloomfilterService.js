const BITS = 8 * 1024 * 1024;

class BloomfilterService {
  constructor() {
    this.counters = new Uint16Array(BITS);
  }

  _hash(str, seed) {
    let h = 2166136261 ^ seed;
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return (h >>> 0) % BITS;
  }

  _indices(value) {
    const v = value.toLowerCase();
    return [
      this._hash(v, 0),
      this._hash(v, 1234567891),
      this._hash(v, 987654321),
    ];
  }

  add(value) {
    for (const idx of this._indices(value)) {
      if (this.counters[idx] < 65535) {
        this.counters[idx]++;
      }
    }
  }

  remove(value) {
    for (const idx of this._indices(value)) {
      if (this.counters[idx] > 0) {
        this.counters[idx]--;
      }
    }
  }

  mightContain(value) {
    for (const idx of this._indices(value)) {
      if (this.counters[idx] === 0) {
        return false;
      }
    }
    return true;
  }

  seed(values) {
    for (const v of values) this.add(v);
  }
}

export const emailBloom = new BloomfilterService();
export default new BloomfilterService();