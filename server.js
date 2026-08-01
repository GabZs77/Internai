// ===================================================================
// INTERNET IA - SERVIDOR PROXY
// Arquivo único: server.js
// Node.js + Express
// ===================================================================

// ===== IMPORTAÇÕES =====
require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const compression = require('compression');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const crypto = require('crypto');
const path = require('path');

// ===== CONFIGURAÇÕES =====
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';
const CACHE_TTL = parseInt(process.env.CACHE_TTL) || 300;
const ENABLE_CACHE = process.env.ENABLE_CACHE !== 'false';
const REQUEST_TIMEOUT = parseInt(process.env.REQUEST_TIMEOUT) || 30000;
const MAX_PAYLOAD_SIZE = process.env.MAX_PAYLOAD_SIZE || '10mb';

// ===== VARIÁVEIS DE ESTADO =====
let requestCount = 0;
const startTime = Date.now();
const cache = new Map();

// ===== INICIALIZAÇÃO DO EXPRESS =====
const app = express();

// ===== MIDDLEWARES DE SEGURANÇA =====
app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    contentSecurityPolicy: false,
}));

// ===== COMPRESSION =====
app.use(compression());

// ===== CORS CONFIGURÁVEL =====
const allowedOrigins = process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(',')
    : ['http://localhost:3000', 'http://localhost:5500', 'http://127.0.0.1:5500'];

app.use(cors({
    origin: function (origin, callback) {
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            console.warn(`[CORS] Origem bloqueada: ${origin}`);
            callback(new Error('Origem não permitida pelo CORS'));
        }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
    credentials: true,
    maxAge: 86400,
}));

// ===== RATE LIMIT =====
const limiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW) || 15 * 60 * 1000,
    max: parseInt(process.env.RATE_LIMIT_MAX) || 100,
    message: {
        error: 'Muitas requisições. Tente novamente mais tarde.',
        retryAfter: '15 minutos'
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
        return req.ip || req.headers['x-forwarded-for'] || 'unknown';
    },
    skip: (req) => {
        return req.path === '/status' || req.path === '/';
    }
});
app.use(limiter);

// ===== BODY PARSER =====
app.use(express.json({ limit: MAX_PAYLOAD_SIZE }));
app.use(express.urlencoded({ extended: true, limit: MAX_PAYLOAD_SIZE }));

// ===== SERVE STATIC FILES =====
app.use(express.static('public'));

// ===== LOGGER MIDDLEWARE =====
app.use((req, res, next) => {
    const requestId = crypto.randomBytes(8).toString('hex');
    req.requestId = requestId;
    requestCount++;

    const start = Date.now();
    const logData = {
        id: requestId,
        method: req.method,
        path: req.path,
        ip: req.ip || req.headers['x-forwarded-for'] || 'unknown',
        userAgent: req.headers['user-agent'] || 'unknown',
        timestamp: new Date().toISOString()
    };

    console.log(`[${logData.timestamp}] [${logData.id}] ${logData.method} ${logData.path} - IP: ${logData.ip}`);

    const originalSend = res.send;
    res.send = function (data) {
        const duration = Date.now() - start;
        res.setHeader('X-Request-ID', requestId);
        res.setHeader('X-Response-Time', `${duration}ms`);

        console.log(`[${logData.timestamp}] [${logData.id}] ${logData.method} ${logData.path} - ${res.statusCode} - ${duration}ms`);

        originalSend.call(this, data);
    };

    next();
});

// ===== VALIDAÇÃO DE PAYLOAD =====
app.use((req, res, next) => {
    if (req.method === 'POST' || req.method === 'PUT') {
        const contentLength = parseInt(req.headers['content-length'] || '0');
        if (contentLength > parseInt(MAX_PAYLOAD_SIZE)) {
            return res.status(413).json({
                error: 'Payload muito grande',
                maxSize: MAX_PAYLOAD_SIZE
            });
        }
    }
    next();
});

// ===== SISTEMA DE CACHE =====
function getCacheKey(req) {
    const body = req.body ? JSON.stringify(req.body) : '';
    return `${req.method}:${req.path}:${body}`;
}

