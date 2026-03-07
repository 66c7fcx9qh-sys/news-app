// App State
const state = {
    news: [],
    sources: JSON.parse(localStorage.getItem('news_sources')) || [
        { id: 1, name: 'BBC News', url: 'https://www.bbc.com/news' },
        { id: 2, name: 'The Verge', url: 'https://www.theverge.com' },
        { id: 3, name: 'Wired', url: 'https://www.wired.com' }
    ],
    categories: JSON.parse(localStorage.getItem('news_categories')) || ['Tutte', 'Tecnologia', 'Scienza', 'Business', 'Design'],
    activeCategory: 'Tutte',
    fontSize: localStorage.getItem('font_size') || 16
};

// Mock News Data (In a real app, this would be fetched from sources via a proxy)
const mockNews = [
    {
        title: "Nuova frontiera nel calcolo quantistico: traguardo raggiunto",
        source: "Scienza Oggi",
        category: "Scienza",
        summary: "I ricercatori hanno raggiunto un nuovo traguardo di stabilità nei qubit, promettendo di accelerare la ricerca medica.",
        content: "Oggi, i laboratori Quantum Dynamics hanno annunciato una scoperta rivoluzionaria. Utilizzando una nuova lega di superconduttori, il team è riuscito a mantenere la coerenza dei qubit per un tempo 10 volte superiore ai record precedenti. Questo significa che i calcoli complessi per la sintesi proteica potrebbero presto essere eseguiti in pochi minuti anziché anni, aprendo la strada a cure personalizzate per malattie rare. La comunità scientifica è in fermento, definendo questo il 'momento Apollo' del calcolo quantistico."
    },
    {
        title: "Apple annuncia i nuovi processori M4 con AI integrata",
        source: "Wired",
        category: "Tecnologia",
        summary: "I nuovi chip M4 puntano tutto sull'intelligenza artificiale generativa locale, con prestazioni Neural Engine raddoppiate.",
        content: "Cupertino ha appena svelato l'M4, l'ultimo chip al silicio progettato internamente. La novità principale è un Neural Engine a 32 core capace di gestire modelli linguistici di grandi dimensioni direttamente sul dispositivo, garantendo privacy e velocità senza precedenti. Tim Cook ha dichiarato che 'l'M4 segna una nuova era per il personal computing, dove l'AI non è solo una funzione, ma il cuore dell'esperienza'. I primi MacBook Pro con M4 arriveranno sul mercato il prossimo mese."
    },
    {
        title: "I mercati globali reagiscono ai nuovi dati sull'inflazione",
        source: "Business Insider",
        category: "Business",
        summary: "Borse in rialzo dopo i dati sull'inflazione più bassi del previsto, alimentando speranze di tagli ai tassi d'interesse.",
        content: "Gli indici Dow Jones e Nasdaq hanno chiuso in forte rialzo ieri, dopo che il rapporto sull'indice dei prezzi al consumo ha mostrato un rallentamento della crescita dei prezzi. Gli analisti prevedono ora che la Federal Reserve possa iniziare a tagliare i tassi d'interesse già dalla prossima riunione di giugno. Questo ottimismo ha spinto non solo i titoli tecnologici ma anche il settore immobiliare, che soffre particolarmente per gli alti costi del prestito. Resta però cautela sulle tensioni geopolitiche che potrebbero influenzare i prezzi dell'energia."
    },
    {
        title: "Design minimalista: perché meno è meglio nelle app moderne",
        source: "Design Week",
        category: "Design",
        summary: "Esaminiamo come la riduzione del rumore visivo stia migliorando la conversione e l'accessibilità nelle web app.",
        content: "Nel 2024, la tendenza del 'Less is More' è tornata prepotentemente alla ribalta. Dopo anni di design massimalisti e interfacce sature, gli utenti cercano chiarezza. Grandi aziende come Airbnb e Uber hanno semplificato ulteriormente le loro interfacce, concentrandosi sulla gerarchia tipografica e sugli spazi bianchi. Questo non è solo un cambio estetico: studi dimostrano che interfacce meno affollate riducono il carico cognitivo, rendendo le applicazioni più accessibili a persone con neurodiversità o disabilità visive."
    },
    {
        title: "SpaceX lancia con successo la missione Artemis III",
        source: "BBC News",
        category: "Scienza",
        summary: "Il razzo Starship ha completato il test cruciale per il prossimo allunaggio umano, superando le aspettative.",
        content: "In una notte stellata a Boca Chica, Starship ha acceso i suoi 33 motori Raptor portando con successo il modulo di allunaggio in orbita terrestre. Questo test era fondamentale per convalidare le procedure di rifornimento in orbita, l'ostacolo tecnico più grande per la missione Artemis III della NASA, che mira a riportare l'uomo sulla Luna nel 2026. Elon Musk ha twittato ringraziando il team per lo sforzo monumentale. Il prossimo passo sarà un test di rientro atmosferico ad alta quota previsto per l'estate."
    },
    {
        title: "L'impatto dei nuovi regolamenti europei sulla privacy",
        source: "The Verge",
        category: "Tecnologia",
        summary: "L'Unione Europea introduce nuove regole per limitare come le Big Tech possono profilare gli utenti per i feed.",
        content: "Il nuovo pacchetto di leggi sui mercati digitali (DMA) sta iniziando a produrre i suoi effetti. Da questa settimana, le piattaforme considerate 'gatekeeper' devono offrire agli utenti un'opzione chiara per un feed non personalizzato basato sulla profilazione. Questo mette in crisi il modello pubblicitario di molte aziende americane, ma viene salutato dai difensori dei diritti civili come una vittoria storica per la sovranità digitale dei cittadini. Le multe per chi non si adegua possono arrivare fino al 10% del fatturato globale annuo."
    }
];

