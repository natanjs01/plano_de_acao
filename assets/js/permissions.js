// ====================================
// SISTEMA DE PERMISSÕES GRANULARES
// ====================================

import { APP_STATE } from './config.js';

// ====== DEFINIÇÃO DE PERFIS ======
export const PERFIS = {
  admin: {
    nome: 'Administrador',
    nivel: 5,
    descricao: 'Acesso total ao sistema'
  },
  consultoria: {
    nome: 'Consultoria',
    nivel: 4,
    descricao: 'Pode visualizar e criar relatórios de todas as tarefas, sem poder editar ou excluir'
  },
  coordenador: {
    nome: 'Coordenador',
    nivel: 3,
    descricao: 'Pode gerenciar tarefas e aprovar conclusões do seu setor'
  },
  supervisor: {
    nome: 'Supervisor',
    nivel: 2,
    descricao: 'Pode criar e editar tarefas do seu setor'
  },
  usuario: {
    nome: 'Usuário',
    nivel: 1,
    descricao: 'Pode visualizar tarefas e solicitar conclusões'
  }
};

// ====== MAPEAMENTO DE PERMISSÕES ======
export const PERMISSOES = {
  // TAREFAS
  'tarefas.criar': ['admin', 'coordenador', 'supervisor'],
  'tarefas.editar': ['admin', 'coordenador', 'supervisor'],
  'tarefas.editar.todas': ['admin'],
  'tarefas.editar.setor': ['coordenador', 'supervisor'],
  'tarefas.deletar': ['admin'],
  'tarefas.visualizar': ['admin', 'consultoria', 'coordenador', 'supervisor', 'usuario'],
  'tarefas.aprovar': ['admin', 'coordenador'],
  'tarefas.solicitar_conclusao': ['consultoria', 'usuario', 'supervisor'],
  
  // USUÁRIOS
  'usuarios.gerenciar': ['admin'],
  'usuarios.criar': ['admin'],
  'usuarios.editar': ['admin'],
  'usuarios.deletar': ['admin'],
  'usuarios.ativar_desativar': ['admin'],
  
  // SETORES
  'setores.gerenciar': ['admin'],
  'setores.criar': ['admin'],
  'setores.editar': ['admin'],
  'setores.deletar': ['admin'],
  
  // STATUS
  'status.gerenciar': ['admin'],
  
  // RELATÓRIOS
  'relatorios.visualizar': ['admin', 'consultoria', 'coordenador'],
  'relatorios.exportar': ['admin', 'consultoria', 'coordenador'],
  
  // SISTEMA
  'sistema.reset': ['admin'],
  'sistema.importar': ['admin'],
  'sistema.exportar': ['admin', 'consultoria', 'coordenador']
};

// ====== FUNÇÃO PARA DETERMINAR PERFIL DO USUÁRIO ======
/**
 * Determina o perfil do usuário baseado nos dados do banco
 * SEM ALTERAR O SUPABASE - usa apenas campos existentes
 */
export function getUserProfile(userData) {
  if (!userData) return 'usuario';
  
  // Se é admin no banco, retorna admin
  if (userData.is_admin === true) {
    return 'admin';
  }
  
  // REGRAS CUSTOMIZÁVEIS (adicione suas regras aqui)
  
  // CONSULTORIA: Se o nome contém "Consultoria"
  if (userData.nome && userData.nome.toLowerCase().includes('consultoria')) {
    return 'consultoria';
  }
  
  // COORDENADOR: Se o nome contém "Coordenador"
  if (userData.nome && userData.nome.toLowerCase().includes('coordenador')) {
    return 'coordenador';
  }
  
  // SUPERVISOR: Se o nome contém "Supervisor"
  if (userData.nome && userData.nome.toLowerCase().includes('supervisor')) {
    return 'supervisor';
  }
  
  // Exemplo: Verificar por email (domínio específico)
  // if (userData.email && userData.email.endsWith('@consultoria.com')) {
  //   return 'consultoria';
  // }
  
  // Padrão: usuário comum
  return 'usuario';
}

// ====== FUNÇÃO PARA VERIFICAR PERMISSÃO ======
/**
 * Verifica se o usuário atual tem permissão para realizar uma ação
 * @param {string} permissao - Permissão a verificar (ex: 'tarefas.criar')
 * @returns {boolean} - true se tem permissão, false caso contrário
 */
