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

// Initialize UI
document.addEventListener('DOMContentLoaded', () => {
    updateDate();
    initSettings();
    renderCategories();
    fetchAllNews();
    setupNavigation();
});

function updateDate() {
    const options = { weekday: 'long', day: 'numeric', month: 'short' };
    document.getElementById('current-date').innerText = new Date().toLocaleDateString('it-IT', options);
    updateGreeting();
}

function updateGreeting() {
    const hour = new Date().getHours();
    const greetingEl = document.getElementById('day-greeting');
    if (greetingEl) {
        if (hour >= 5 && hour < 18) {
            greetingEl.innerText = 'Good Morning';
        } else {
            greetingEl.innerText = 'Good Evening';
        }
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

    const addSourceBtn = document.getElementById('add-source-btn');
    if (addSourceBtn) addSourceBtn.onclick = addSource;
    
    const addCatBtn = document.getElementById('add-category-btn');
    if (addCatBtn) addCatBtn.onclick = addCategory;
}

// Real News Fetching Logic
async function fetchAllNews() {
    const feed = document.getElementById('news-feed');
    feed.innerHTML = '<div class="loader">Aggiornamento notizie...</div>';
    state.loading = true;

    try {
        const fetchPromises = state.sources.map(source => 
            fetch(`https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(source.url)}`)
                .then(res => res.json())
                .catch(() => ({ status: 'error' }))
        );

        const results = await Promise.all(fetchPromises);
        let allNews = [];

        results.forEach((data, index) => {
            if (data.status === 'ok') {
                const sourceName = state.sources[index].name;
                const items = data.items.map(item => ({
                    title: item.title,
                    source: sourceName,
                    summary: item.description.replace(/<[^>]*>?/gm, '').substring(0, 150) + '...',
                    content: item.content || item.description,
                    link: item.link,
                    pubDate: new Date(item.pubDate),
                    category: detectCategory(item.title + " " + (item.content || item.description))
                }));
                allNews = [...allNews, ...items];
            }
        });

        allNews.sort((a, b) => b.pubDate - a.pubDate);
        state.news = allNews;
        renderNews();
    } catch (err) {
        console.error("Fetch error:", err);
        feed.innerHTML = '<div class="error" style="padding:20px; color:#ff453a; text-align:center;">Impossibile caricare le notizie. Controlla la connessione o gli URL nelle impostazioni.</div>';
    } finally {
        state.loading = false;
    }
}

function detectCategory(text) {
    text = text.toLowerCase();
    if (text.includes('tech') || text.includes('apple') || text.includes('google') || text.includes('chip') || text.includes('smart') || text.includes('digitale')) return 'Tecnologia';
    if (text.includes('scienza') || text.includes('nasa') || text.includes('spazio') || text.includes('ricerca') || text.includes('astronomia')) return 'Scienza';
    if (text.includes('business') || text.includes('mercati') || text.includes('economia') || text.includes('finanza') || text.includes('dollaro')) return 'Business';
    if (text.includes('design') || text.includes('minimalismo') || text.includes('architettura') || text.includes('grafica')) return 'Design';
    return 'Tutte';
}

function renderCategories() {
    const container = document.getElementById('category-tabs');
    if (!container) return;
    container.innerHTML = state.categories.map(cat => `
        <div class="category-tab ${cat === state.activeCategory ? 'active' : ''}" onclick="setCategory('${cat}')">
            ${cat}
        </div>
    `).join('');
}

function setCategory(cat) {
    state.activeCategory = cat;
    renderCategories();
    renderNews();
}

function renderNews() {
    const feed = document.getElementById('news-feed');
    if (!feed) return;

    if (state.news.length === 0 && !state.loading) {
        feed.innerHTML = '<div class="empty-state" style="padding:40px; text-align:center; color:var(--text-muted);">Nessuna notizia trovata. Aggiungi URL validi di feed RSS nelle impostazioni.</div>';
        return;
    }

    const filteredNews = state.activeCategory === 'Tutte' 
        ? state.news 
        : state.news.filter(n => n.category === state.activeCategory);

    feed.innerHTML = filteredNews.map(item => `
        <div class="news-card" onclick="showFullArticle('${item.title.replace(/'/g, "\\'")}', '${item.source.replace(/'/g, "\\'")}', '${item.content.replace(/'/g, "\\'").replace(/\n/g, " ").replace(/"/g, '&quot;')}', '${item.link}')">
            <div class="card-header">
                <span class="source">${item.source}</span>
                <span class="gemini-tag">Gemini Summary</span>
            </div>
            <h2>${item.title}</h2>
            <p class="summary-preview">${item.summary}</p>
        </div>
    `).join('');
}

// Navigation Logic
function setupNavigation() {
    const views = {
        'nav-home': null, 
        'nav-settings': 'settings-view'
    };

    Object.keys(views).forEach(navId => {
        const el = document.getElementById(navId);
        if (el) {
            el.addEventListener('click', () => {
                document.querySelectorAll('.tab-item').forEach(btn => btn.classList.remove('active'));
                el.classList.add('active');

                if (navId === 'nav-settings') {
                    document.getElementById('settings-view').classList.remove('hidden');
                } else {
                    document.getElementById('settings-view').classList.add('hidden');
                    fetchAllNews();
                }
            });
        }
    });

    const closeBtn = document.getElementById('close-settings');
    if (closeBtn) {
        closeBtn.onclick = () => {
            document.getElementById('settings-view').classList.add('hidden');
            document.getElementById('nav-home').classList.add('active');
            document.getElementById('nav-settings').classList.remove('active');
            fetchAllNews();
        };
    }
}

// Full Article View logic (Enhanced with AI simulation)
async function showFullArticle(title, source, content, link) {
    const modal = document.getElementById('summary-modal');
    const modalTitle = document.getElementById('modal-title');
    const modalBody = document.getElementById('modal-body');
    const badge = document.querySelector('.gemini-badge');

    if (!modal || !modalTitle || !modalBody) return;

    badge.innerText = "Gemini Analysis";
    badge.classList.remove('news-badge');
    modalTitle.innerText = title;
    
    // Pulse animation while "Gemini" processes
    modalBody.innerHTML = `
        <div class="article-meta">Analisi dell'articolo da <strong>${source}</strong>...</div>
        <div class="ai-pulse">✨ Gemini sta estraendo i concetti chiave e rimuovendo il rumore visivo...</div>
    `;
    modal.classList.remove('hidden');

    // Simulate AI extraction time
    await new Promise(r => setTimeout(r, 1000));

    // Clean content
    let cleanContent = content
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove scripts
        .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')   // Remove styles
        .replace(/<[^>]*>?/gm, '') // Remove HTML tags
        .trim();

    if (cleanContent.length < 50) {
        cleanContent = "Gemini ha estratto il contenuto principale: " + cleanContent + " (Il feed fornisce solo un'anteprima limitata).";
    }

    modalBody.innerHTML = `
        <div class="article-meta">Fonte: <strong>${source}</strong></div>
        <div class="article-content" style="white-space: pre-wrap; font-size: 1.1em;">
            ${cleanContent}
            <br><br>
            <div style="background: rgba(66, 133, 244, 0.1); padding: 15px; border-radius: 12px; border-left: 4px solid var(--accent-gemini);">
                <p style="margin:0; font-size: 0.9em; color: var(--accent-gemini); font-weight:600;">🤖 Gemini Note:</p>
                <p style="margin:5px 0 0; font-size: 0.85em; color: #ccc;">Ho rimosso pubblicità e link superflui per una lettura pulita.</p>
            </div>
            <br>
            <a href="${link}" target="_blank" class="primary-btn" style="text-decoration:none; display:inline-block; margin-top:10px;">Apri Fonte Originale</a>
        </div>
    `;

    document.getElementById('close-modal').onclick = () => {
        modal.classList.add('hidden');
    };
}

// Source Management
function renderSources() {
    const list = document.getElementById('sources-list');
    if (!list) return;
    list.innerHTML = state.sources.map(s => `
        <div class="list-item">
            <div style="display:flex; flex-direction:column; max-width: 80%;">
                <span style="font-weight:600; overflow:hidden; text-overflow:ellipsis;">${s.name}</span>
                <span style="font-size:10px; color:var(--text-muted); overflow:hidden; text-overflow:ellipsis;">${s.url}</span>
            </div>
            <button onclick="removeSource(${s.id})">✕</button>
        </div>
    `).join('');
}

function addSource() {
    const urlInput = document.getElementById('new-source-url');
    if (urlInput.value) {
        try {
            const id = Date.now();
            let url = urlInput.value.trim();
            if (!url.startsWith('http')) url = 'https://' + url;
            
            const hostname = new URL(url).hostname.replace('www.', '');
            state.sources.push({ id, name: hostname, url: url });
            localStorage.setItem('news_sources', JSON.stringify(state.sources));
            renderSources();
            urlInput.value = '';
        } catch (e) {
            alert("URL non valido. Assicurati di inserire un link corretto.");
        }
    }
}

window.removeSource = function(id) {
    state.sources = state.sources.filter(s => s.id !== id);
    localStorage.setItem('news_sources', JSON.stringify(state.sources));
    renderSources();
};

// Category Management
function renderManagedCategories() {
    const list = document.getElementById('categories-list');
    if (!list) return;
    list.innerHTML = state.categories.filter(c => c !== 'Tutte').map(c => `
        <div class="list-item">
            <span>${c}</span>
            <button onclick="removeCategory('${c}')">✕</button>
        </div>
    `).join('');
}

function addCategory() {
    const catInput = document.getElementById('new-category-name');
    if (catInput.value && !state.categories.includes(catInput.value)) {
        state.categories.push(catInput.value);
        localStorage.setItem('news_categories', JSON.stringify(state.categories));
        renderCategories();
        renderManagedCategories();
        catInput.value = '';
    }
}

window.removeCategory = function(cat) {
    state.categories = state.categories.filter(c => c !== cat);
    localStorage.setItem('news_categories', JSON.stringify(state.categories));
    renderCategories();
    renderManagedCategories();
};
