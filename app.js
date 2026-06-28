// Data state
let locationsData = [];
let collectedItems = new Set();
let activeCategoryFilters = new Set();
const mapMarkers = {}; // Keep track of Leaflet markers by unique key: 'type_id'

// Leaflet Map Initialization
let map;
let currentStyle = 'road';

const mapBackgrounds = {
    road: '#1862ad',
    atlas: '#0fa8d2',
    satellite: '#143d6b'
};

const tileLayers = {
    road: L.tileLayer('https://s3-eu-west-1.amazonaws.com/gtavmap/tiles/road/{z}-{x}_{y}.png', {
        minZoom: 3,
        maxZoom: 7,
        noWrap: true,
        attribution: 'Map tiles by danharper | Grand Theft Auto V © Rockstar Games'
    }),
    atlas: L.tileLayer('https://s3-eu-west-1.amazonaws.com/gtavmap/tiles/atlas/{z}-{x}_{y}.png', {
        minZoom: 3,
        maxZoom: 7,
        noWrap: true,
        attribution: 'Map tiles by danharper | Grand Theft Auto V © Rockstar Games'
    }),
    satellite: L.tileLayer('https://s3-eu-west-1.amazonaws.com/gtavmap/tiles/satellite/{z}-{x}_{y}.png', {
        minZoom: 3,
        maxZoom: 7,
        noWrap: true,
        attribution: 'Map tiles by danharper | Grand Theft Auto V © Rockstar Games'
    })
};

// Category Metadata
const categoryMetadata = {
    'Spaceship Part': { class: 'cat-spaceship', label: 'Partes de Nave', color: '#10b981', glow: 'rgba(16, 185, 129, 0.4)' },
    'Letter Scrap': { class: 'cat-letter', label: 'Pedaços de Carta', color: '#f97316', glow: 'rgba(249, 115, 22, 0.4)' },
    'Stunt Jump': { class: 'cat-stunt', label: 'Saltos Únicos', color: '#ef4444', glow: 'rgba(239, 68, 68, 0.4)' },
    'Under the Bridge': { class: 'cat-bridge', label: 'Sob a Ponte', color: '#eab308', glow: 'rgba(234, 179, 8, 0.4)' },
    'Nuclear Waste': { class: 'cat-waste', label: 'Lixo Nuclear', color: '#06b6d4', glow: 'rgba(6, 182, 212, 0.4)' },
    'Epsilon Tract': { class: 'cat-epsilon', label: 'Tratados de Epsilon', color: '#a855f7', glow: 'rgba(168, 85, 247, 0.4)' },
    'Knife Flight': { class: 'cat-flight', label: 'Voos de Faca', color: '#f43f5e', glow: 'rgba(244, 63, 94, 0.4)' },
    'Money': { class: 'cat-money', label: 'Pacotes Ocultos', color: '#3b82f6', glow: 'rgba(59, 130, 246, 0.4)' },
    'Vehicle Spawn': { class: 'cat-vehicle', label: 'Carros Raros', color: '#ec4899', glow: 'rgba(236, 72, 153, 0.4)' },
    'Epsilon Car': { class: 'cat-epsilon-car', label: 'Carros Epsilon', color: '#6366f1', glow: 'rgba(99, 102, 241, 0.4)' }
};

// Init application
document.addEventListener('DOMContentLoaded', () => {
    initLocalStorage();
    initMap();
    loadLocationsData();
    setupEventListeners();
});

// Load progress from localStorage
function initLocalStorage() {
    const saved = localStorage.getItem('gta5_map_collected');
    if (saved) {
        try {
            const arr = JSON.parse(saved);
            collectedItems = new Set(arr);
        } catch (e) {
            console.error('Error parsing collected items storage:', e);
            collectedItems = new Set();
        }
    }
    
    // Load saved opacity setting
    const savedOpacity = localStorage.getItem('gta5_map_collected_opacity') || '55';
    document.documentElement.style.setProperty('--collected-opacity', savedOpacity / 100);
    const slider = document.getElementById('opacity-slider');
    const sliderVal = document.getElementById('opacity-val');
    if (slider && sliderVal) {
        slider.value = savedOpacity;
        sliderVal.innerText = `${savedOpacity}%`;
    }
}

