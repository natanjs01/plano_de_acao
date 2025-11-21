// ====================================
// CONFIGURAÇÕES E CONSTANTES GLOBAIS
// ====================================

// Configuração Supabase
export const SUPABASE_CONFIG = {
  url: "https://iynsvuugjjbvjacrjmig.supabase.co",
  key: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml5bnN2dXVnampidmphY3JqbWlnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg4ODUwODksImV4cCI6MjA3NDQ2MTA4OX0.b-8p05tTG4iLbITGVdY1Da3TQbbupaYIZLfT-aMhPbk"
};

// Cliente Supabase (será inicializado no main.js)
export let supabaseClient = null;

export function initializeSupabase() {
  if (typeof supabase === 'undefined') {
    console.error('❌ Supabase não foi carregado!');
    alert('Erro: Biblioteca Supabase não foi carregada. Verifique a conexão com a internet.');
    return null;
  }
  
  console.log('✅ Supabase carregado com sucesso');
  
  supabaseClient = supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.key, {
    auth: {
      detectSessionInUrl: true,
      persistSession: true,  // Permitir persistência temporária para validação do código
      autoRefreshToken: true, // Permitir renovação do token
      storage: window.localStorage,
      storageKey: 'plano-acao-auth'
    }
  });
  
  // Tornar acessível globalmente
  window.supabaseClient = supabaseClient;
  
  return supabaseClient;
}

// Estado global da aplicação
export const APP_STATE = {
  currentUser: null,
  currentUserData: null,
  currentSetor: null,
  isAdmin: false,
  selectedSetorFilter: null,
  tasks: [],
  statusOptions: [],
  setores: []
};

// Constantes de configuração
export const APP_CONFIG = {
  BYPASS_AUTH: false, // Sistema de autenticação ativo
  DEFAULT_STATUS: [
    'Backlog',
    'Em andamento',
    'Bloqueado',
    'Concluído'
  ],
  DEFAULT_PRIORITIES: [
    'Baixa',
    'Média',
    'Alta',
    'Crítica'
  ]
};

// Configuração de cores para status
export const STATUS_COLORS = {
  'Backlog': { bg: '#f1f5f9', fg: '#475569' },
  'Em andamento': { bg: '#dbeafe', fg: '#1e40af' },
  'Bloqueado': { bg: '#fee2e2', fg: '#991b1b' },
  'Concluído': { bg: '#d1fae5', fg: '#065f46' }
};

// Configuração de cores para prioridades
export const PRIORITY_COLORS = {
  'Baixa': { bg: '#e0f2fe', fg: '#075985' },
  'Média': { bg: '#fef3c7', fg: '#92400e' },
  'Alta': { bg: '#fed7aa', fg: '#9a3412' },
  'Crítica': { bg: '#fecaca', fg: '#991b1b' }
};

// Configuração de cores para gráficos Chart.js
export const CHART_COLORS = {
  emerald: '#3ba97d',
  sky: '#2586b6',
  amber: '#bfa13b',
  rose: '#b85c6b',
  slate: '#6b7a8c'
};

// Mapeamento de ícones para KPIs
export const KPI_ICONS = {
  total: '<path d="M3 6h18M3 12h18M3 18h18"/>',
  backlog: '<path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2"/>',
  emAndamento: '<path d="M13 10V3L4 14h7v7l9-11h-7z"/>',
  bloqueado: '<path d="M12 8v4m0 4h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z"/>',
  concluido: '<path d="M9 12l2 2 4-4m6 2a9 9 0 1 1-18 0 9 9 0 0 1 18 0z"/>',
  alta: '<path d="M13 10V3L4 14h7v7l9-11h-7z"/>',
  atrasadas: '<path d="M12 8v4l3 3m6-3a9 9 0 1 1-18 0 9 9 0 0 1 18 0z"/>'
};

// Exportar estado e funções auxiliares
export function updateAppState(key, value) {
  APP_STATE[key] = value;
}

export function getAppState(key) {
  return APP_STATE[key];
}