function getCachedResponse(key) {
    if (!ENABLE_CACHE) return null;
    const cached = cache.get(key);
    if (!cached) return null;
    if (Date.now() - cached.timestamp > CACHE_TTL * 1000) {
        cache.delete(key);
        return null;
    }
    return cached.data;
}

function setCachedResponse(key, data) {
    if (!ENABLE_CACHE) return;
    cache.set(key, {
        data,
        timestamp: Date.now()
    });
}

// ===== LIMPEZA AUTOMÁTICA DO CACHE =====
setInterval(() => {
    const now = Date.now();
    for (const [key, value] of cache.entries()) {
        if (now - value.timestamp > CACHE_TTL * 1000) {
            cache.delete(key);
        }
    }
}, 60000);

// ===== CONFIGURAÇÃO DAS APIS =====
const API_CONFIGS = {
    chat: {
        url: process.env.CHAT_API_URL || 'https://gen.pollinations.ai/v1/chat/completions',
        key: process.env.CHAT_API_KEY,
        model: process.env.CHAT_MODEL || 'openai',
        timeout: parseInt(process.env.CHAT_TIMEOUT) || REQUEST_TIMEOUT,
        headers: {
            'Content-Type': 'application/json',
        }
    },
    image: {
        url: process.env.IMAGE_API_URL || 'https://image.pollinations.ai/prompt/',
        key: process.env.IMAGE_API_KEY,
        timeout: parseInt(process.env.IMAGE_TIMEOUT) || REQUEST_TIMEOUT,
        headers: {}
    },
    files: {
        url: process.env.FILES_API_URL || 'https://api.example.com/files',
        key: process.env.FILES_API_KEY,
        timeout: parseInt(process.env.FILES_TIMEOUT) || REQUEST_TIMEOUT,
        headers: {}
    },
    search: {
        url: process.env.SEARCH_API_URL || 'https://api.example.com/search',
        key: process.env.SEARCH_API_KEY,
        timeout: parseInt(process.env.SEARCH_TIMEOUT) || REQUEST_TIMEOUT,
        headers: {}
    }
};

// ===== FUNÇÃO PARA ENVIAR REQUISIÇÕES =====
async function proxyRequest(req, res, apiName) {
    try {
        const config = API_CONFIGS[apiName];
        if (!config) {
            return res.status(404).json({
                error: `API "${apiName}" não encontrada`,
                available: Object.keys(API_CONFIGS)
            });
        }

        const cacheKey = getCacheKey(req);
        const cached = getCachedResponse(cacheKey);
        if (cached && req.method === 'GET') {
            return res.json(cached);
        }

        const headers = { ...config.headers };
        if (config.key) {
            headers['Authorization'] = `Bearer ${config.key}`;
        }

        let data = req.body;
        if (apiName === 'image') {
            const prompt = req.body.prompt || req.query.prompt;
            if (prompt) {
                const params = new URLSearchParams(req.query);
                params.set('prompt', prompt);
                const url = `${config.url}${encodeURIComponent(prompt)}?${params.toString()}`;
                const response = await axios({
                    method: 'GET',
                    url: url,
                    headers: headers,
                    timeout: config.timeout,
                    responseType: 'stream'
                });

                res.setHeader('Content-Type', response.headers['content-type']);
                response.data.pipe(res);
                return;
            }
        }

        const response = await axios({
            method: req.method,
            url: config.url,
            headers: headers,
            data: data,
            params: req.query,
            timeout: config.timeout,
        });

        if (req.method === 'GET') {
            setCachedResponse(cacheKey, response.data);
        }

        res.status(response.status).json(response.data);

    } catch (error) {
        handleProxyError(error, req, res);
    }
}

// ===== TRATAMENTO DE ERROS =====
function handleProxyError(error, req, res) {
    const requestId = req.requestId || 'unknown';

    console.error(`[${requestId}] Erro no proxy:`, {
        message: error.message,
        code: error.code,
        status: error.response?.status,
        data: error.response?.data,
        stack: error.stack
    });

    if (error.response) {
        return res.status(error.response.status || 500).json({
            error: 'Erro na API externa',
            status: error.response.status,
            data: error.response.data,
            requestId
        });
    }

    if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
        return res.status(504).json({
            error: 'Timeout na requisição',
            timeout: error.timeout || REQUEST_TIMEOUT,
            requestId
        });
    }

    if (error.code === 'ENOTFOUND') {
        return res.status(503).json({
            error: 'API externa indisponível',
            requestId
        });
    }

    res.status(500).json({
        error: 'Erro interno no proxy',
        message: error.message,
        requestId
    });
}