// Save progress to localStorage
function saveProgress() {
    localStorage.setItem('gta5_map_collected', JSON.stringify([...collectedItems]));
    updateUIProgress();
}

// Leaflet Map Init
function initMap() {
    // Lat/Lng in locations.json uses standard Web Mercator coordinates mapping
    map = L.map('map', {
        center: [65.5, -125.0],
        zoom: 4,
        zoomControl: false,
        attributionControl: true
    });

    // Add default tile layer
    tileLayers[currentStyle].addTo(map);
    document.getElementById('map').style.backgroundColor = mapBackgrounds[currentStyle];

    // Position Zoom control to top-right
    L.control.zoom({ position: 'topright' }).addTo(map);
}

// Change Map Styles
function setMapStyle(style) {
    if (currentStyle === style) return;

    map.removeLayer(tileLayers[currentStyle]);
    currentStyle = style;
    tileLayers[currentStyle].addTo(map);
    document.getElementById('map').style.backgroundColor = mapBackgrounds[currentStyle];

    // Update active tab styling
    document.querySelectorAll('.map-style-tab').forEach(tab => {
        if (tab.dataset.style === style) {
            tab.classList.add('active');
        } else {
            tab.classList.remove('active');
        }
    });
}

// Fetch markers data from locations.json
async function loadLocationsData() {
    try {
        const response = await fetch('locations.json');
        locationsData = await response.json();
        
        // Initialize all categories as active
        Object.keys(categoryMetadata).forEach(cat => {
            activeCategoryFilters.add(cat);
        });

        renderCategoriesUI();
        renderMarkers();
        updateUIProgress();
    } catch (e) {
        console.error('Error loading locations data:', e);
    }
}

// Build beautiful SVG icons dynamically
function getSVGIcon(type, isCollected) {
    const meta = categoryMetadata[type] || { color: '#ffffff' };
    const color = meta.color;
    const opacity = 1.0; // Handled by CSS for collected markers
    const scale = isCollected ? 0.85 : 1.0;
    
    // Glowing shadow for uncollected items
    const shadowColor = isCollected ? 'transparent' : color;
    const filterId = `shadow-${type.replace(/\s+/g, '-')}-${isCollected ? 'col' : 'uncol'}`;

    const svgHtml = `
    <svg width="28" height="34" viewBox="0 0 28 34" fill="none" xmlns="http://www.w3.org/2000/svg" style="opacity: ${opacity}; transform: scale(${scale}); filter: drop-shadow(0 4px 6px rgba(0,0,0,0.45));">
        <defs>
            <filter id="${filterId}" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="0" stdDeviation="3" flood-color="${shadowColor}" flood-opacity="0.8"/>
            </filter>
        </defs>
        <path d="M14 0C6.26801 0 0 6.26801 0 14C0 24.5 14 34 14 34C14 34 28 24.5 28 14C28 6.26801 21.732 0 14 0Z" fill="${color}" filter="url(#${filterId})"/>
        <circle cx="14" cy="14" r="6" fill="#0c0d14"/>
        <circle cx="14" cy="14" r="4" fill="#ffffff"/>
    </svg>
    `;

    return L.divIcon({
        html: svgHtml,
        className: `custom-leaflet-marker ${isCollected ? 'collected' : ''}`,
        iconSize: [28, 34],
        iconAnchor: [14, 34],
        popupAnchor: [0, -34]
    });
}

// Draw markers on map
function renderMarkers() {
    locationsData.forEach(item => {
        const key = `${item.type}_${item.id}`;
        const isCollected = collectedItems.has(key);
        const icon = getSVGIcon(item.type, isCollected);
        
        const marker = L.marker([item.lat, item.lng], { icon: icon });

        // Popup building
        marker.bindPopup(() => createPopupContent(item, key));
        
        mapMarkers[key] = marker;
        
        // Add to map if active
        if (activeCategoryFilters.has(item.type)) {
            marker.addTo(map);
        }
    });
}

