// Uygulamanın global state'i
export const state = {
  allEarthquakes: [],
  currentFilter: 0, // 0: Tümü, 2: +2.0, 3: +3.0, 4: +4.0 // varsayılan filtre büyüklüğü
  isUIMounted: false // DOM Thrashing'i önlemek için eklendi
};

export function setEarthquakes(data) {
  state.allEarthquakes = data;
}

export function setFilter(val) {
  state.currentFilter = val;
}

export function setUIMounted(val) {
  state.isUIMounted = val;
}