// Initialize UI
document.addEventListener('DOMContentLoaded', () => {
    updateDate();
    initSettings();
    renderCategories();
    renderNews();
    setupNavigation();
});

function updateDate() {
    const options = { weekday: 'long', day: 'numeric', month: 'short' };
    document.getElementById('current-date').innerText = new Date().toLocaleDateString('it-IT', options);
}

function initSettings() {
    const fontSlider = document.getElementById('font-size');
    fontSlider.value = state.fontSize;
    document.documentElement.style.setProperty('--base-font-size', `${state.fontSize}px`);

    fontSlider.addEventListener('input', (e) => {
        state.fontSize = e.target.value;
        document.documentElement.style.setProperty('--base-font-size', `${state.fontSize}px`);
        localStorage.setItem('font_size', state.fontSize);
    });

    renderSources();
    renderManagedCategories();

    document.getElementById('add-source-btn').onclick = addSource;
    document.getElementById('add-category-btn').onclick = addCategory;
}

function renderCategories() {
    const container = document.getElementById('category-tabs');
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
    const filteredNews = state.activeCategory === 'Tutte'
        ? mockNews
        : mockNews.filter(n => n.category === state.activeCategory);

    feed.innerHTML = filteredNews.map(item => `
        <div class="news-card" onclick="showFullArticle('${item.title.replace(/'/g, "\\'")}', '${item.source.replace(/'/g, "\\'")}', '${item.content.replace(/'/g, "\\'").replace(/\n/g, "<br>")}')">
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
        document.getElementById(navId).addEventListener('click', () => {
            // Reset active tabs
            document.querySelectorAll('.tab-item').forEach(btn => btn.classList.remove('active'));
            document.getElementById(navId).classList.add('active');

            if (navId === 'nav-settings') {
                document.getElementById('settings-view').classList.remove('hidden');
            } else {
                document.getElementById('settings-view').classList.add('hidden');
            }
        });
    });

    document.getElementById('close-settings').onclick = () => {
        document.getElementById('settings-view').classList.add('hidden');
        document.getElementById('nav-home').classList.add('active');
        document.getElementById('nav-settings').classList.remove('active');
    };
}

// Full Article View logic
function showFullArticle(title, source, content) {
    const modal = document.getElementById('summary-modal');
    const modalTitle = document.getElementById('modal-title');
    const modalBody = document.getElementById('modal-body');

    // Update modal header for full news
    document.querySelector('.gemini-badge').innerText = "Notizia Completa";
    document.querySelector('.gemini-badge').classList.add('news-badge');

    modalTitle.innerText = title;
    modalBody.innerHTML = `
        <div class="article-meta">Fonte: <strong>${source}</strong></div>
        <div class="article-content">${content}</div>
    `;
    modal.classList.remove('hidden');

    document.getElementById('close-modal').onclick = () => {
        modal.classList.add('hidden');
        // Reset badge for next time if needed
        document.querySelector('.gemini-badge').innerText = "Gemini Summary";
        document.querySelector('.gemini-badge').classList.remove('news-badge');
    };
}

// Source Management
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
    const urlInput = document.getElementById('new-source-url');
    if (urlInput.value) {
        const id = Date.now();
        const name = new URL(urlInput.value).hostname.replace('www.', '');
        state.sources.push({ id, name, url: urlInput.value });
        localStorage.setItem('news_sources', JSON.stringify(state.sources));
        renderSources();
        urlInput.value = '';
    }
}

function removeSource(id) {
    state.sources = state.sources.filter(s => s.id !== id);
    localStorage.setItem('news_sources', JSON.stringify(state.sources));
    renderSources();
}

// Category Management
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
    const catInput = document.getElementById('new-category-name');
    if (catInput.value && !state.categories.includes(catInput.value)) {
        state.categories.push(catInput.value);
        localStorage.setItem('news_categories', JSON.stringify(state.categories));
        renderCategories();
        renderManagedCategories();
        catInput.value = '';
    }
}

function removeCategory(cat) {
    state.categories = state.categories.filter(c => c !== cat);
    localStorage.setItem('news_categories', JSON.stringify(state.categories));
    renderCategories();
    renderManagedCategories();
}
