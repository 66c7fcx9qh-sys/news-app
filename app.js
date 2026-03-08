// App State
const state = {
    news: [],
    sources: JSON.parse(localStorage.getItem('news_sources')) || [
        { id: 1, name: 'BBC News', url: 'https://feeds.bbci.co.uk/news/rss.xml' },
        { id: 2, name: 'The Verge', url: 'https://www.theverge.com/rss/index.xml' },
        { id: 3, name: 'ANSA', url: 'https://www.ansa.it/sito/notizie/topnews/topnews_rss.xml' }
    ],
    categories: JSON.parse(localStorage.getItem('news_categories')) || ['Tutte', 'Tecnologia', 'Scienza', 'Business', 'Design'],
    activeCategory: 'Tutte',
    fontSize: localStorage.getItem('font_size') || 16,
    loading: false
};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    updateDate();
    initSettings();
    renderCategories();
    fetchAllNews();
    initSwipeToClose();
});

function updateDate() {
    const options = { weekday: 'long', day: 'numeric', month: 'short' };
    document.getElementById('current-date').innerText = new Date().toLocaleDateString('it-IT', options);
    updateGreeting();
}

function updateGreeting() {
    const hour = new Date().getHours();
    const el = document.getElementById('day-greeting');
    if (el) {
        if (hour >= 5 && hour < 12) el.innerText = 'Buongiorno';
        else if (hour >= 12 && hour < 18) el.innerText = 'Buon pomeriggio';
        else if (hour >= 18 && hour < 22) el.innerText = 'Buonasera';
        else el.innerText = 'Buonanotte';
    }
}

function initSettings() {
    const fontSlider = document.getElementById('font-size');
    if (fontSlider) {
        fontSlider.value = state.fontSize;
        document.documentElement.style.setProperty('--base-font-size', `${state.fontSize}px`);
        fontSlider.addEventListener('input', (e) => {
            state.fontSize = e.target.value;
            document.documentElement.style.setProperty('--base-font-size', `${state.fontSize}px`);
            localStorage.setItem('font_size', state.fontSize);
        });
    }

    renderSources();
    renderManagedCategories();

    const openBtn = document.getElementById('open-settings-btn');
    if (openBtn) {
        openBtn.onclick = () => document.getElementById('settings-view').classList.remove('hidden');
    }

    const closeBtn = document.getElementById('close-settings');
    if (closeBtn) {
        closeBtn.onclick = () => {
            document.getElementById('settings-view').classList.add('hidden');
            fetchAllNews();
        };
    }

    document.getElementById('add-source-btn').onclick = addSource;
    document.getElementById('add-category-btn').onclick = addCategory;
}

// Swipe to Close Implementation
function initSwipeToClose() {
    const sheet = document.getElementById('settings-view');
    let startY = 0;
    let currentY = 0;

    sheet.addEventListener('touchstart', (e) => {
        startY = e.touches[0].clientY;
    });

    sheet.addEventListener('touchmove', (e) => {
        currentY = e.touches[0].clientY;
        const diff = currentY - startY;
        if (diff > 0) { // Only swipe down
            sheet.style.transform = `translateY(${diff}px)`;
            sheet.style.transition = 'none';
        }
    });

    sheet.addEventListener('touchend', (e) => {
        const diff = currentY - startY;
        sheet.style.transition = 'transform 0.3s ease-out';
        if (diff > 150) {
            sheet.classList.add('hidden');
        }
        sheet.style.transform = '';
        startY = 0;
        currentY = 0;
    });
}

async function fetchAllNews() {
    const feed = document.getElementById('news-feed');
    // Skeleton Loading
    feed.innerHTML = Array(6).fill(0).map(() => `<div class="news-card skeleton skeleton-card"></div>`).join('');
    state.loading = true;

    try {
        const promises = state.sources.map(s => 
            fetch(`https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(s.url)}`).then(r => r.json())
        );
        const results = await Promise.all(promises);
        
        state.news = [];
        results.forEach((data, i) => {
            if (data.status === 'ok') {
                const items = data.items.map(item => ({
                    title: item.title,
                    source: state.sources[i].name,
                    summary: item.description.replace(/<[^>]*>?/gm, '').substring(0, 150) + '...',
                    content: item.content || item.description,
                    link: item.link,
                    pubDate: new Date(item.pubDate),
                    category: detectCategory(item.title + " " + (item.content || item.description))
                }));
                state.news = [...state.news, ...items];
            }
        });

        state.news.sort((a, b) => b.pubDate - a.pubDate);
        renderNews();
    } catch (e) {
        feed.innerHTML = '<div class="error">Qualcosa è andato storto. Controlla la tua connessione.</div>';
    } finally {
        state.loading = false;
    }
}

function detectCategory(text) {
    const t = text.toLowerCase();
    if (t.match(/tech|apple|google|chip|smartphone|app/)) return 'Tecnologia';
    if (t.match(/scienza|spazio|nasa|ricerca|medicina/)) return 'Scienza';
    if (t.match(/borse|mercati|economia|fisco|business/)) return 'Business';
    if (t.match(/design|grafica|minimalismo|architettura/)) return 'Design';
    return 'Tutte';
}