export function hasPermission(permissao) {
  const userData = APP_STATE.currentUserData;
  if (!userData) return false;
  
  const perfil = getUserProfile(userData);
  const perfisPermitidos = PERMISSOES[permissao];
  
  if (!perfisPermitidos) {
    console.warn(`⚠️ Permissão '${permissao}' não definida no sistema`);
    return false;
  }
  
  return perfisPermitidos.includes(perfil);
}

// ====== VERIFICAÇÕES ESPECÍFICAS ======

/**
 * Verifica se pode editar uma tarefa específica
 */
export function canEditTask(task) {
  const userData = APP_STATE.currentUserData;
  if (!userData) return false;
  
  const perfil = getUserProfile(userData);
  
  // Admin pode editar tudo
  if (perfil === 'admin') return true;
  
  // Coordenador/Supervisor podem editar tarefas do próprio setor
  if (perfil === 'coordenador' || perfil === 'supervisor') {
    if (hasPermission('tarefas.editar.setor')) {
      return task.setor_id === userData.setor_id;
    }
  }
  
  return false;
}

/**
 * Verifica se pode deletar uma tarefa específica
 */
export function canDeleteTask(task) {
  return hasPermission('tarefas.deletar');
}

/**
 * Verifica se pode aprovar solicitações de conclusão
 */
export function canApproveTask(task) {
  const userData = APP_STATE.currentUserData;
  if (!userData) return false;
  
  const perfil = getUserProfile(userData);
  
  // Admin pode aprovar tudo
  if (perfil === 'admin') return true;
  
  // Coordenador pode aprovar tarefas do próprio setor
  if (perfil === 'coordenador') {
    return task.setor_id === userData.setor_id;
  }
  
  return false;
}

/**
 * Filtra tarefas que o usuário pode visualizar
 */
export function filterTasksByPermission(tasks) {
  const userData = APP_STATE.currentUserData;
  if (!userData) return [];
  
  const perfil = getUserProfile(userData);
  
  // Admin vê tudo
  if (perfil === 'admin') return tasks;
  
  // Coordenador/Supervisor veem tarefas do próprio setor
  if (perfil === 'coordenador' || perfil === 'supervisor') {
    return tasks.filter(task => task.setor_id === userData.setor_id);
  }
  
  // Usuário comum vê tarefas do próprio setor
  if (perfil === 'usuario' && userData.setor_id) {
    return tasks.filter(task => task.setor_id === userData.setor_id);
  }
  
  return tasks;
}

// ====== FUNÇÕES AUXILIARES ======

/**
 * Retorna informações do perfil atual do usuário
 */
export function getCurrentUserProfile() {
  const userData = APP_STATE.currentUserData;
  if (!userData) return null;
  
  const perfilKey = getUserProfile(userData);
  return {
    key: perfilKey,
    ...PERFIS[perfilKey]
  };
}

/**
 * Lista todas as permissões do usuário atual
 */
export function getUserPermissions() {
  const userData = APP_STATE.currentUserData;
  if (!userData) return [];
  
  const perfil = getUserProfile(userData);
  
  return Object.entries(PERMISSOES)
    .filter(([permissao, perfis]) => perfis.includes(perfil))
    .map(([permissao]) => permissao);
}

/**
 * Debug: Mostra informações do sistema de permissões
 */
export function debugPermissions() {
  const userData = APP_STATE.currentUserData;
  if (!userData) {
    console.log('❌ Nenhum usuário logado');
    return;
  }
  
  const perfil = getCurrentUserProfile();
  const permissoes = getUserPermissions();
  
  console.log('👤 USUÁRIO:', userData.nome);
  console.log('🎭 PERFIL:', perfil.nome, `(nível ${perfil.nivel})`);
  console.log('📋 DESCRIÇÃO:', perfil.descricao);
  console.log('✅ PERMISSÕES:', permissoes);
  console.log('🏢 SETOR:', userData.setores?.nome || 'Nenhum');
  console.log('🔑 IS_ADMIN (banco):', userData.is_admin);
}

// Expor função de debug globalmente para testes
if (typeof window !== 'undefined') {
  window.debugPermissions = debugPermissions;
}
