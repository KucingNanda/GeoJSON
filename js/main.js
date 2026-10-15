/**
 * Integrasi CrootJS (JSCroot) untuk Pemetaan Visualisasi GeoJSON Rute
 * Sumber Data: Tugas3_NandaSR.geojson (Titik Kost -> ULBI & Polyline Rute Jalan)
 */

import { getJSON } from "https://cdn.jsdelivr.net/gh/jscroot/lib@0.2.8/api.js";
import { setInner, onClick } from "https://cdn.jsdelivr.net/gh/jscroot/lib@0.2.8/element.js";

// 1. Inisialisasi Peta Leaflet
const map = L.map("map", {
  zoomControl: true,
  preferCanvas: true
}).setView([-6.878, 107.585], 14);

// 2. Tambahkan Tile Layer OpenStreetMap
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 19,
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors | CrootJS'
}).addTo(map);

// Variabel penampung layer rute & ulbi untuk kontrol zoom
let routeLayer = null;
let ulbiLayer = null;

// Helper untuk icon custom marker HTML
function createCustomPin(iconText, className) {
  return L.divIcon({
    className: "custom-div-icon",
    html: `<div class="custom-pin ${className}">${iconText}</div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32]
  });
}

// 3. Callback penanganan data GeoJSON dari CrootJS
function handleGeoJSONData(response) {
  const geojsonData = response.data || response;

  if (!geojsonData || !geojsonData.features) {
    console.error("Format data GeoJSON tidak valid:", geojsonData);
    setInner("status-badge", "Format Data Gagal");
    return;
  }

  // Layer GeoJSON dengan styling terpisah untuk Rute, Marker, dan Gedung Kampus
  const mainGeoJsonLayer = L.geoJSON(geojsonData, {
    style: function (feature) {
      const geomType = feature.geometry ? feature.geometry.type : "";
      
      // Styling khusus Polyline Jalan (Rute)
      if (geomType === "LineString") {
        const coords = feature.geometry.coordinates || [];
        // Deteksi apakah ini rute panjang antar kost & ULBI (jumlah koordinat > 10)
        if (coords.length > 5) {
          return {
            color: "#3b82f6",
            weight: 5,
            opacity: 0.9,
            dashArray: "1, 8",
            lineJoin: "round"
          };
        }
        return {
          color: "#94a3b8",
          weight: 3,
          opacity: 0.8
        };
      }

      // Styling Polygon Gedung ULBI
      if (geomType === "Polygon" || geomType === "MultiPolygon") {
        return {
          fillColor: feature.properties.fill || "#f59e0b",
          weight: 1.5,
          opacity: 1,
          color: "#ffffff",
          fillOpacity: 0.7
        };
      }

      return {
        color: "#3b82f6",
        weight: 3
      };
    },

    pointToLayer: function (feature, latlng) {
      const nama = feature.properties ? feature.properties.Nama : "";

      if (nama === "Kost") {
        return L.marker(latlng, {
          icon: createCustomPin("🏠", "pin-start")
        });
      } else if (nama === "ULBI") {
        return L.marker(latlng, {
          icon: createCustomPin("🎓", "pin-dest")
        });
      }

      return L.circleMarker(latlng, {
        radius: 6,
        fillColor: "#eab308",
        color: "#fff",
        weight: 1.5,
        opacity: 1,
        fillOpacity: 0.8
      });
    },

    onEachFeature: function (feature, layer) {
      const props = feature.properties || {};
      const geomType = feature.geometry ? feature.geometry.type : "";

      let popupHtml = '<div class="popup-content">';
      if (props.Nama) {
        popupHtml += `<h4>${props.Nama}</h4>`;
      } else if (geomType === "LineString") {
        popupHtml += `<h4>Polyline Rute Jalan</h4>`;
        popupHtml += `<p>Jalur penghubung antara Kost &amp; Kampus ULBI</p>`;
      } else {
        popupHtml += `<h4>Area Fasilitas</h4>`;
      }

      if (props.fill) {
        popupHtml += `<p>Warna tema: <code>${props.fill}</code></p>`;
      }
      popupHtml += "</div>";

      layer.bindPopup(popupHtml);

      // Simpan layer referensi untuk tombol kontrol fokus
      if (geomType === "LineString" && feature.geometry.coordinates.length > 5) {
        routeLayer = layer;
      }
      if (props.Nama === "ULBI") {
        ulbiLayer = layer;
      }
    }
  }).addTo(map);

  // Sesuaikan zoom layar ke seluruh data GeoJSON
  if (mainGeoJsonLayer.getBounds().isValid()) {
    map.fitBounds(mainGeoJsonLayer.getBounds(), { padding: [40, 40] });
  }

  // Update status indikator
  const statusBadge = document.getElementById("status-badge");
  if (statusBadge) {
    statusBadge.textContent = "Data Berhasil Dimuat";
    statusBadge.classList.add("ready");
  }
}

// 4. Fallback loader jika CDN mengalami kendala jaringan
async function loadGeoJsonFallback(url) {
  try {
    const res = await fetch(url);
    const data = await res.json();
    handleGeoJSONData(data);
  } catch (err) {
    console.error("Gagal memuat GeoJSON via fallback:", err);
    setInner("status-badge", "Gagal Memuat");
  }
}

// 5. Muat Data GeoJSON menggunakan CrootJS
const targetGeoJsonUrl = "./Tugas3_NandaSR.geojson";

try {
  getJSON(targetGeoJsonUrl, (res) => {
    if (res) {
      handleGeoJSONData(res);
    } else {
      loadGeoJsonFallback(targetGeoJsonUrl);
    }
  });
} catch (e) {
  console.warn("JSCroot getJSON error, using fallback fetch", e);
  loadGeoJsonFallback(targetGeoJsonUrl);
}

// 6. Tombol Aksi Fokus
onClick("btn-fit-route", () => {
  if (routeLayer) {
    map.fitBounds(routeLayer.getBounds(), { padding: [50, 50] });
  } else {
    map.setView([-6.878, 107.585], 14);
  }
});

onClick("btn-fit-ulbi", () => {
  // Koordinat ULBI: [-6.873687, 107.575879]
  map.flyTo([-6.873687, 107.575879], 17, { duration: 1.5 });
});