function renderCategories() {
    const container = document.getElementById('category-tabs');
    container.innerHTML = state.categories.map(c => `
        <div class="category-tab ${c === state.activeCategory ? 'active' : ''}" onclick="setCategory('${c}')">${c}</div>
    `).join('');
}

window.setCategory = (c) => {
    state.activeCategory = c;
    renderCategories();
    renderNews();
};

// Safe string escaping for HTML onclick events
function escapeString(str) {
    if (!str) return '';
    return str.replace(/\\/g, '\\\\')
              .replace(/'/g, "\\'")
              .replace(/"/g, '&quot;')
              .replace(/\n/g, ' ')
              .replace(/\r/g, ' ');
}

function renderNews() {
    const feed = document.getElementById('news-feed');
    const filtered = state.activeCategory === 'Tutte' ? state.news : state.news.filter(n => n.category === state.activeCategory);
    
    if (filtered.length === 0) {
        feed.innerHTML = '<div class="empty">Nessuna notizia trovata.</div>';
        return;
    }

    feed.innerHTML = filtered.map(n => {
        const safeTitle = escapeString(n.title);
        const safeSource = escapeString(n.source);
        const safeContent = escapeString(n.content);
        
        return `
            <div class="news-card" onclick="openArticle('${safeTitle}', '${safeSource}', '${safeContent}', '${n.link}')">
                <div class="card-header">
                    <span class="source">${n.source}</span>
                    <span class="gemini-tag">Gemini Summary</span>
                </div>
                <h2>${n.title}</h2>
                <p class="summary-preview">${n.summary}</p>
            </div>
        `;
    }).join('');
}

window.openArticle = async (title, source, content, link) => {
    const modal = document.getElementById('summary-modal');
    const modalBody = document.getElementById('modal-body');
    const badge = document.querySelector('.gemini-badge');

    badge.innerText = "Gemini Analysis";
    document.getElementById('modal-title').innerText = title;
    modalBody.innerHTML = `<div class="ai-pulse">✨ Gemini sta analizzando l'articolo...</div>`;
    modal.classList.remove('hidden');

    await new Promise(r => setTimeout(r, 800));

    // Clean HTML tags and entities
    const clean = content.replace(/<[^>]*>?/gm, '')
                         .replace(/&quot;/g, '"')
                         .replace(/&amp;/g, '&')
                         .replace(/&lt;/g, '<')
                         .replace(/&gt;/g, '>')
                         .trim() || "Contenuto non disponibile.";

    modalBody.innerHTML = `
        <div style="font-size:1.1em; line-height:1.6; white-space:pre-wrap; margin-bottom:20px;">${clean}</div>
        <div style="background:rgba(66,133,244,0.1); padding:12px; border-radius:12px; border-left:3px solid #4285f4; margin-bottom:20px;">
            <span style="color:#4285f4; font-weight:600; font-size:12px;">🤖 GEMINI:</span>
            <p style="margin:5px 0 0; font-size:13px; color:#aaa;">Ho rimosso il rumore visivo per te.</p>
        </div>
        <button onclick="openIframe('${link}')" class="primary-btn" style="margin-bottom:10px;">Browser In-App</button>
        <a href="${link}" target="_blank" style="display:block; text-align:center; color:#888; text-decoration:none; font-size:14px;">Apri in Safari</a>
    `;

    document.getElementById('close-modal').onclick = () => {
        modal.classList.add('hidden');
        document.getElementById('iframe-container').classList.add('hidden');
        document.getElementById('article-iframe').src = '';
    };
};

window.openIframe = (url) => {
    document.querySelector('.gemini-badge').innerText = "Browser In-App";
    const container = document.getElementById('iframe-container');
    const iframe = document.getElementById('article-iframe');
    iframe.src = url;
    container.classList.remove('hidden');
};

function renderSources() {
    const list = document.getElementById('sources-list');
    list.innerHTML = state.sources.map(s => `
        <div class="list-item">
            <span>${s.name}</span>
            <button onclick="removeSource(${s.id})">✕</button>
        </div>
    `).join('');
}

function addSource() {
    const input = document.getElementById('new-source-url');
    if (input.value) {
        try {
            state.sources.push({ id: Date.now(), name: new URL(input.value).hostname.replace('www.', ''), url: input.value });
            localStorage.setItem('news_sources', JSON.stringify(state.sources));
            renderSources();
            input.value = '';
        } catch(e) { alert("URL non valido"); }
    }
}

window.removeSource = (id) => {
    state.sources = state.sources.filter(s => s.id !== id);
    localStorage.setItem('news_sources', JSON.stringify(state.sources));
    renderSources();
};

function renderManagedCategories() {
    const list = document.getElementById('categories-list');
    list.innerHTML = state.categories.filter(c => c !== 'Tutte').map(c => `
        <div class="list-item">
            <span>${c}</span>
            <button onclick="removeCategory('${c}')">✕</button>
        </div>
    `).join('');
}

function addCategory() {
    const input = document.getElementById('new-category-name');
    if (input.value) {
        state.categories.push(input.value);
        localStorage.setItem('news_categories', JSON.stringify(state.categories));
        renderCategories();
        renderManagedCategories();
        input.value = '';
    }
}

window.removeCategory = (c) => {
    state.categories = state.categories.filter(cat => cat !== c);
    localStorage.setItem('news_categories', JSON.stringify(state.categories));
    renderCategories();
    renderManagedCategories();
};
