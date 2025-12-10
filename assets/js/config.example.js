// ====================================
// CONFIGURAÇÕES E CONSTANTES GLOBAIS
// ====================================
// 
// ⚠️ INSTRUÇÕES PARA CONFIGURAR O PROJETO:
// 1. Copie este arquivo e renomeie para: config.js
// 2. Substitua os valores abaixo com suas credenciais do Supabase
// 3. NUNCA commite o arquivo config.js no GitHub!

// Configuração Supabase
export const SUPABASE_CONFIG = {
  url: "SUA_URL_DO_SUPABASE_AQUI",  // Exemplo: https://seuprojeto.supabase.co
  key: "SUA_ANON_KEY_DO_SUPABASE_AQUI"  // Encontre em: Project Settings > API > anon/public
};

// Cliente Supabase (será inicializado no main.js)
export let supabaseClient = null;

export function initializeSupabase() {
  if (typeof supabase === 'undefined') {
    console.error('❌ Supabase não foi carregado!');
    alert('Erro: Biblioteca Supabase não foi carregada. Verifique a conexão com a internet.');
    return null;
  }
  
  supabaseClient = supabase.createClient(
    SUPABASE_CONFIG.url,
    SUPABASE_CONFIG.key
  );
  
  console.log('✅ Supabase inicializado com sucesso!');
  return supabaseClient;
}

// ====================================
// CONSTANTES DE CONFIGURAÇÃO
// ====================================

export const CONFIG = {
  APP_NAME: 'Sistema de Plano de Ação',
  VERSION: '1.0.0',
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_FILE_TYPES: [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ],
  DATE_FORMAT: 'DD/MM/YYYY',
  DATETIME_FORMAT: 'DD/MM/YYYY HH:mm'
};

// ====================================
// CONSTANTES DE STATUS
// ====================================

export const STATUS = {
  AGUARDANDO: 'aguardando',
  EM_ANDAMENTO: 'em_andamento',
  CONCLUIDO: 'concluido',
  ATRASADO: 'atrasado'
};

export const STATUS_LABELS = {
  [STATUS.AGUARDANDO]: 'Aguardando',
  [STATUS.EM_ANDAMENTO]: 'Em Andamento',
  [STATUS.CONCLUIDO]: 'Concluído',
  [STATUS.ATRASADO]: 'Atrasado'
};

export const STATUS_COLORS = {
  [STATUS.AGUARDANDO]: '#6c757d',
  [STATUS.EM_ANDAMENTO]: '#0dcaf0',
  [STATUS.CONCLUIDO]: '#198754',
  [STATUS.ATRASADO]: '#dc3545'
};

// ====================================
// CONSTANTES DE PRIORIDADE
// ====================================

export const PRIORITY = {
  BAIXA: 'baixa',
  MEDIA: 'media',
  ALTA: 'alta',
  URGENTE: 'urgente'
};

export const PRIORITY_LABELS = {
  [PRIORITY.BAIXA]: 'Baixa',
  [PRIORITY.MEDIA]: 'Média',
  [PRIORITY.ALTA]: 'Alta',
  [PRIORITY.URGENTE]: 'Urgente'
};

export const PRIORITY_COLORS = {
  [PRIORITY.BAIXA]: '#6c757d',
  [PRIORITY.MEDIA]: '#0dcaf0',
  [PRIORITY.ALTA]: '#ffc107',
  [PRIORITY.URGENTE]: '#dc3545'
};