// ===== ROTAS DA API =====

// ===== STATUS =====
app.get('/status', (req, res) => {
    const memoryUsage = process.memoryUsage();
    const uptime = Math.floor((Date.now() - startTime) / 1000);

    res.json({
        status: 'online',
        uptime: {
            seconds: uptime,
            formatted: formatUptime(uptime)
        },
        memory: {
            used: Math.round(memoryUsage.heapUsed / 1024 / 1024),
            total: Math.round(memoryUsage.heapTotal / 1024 / 1024),
            rss: Math.round(memoryUsage.rss / 1024 / 1024)
        },
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        requests: requestCount,
        cache: {
            enabled: ENABLE_CACHE,
            size: cache.size,
            ttl: CACHE_TTL
        },
        apis: Object.keys(API_CONFIGS),
        node: process.version,
        env: NODE_ENV
    });
});

function formatUptime(seconds) {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    const parts = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    parts.push(`${secs}s`);

    return parts.join(' ');
}

// ===== ROTA RAIZ =====
app.get('/', (req, res) => {
    res.json({
        service: 'Internet IA - Proxy Server',
        version: '1.0.0',
        endpoints: {
            '/status': 'GET - Status do servidor',
            '/api/chat': 'POST - Chat com IA',
            '/api/image': 'POST - Gerar imagem',
            '/api/files': 'POST - Processar arquivos',
            '/api/search': 'POST - Buscar informações'
        },
        docs: 'Consulte /status para mais informações',
        timestamp: new Date().toISOString()
    });
});

// ===== ENDPOINTS =====

app.post('/api/chat', async (req, res) => {
    await proxyRequest(req, res, 'chat');
});

app.post('/api/image', async (req, res) => {
    await proxyRequest(req, res, 'image');
});

app.get('/api/image', async (req, res) => {
    await proxyRequest(req, res, 'image');
});

app.post('/api/files', async (req, res) => {
    await proxyRequest(req, res, 'files');
});

app.post('/api/search', async (req, res) => {
    await proxyRequest(req, res, 'search');
});

app.get('/api/status', (req, res) => {
    res.redirect('/status');
});

// ===== ROTA CORINGA - 404 =====
app.use((req, res) => {
    res.status(404).json({
        error: 'Rota não encontrada',
        path: req.path,
        method: req.method,
        available: ['/status', '/api/chat', '/api/image', '/api/files', '/api/search']
    });
});

// ===== TRATAMENTO DE ERROS GLOBAL =====
app.use((err, req, res, next) => {
    console.error('[Global Error]', {
        message: err.message,
        stack: err.stack,
        path: req.path,
        method: req.method,
        requestId: req.requestId
    });

    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
        return res.status(400).json({
            error: 'JSON inválido',
            message: err.message
        });
    }

    res.status(500).json({
        error: 'Erro interno do servidor',
        message: err.message,
        requestId: req.requestId
    });
});

// ===== INICIAR SERVIDOR =====
app.listen(PORT, () => {
    console.log('========================================');
    console.log('  INTERNET IA - PROXY SERVER');
    console.log('========================================');
    console.log(`  Servidor iniciado em: http://localhost:${PORT}`);
    console.log(`  Ambiente: ${NODE_ENV}`);
    console.log(`  Cache: ${ENABLE_CACHE ? 'ATIVADO' : 'DESATIVADO'} (TTL: ${CACHE_TTL}s)`);
    console.log(`  APIs configuradas: ${Object.keys(API_CONFIGS).join(', ')}`);
    console.log(`  CORS Origins: ${allowedOrigins.join(', ')}`);
    console.log(`  Rate Limit: ${limiter.max} req/${limiter.windowMs/60000}min`);
    console.log('========================================');
});

module.exports = app;
