import { getJSON } from "https://cdn.jsdelivr.net/gh/crootjs/lib@0.0.16/api.js";

// 1. Inisialisasi peta Leaflet langsung agar peta segera tampil
const map = L.map("map").setView([-6.878, 107.585], 14);

// 2. Tambahkan Tile Layer OpenStreetMap
L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 19,
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

// Pastikan Leaflet membaca ukuran container secara akurat
setTimeout(() => {
  map.invalidateSize();
}, 200);

// 3. Fungsi untuk menampilkan data GeoJSON ke peta
function renderGeoJSON(geojsonData) {
  if (!geojsonData) return;

  const geojsonLayer = L.geoJSON(geojsonData, {
    style: function (feature) {
      if (feature.geometry && feature.geometry.type === "LineString") {
        return {
          color: "#0066ff",
          weight: 5,
          opacity: 0.85
        };
      }
      return {
        fillColor: feature.properties && feature.properties.fill ? feature.properties.fill : "#f59e0b",
        weight: 2,
        opacity: 1,
        color: "#333333",
        fillOpacity: 0.6
      };
    },
    onEachFeature: function (feature, layer) {
      const props = feature.properties || {};
      const nama = props.Nama || (feature.geometry && feature.geometry.type === "LineString" ? "Polyline Rute" : "Objek Peta");
      layer.bindPopup("<strong>" + nama + "</strong>");
    }
  }).addTo(map);

  // Pusatkan peta ke bounds data GeoJSON
  if (geojsonLayer.getBounds().isValid()) {
    map.fitBounds(geojsonLayer.getBounds(), { padding: [30, 30] });
  }
}

// 4. Callback respon dari getJSON CrootJS
function onGeoJSONLoaded(result) {
  if (result && result.data) {
    renderGeoJSON(result.data);
  } else {
    // Fallback jika format result langsung GeoJSON
    renderGeoJSON(result);
  }
}

// 5. Muat data Tugas3_NandaSR.geojson menggunakan CrootJS
const geojsonUrl = "./Tugas3_NandaSR.geojson";

getJSON(geojsonUrl, onGeoJSONLoaded);