// Generate Popup HTML Content
function createPopupContent(item, key) {
    const isCollected = collectedItems.has(key);
    const meta = categoryMetadata[item.type] || { color: '#fff', label: item.type };
    
    let ytLinkHtml = '';
    if (item.video && item.video.yt_id) {
        let seconds = 0;
        if (item.video.start) {
            const parts = item.video.start.split(':');
            if (parts.length === 2) {
                seconds = parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
            }
        }
        const ytUrl = `https://youtu.be/${item.video.yt_id}?t=${seconds}`;
        ytLinkHtml = `
            <a href="${ytUrl}" target="_blank" class="popup-youtube-link">
                <svg viewBox="0 0 24 24">
                    <path d="M23.498 6.163a3.003 3.003 0 0 0-2.11-2.107C19.522 3.543 12 3.543 12 3.543s-7.522 0-9.388.513a3.003 3.003 0 0 0-2.11 2.107C0 8.029 0 12 0 12s0 3.971.502 5.837a3.003 3.003 0 0 0 2.11 2.107C4.478 20.457 12 20.457 12 20.457s7.522 0 9.388-.513a3.003 3.003 0 0 0 2.11-2.107C24 15.971 24 12 24 12s0-3.971-.502-5.837zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                </svg>
                Guia em Vídeo (${item.video.start})
            </a>
        `;
    }

    const buttonClass = isCollected ? 'uncollect-btn' : 'collect-btn';
    const buttonText = isCollected ? 'Desmarcar Coletado' : 'Marcar como Coletado';
    const note = item.notes ? `<p class="popup-notes">${item.notes}</p>` : '';

    const container = document.createElement('div');
    container.className = 'popup-card';
    container.innerHTML = `
        <span class="popup-category" style="color: ${meta.color}">${meta.label}</span>
        <h4 class="popup-title">${item.title}</h4>
        ${note}
        <button class="popup-action-btn ${buttonClass}" onclick="toggleItemCollection('${key}')">${buttonText}</button>
        ${ytLinkHtml}
    `;

    return container;
}

// Toggle Collection State
function toggleItemCollection(key) {
    const marker = mapMarkers[key];
    const item = locationsData.find(loc => `${loc.type}_${loc.id}` === key);
    
    if (collectedItems.has(key)) {
        collectedItems.delete(key);
    } else {
        collectedItems.add(key);
    }

    // Save & Update Marker Visual
    saveProgress();
    
    if (marker) {
        const isCollected = collectedItems.has(key);
        marker.setIcon(getSVGIcon(item.type, isCollected));
        // Re-bind popup to update its buttons dynamically
        marker.closePopup();
        marker.bindPopup(() => createPopupContent(item, key));
        // Wait a slight delay and reopen if it was active
        setTimeout(() => marker.openPopup(), 100);
    }

    // Update list UI checkbox if visible
    const listCheckbox = document.getElementById(`list-chk-${key.replace(/\s+/g, '_')}`);
    if (listCheckbox) {
        listCheckbox.checked = collectedItems.has(key);
    }

    // Refresh category progress UI
    updateCategoryProgressUI(item.type);
}

// Generate the categories sidebar checklist
function renderCategoriesUI() {
    const container = document.getElementById('categories-container');
    container.innerHTML = '';

    // Group items by category to get totals
    const categoryCounts = {};
    locationsData.forEach(item => {
        categoryCounts[item.type] = (categoryCounts[item.type] || 0) + 1;
    });

    Object.keys(categoryMetadata).forEach(cat => {
        const meta = categoryMetadata[cat];
        const total = categoryCounts[cat] || 0;
        if (total === 0) return; // Skip categories with no items

        const collected = locationsData.filter(item => item.type === cat && collectedItems.has(`${item.type}_${item.id}`)).length;
        const progressPercent = (collected / total) * 100;

        const catId = `cat-block-${cat.replace(/\s+/g, '_')}`;
        
        const catElement = document.createElement('div');
        catElement.className = `category-item ${meta.class}`;
        catElement.id = catId;
        catElement.innerHTML = `
            <div class="category-main" onclick="toggleCategoryCollapse('${cat}')">
                <div class="category-info">
                    <div class="category-checkbox-wrapper" onclick="event.stopPropagation()">
                        <input type="checkbox" id="chk-${cat.replace(/\s+/g, '_')}" class="category-checkbox" checked onchange="toggleCategoryFilter('${cat}')">
                    </div>
                    <span class="category-name">${meta.label}</span>
                </div>
                <span class="category-badge" id="badge-${cat.replace(/\s+/g, '_')}">${collected}/${total}</span>
            </div>
            <div class="category-progress-container">
                <div class="category-progress-fill" id="bar-${cat.replace(/\s+/g, '_')}" style="width: ${progressPercent}%"></div>
            </div>
            <div class="category-items-list" id="list-${cat.replace(/\s+/g, '_')}" style="display: none; padding-top: 8px;" onclick="event.stopPropagation()">
                <!-- Dynamic Items Inserted Here -->
            </div>
        `;
        container.appendChild(catElement);
        renderCategoryItemsList(cat);
    });
}

