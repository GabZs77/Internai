// ===================================================================
// Internet IA - Script Principal
// Plataforma completa de Inteligência Artificial
// ===================================================================

// ===== CONFIGURAÇÃO DA API =====
const API_CONFIG = {
    url: 'https://gen.pollinations.ai/v1/chat/completions',
    key: 'pk_bJav4nbMa2fZGkqG',
    model: 'openai',
    imageModel: 'flux',
    imageUrl: 'https://image.pollinations.ai/prompt/'
};

// ===== ESTADO DA APLICAÇÃO =====
const state = {
    conversations: [],
    currentConvId: null,
    isGenerating: false,
    abortController: null,
    sidebarOpen: window.innerWidth > 768,
    isRecording: false,
    mediaRecorder: null,
    audioChunks: [],
    attachedFiles: [],
    searchQuery: '',
    fullscreen: false
};

// ===== ELEMENTOS DO DOM =====
const $ = (s) => document.querySelector(s);
const $$ = (s) => document.querySelectorAll(s);

const DOM = {
    app: $('#app'),
    sidebar: $('#sidebar'),
    sidebarOverlay: $('#sidebar-overlay'),
    sidebarClose: $('#sidebar-close-btn'),
    sidebarToggle: $('#sidebar-toggle-btn'),
    sidebarSearch: $('#sidebar-search-input'),
    convList: $('#conv-list'),
    pinnedList: $('#pinned-list'),
    pinnedSection: $('#pinned-section'),
    favList: $('#fav-list'),
    favSection: $('#fav-section'),
    newChatBtn: $('#new-chat-btn'),
    mainTitle: $('#main-title'),
    statusDot: $('#status-dot'),
    statusText: $('#status-text'),
    msgCounter: $('#msg-counter'),
    messagesContainer: $('#messages-container'),
    messages: $('#messages'),
    welcome: $('#welcome'),
    suggestionsGrid: $('#suggestions-grid'),
    scrollBottomBtn: $('#scroll-bottom-btn'),
    messageInput: $('#message-input'),
    sendBtn: $('#send-btn'),
    stopBtn: $('#stop-btn'),
    attachBtn: $('#attach-btn'),
    voiceBtn: $('#voice-btn'),
    clearChatBtn: $('#clear-chat-btn'),
    charCount: $('#char-count'),
    filePreview: $('#file-preview'),
    fileInput: $('#file-input'),
    recordingIndicator: $('#recording-indicator'),
    stopRecordingBtn: $('#stop-recording-btn'),
    settingsBtn: $('#settings-btn'),
    settingsModal: $('#settings-modal'),
    settingsClose: $('#settings-close-btn'),
    searchChatBtn: $('#search-chat-btn'),
    searchInChat: $('#search-in-chat'),
    searchChatInput: $('#search-chat-input'),
    searchChatInfo: $('#search-chat-info'),
    fullscreenBtn: $('#fullscreen-btn'),
    exportMenuBtn: $('#export-menu-btn'),
    exportMenu: $('#export-menu'),
    exportAllBtn: $('#export-all-btn'),
    clearHistoryBtn: $('#clear-history-btn'),
    contextMenu: $('#context-menu'),
    toastContainer: $('#toast-container'),
    settingFont: $('#setting-font'),
    settingFontsize: $('#setting-fontsize'),
    settingExportAll: $('#setting-export-all'),
    settingClearCache: $('#setting-clear-cache'),
    settingDeleteAll: $('#setting-delete-all')
};

// ===== SUGESTÕES INICIAIS =====
const SUGGESTIONS = [
    { icon: 'code', title: 'Criar um código', desc: 'Gere código em qualquer linguagem' },
    { icon: 'book', title: 'Explicar um assunto', desc: 'Entenda qualquer tema em detalhes' },
    { icon: 'file-text', title: 'Fazer um resumo', desc: 'Resuma textos longos com clareza' },
    { icon: 'languages', title: 'Traduzir texto', desc: 'Traduza para qualquer idioma' },
    { icon: 'lightbulb', title: 'Gerar ideias', desc: 'Brainstorming criativo e original' },
    { icon: 'pen-tool', title: 'Escrever um artigo', desc: 'Artigos completos e bem estruturados' },
    { icon: 'clapperboard', title: 'Criar um roteiro', desc: 'Roteiros para vídeos e podcasts' },
    { icon: 'calculator', title: 'Resolver problemas', desc: 'Matemática, lógica e mais' },
    { icon: 'mail', title: 'Criar um e-mail', desc: 'E-mails profissionais e eficazes' },
    { icon: 'image', title: 'Gerar uma imagem', desc: 'Crie imagens com inteligência artificial' }
];

// ===== ÍCONES SVG =====
const ICONS = {
    code: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>',
    book: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/></svg>',
    'file-text': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>',
    languages: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 8l6 6"/><path d="M4 14l6-6 2-3"/><path d="M2 5h12"/><path d="M7 2h1"/><path d="M22 22l-5-10-5 10"/><path d="M14 18h6"/></svg>',
    lightbulb: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18h6"/><path d="M10 22h4"/><path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0018 8 6 6 0 006 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 019 14"/></svg>',
    'pen-tool': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19l7-7 3 3-7 7-3-3z"/><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/><path d="M2 2l7.586 7.586"/><circle cx="11" cy="11" r="2"/></svg>',
    clapperboard: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.2 6l-2-2-5 5"/><path d="M4 4h4l2 2-4 4H4z"/><path d="M4 8v12a2 2 0 002 2h12a2 2 0 002-2V8"/><path d="M4 8h16"/></svg>',
    calculator: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="2" width="16" height="20" rx="2"/><line x1="8" y1="6" x2="16" y2="6"/><line x1="16" y1="14" x2="16" y2="18"/><line x1="8" y1="10" x2="8" y2="10.01"/><line x1="12" y1="10" x2="12" y2="10.01"/><line x1="16" y1="10" x2="16" y2="10.01"/><line x1="8" y1="14" x2="8" y2="14.01"/><line x1="12" y1="14" x2="12" y2="14.01"/><line x1="8" y1="18" x2="8" y2="18.01"/><line x1="12" y1="18" x2="12" y2="18.01"/></svg>',
    mail: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>',
    image: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>',
    chat: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>',
    pin: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 17v5"/><path d="M9 10.76a2 2 0 01-1.11 1.79l-1.78.9A2 2 0 005 15.24V17h14v-1.76a2 2 0 00-1.11-1.79l-1.78-.9A2 2 0 0115 10.76V7a1 1 0 00-1-1h-4a1 1 0 00-1 1z"/><path d="M12 2a3 3 0 00-3 3v1h6V5a3 3 0 00-3-3z"/></svg>',
    star: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>',
    copy: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>',
    refresh: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 11-2.12-9.36L23 10"/></svg>',
    share: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>',
    thumbsUp: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 9V5a3 3 0 00-3-3l-4 9v11h11.28a2 2 0 002-1.7l1.38-9a2 2 0 00-2-2.3zM7 22H4a2 2 0 01-2-2v-7a2 2 0 012-2h3"/></svg>',
    thumbsDown: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 15v4a3 3 0 003 3l4-9V2H5.72a2 2 0 00-2 1.7l-1.38 9a2 2 0 002 2.3zm7-13h2.67A2.31 2.31 0 0122 4v7a2.31 2.31 0 01-2.33 2H17"/></svg>',
    volume: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 010 14.14M15.54 8.46a5 5 0 010 7.07"/></svg>',
    edit: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>',
    trash: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>',
    download: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>',
    chevronDown: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>',
    chevronUp: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="18 15 12 9 6 15"/></svg>',
    maximize: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></svg>',
    minimize: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="4 14 10 14 10 20"/><polyline points="20 10 14 10 14 4"/><line x1="14" y1="10" x2="21" y2="3"/><line x1="3" y1="21" x2="10" y2="14"/></svg>',
    check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>',
    x: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',
    alert: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>',
    info: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>',
    file: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V9z"/><polyline points="13 2 13 9 20 9"/></svg>',
    flag: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg>'
};

// ===== UTILITÁRIOS =====
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

