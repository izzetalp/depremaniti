import { state, setEarthquakes, setUIMounted } from "./modules/state.js";
import { fetchEarthquakes } from "./modules/api.js";
import { showLoading, showError, renderEarthquakesPage, renderAboutPage, openMapModal } from "./modules/ui.js";

const lastEarthquakesBtn = document.querySelector("#last-earthquakes-btn");
const aboutBtn = document.querySelector("#about-btn");
const mainContent = document.querySelector("main");

async function init() {
  showLoading();
  try {
    const data = await fetchEarthquakes();
    // console.log("Gelen Veri:", data); // Debug opsiyonel
    
    if (Array.isArray(data)) {
      setEarthquakes(data);
    } else {
      setEarthquakes([]);
    }

    renderEarthquakesPage();
  } catch (error) {
    console.error("Hata:", error);
    showError(`Veriler yüklenirken bir sorun oluştu: ${error.message}`);
  }
}

// 1. Sayfa yüklendiğinde başlat
window.addEventListener("DOMContentLoaded", () => {
  init();
});

// 2. Menü Dinleyicileri
lastEarthquakesBtn.addEventListener("click", () => {
  setUIMounted(false);
  if (state.allEarthquakes.length === 0) {
    init();
  } else {
    renderEarthquakesPage();
  }
});

aboutBtn.addEventListener("click", () => {
  setUIMounted(false);
  renderAboutPage();
});

// 3. Liste elemanlarına tıklama olayını yakala (Event Delegation)
mainContent.addEventListener("click", (e) => {
  const listItem = e.target.closest(".earthquake-list-item");
  if (!listItem) return;
  
  const eqId = listItem.dataset.id;
  if (!eqId) return;
  
  const eq = state.allEarthquakes.find(item => String(item.id) === String(eqId));
  if (eq) {
    openMapModal(eq);
  }
});