// Collapsible Category Item Lists
const collapsedStates = {};
function toggleCategoryCollapse(cat) {
    const listContainer = document.getElementById(`list-${cat.replace(/\s+/g, '_')}`);
    if (!listContainer) return;

    if (collapsedStates[cat]) {
        listContainer.style.display = 'none';
        collapsedStates[cat] = false;
    } else {
        listContainer.style.display = 'block';
        collapsedStates[cat] = true;
    }
}

// Render individual items checklist inside expanded sidebar categories
function renderCategoryItemsList(cat) {
    const listContainer = document.getElementById(`list-${cat.replace(/\s+/g, '_')}`);
    if (!listContainer) return;

    const items = locationsData.filter(item => item.type === cat);
    // Sort items by order if present, or ID
    items.sort((a, b) => (a.order || a.id) - (b.order || b.id));

    listContainer.innerHTML = '';
    items.forEach(item => {
        const key = `${item.type}_${item.id}`;
        const isCollected = collectedItems.has(key);
        const itemElement = document.createElement('div');
        itemElement.style.cssText = 'display: flex; align-items: center; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid rgba(255,255,255,0.02); font-size: 13px;';
        
        // Checklist container
        itemElement.innerHTML = `
            <div style="display: flex; align-items: center; gap: 8px; flex: 1; cursor: pointer;" onclick="focusOnMarker('${key}')">
                <input type="checkbox" id="list-chk-${key.replace(/\s+/g, '_')}" style="cursor:pointer;" ${isCollected ? 'checked' : ''} onclick="event.stopPropagation(); toggleItemCollection('${key}')">
                <span class="item-list-title" style="color: var(--text-main); font-weight: 400;">#${item.order || item.id} - ${item.title.replace(item.type + ' ', '').substring(0, 24)}...</span>
            </div>
            <span style="font-size: 10px; color: var(--text-muted); cursor:pointer;" onclick="focusOnMarker('${key}')">Focar</span>
        `;
        listContainer.appendChild(itemElement);
    });
}

// Center map on marker and open popup
function focusOnMarker(key) {
    const marker = mapMarkers[key];
    if (marker) {
        map.setView(marker.getLatLng(), 6);
        marker.openPopup();
        
        // On mobile, close sidebar automatically when clicking to focus
        if (window.innerWidth <= 768) {
            toggleSidebar(false);
        }
    }
}

// Toggle Visibility filter of categories on map
function toggleCategoryFilter(cat) {
    const checkbox = document.getElementById(`chk-${cat.replace(/\s+/g, '_')}`);
    const isActive = checkbox.checked;

    if (isActive) {
        activeCategoryFilters.add(cat);
        // Show markers
        locationsData.forEach(item => {
            if (item.type === cat) {
                const marker = mapMarkers[`${item.type}_${item.id}`];
                if (marker) marker.addTo(map);
            }
        });
    } else {
        activeCategoryFilters.delete(cat);
        // Hide markers
        locationsData.forEach(item => {
            if (item.type === cat) {
                const marker = mapMarkers[`${item.type}_${item.id}`];
                if (marker) marker.remove();
            }
        });
    }
}