function formatDate(ts) {
    const d = new Date(ts);
    const now = new Date();
    const diff = now - d;
    if (diff < 60000) return 'Agora';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}min atrás`;
    if (diff < 86400000) return `Hoje, ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
    if (diff < 172800000) return `Ontem, ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
    return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function estimateTokens(text) {
    return Math.ceil(text.length / 3.5);
}

function truncateText(text, max) {
    return text.length > max ? text.substring(0, max) + '...' : text;
}

// ===== SISTEMA DE TOAST =====
function showToast(message, type = 'info') {
    const iconMap = {
        success: ICONS.check,
        error: ICONS.x,
        info: ICONS.info
    };
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `${iconMap[type] || iconMap.info}<span>${escapeHtml(message)}</span>`;
    DOM.toastContainer.appendChild(toast);
    setTimeout(() => {
        toast.classList.add('removing');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// ===== PARSER DE MARKDOWN =====
function parseMarkdown(text) {
    // Tratar caixas informativas
    text = text.replace(/>\s*\[!(info|warning|success|error)\]\s*(.*?)(?=\n|$)/gi, (m, type, content) => {
        return `<div class="info-box ${type.toLowerCase()}">${parseInline(content)}</div>`;
    });

    // Blocos de código
    text = text.replace(/```(\w*)\n([\s\S]*?)```/g, (match, lang, code) => {
        const id = generateId();
        const lines = code.trim().split('\n');
        const lineCount = lines.length;
        const highlighted = highlightSyntax(escapeHtml(code.trim()), lang);
        return `<div class="code-block-wrapper" data-code-id="${id}">
            <div class="code-block-header">
                <span class="code-block-lang">${lang || 'código'}</span>
                <div class="code-block-actions">
                    <button onclick="copyCode('${id}')" title="Copiar código">Copiar</button>
                </div>
            </div>
            <div class="code-block-body" id="code-body-${id}" style="${lineCount > 15 ? '' : ''}">
                <pre>${highlighted}</pre>
            </div>
            ${lineCount > 15 ? `<div class="code-block-toggle" onclick="toggleCode('${id}', this)">${ICONS.chevronDown} Expandir</div>` : ''}
        </div>`;
    });

    // Código inline
    text = text.replace(/`([^`]+)`/g, '<code>$1</code>');

    // Tabelas
    text = text.replace(/^(\|.+\|)\n(\|[-| :]+\|)\n((?:\|.+\|\n?)*)/gm, (match, header, sep, body) => {
        const headers = header.split('|').filter(c => c.trim()).map(c => `<th>${parseInline(c.trim())}</th>`).join('');
        const rows = body.trim().split('\n').map(row => {
            const cells = row.split('|').filter(c => c.trim()).map(c => `<td>${parseInline(c.trim())}</td>`).join('');
            return `<tr>${cells}</tr>`;
        }).join('');
        return `<table><thead><tr>${headers}</tr></thead><tbody>${rows}</tbody></table>`;
    });

    // Cabeçalhos
    text = text.replace(/^#### (.+)$/gm, '<h4>$1</h4>');
    text = text.replace(/^### (.+)$/gm, '<h3>$1</h3>');
    text = text.replace(/^## (.+)$/gm, '<h2>$1</h2>');
    text = text.replace(/^# (.+)$/gm, '<h1>$1</h1>');

    // Linha horizontal
    text = text.replace(/^---$/gm, '<hr>');

    // Blockquotes
    text = text.replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>');

    // Listas ordenadas
    text = text.replace(/^(\d+)\.\s+(.+)$/gm, '<li>$2</li>');

    // Listas não ordenadas
    text = text.replace(/^[-*]\s+(.+)$/gm, '<li>$1</li>');

    // Agrupar LIs em UL
    text = text.replace(/((?:<li>.*<\/li>\n?)+)/g, '<ul>$1</ul>');

    // Parágrafos
    text = text.replace(/\n\n/g, '</p><p>');
    text = text.replace(/\n/g, '<br>');

    // Inline
    text = parseInline(text);

    // Limpar
    text = text.replace(/<p><(h[1-4]|ul|ol|blockquote|div|table|hr|pre)/g, '<$1');
    text = text.replace(/<\/(h[1-4]|ul|ol|blockquote|div|table|pre)><\/p>/g, '</$1>');
    text = text.replace(/<p><\/p>/g, '');

    return `<p>${text}</p>`;
}

function parseInline(text) {
    // Imagens
    text = text.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1">');
    // Links
    text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
    // Negrito
    text = text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    // Itálico
    text = text.replace(/\*(.+?)\*/g, '<em>$1</em>');
    // Tachado
    text = text.replace(/~~(.+?)~~/g, '<del>$1</del>');
    return text;
}

// ===== DESTAQUE DE SINTAXE =====
function highlightSyntax(code, lang) {
    lang = (lang || '').toLowerCase();
    // Regex genérico para sintaxe
    const rules = [
        { regex: /\/\/.*$/gm, class: 'c1' },          // Comentários linha
        { regex: /\/\*[\s\S]*?\*\//g, class: 'c1' },  // Comentários bloco
        { regex: /#.*$/gm, class: 'c1' },              // Comentários Python/Shell
        { regex: /<!--[\s\S]*?-->/g, class: 'c1' },   // Comentários HTML
        { regex: /("(?:[^"\\]|\\.)*")/g, class: 's1' }, // Strings duplas
        { regex: /('(?:[^'\\]|\\.)*')/g, class: 's1' }, // Strings simples
        { regex: /(`(?:[^`\\]|\\.)*`)/g, class: 's1' }, // Template literals
        { regex: /\b(\d+\.?\d*)\b/g, class: 'n1' },   // Números
        { regex: /\b(true|false|null|undefined|None|True|False|NaN|Infinity)\b/g, class: 'k2' },
        { regex: /\b(const|let|var|function|return|if|else|for|while|do|switch|case|break|continue|class|import|export|from|default|new|this|super|extends|async|await|try|catch|finally|throw|typeof|instanceof|in|of|yield|delete|void|with|debugger|static|get|set)\b/g, class: 'k1' },
        { regex: /\b(def|print|self|elif|lambda|pass|raise|except|finally|global|nonlocal|assert|with|as|is|not|and|or)\b/g, class: 'k1' },
        { regex: /\b(SELECT|FROM|WHERE|INSERT|INTO|VALUES|UPDATE|SET|DELETE|CREATE|TABLE|ALTER|DROP|INDEX|JOIN|LEFT|RIGHT|INNER|OUTER|ON|AND|OR|NOT|NULL|IS|IN|LIKE|BETWEEN|ORDER|BY|GROUP|HAVING|LIMIT|OFFSET|AS|DISTINCT|COUNT|SUM|AVG|MAX|MIN|UNION|ALL|EXISTS|CASE|WHEN|THEN|ELSE|END|PRIMARY|KEY|FOREIGN|REFERENCES|CONSTRAINT|DEFAULT|CHECK|UNIQUE|CASCADE)\b/gi, class: 'k1' },
        { regex: /\b(int|float|double|long|short|byte|char|boolean|String|Integer|Float|Double|Long|Short|Byte|Character|Boolean|void|public|private|protected|static|final|abstract|interface|implements|package|throws|synchronized|volatile|transient|native|enum|assert)\b/g, class: 'k1' },
    ];

    let result = code;
    // Aplicar regras com proteção
    rules.forEach(rule => {
        result = result.replace(rule.regex, (match) => {
            return `<span class="hl-${rule.class}">${match}</span>`;
        });
    });

    // Adicionar numeração de linhas
    const lines = result.split('\n');
    return lines.map(line => `<span class="code-line">${line || ' '}</span>`).join('\n');
}

// ===== ESTILOS DE SYNTAX HIGHLIGHTING (injetados) =====
(function injectHighlightStyles() {
    const style = document.createElement('style');
    style.textContent = `
        .hl-k1{color:#c678dd}.hl-k2{color:#d19a66}.hl-s1{color:#98c379}
        .hl-n1{color:#d19a66}.hl-c1{color:#5c6370;font-style:italic}
    `;
    document.head.appendChild(style);
})();

// ===== GERENCIAMENTO DE CONVERSAS =====
function createConversation() {
    const conv = {
        id: generateId(),
        title: 'Nova conversa',
        messages: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
        pinned: false,
        favorited: false
    };
    state.conversations.unshift(conv);
    saveConversations();
    switchConversation(conv.id);
    renderSidebar();
    return conv;
}

function getCurrentConversation() {
    return state.conversations.find(c => c.id === state.currentConvId);
}

function switchConversation(id) {
    state.currentConvId = id;
    const conv = getCurrentConversation();
    DOM.mainTitle.textContent = conv ? conv.title : 'Internet IA';
    renderMessages();
    renderSidebar();
    closeSidebarMobile();
}

function deleteConversation(id) {
    state.conversations = state.conversations.filter(c => c.id !== id);
    if (state.currentConvId === id) {
        state.currentConvId = null;
        showWelcome();
    }
    saveConversations();
    renderSidebar();
    showToast('Conversa excluída', 'success');
}

function renameConversation(id, newTitle) {
    const conv = state.conversations.find(c => c.id === id);
    if (conv) {
        conv.title = newTitle;
        conv.updatedAt = Date.now();
        if (id === state.currentConvId) DOM.mainTitle.textContent = newTitle;
        saveConversations();
        renderSidebar();
    }
}

function togglePin(id) {
    const conv = state.conversations.find(c => c.id === id);
    if (conv) {
        conv.pinned = !conv.pinned;
        saveConversations();
        renderSidebar();
        showToast(conv.pinned ? 'Conversa fixada' : 'Conversa desafixada', 'success');
    }
}

function toggleFavorite(id) {
    const conv = state.conversations.find(c => c.id === id);
    if (conv) {
        conv.favorited = !conv.favorited;
        saveConversations();
        renderSidebar();
        showToast(conv.favorited ? 'Adicionada aos favoritos' : 'Removida dos favoritos', 'success');
    }
}

function saveConversations() {
    try {
        localStorage.setItem('internet_ia_conversations', JSON.stringify(state.conversations));
    } catch (e) {
        console.warn('Erro ao salvar conversas:', e);
    }
}

function loadConversations() {
    try {
        const data = localStorage.getItem('internet_ia_conversations');
        if (data) {
            state.conversations = JSON.parse(data);
        }
    } catch (e) {
        console.warn('Erro ao carregar conversas:', e);
        state.conversations = [];
    }
}

// ===== RENDERIZAÇÃO DA SIDEBAR =====
function renderSidebar() {
    const query = DOM.sidebarSearch.value.toLowerCase();

    // Fixadas
    const pinned = state.conversations.filter(c => c.pinned && (!query || c.title.toLowerCase().includes(query)));
    DOM.pinnedSection.style.display = pinned.length ? 'block' : 'none';
    DOM.pinnedList.innerHTML = pinned.map(c => renderConvItem(c)).join('');

    // Favoritas
    const favs = state.conversations.filter(c => c.favorited && !c.pinned && (!query || c.title.toLowerCase().includes(query)));
    DOM.favSection.style.display = favs.length ? 'block' : 'none';
    DOM.favList.innerHTML = favs.map(c => renderConvItem(c)).join('');

    // Normais
    const normal = state.conversations.filter(c => !c.pinned && !c.favorited && (!query || c.title.toLowerCase().includes(query)));
    DOM.convList.innerHTML = normal.length ? normal.map(c => renderConvItem(c)).join('') :
        (query ? '<div style="padding:16px;text-align:center;font-size:12px;color:var(--text-tertiary)">Nenhum resultado</div>' :
        '<div style="padding:16px;text-align:center;font-size:12px;color:var(--text-tertiary)">Nenhuma conversa ainda</div>');
}

function renderConvItem(conv) {
    const active = conv.id === state.currentConvId ? 'active' : '';
    return `<div class="conv-item ${active}" data-id="${conv.id}" onclick="switchConversation('${conv.id}')">
        <span class="conv-icon">${ICONS.chat}</span>
        <span class="conv-title">${escapeHtml(truncateText(conv.title, 30))}</span>
        ${conv.pinned ? `<span class="conv-pin active">${ICONS.pin}</span>` : ''}
        ${conv.favorited ? `<span class="conv-fav active">${ICONS.star}</span>` : ''}
        <div class="conv-actions">
            <button class="conv-action-btn" onclick="event.stopPropagation();togglePin('${conv.id}')" title="${conv.pinned ? 'Desafixar' : 'Fixar'}">${ICONS.pin}</button>
            <button class="conv-action-btn" onclick="event.stopPropagation();toggleFavorite('${conv.id}')" title="${conv.favorited ? 'Remover favorito' : 'Favoritar'}">${ICONS.star}</button>
            <button class="conv-action-btn" onclick="event.stopPropagation();showConvContextMenu(event,'${conv.id}')" title="Mais opções">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="5" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="12" cy="19" r="1"/></svg>
            </button>
        </div>
    </div>`;
}

// ===== CONTEXTO MENU =====
function showConvContextMenu(e, convId) {
    e.preventDefault();
    const conv = state.conversations.find(c => c.id === convId);
    if (!conv) return;
    DOM.contextMenu.innerHTML = `
        <div class="context-menu-item" onclick="promptRename('${convId}')">${ICONS.edit} Renomear</div>
        <div class="context-menu-item" onclick="togglePin('${convId}')">${ICONS.pin} ${conv.pinned ? 'Desafixar' : 'Fixar'}</div>
        <div class="context-menu-item" onclick="toggleFavorite('${convId}')">${ICONS.star} ${conv.favorited ? 'Remover favorito' : 'Favoritar'}</div>
        <div class="context-menu-sep"></div>
        <div class="context-menu-item danger" onclick="deleteConversation('${convId}')">${ICONS.trash} Excluir</div>
    `;
    showContextMenu(e);
}

function showMsgContextMenu(e, msgIndex, role) {
    e.preventDefault();
    const conv = getCurrentConversation();
    if (!conv) return;
    const isUser = role === 'user';
    let items = '';

    if (isUser) {
        items = `
            <div class="context-menu-item" onclick="editMessage(${msgIndex})">${ICONS.edit} Editar pergunta</div>
            <div class="context-menu-item" onclick="copyMessageText(${msgIndex})">${ICONS.copy} Copiar pergunta</div>
            <div class="context-menu-item" onclick="resendMessage(${msgIndex})">${ICONS.refresh} Reenviar</div>
            <div class="context-menu-sep"></div>
            <div class="context-menu-item danger" onclick="deleteMessage(${msgIndex})">${ICONS.trash} Excluir</div>
        `;
    } else {
        items = `
            <div class="context-menu-item" onclick="copyMessageText(${msgIndex})">${ICONS.copy} Copiar texto</div>
            <div class="context-menu-item" onclick="copyMessageMarkdown(${msgIndex})">${ICONS.copy} Copiar Markdown</div>
            <div class="context-menu-item" onclick="exportSingleMessage(${msgIndex},'txt')">${ICONS.download} Exportar TXT</div>
            <div class="context-menu-item" onclick="exportSingleMessage(${msgIndex},'pdf')">${ICONS.download} Exportar PDF</div>
            <div class="context-menu-sep"></div>
            <div class="context-menu-item" onclick="regenerateMessage(${msgIndex})">${ICONS.refresh} Regenerar</div>
            <div class="context-menu-item danger" onclick="flagMessage(${msgIndex})">${ICONS.flag} Denunciar</div>
        `;
    }
    DOM.contextMenu.innerHTML = items;
    showContextMenu(e);
}

function showContextMenu(e) {
    DOM.contextMenu.classList.add('active');
    const x = Math.min(e.clientX, window.innerWidth - 200);
    const y = Math.min(e.clientY, window.innerHeight - 200);
    DOM.contextMenu.style.left = x + 'px';
    DOM.contextMenu.style.top = y + 'px';
}

function hideContextMenu() {
    DOM.contextMenu.classList.remove('active');
}

// ===== RENAME PROMPT =====
function promptRename(convId) {
    hideContextMenu();
    const conv = state.conversations.find(c => c.id === convId);
    if (!conv) return;
    // Criar input inline
    const item = document.querySelector(`.conv-item[data-id="${convId}"] .conv-title`);
    if (!item) return;
    const original = conv.title;
    item.innerHTML = `<input type="text" value="${escapeHtml(original)}" style="width:100%;padding:2px 4px;font-size:13px;background:var(--bg-glass);border:1px solid var(--border-hover);border-radius:4px;color:var(--text-primary);font-family:var(--font)" id="rename-input">`;
    const input = $('#rename-input');
    input.focus();
    input.select();
    const finish = () => {
        const val = input.value.trim();
        renameConversation(convId, val || original);
    };
    input.addEventListener('blur', finish);
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') { e.preventDefault(); input.blur(); }
        if (e.key === 'Escape') { input.value = original; input.blur(); }
    });
}

// ===== RENDERIZAÇÃO DE MENSAGENS =====
function renderMessages() {
    const conv = getCurrentConversation();
    if (!conv || conv.messages.length === 0) {
        showWelcome();
        return;
    }
    DOM.welcome.style.display = 'none';
    DOM.messages.style.display = 'block';
    DOM.messages.innerHTML = conv.messages.map((msg, i) => renderMessage(msg, i)).join('');
    updateMsgCounter();
    scrollToBottom();
}

function renderMessage(msg, index) {
    const isUser = msg.role === 'user';
    const time = msg.timestamp ? formatDate(msg.timestamp) : '';
    const avatar = isUser
        ? `<div class="msg-avatar user">U</div>`
        : `<div class="msg-avatar ai">${ICONS.chat}</div>`;

    let content = '';
    if (isUser) {
        content = `<div class="msg-content"><p>${escapeHtml(msg.content).replace(/\n/g, '<br>')}</p></div>`;
    } else {
        content = `<div class="msg-content" id="msg-content-${index}">${parseMarkdown(msg.content)}</div>`;
        // Arquivos gerados
        if (msg.generatedFiles && msg.generatedFiles.length) {
            content += `<div style="margin-top:8px">${msg.generatedFiles.map(f => renderGeneratedFile(f)).join('')}</div>`;
        }
        // Imagens geradas
        if (msg.generatedImages && msg.generatedImages.length) {
            content += msg.generatedImages.map(img => renderGeneratedImage(img)).join('');
        }
    }

    // Ações do usuário
    let userActions = '';
    if (isUser) {
        userActions = `<div class="msg-actions">
            <button class="msg-action-btn" onclick="editMessage(${index})" title="Editar">${ICONS.edit}<span>Editar</span></button>
            <button class="msg-action-btn" onclick="copyMessageText(${index})" title="Copiar">${ICONS.copy}<span>Copiar</span></button>
            <button class="msg-action-btn" onclick="resendMessage(${index})" title="Reenviar">${ICONS.refresh}<span>Reenviar</span></button>
            <button class="msg-action-btn" onclick="deleteMessage(${index})" title="Excluir">${ICONS.trash}<span>Excluir</span></button>
        </div>`;
    }

    // Ações da IA
    let aiActions = '';
    if (!isUser) {
        aiActions = `<div class="msg-actions">
            <button class="msg-action-btn" onclick="copyMessageText(${index})" title="Copiar texto">${ICONS.copy}<span>Copiar</span></button>
            <button class="msg-action-btn" onclick="copyMessageMarkdown(${index})" title="Copiar Markdown">${ICONS.copy}<span>Markdown</span></button>
            <button class="msg-action-btn" onclick="regenerateMessage(${index})" title="Regenerar">${ICONS.refresh}<span>Regenerar</span></button>
            <button class="msg-action-btn" onclick="shareMessage(${index})" title="Compartilhar">${ICONS.share}<span>Compartilhar</span></button>
            <button class="msg-action-btn" onclick="rateMessage(${index},'up')" title="Bom">${ICONS.thumbsUp}<span>Bom</span></button>
            <button class="msg-action-btn" onclick="rateMessage(${index},'down')" title="Ruim">${ICONS.thumbsDown}<span>Ruim</span></button>
            <button class="msg-action-btn" onclick="speakMessage(${index})" title="Ouvir">${ICONS.volume}<span>Ouvir</span></button>
            <button class="msg-action-btn" onclick="exportSingleMessage(${index},'txt')" title="Exportar TXT">${ICONS.download}<span>TXT</span></button>
            <button class="msg-action-btn" onclick="exportSingleMessage(${index},'pdf')" title="Exportar PDF">${ICONS.download}<span>PDF</span></button>
            <button class="msg-action-btn" onclick="toggleExpandMsg(${index})" title="Expandir/Recolher" id="expand-btn-${index}">${ICONS.chevronDown}<span>Expandir</span></button>
            <button class="msg-action-btn" onclick="flagMessage(${index})" title="Denunciar">${ICONS.flag}<span>Denunciar</span></button>
        </div>`;
        // Meta info
        const tokens = estimateTokens(msg.content);
        const responseTime = msg.responseTime ? `${msg.responseTime}s` : '';
        let meta = [];
        if (responseTime) meta.push(`Tempo: ${responseTime}`);
        if (tokens) meta.push(`Tokens: ~${tokens}`);
        if (meta.length) {
            aiActions += `<div class="msg-meta">${meta.join(' · ')}</div>`;
        }
    }

    return `<div class="message" data-index="${index}" oncontextmenu="showMsgContextMenu(event, ${index}, '${msg.role}')">
        ${avatar}
        <div class="msg-body">
            <div class="msg-header">
                <span class="msg-name">${isUser ? 'Você' : 'Internet IA'}</span>
                ${time ? `<span class="msg-time">${time}</span>` : ''}
            </div>
            ${content}
            ${isUser ? userActions : aiActions}
        </div>
    </div>`;
}

function renderGeneratedFile(file) {
    const ext = file.filename.split('.').pop().toUpperCase();
    const icon = ICONS.file;
    return `<div class="generated-file" onclick="downloadGeneratedFile('${file.id}')">
        ${icon}
        <span>${escapeHtml(file.filename)}</span>
        <span style="opacity:0.5">(${ext})</span>
    </div>`;
}

function renderGeneratedImage(img) {
    return `<div class="generated-image">
        <img src="${img.url}" alt="${escapeHtml(img.prompt)}" loading="lazy">
        <div class="generated-image-actions">
            <button onclick="window.open('${img.url}','_blank')">Abrir</button>
            <button onclick="downloadImage('${img.url}','internet-ia-image.png')">Baixar</button>
        </div>
    </div>`;
}

// ===== WELCOME SCREEN =====
function showWelcome() {
    DOM.welcome.style.display = 'flex';
    DOM.messages.style.display = 'none';
    DOM.mainTitle.textContent = 'Internet IA';
    updateMsgCounter();
}

function renderSuggestions() {
    DOM.suggestionsGrid.innerHTML = SUGGESTIONS.map(s => `
        <div class="suggestion-card" onclick="sendSuggestion('${escapeHtml(s.title)}')">
            <span style="width:18px;height:18px;opacity:0.5">${ICONS[s.icon] || ICONS.chat}</span>
            <span class="s-title">${s.title}</span>
            <span class="s-desc">${s.desc}</span>
        </div>
    `).join('');
}

function sendSuggestion(title) {
    DOM.messageInput.value = title;
    updateCharCount();
    handleSend();
}

// ===== API - ENVIO DE MENSAGENS =====
async function sendMessage(content) {
    // Criar conversa se não existir
    if (!state.currentConvId) {
        createConversation();
    }
    const conv = getCurrentConversation();
    if (!conv) return;

    // Adicionar mensagem do usuário
    const userMsg = {
        role: 'user',
        content: content,
        timestamp: Date.now()
    };

    // Adicionar conteúdo de arquivos anexados
    if (state.attachedFiles.length > 0) {
        const fileContents = await readAttachedFiles();
        if (fileContents) {
            userMsg.content += '\n\n---\nArquivos anexados:\n' + fileContents;
        }
        clearAttachedFiles();
    }

    conv.messages.push(userMsg);

    // Gerar título automaticamente
    if (conv.messages.length === 1) {
        conv.title = truncateText(content, 40);
        DOM.mainTitle.textContent = conv.title;
    }
    conv.updatedAt = Date.now();

    renderMessages();
    saveConversations();
    renderSidebar();

    // Mostrar indicador de digitação
    showTypingIndicator();
    setGenerating(true);

    const startTime = Date.now();

    try {
        // Verificar se é pedido de imagem
        if (isImageRequest(content)) {
            await handleImageGeneration(content, conv, startTime);
            return;
        }

        // Preparar mensagens para a API
        const apiMessages = conv.messages.map(m => ({
            role: m.role,
            content: m.content
        }));

        // Adicionar system prompt para gerar arquivos
        const systemPrompt = {
            role: 'system',
            content: `Você é a Internet IA, um assistente de inteligência artificial avançado, útil e preciso. 
Responda sempre em português brasileiro, a menos que o usuário peça outro idioma.
Formate suas respostas usando Markdown quando apropriado.
Use blocos de código com a linguagem especificada.
Quando o usuário pedir para gerar arquivos, use o formato especial:
[ARQUIVO: nome.ext] conteúdo aqui [/ARQUIVO]
Tipos suportados: .txt, .md, .pdf, .docx, .xlsx, .pptx
Para .xlsx, gere dados em formato de tabela que será convertida para Excel.
Para .pptx, gere slides no formato:
[SLIDE: Título do Slide]
Conteúdo do slide
[/SLIDE]
Para .docx, escreva o conteúdo normalmente.
Para PDF, escreva o conteúdo normalmente.
Seja preciso, detalhado e profissional.`
        };

        state.abortController = new AbortController();

        const response = await fetch(API_CONFIG.url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${API_CONFIG.key}`
            },
            body: JSON.stringify({
                model: API_CONFIG.model,
                messages: [systemPrompt, ...apiMessages],
                stream: true
            }),
            signal: state.abortController.signal
        });

        if (!response.ok) {
            throw new Error(`Erro na API: ${response.status}`);
        }

        // Remover indicador de digitação
        hideTypingIndicator();

        // Criar mensagem da IA vazia
        const aiMsg = {
            role: 'assistant',
            content: '',
            timestamp: Date.now(),
            responseTime: 0,
            generatedFiles: [],
            generatedImages: []
        };
        conv.messages.push(aiMsg);
        const aiIndex = conv.messages.length - 1;

        // Stream de resposta
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        let fullContent = '';

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
                const trimmed = line.trim();
                if (!trimmed || !trimmed.startsWith('data:')) continue;
                const data = trimmed.slice(5).trim();
                if (data === '[DONE]') continue;

                try {
                    const json = JSON.parse(data);
                    const delta = json.choices?.[0]?.delta?.content;
                    if (delta) {
                        fullContent += delta;
                        aiMsg.content = fullContent;
                        updateStreamingMessage(aiIndex, fullContent);
                    }
                } catch (e) { /* ignorar erros de parse */ }
            }
        }

        // Finalizar mensagem
        aiMsg.content = fullContent;
        aiMsg.responseTime = ((Date.now() - startTime) / 1000).toFixed(1);

        // Processar arquivos gerados
        aiMsg.generatedFiles = processGeneratedFiles(fullContent);
        if (aiMsg.generatedFiles.length > 0) {
            aiMsg.content = fullContent.replace(/\[ARQUIVO:[^\]]*\][\s\S]*?\[\/ARQUIVO\]/g, '').trim();
        }

        saveConversations();
        renderMessages();
        setGenerating(false);
        setApiStatus(true);

    } catch (error) {
        hideTypingIndicator();
        setGenerating(false);

        if (error.name === 'AbortError') {
            showToast('Geração interrompida', 'info');
            saveConversations();
            renderMessages();
            return;
        }

        setApiStatus(false);
        const errorMsg = {
            role: 'assistant',
            content: `Desculpe, ocorreu um erro ao processar sua mensagem.\n\n**Erro:** ${error.message}\n\nPor favor, verifique sua conexão e tente novamente.`,
            timestamp: Date.now(),
            responseTime: ((Date.now() - startTime) / 1000).toFixed(1),
            generatedFiles: [],
            generatedImages: []
        };
        conv.messages.push(errorMsg);
        saveConversations();
        renderMessages();
        showToast('Erro na conexão com a API', 'error');
    }
}

// ===== STREAMING DE MENSAGEM =====
function updateStreamingMessage(index, content) {
    const el = document.getElementById(`msg-content-${index}`);
    if (!el) {
        // Re-renderizar se não existir
        const conv = getCurrentConversation();
        if (conv && conv.messages[index]) {
            renderMessages();
            scrollToBottom();
        }
        return;
    }
    el.innerHTML = parseMarkdown(content);
    scrollToBottom();
}

// ===== INDICADOR DE DIGITAÇÃO =====
function showTypingIndicator() {
    const existing = document.querySelector('.typing-indicator');
    if (existing) return;
    const html = `<div class="typing-indicator">
        <div class="msg-avatar ai">${ICONS.chat}</div>
        <div class="msg-body">
            <div class="typing-dots"><span></span><span></span><span></span></div>
            <div class="typing-text">A IA está pensando...</div>
        </div>
    </div>`;
    DOM.messages.insertAdjacentHTML('beforeend', html);
    scrollToBottom();
}

function hideTypingIndicator() {
    const el = document.querySelector('.typing-indicator');
    if (el) el.remove();
}

// ===== GERAR IMAGENS =====
function isImageRequest(text) {
    const lower = text.toLowerCase();
    const keywords = ['gerar imagem', 'criar imagem', 'crie uma imagem', 'gere uma imagem', 'desenhe', 'draw', 'generate image', 'criar arte', 'faça uma imagem', 'ilustre', 'imagem de', 'foto de'];
    return keywords.some(k => lower.includes(k));
}

async function handleImageGeneration(prompt, conv, startTime) {
    hideTypingIndicator();

    // Extrair prompt da imagem
    let imagePrompt = prompt;
    const keywords = ['gerar imagem de', 'gerar imagem', 'criar imagem de', 'criar imagem', 'crie uma imagem de', 'crie uma imagem', 'gere uma imagem de', 'gere uma imagem', 'desenhe', 'faça uma imagem de', 'faça uma imagem', 'ilustre', 'imagem de'];
    for (const kw of keywords) {
        const idx = prompt.toLowerCase().indexOf(kw);
        if (idx !== -1) {
            imagePrompt = prompt.substring(idx + kw.length).trim();
            break;
        }
    }
    if (!imagePrompt || imagePrompt === prompt) {
        imagePrompt = prompt;
    }

    // Adicionar qualidade
    const enhancedPrompt = `${imagePrompt}, professional, high quality, detailed, 4k, sharp focus`;

    const imageUrl = `${API_CONFIG.imageUrl}${encodeURIComponent(enhancedPrompt)}?width=1024&height=1024&nologo=true&seed=${Math.floor(Math.random() * 999999)}`;

    const aiMsg = {
        role: 'assistant',
        content: `Aqui está a imagem gerada com base no seu pedido:\n\n**Prompt:** ${imagePrompt}`,
        timestamp: Date.now(),
        responseTime: ((Date.now() - startTime) / 1000).toFixed(1),
        generatedFiles: [],
        generatedImages: [{ url: imageUrl, prompt: imagePrompt }]
    };
    conv.messages.push(aiMsg);
    saveConversations();
    renderMessages();
    setGenerating(false);
}

// ===== PROCESSAR ARQUIVOS GERADOS =====
function processGeneratedFiles(content) {
    const regex = /\[ARQUIVO:\s*([^\]]+)\]([\s\S]*?)\[\/ARQUIVO\]/g;
    const files = [];
    let match;
    while ((match = regex.exec(content)) !== null) {
        const filename = match[1].trim();
        const fileContent = match[2].trim();
        const id = generateId();
        files.push({ id, filename, content: fileContent });
        // Armazenar para download
        try { sessionStorage.setItem(`file_${id}`, JSON.stringify({ filename, content: fileContent })); } catch (e) {}
    }
    return files;
}

// ===== DOWNLOAD DE ARQUIVOS GERADOS =====
function downloadGeneratedFile(id) {
    try {
        const data = JSON.parse(sessionStorage.getItem(`file_${id}`));
        if (!data) { showToast('Arquivo não encontrado', 'error'); return; }
        const ext = data.filename.split('.').pop().toLowerCase();
        switch (ext) {
            case 'txt': case 'md': downloadTextFile(data.filename, data.content); break;
            case 'pdf': generatePDF(data.content, data.filename); break;
            case 'docx': generateWord(data.content, data.filename); break;
            case 'xlsx': generateExcel(data.content, data.filename); break;
            case 'pptx': generatePPTX(data.content, data.filename); break;
            default: downloadTextFile(data.filename, data.content);
        }
    } catch (e) {
        showToast('Erro ao baixar arquivo', 'error');
    }
}

function downloadTextFile(filename, content) {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    downloadBlob(blob, filename);
}

function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// ===== GERAÇÃO DE PDF =====
function generatePDF(content, filename) {
    const win = window.open('', '_blank');
    if (!win) { showToast('Permita popups para gerar PDF', 'error'); return; }
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${escapeHtml(filename)}</title>
    <style>
        body{font-family:'Segoe UI',sans-serif;max-width:700px;margin:40px auto;padding:20px;color:#111;line-height:1.7;font-size:14px}
        h1{font-size:24px;border-bottom:2px solid #000;padding-bottom:8px;margin-bottom:20px}
        h2{font-size:20px;margin-top:24px;color:#222}
        h3{font-size:16px;margin-top:20px;color:#333}
        p{margin:10px 0}
        ul,ol{margin:10px 0 10px 24px}
        li{margin:4px 0}
        table{width:100%;border-collapse:collapse;margin:16px 0}
        th,td{border:1px solid #ddd;padding:8px 12px;text-align:left}
        th{background:#f5f5f5;font-weight:600}
        code{background:#f0f0f0;padding:2px 6px;border-radius:3px;font-size:13px}
        pre{background:#f5f5f5;padding:16px;border-radius:6px;overflow-x:auto;font-size:13px;line-height:1.5}
        blockquote{border-left:4px solid #ccc;padding:8px 16px;margin:12px 0;color:#555;font-style:italic}
        hr{border:none;border-top:1px solid #ddd;margin:20px 0}
    </style></head><body>${parseMarkdown(content)}</body></html>`;
    win.document.write(html);
    win.document.close();
    setTimeout(() => { win.print(); }, 500);
    showToast('PDF gerado. Use "Salvar como PDF" na janela de impressão.', 'info');
}

// ===== GERAÇÃO DE WORD (DOCX simplificado) =====
function generateWord(content, filename) {
    // Usar HTML como DOCX (compatível com Word)
    const html = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head><meta charset="utf-8"><title>${escapeHtml(filename)}</title>
    <style>
        body{font-family:Calibri,sans-serif;font-size:12pt;line-height:1.6;color:#000}
        h1{font-size:20pt;font-weight:bold;color:#1a1a1a}
        h2{font-size:16pt;font-weight:bold;color:#2a2a2a}
        h3{font-size:14pt;font-weight:bold;color:#3a3a3a}
        p{margin:6pt 0}
        table{border-collapse:collapse;width:100%}
        th,td{border:1px solid #999;padding:6pt 8pt}
        th{background:#e8e8e8;font-weight:bold}
        ul,ol{margin:6pt 0 6pt 24pt}
        li{margin:3pt 0}
    </style></head><body>${parseMarkdown(content)}</body></html>`;
    const blob = new Blob([html], { type: 'application/vnd.ms-word' });
    downloadBlob(blob, filename);
    showToast('Arquivo Word baixado', 'success');
}

// ===== GERAÇÃO DE EXCEL (XLSX simplificado) =====
function generateExcel(content, filename) {
    // Parsear tabelas do conteúdo
    let csvContent = '';
    const tableRegex = /<table>[\s\S]*?<\/table>/g;
    const parsedHtml = parseMarkdown(content);
    let tables = parsedHtml.match(tableRegex);

    if (tables && tables.length > 0) {
        tables.forEach((table, ti) => {
            if (ti > 0) csvContent += '\n\n';
            const rows = table.match(/<tr>[\s\S]*?<\/tr>/g);
            if (rows) {
                rows.forEach(row => {
                    const cells = row.match(/<t[hd][^>]*>([\s\S]*?)<\/t[hd]>/g);
                    if (cells) {
                        const values = cells.map(c => {
                            const text = c.replace(/<[^>]+>/g, '').replace(/"/g, '""').trim();
                            return `"${text}"`;
                        });
                        csvContent += values.join(';') + '\n';
                    }
                });
            }
        });
    } else {
        // Se não houver tabelas, criar CSV a partir do texto
        const lines = content.split('\n').filter(l => l.trim());
        lines.forEach(line => {
            if (line.match(/^\|/)) {
                const cells = line.split('|').filter(c => c.trim()).map(c => `"${c.trim().replace(/"/g, '""')}"`);
                csvContent += cells.join(';') + '\n';
            }
        });
    }

    if (!csvContent.trim()) {
        csvContent = '"Sem dados de tabela encontrados"\n';
    }

    // Adicionar BOM para UTF-8
    const bom = '\uFEFF';
    const blob = new Blob([bom + csvContent], { type: 'text/csv;charset=utf-8' });
    downloadBlob(blob, filename.replace('.xlsx', '.csv'));
    showToast('Arquivo Excel (CSV) baixado', 'success');
}

// ===== GERAÇÃO DE PPTX =====
function generatePPTX(content, filename) {
    // Gerar HTML de apresentação que pode ser salva
    const slideRegex = /\[SLIDE:\s*([^\]]*)\]([\s\S]*?)(?=\[SLIDE:|$)/g;
    let slides = [];
    let match;

    if (slideRegex.test(content)) {
        slideRegex.lastIndex = 0;
        while ((match = slideRegex.exec(content)) !== null) {
            slides.push({ title: match[1].trim(), content: match[2].trim() });
        }
    }

    if (slides.length === 0) {
        // Dividir por cabeçalhos
        const sections = content.split(/\n(?=#{1,3}\s)/);
        sections.forEach(s => {
            if (s.trim()) {
                const lines = s.trim().split('\n');
                const title = lines[0].replace(/^#+\s*/, '');
                const body = lines.slice(1).join('\n');
                slides.push({ title, content: body });
            }
        });
    }

    if (slides.length === 0) {
        slides.push({ title: 'Apresentação', content: content });
    }

    const slideHtml = slides.map((slide, i) => `
        <div style="page-break-after:always;width:960px;height:540px;padding:60px 80px;box-sizing:border-box;display:flex;flex-direction:column;justify-content:center;position:relative;font-family:Calibri,sans-serif;${i === 0 ? 'background:linear-gradient(135deg,#1a1a1a,#333);color:#fff;' : 'background:#fff;color:#333;'}">
            ${i === 0 ? '<div style="position:absolute;bottom:30px;right:60px;font-size:11px;opacity:0.5">Internet IA</div>' : ''}
            <div style="font-size:${i === 0 ? 36 : 28}px;font-weight:bold;margin-bottom:24px;line-height:1.2">${escapeHtml(slide.title)}</div>
            <div style="font-size:${i === 0 ? 18 : 16}px;line-height:1.6;opacity:${i === 0 ? 0.85 : 0.8}">${parseMarkdown(slide.content)}</div>
        </div>
    `).join('');

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${escapeHtml(filename)}</title>
    <style>@media print{body{margin:0}@page{size:960px 540px;margin:0}}</style></head>
    <body>${slideHtml}<script>setTimeout(()=>window.print(),500)<\/script></body></html>`;

    const win = window.open('', '_blank');
    if (!win) { showToast('Permita popups para gerar PPTX', 'error'); return; }
    win.document.write(html);
    win.document.close();
    showToast('Apresentação gerada. Use "Salvar como PDF" para exportar.', 'info');
}

// ===== DOWNLOAD DE IMAGEM =====
function downloadImage(url, filename) {
    fetch(url)
        .then(r => r.blob())
        .then(blob => downloadBlob(blob, filename))
        .catch(() => window.open(url, '_blank'));
}

// ===== AÇÕES DE MENSAGEM =====
function copyMessageText(index) {
    const conv = getCurrentConversation();
    if (!conv || !conv.messages[index]) return;
    navigator.clipboard.writeText(conv.messages[index].content)
        .then(() => showToast('Texto copiado', 'success'))
        .catch(() => showToast('Erro ao copiar', 'error'));
    hideContextMenu();
}

function copyMessageMarkdown(index) {
    const conv = getCurrentConversation();
    if (!conv || !conv.messages[index]) return;
    navigator.clipboard.writeText(conv.messages[index].content)
        .then(() => showToast('Markdown copiado', 'success'))
        .catch(() => showToast('Erro ao copiar', 'error'));
    hideContextMenu();
}

function copyCode(codeId) {
    const el = document.getElementById(`code-body-${codeId}`);
    if (!el) return;
    const text = el.textContent || el.innerText;
    navigator.clipboard.writeText(text)
        .then(() => showToast('Código copiado', 'success'))
        .catch(() => showToast('Erro ao copiar', 'error'));
}

function toggleCode(codeId, btn) {
    const el = document.getElementById(`code-body-${codeId}`);
    if (!el) return;
    const isExpanded = el.classList.toggle('expanded');
    btn.innerHTML = isExpanded ? `${ICONS.chevronUp} Recolher` : `${ICONS.chevronDown} Expandir`;
}

async function regenerateMessage(index) {
    hideContextMenu();
    const conv = getCurrentConversation();
    if (!conv) return;
    // Encontrar a pergunta do usuário antes desta resposta
    let userContent = '';
    for (let i = index - 1; i >= 0; i--) {
        if (conv.messages[i].role === 'user') {
            userContent = conv.messages[i].content;
            break;
        }
    }
    // Remover esta resposta e todas após ela
    conv.messages = conv.messages.slice(0, index);
    saveConversations();
    renderMessages();
    if (userContent) {
        await sendMessage(userContent);
    }
}

function resendMessage(index) {
    hideContextMenu();
    const conv = getCurrentConversation();
    if (!conv || conv.messages[index].role !== 'user') return;
    const content = conv.messages[index].content;
    // Remover desta mensagem em diante
    conv.messages = conv.messages.slice(0, index);
    saveConversations();
    renderMessages();
    sendMessage(content);
}

function editMessage(index) {
    hideContextMenu();
    const conv = getCurrentConversation();
    if (!conv || conv.messages[index].role !== 'user') return;
    const msgEl = document.querySelector(`.message[data-index="${index}"] .msg-content`);
    if (!msgEl) return;
    const original = conv.messages[index].content;
    msgEl.innerHTML = `<textarea style="width:100%;min-height:60px;padding:8px;background:var(--bg-glass);border:1px solid var(--border-hover);border-radius:var(--radius-sm);font-size:14px;font-family:var(--font);color:var(--text-primary);resize:vertical" id="edit-input-${index}">${escapeHtml(original)}</textarea>
    <div style="display:flex;gap:8px;margin-top:8px">
        <button style="padding:6px 16px;background:#fff;color:#000;border-radius:var(--radius-sm);font-size:12px;font-weight:600" onclick="saveEdit(${index})">Salvar e enviar</button>
        <button style="padding:6px 16px;background:var(--bg-glass);border:1px solid var(--border);border-radius:var(--radius-sm);font-size:12px;color:var(--text-secondary)" onclick="renderMessages()">Cancelar</button>
    </div>`;
    const input = $(`#edit-input-${index}`);
    input.focus();
    input.setSelectionRange(input.value.length, input.value.length);
}

function saveEdit(index) {
    const input = $(`#edit-input-${index}`);
    if (!input) return;
    const newContent = input.value.trim();
    if (!newContent) return;
    const conv = getCurrentConversation();
    if (!conv) return;
    conv.messages[index].content = newContent;
    conv.messages = conv.messages.slice(0, index + 1);
    saveConversations();
    renderMessages();
    sendMessage(newContent);
}

function deleteMessage(index) {
    hideContextMenu();
    const conv = getCurrentConversation();
    if (!conv) return;
    conv.messages.splice(index, 1);
    saveConversations();
    renderMessages();
    showToast('Mensagem excluída', 'success');
}

function shareMessage(index) {
    hideContextMenu();
    const conv = getCurrentConversation();
    if (!conv || !conv.messages[index]) return;
    const text = conv.messages[index].content;
    if (navigator.share) {
        navigator.share({ title: 'Internet IA - Resposta', text: text }).catch(() => {});
    } else {
        navigator.clipboard.writeText(text)
            .then(() => showToast('Resposta copiada para compartilhar', 'success'))
            .catch(() => showToast('Erro ao copiar', 'error'));
    }
}

function rateMessage(index, rating) {
    showToast(rating === 'up' ? 'Avaliação positiva registrada' : 'Avaliação negativa registrada', 'info');
}

function speakMessage(index) {
    const conv = getCurrentConversation();
    if (!conv || !conv.messages[index]) return;
    if (window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
        showToast('Leitura interrompida', 'info');
        return;
    }
    const text = conv.messages[index].content.replace(/[#*`|>-]/g, '').replace(/\[ARQUIVO[^\]]*\][\s\S]*?\[\/ARQUIVO\]/g, '');
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'pt-BR';
    utterance.rate = 1;
    window.speechSynthesis.speak(utterance);
    showToast('Lendo resposta...', 'info');
}

function toggleExpandMsg(index) {
    const conv = getCurrentConversation();
    if (!conv || !conv.messages[index]) return;
    const el = document.querySelector(`.message[data-index="${index}"] .msg-content`);
    const btn = $(`#expand-btn-${index}`);
    if (!el) return;
    if (el.style.maxHeight && el.style.maxHeight !== 'none') {
        el.style.maxHeight = 'none';
        el.style.overflow = 'visible';
        if (btn) btn.innerHTML = `${ICONS.chevronUp}<span>Recolher</span>`;
    } else {
        el.style.maxHeight = '300px';
        el.style.overflow = 'hidden';
        if (btn) btn.innerHTML = `${ICONS.chevronDown}<span>Expandir</span>`;
    }
}

function flagMessage(index) {
    hideContextMenu();
    showToast('Resposta denunciada. Obrigado pelo feedback.', 'info');
}

// ===== EXPORTAÇÃO =====
function exportConversation(format) {
    const conv = getCurrentConversation();
    if (!conv || conv.messages.length === 0) {
        showToast('Nenhuma conversa para exportar', 'error');
        return;
    }
    hideContextMenu();
    DOM.exportMenu.classList.remove('active');

    switch (format) {
        case 'txt': exportAsTXT(conv); break;
        case 'md': exportAsMD(conv); break;
        case 'pdf': exportAsPDF(conv); break;
        case 'clipboard': copyFullConversation(conv); break;
        case 'share': shareConversation(conv); break;
    }
}

function exportAsTXT(conv) {
    let text = `Conversa: ${conv.title}\nData: ${new Date(conv.createdAt).toLocaleString('pt-BR')}\n${'='.repeat(50)}\n\n`;
    conv.messages.forEach(m => {
        text += `[${m.role === 'user' ? 'Você' : 'Internet IA'}] - ${m.timestamp ? new Date(m.timestamp).toLocaleString('pt-BR') : ''}\n${m.content}\n\n`;
    });
    downloadTextFile(`${conv.title}.txt`, text);
    showToast('Conversa exportada como TXT', 'success');
}

function exportAsMD(conv) {
    let md = `# ${conv.title}\n\n*Exportado em ${new Date().toLocaleString('pt-BR')}*\n\n---\n\n`;
    conv.messages.forEach(m => {
        md += `### ${m.role === 'user' ? 'Você' : 'Internet IA'}\n\n${m.content}\n\n---\n\n`;
    });
    downloadTextFile(`${conv.title}.md`, md);
    showToast('Conversa exportada como Markdown', 'success');
}

function exportAsPDF(conv) {
    let htmlContent = `<h1>${escapeHtml(conv.title)}</h1><p><em>Exportado em ${new Date().toLocaleString('pt-BR')}</em></p><hr>`;
    conv.messages.forEach(m => {
        htmlContent += `<h3>${m.role === 'user' ? 'Você' : 'Internet IA'}</h3>${parseMarkdown(m.content)}<hr>`;
    });
    generatePDF(htmlContent, `${conv.title}.pdf`);
}

function copyFullConversation(conv) {
    let text = '';
    conv.messages.forEach(m => {
        text += `[${m.role === 'user' ? 'Você' : 'Internet IA'}]:\n${m.content}\n\n`;
    });
    navigator.clipboard.writeText(text)
        .then(() => showToast('Conversa copiada', 'success'))
        .catch(() => showToast('Erro ao copiar', 'error'));
}

function shareConversation(conv) {
    if (navigator.share) {
        navigator.share({ title: conv.title, text: `Conversa no Internet IA:\n${conv.messages.map(m => `[${m.role === 'user' ? 'Você' : 'IA'}]: ${m.content.substring(0, 100)}...`).join('\n')}` }).catch(() => {});
    } else {
        copyFullConversation(conv);
    }
}

function exportSingleMessage(index, format) {
    hideContextMenu();
    const conv = getCurrentConversation();
    if (!conv || !conv.messages[index]) return;
    const msg = conv.messages[index];

    if (format === 'txt') {
        downloadTextFile(`resposta-${index}.txt`, msg.content);
        showToast('Resposta exportada como TXT', 'success');
    } else if (format === 'pdf') {
        generatePDF(msg.content, `resposta-${index}.pdf`);
    }
}

function exportAllConversations() {
    if (state.conversations.length === 0) {
        showToast('Nenhuma conversa para exportar', 'error');
        return;
    }
    let text = 'Internet IA - Todas as Conversas\n' + '='.repeat(50) + '\n\n';
    state.conversations.forEach(conv => {
        text += `Conversa: ${conv.title}\nData: ${new Date(conv.createdAt).toLocaleString('pt-BR')}\n${'-'.repeat(40)}\n`;
        conv.messages.forEach(m => {
            text += `[${m.role === 'user' ? 'Você' : 'IA'}]: ${m.content}\n\n`;
        });
        text += '\n\n';
    });
    downloadTextFile('internet-ia-todas-conversas.txt', text);
    showToast('Todas as conversas exportadas', 'success');
}

// ===== ARQUIVOS ANEXADOS =====
function handleAttachFiles() {
    DOM.fileInput.click();
}

function handleFileSelect(e) {
    const files = Array.from(e.target.files);
    files.forEach(file => {
        state.attachedFiles.push(file);
    });
    renderFilePreview();
    DOM.fileInput.value = '';
}

function renderFilePreview() {
    if (state.attachedFiles.length === 0) {
        DOM.filePreview.style.display = 'none';
        return;
    }
    DOM.filePreview.style.display = 'flex';
    DOM.filePreview.innerHTML = state.attachedFiles.map((f, i) => `
        <div class="file-preview-item">
            ${ICONS.file}
            <span>${escapeHtml(truncateText(f.name, 20))}</span>
            <span style="opacity:0.4">(${(f.size / 1024).toFixed(1)}KB)</span>
            <button class="remove-file" onclick="removeAttachedFile(${i})">${ICONS.x}</button>
        </div>
    `).join('');
}

function removeAttachedFile(index) {
    state.attachedFiles.splice(index, 1);
    renderFilePreview();
}

function clearAttachedFiles() {
    state.attachedFiles = [];
    renderFilePreview();
}

async function readAttachedFiles() {
    const results = [];
    for (const file of state.attachedFiles) {
        try {
            const text = await file.text();
            results.push(`--- ${file.name} ---\n${text}`);
        } catch (e) {
            results.push(`--- ${file.name} ---\n[Arquivo binário, não foi possível ler o conteúdo]`);
        }
    }
    return results.join('\n\n');
}

// ===== GRAVAÇÃO DE VOZ =====
async function toggleRecording() {
    if (state.isRecording) {
        stopRecording();
        return;
    }

    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        state.mediaRecorder = new MediaRecorder(stream);
        state.audioChunks = [];

        state.mediaRecorder.ondataavailable = (e) => {
            if (e.data.size > 0) state.audioChunks.push(e.data);
        };

        state.mediaRecorder.onstop = async () => {
            stream.getTracks().forEach(t => t.stop());
            const blob = new Blob(state.audioChunks, { type: 'audio/webm' });

            // Enviar para API de reconhecimento (usando Web Speech API como fallback)
            if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
                showToast('Processando áudio...', 'info');
                // Tentar transcrever
                const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
                recognition.lang = 'pt-BR';
                recognition.continuous = false;

                recognition.onresult = (event) => {
                    const transcript = Array.from(event.results).map(r => r[0].transcript).join('');
                    DOM.messageInput.value += transcript;
                    updateCharCount();
                    autoResizeInput();
                    showToast('Áudio transcrito', 'success');
                };

                recognition.onerror = () => {
                    showToast('Não foi possível transcrever o áudio', 'error');
                };

                // Criar URL e tentar reconhecer
                try {
                    const url = URL.createObjectURL(blob);
                    // Como SpeechRecognition não aceita URLs diretamente,
                    // vamos usar um workaround: mostrar que foi gravado
                    URL.revokeObjectURL(url);
                    showToast('Gravação concluída. O áudio foi anexado.', 'info');
                    // Adicionar como "arquivo" anexado
                    state.attachedFiles.push(new File([blob], 'gravacao.webm', { type: 'audio/webm' }));
                    renderFilePreview();
                } catch (e) {
                    showToast('Erro ao processar áudio', 'error');
                }
            } else {
                state.attachedFiles.push(new File([blob], 'gravacao.webm', { type: 'audio/webm' }));
                renderFilePreview();
                showToast('Gravação anexada', 'success');
            }
        };

        state.mediaRecorder.start();
        state.isRecording = true;
        DOM.recordingIndicator.style.display = 'flex';
        DOM.voiceBtn.style.color = '#ef4444';
    } catch (e) {
        showToast('Não foi possível acessar o microfone', 'error');
    }
}

function stopRecording() {
    if (state.mediaRecorder && state.isRecording) {
        state.mediaRecorder.stop();
        state.isRecording = false;
        DOM.recordingIndicator.style.display = 'none';
        DOM.voiceBtn.style.color = '';
    }
}

// ===== CONTROLES DE UI =====
function setGenerating(value) {
    state.isGenerating = value;
    DOM.sendBtn.style.display = value ? 'none' : 'flex';
    DOM.stopBtn.style.display = value ? 'flex' : 'none';
    DOM.messageInput.disabled = value;
}

function stopGeneration() {
    if (state.abortController) {
        state.abortController.abort();
        state.abortController = null;
    }
}

function setApiStatus(online) {
    DOM.statusDot.className = `status-dot ${online ? '' : 'offline'}`;
    DOM.statusText.textContent = online ? 'Online' : 'Offline';
}

function updateMsgCounter() {
    const conv = getCurrentConversation();
    const count = conv ? conv.messages.length : 0;
    DOM.msgCounter.textContent = `${count} msg${count !== 1 ? 's' : ''}`;
}

function updateCharCount() {
    const len = DOM.messageInput.value.length;
    DOM.charCount.textContent = `${len} / 4000`;
    DOM.sendBtn.disabled = len === 0 && state.attachedFiles.length === 0;
}

function autoResizeInput() {
    const el = DOM.messageInput;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 200) + 'px';
}

function scrollToBottom() {
    requestAnimationFrame(() => {
        DOM.messagesContainer.scrollTop = DOM.messagesContainer.scrollHeight;
    });
}

function toggleSidebar() {
    if (window.innerWidth <= 768) {
        const isOpen = !DOM.sidebar.classList.contains('collapsed');
        if (isOpen) {
            DOM.sidebar.classList.add('collapsed');
            DOM.sidebarOverlay.classList.remove('active');
        } else {
            DOM.sidebar.classList.remove('collapsed');
            DOM.sidebarOverlay.classList.add('active');
        }
    } else {
        DOM.sidebar.classList.toggle('collapsed');
    }
}

function closeSidebarMobile() {
    if (window.innerWidth <= 768) {
        DOM.sidebar.classList.add('collapsed');
        DOM.sidebarOverlay.classList.remove('active');
    }
}

function toggleFullscreen() {
    state.fullscreen = !state.fullscreen;
    DOM.app.classList.toggle('fullscreen', state.fullscreen);
    DOM.fullscreenBtn.innerHTML = state.fullscreen ? ICONS.minimize : ICONS.maximize;
    if (state.fullscreen && !document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => {});
    } else if (!state.fullscreen && document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
    }
}

function toggleSearchInChat() {
    DOM.searchInChat.classList.toggle('active');
    if (DOM.searchInChat.classList.contains('active')) {
        DOM.searchChatInput.focus();
    } else {
        DOM.searchChatInput.value = '';
        DOM.searchChatInfo.textContent = '';
        clearSearchHighlights();
    }
}

function handleSearchInChat() {
    const query = DOM.searchChatInput.value.toLowerCase().trim();
    clearSearchHighlights();
    if (!query) { DOM.searchChatInfo.textContent = ''; return; }

    const messages = DOM.messages.querySelectorAll('.msg-content');
    let count = 0;
    messages.forEach(el => {
        const text = el.textContent.toLowerCase();
        if (text.includes(query)) {
            count++;
            el.style.background = 'rgba(255,255,255,0.05)';
            el.style.borderRadius = '8px';
            el.style.padding = '8px';
        }
    });
    DOM.searchChatInfo.textContent = count > 0 ? `${count} ocorrência(s) encontrada(s)` : 'Nenhum resultado';
}

function clearSearchHighlights() {
    DOM.messages.querySelectorAll('.msg-content').forEach(el => {
        el.style.background = '';
        el.style.borderRadius = '';
        el.style.padding = '';
    });
}

// ===== HANDLER DE ENVIO =====
function handleSend() {
    const content = DOM.messageInput.value.trim();
    if ((!content && state.attachedFiles.length === 0) || state.isGenerating) return;
    if (content.length > 4000) {
        showToast('Mensagem muito longa. Máximo 4000 caracteres.', 'error');
        return;
    }
    DOM.messageInput.value = '';
    autoResizeInput();
    updateCharCount();
    sendMessage(content || 'Analise os arquivos anexados.');
}

// ===== ATALHOS DE TECLADO =====
document.addEventListener('keydown', (e) => {
    // Ctrl+Enter para enviar
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        handleSend();
    }
    // Escape para fechar modais
    if (e.key === 'Escape') {
        DOM.settingsModal.classList.remove('active');
        DOM.searchInChat.classList.remove('active');
        DOM.exportMenu.classList.remove('active');
        hideContextMenu();
    }
    // Ctrl+N para nova conversa
    if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        createConversation();
    }
    // Ctrl+Shift+F para pesquisar na conversa
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'F') {
        e.preventDefault();
        toggleSearchInChat();
    }
    // Ctrl+E para exportar
    if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
        e.preventDefault();
        DOM.exportMenu.classList.toggle('active');
    }
});

// ===== SCROLL =====
DOM.messagesContainer.addEventListener('scroll', () => {
    const { scrollTop, scrollHeight, clientHeight } = DOM.messagesContainer;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
    DOM.scrollBottomBtn.classList.toggle('visible', !isNearBottom);
});

// ===== EVENT LISTENERS =====
function initEventListeners() {
    // Sidebar
    DOM.sidebarToggle.addEventListener('click', toggleSidebar);
    DOM.sidebarClose.addEventListener('click', toggleSidebar);
    DOM.sidebarOverlay.addEventListener('click', closeSidebarMobile);
    DOM.newChatBtn.addEventListener('click', () => createConversation());

    // Sidebar search
    DOM.sidebarSearch.addEventListener('input', () => renderSidebar());

    // Input
    DOM.messageInput.addEventListener('input', () => {
        updateCharCount();
        autoResizeInput();
    });
    DOM.messageInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey && !e.ctrlKey && !e.metaKey) {
            e.preventDefault();
            handleSend();
        }
    });

    // Botões
    DOM.sendBtn.addEventListener('click', handleSend);
    DOM.stopBtn.addEventListener('click', stopGeneration);
    DOM.attachBtn.addEventListener('click', handleAttachFiles);
    DOM.fileInput.addEventListener('change', handleFileSelect);
    DOM.voiceBtn.addEventListener('click', toggleRecording);
    DOM.stopRecordingBtn.addEventListener('click', stopRecording);
    DOM.clearChatBtn.addEventListener('click', () => {
        const conv = getCurrentConversation();
        if (conv) {
            conv.messages = [];
            saveConversations();
            renderMessages();
            showToast('Conversa limpa', 'success');
        }
    });
    DOM.scrollBottomBtn.addEventListener('click', scrollToBottom);
    DOM.fullscreenBtn.addEventListener('click', toggleFullscreen);

    // Export menu
    DOM.exportMenuBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        DOM.exportMenu.classList.toggle('active');
    });
    DOM.exportMenu.querySelectorAll('.export-menu-item').forEach(item => {
        item.addEventListener('click', () => exportConversation(item.dataset.format));
    });

    // Search in chat
    DOM.searchChatBtn.addEventListener('click', toggleSearchInChat);
    DOM.searchChatInput.addEventListener('input', handleSearchInChat);

    // Settings
    DOM.settingsBtn.addEventListener('click', () => DOM.settingsModal.classList.add('active'));
    DOM.settingsClose.addEventListener('click', () => DOM.settingsModal.classList.remove('active'));
    DOM.settingsModal.addEventListener('click', (e) => {
        if (e.target === DOM.settingsModal) DOM.settingsModal.classList.remove('active');
    });

    DOM.settingFont.addEventListener('change', (e) => {
        document.body.style.fontFamily = e.target.value === 'system' ? 'system-ui, sans-serif' : 'Inter, sans-serif';
        localStorage.setItem('internet_ia_font', e.target.value);
    });

    DOM.settingFontsize.addEventListener('input', (e) => {
        document.documentElement.style.fontSize = e.target.value + 'px';
        localStorage.setItem('internet_ia_fontsize', e.target.value);
    });

    DOM.settingExportAll.addEventListener('click', exportAllConversations);
    DOM.settingClearCache.addEventListener('click', () => {
        sessionStorage.clear();
        showToast('Cache limpo', 'success');
    });
    DOM.settingDeleteAll.addEventListener('click', () => {
        state.conversations = [];
        state.currentConvId = null;
        saveConversations();
        renderSidebar();
        showWelcome();
        DOM.settingsModal.classList.remove('active');
        showToast('Histórico excluído', 'success');
    });

    // Sidebar footer buttons
    DOM.exportAllBtn.addEventListener('click', exportAllConversations);
    DOM.clearHistoryBtn.addEventListener('click', () => {
        if (state.conversations.length === 0) {
            showToast('Nenhuma conversa para limpar', 'info');
            return;
        }
        state.conversations = [];
        state.currentConvId = null;
        saveConversations();
        renderSidebar();
        showWelcome();
        showToast('Histórico excluído', 'success');
    });

    // Fechar menus ao clicar fora
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.export-menu') && !e.target.closest('#export-menu-btn')) {
            DOM.exportMenu.classList.remove('active');
        }
        if (!e.target.closest('.context-menu')) {
            hideContextMenu();
        }
    });

    // Responsividade
    window.addEventListener('resize', () => {
        if (window.innerWidth > 768) {
            DOM.sidebar.classList.remove('collapsed');
            DOM.sidebarOverlay.classList.remove('active');
        } else {
            if (!state.sidebarOpen) {
                DOM.sidebar.classList.add('collapsed');
            }
        }
    });

    // Verificar status da API periodicamente
    checkApiStatus();
    setInterval(checkApiStatus, 30000);
}

// ===== VERIFICAR STATUS DA API =====
async function checkApiStatus() {
    try {
        const response = await fetch(API_CONFIG.url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${API_CONFIG.key}`
            },
            body: JSON.stringify({
                model: API_CONFIG.model,
                messages: [{ role: 'user', content: 'hi' }],
                max_tokens: 1
            })
        });
        setApiStatus(response.ok);
    } catch (e) {
        setApiStatus(false);
    }
}

// ===== CARREGAR CONFIGURAÇÕES SALVAS =====
function loadSettings() {
    const font = localStorage.getItem('internet_ia_font');
    if (font) {
        DOM.settingFont.value = font;
        document.body.style.fontFamily = font === 'system' ? 'system-ui, sans-serif' : 'Inter, sans-serif';
    }
    const fontsize = localStorage.getItem('internet_ia_fontsize');
    if (fontsize) {
        DOM.settingFontsize.value = fontsize;
        document.documentElement.style.fontSize = fontsize + 'px';
    }
}

// ===== INICIALIZAÇÃO =====
function init() {
    loadSettings();
    loadConversations();
    renderSuggestions();
    renderSidebar();
    initEventListeners();

    // Sidebar inicial no mobile
    if (window.innerWidth <= 768) {
        DOM.sidebar.classList.add('collapsed');
    }

    // Se há conversas, mostrar a última
    if (state.conversations.length > 0) {
        switchConversation(state.conversations[0].id);
    }

    // Focar no input
    DOM.messageInput.focus();

    console.log('%c Internet IA v1.0.0 ', 'background:#111;color:#fff;padding:8px 16px;border-radius:8px;font-family:monospace;font-size:14px;');
}

// Iniciar
init();