// Update single category's progress UI elements
function updateCategoryProgressUI(cat) {
    const total = locationsData.filter(item => item.type === cat).length;
    const collected = locationsData.filter(item => item.type === cat && collectedItems.has(`${item.type}_${item.id}`)).length;
    const percent = total > 0 ? (collected / total) * 100 : 0;

    const badge = document.getElementById(`badge-${cat.replace(/\s+/g, '_')}`);
    const bar = document.getElementById(`bar-${cat.replace(/\s+/g, '_')}`);

    if (badge) badge.innerText = `${collected}/${total}`;
    if (bar) bar.style.width = `${percent}%`;
}

// Update Global Progress Section
function updateUIProgress() {
    const totalItems = locationsData.length;
    if (totalItems === 0) return;

    const collectedCount = collectedItems.size;
    const percent = (collectedCount / totalItems) * 100;

    document.getElementById('overall-progress-text').innerText = `${collectedCount}/${totalItems}`;
    document.getElementById('overall-progress-fill').style.width = `${percent}%`;
}

// Search and filter items dynamically in the list
function searchLocations() {
    const query = document.getElementById('search-box').value.toLowerCase();
    
    locationsData.forEach(item => {
        const key = `${item.type}_${item.id}`;
        const marker = mapMarkers[key];
        const match = item.title.toLowerCase().includes(query) || (item.notes && item.notes.toLowerCase().includes(query));

        // If search query is entered, we only show matching markers on the map
        if (query.length > 1) {
            if (match && activeCategoryFilters.has(item.type)) {
                if (marker && !map.hasLayer(marker)) marker.addTo(map);
            } else {
                if (marker) marker.remove();
            }
        } else {
            // Restore regular category filters
            if (activeCategoryFilters.has(item.type)) {
                if (marker && !map.hasLayer(marker)) marker.addTo(map);
            } else {
                if (marker) marker.remove();
            }
        }
    });
}

// Toggle Sidebar for mobile responsive
function toggleSidebar(forceState = null) {
    const sidebar = document.getElementById('sidebar');
    if (forceState !== null) {
        if (forceState) sidebar.classList.add('open');
        else sidebar.classList.remove('open');
    } else {
        sidebar.classList.toggle('open');
    }
}

// Setup Event Listeners
function setupEventListeners() {
    // Search box filter
    document.getElementById('search-box').addEventListener('input', searchLocations);

    // Map style switches
    document.querySelectorAll('.map-style-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            setMapStyle(tab.dataset.style);
        });
    });

    // Mobile Sidebar toggle click
    document.getElementById('mobile-toggle').addEventListener('click', (e) => {
        e.stopPropagation();
        toggleSidebar();
    });

    // Close sidebar on map click for mobile
    map.on('click', () => {
        if (window.innerWidth <= 768) {
            toggleSidebar(false);
        }
    });

    // Opacity slider input
    const slider = document.getElementById('opacity-slider');
    const sliderVal = document.getElementById('opacity-val');
    if (slider && sliderVal) {
        slider.addEventListener('input', (e) => {
            const val = e.target.value;
            sliderVal.innerText = `${val}%`;
            document.documentElement.style.setProperty('--collected-opacity', val / 100);
            localStorage.setItem('gta5_map_collected_opacity', val);
        });
    }

    // Show all categories
    document.getElementById('btn-show-all').addEventListener('click', () => {
        Object.keys(categoryMetadata).forEach(cat => {
            activeCategoryFilters.add(cat);
            const chk = document.getElementById(`chk-${cat.replace(/\s+/g, '_')}`);
            if (chk) chk.checked = true;
        });
        
        // Add all markers to map
        locationsData.forEach(item => {
            const marker = mapMarkers[`${item.type}_${item.id}`];
            if (marker && !map.hasLayer(marker)) marker.addTo(map);
        });
    });

    // Hide all categories
    document.getElementById('btn-hide-all').addEventListener('click', () => {
        activeCategoryFilters.clear();
        Object.keys(categoryMetadata).forEach(cat => {
            const chk = document.getElementById(`chk-${cat.replace(/\s+/g, '_')}`);
            if (chk) chk.checked = false;
        });
        
        // Remove all markers from map
        locationsData.forEach(item => {
            const marker = mapMarkers[`${item.type}_${item.id}`];
            if (marker) marker.remove();
        });
    });
}
