// ====================================
// MÓDULO DE OPERAÇÕES COM BANCO DE DADOS
// ====================================

import { supabaseClient, APP_STATE, updateAppState } from './config.js';
import { showToast } from './auth.js';
import { refreshAll } from './ui.js';
import { hasPermission } from './permissions.js';

const STORAGE_KEY = 'tasks_backup';

// ====== CARREGAR TAREFAS ======
export async function loadTasks() {
  await loadTasksFromSupabase();
}

export async function loadTasksFromSupabase() {
  try {
    console.log('🚀 Carregando tarefas do Supabase...');
    const startTime = Date.now();
    
    if (!supabaseClient) {
      console.log('⚠️ SupabaseClient não disponível');
      updateAppState('tasks', []);
      return;
    }
    
    if (!APP_STATE.currentUser) {
      console.log('⚠️ Usuário não autenticado');
      updateAppState('tasks', []);
      return;
    }

    // Construir query base
    let query = supabaseClient.from('tasks').select(`
      *,
      setores(id, nome, cor)
    `);
    
    // Verificar se usuário pode visualizar todas as tarefas (Admin ou Consultoria)
    const canViewAllTasks = APP_STATE.isAdmin || hasPermission('tarefas.visualizar');
    
    // Aplicar filtros baseados no tipo de usuário e permissões
    if (canViewAllTasks && APP_STATE.selectedSetorFilter) {
      // Admin ou Consultoria com filtro de setor selecionado
      query = query.eq('setor_id', APP_STATE.selectedSetorFilter);
    } else if (!canViewAllTasks) {
      // Usuários sem permissão de visualizar tudo veem apenas seu setor
      const userSetorId = APP_STATE.currentUserData?.setor_id || APP_STATE.currentSetor?.id;
      
      if (userSetorId) {
        query = query.eq('setor_id', userSetorId);
      } else {
        console.warn('⚠️ Usuário sem setor definido');
        updateAppState('tasks', []);
        return;
      }
    }
    // Se canViewAllTasks = true e selectedSetorFilter não existe, mostra TODAS as tarefas
    
    const { data, error } = await query;
    
    if (error) {
      console.error('❌ Erro ao carregar tarefas:', error);
      updateAppState('tasks', []);
      showToast('Erro ao carregar tarefas: ' + error.message, 'error');
      return;
    }
    
    updateAppState('tasks', data || []);
    console.log(`✅ ${data?.length || 0} tarefas carregadas`);
    
    // Carregar anexos
    if (data && data.length > 0) {
      await loadAttachmentsForTasks(data);
    }
    
    await migrateExistingTasks();
    
    const endTime = Date.now();
    console.log(`⚡ Carregamento concluído em ${((endTime - startTime) / 1000).toFixed(2)}s`);
    
    refreshAll();
    
  } catch (error) {
    console.error('❌ Erro geral ao carregar tarefas:', error);
    updateAppState('tasks', []);
  }
}

// ====== CARREGAR ANEXOS ======
async function loadAttachmentsForTasks(tasks) {
  try {
    const taskIds = tasks.map(task => task.id);
    
    const { data: allAttachments, error } = await supabaseClient
      .from('task_attachments')
      .select('id, file_name, file_url, task_id')
      .in('task_id', taskIds);
    
    if (error) {
      console.warn('Aviso ao carregar anexos:', error);
      tasks.forEach(task => { task.attachments = []; });
      return;
    }
    
    const attachmentsByTaskId = {};
    
    (allAttachments || []).forEach(attach => {
      const isValidUrl = attach.file_url && (
        attach.file_url.startsWith('data:') || 
        attach.file_url.startsWith('http://') || 
        attach.file_url.startsWith('https://')
      );
      
      if (isValidUrl) {
        if (!attachmentsByTaskId[attach.task_id]) {
          attachmentsByTaskId[attach.task_id] = [];
        }
        
        attachmentsByTaskId[attach.task_id].push({
          id: attach.id,
          name: attach.file_name || 'anexo',
          dataURL: attach.file_url
        });
      }
    });
    
    tasks.forEach(task => {
      task.attachments = attachmentsByTaskId[task.id] || [];
    });
    
    console.log('✅ Anexos carregados');
  } catch (error) {
    console.error('Erro ao carregar anexos:', error);
  }
}

// ====== CRIAR TAREFA ======
export async function createTask(taskData) {
  try {
    // Atribuir setor automaticamente
    if (!APP_STATE.isAdmin && APP_STATE.currentSetor) {
      taskData.setor_id = APP_STATE.currentSetor.id;
    }
    
    const { data, error } = await supabaseClient
      .from('tasks')
      .insert(taskData)
      .select()
      .single();
    
    if (error) throw error;
    
    console.log('✅ Tarefa criada:', data);
    await loadTasksFromSupabase();
    return data;
    
  } catch (error) {
    console.error('❌ Erro ao criar tarefa:', error);
    showToast('Erro ao criar tarefa: ' + error.message, 'error');
    throw error;
  }
}

// ====== ATUALIZAR TAREFA ======
export async function updateTask(taskId, updates) {
  try {
    const { data, error } = await supabaseClient
      .from('tasks')
      .update(updates)
      .eq('id', taskId)
      .select()
      .single();
    
    if (error) throw error;
    
    console.log('✅ Tarefa atualizada:', data);
    await loadTasksFromSupabase();
    return data;
    
  } catch (error) {
    console.error('❌ Erro ao atualizar tarefa:', error);
    showToast('Erro ao atualizar tarefa: ' + error.message, 'error');
    throw error;
  }
}

// ====== DELETAR TAREFA ======
export async function deleteTask(taskId) {
  try {
    const { error } = await supabaseClient
      .from('tasks')
      .delete()
      .eq('id', taskId);
    
    if (error) throw error;
    
    console.log('✅ Tarefa deletada');
    await loadTasksFromSupabase();
    
  } catch (error) {
    console.error('❌ Erro ao deletar tarefa:', error);
    showToast('Erro ao deletar tarefa: ' + error.message, 'error');
    throw error;
  }
}

// ====== CARREGAR SETORES ======
export async function loadSetores() {
  try {
    const { data, error } = await supabaseClient
      .from('setores')
      .select('*')
      .order('nome');
    
    if (error) throw error;
    
    updateAppState('setores', data || []);
    return data;
    
  } catch (error) {
    console.error('❌ Erro ao carregar setores:', error);
    return [];
  }
}

// Criar novo setor
export async function createSetor(setorData) {
  try {
    console.log('🚀 Criando setor...');
    
    if (!supabaseClient) {
      throw new Error('SupabaseClient não disponível');
    }
    
    // Validar dados obrigatórios
    if (!setorData.nome || !setorData.cor) {
      throw new Error('Nome e cor são obrigatórios');
    }
    
    // Verificar se nome já existe
    const { data: existing } = await supabaseClient
      .from('setores')
      .select('nome')
      .eq('nome', setorData.nome)
      .single();
    
    if (existing) {
      throw new Error('Já existe um setor com este nome');
    }
    
    const { data, error } = await supabaseClient
      .from('setores')
      .insert([{
        nome: setorData.nome,
        cor: setorData.cor,
        ativo: setorData.ativo !== undefined ? setorData.ativo : true,
        created_at: new Date().toISOString()
      }])
      .select();
    
    if (error) throw error;
    
    console.log('✅ Setor criado com sucesso');
    showToast(`Setor ${setorData.nome} criado com sucesso!`, 'success');
    
    // Recarregar setores no estado
    await loadSetores();
    
    return data[0];
    
  } catch (error) {
    console.error('❌ Erro ao criar setor:', error);
    showToast('Erro ao criar setor: ' + error.message, 'error');
    throw error;
  }
}

// Atualizar setor
export async function updateSetor(setorId, setorData) {
  try {
    console.log('🚀 Atualizando setor...');
    
    if (!supabaseClient) {
      throw new Error('SupabaseClient não disponível');
    }
    
    // Se está mudando nome, verificar se já existe
    if (setorData.nome) {
      const { data: existing } = await supabaseClient
        .from('setores')
        .select('id, nome')
        .eq('nome', setorData.nome)
        .neq('id', setorId)
        .single();
      
      if (existing) {
        throw new Error('Já existe um setor com este nome');
      }
    }
    
    const updateData = {};
    if (setorData.nome !== undefined) updateData.nome = setorData.nome;
    if (setorData.cor !== undefined) updateData.cor = setorData.cor;
    if (setorData.ativo !== undefined) updateData.ativo = setorData.ativo;
    updateData.updated_at = new Date().toISOString();
    
    const { data, error } = await supabaseClient
      .from('setores')
      .update(updateData)
      .eq('id', setorId)
      .select();
    
    if (error) throw error;
    
    console.log('✅ Setor atualizado com sucesso');
    showToast('Setor atualizado com sucesso!', 'success');
    
    // Recarregar setores no estado
    await loadSetores();
    
    return data[0];
    
  } catch (error) {
    console.error('❌ Erro ao atualizar setor:', error);
    showToast('Erro ao atualizar setor: ' + error.message, 'error');
    throw error;
  }
}

// Deletar setor
export async function deleteSetor(setorId) {
  try {
    console.log('🚀 Deletando setor...');
    
    if (!supabaseClient) {
      throw new Error('SupabaseClient não disponível');
    }
    
    // Verificar se há usuários associados
    const { data: usuarios } = await supabaseClient
      .from('usuarios')
      .select('id')
      .eq('setor_id', setorId);
    
    if (usuarios && usuarios.length > 0) {
      throw new Error(`Este setor possui ${usuarios.length} usuário(s) associado(s). Reatribua os usuários antes de excluir.`);
    }
    
    // Verificar se há tarefas associadas
    const { data: tasks } = await supabaseClient
      .from('tasks')
      .select('id')
      .eq('setor_id', setorId);
    
    if (tasks && tasks.length > 0) {
      throw new Error(`Este setor possui ${tasks.length} tarefa(s) associada(s). Reatribua as tarefas antes de excluir.`);
    }
    
    const { error } = await supabaseClient
      .from('setores')
      .delete()
      .eq('id', setorId);
    
    if (error) throw error;
    
    console.log('✅ Setor deletado com sucesso');
    showToast('Setor removido com sucesso!', 'success');
    
    // Recarregar setores no estado
    await loadSetores();
    
  } catch (error) {
    console.error('❌ Erro ao deletar setor:', error);
    showToast('Erro ao deletar setor: ' + error.message, 'error');
    throw error;
  }
}

// Ativar/Desativar setor
export async function toggleSetorStatus(setorId, currentStatus) {
  try {
    console.log('🚀 Alterando status do setor...');
    
    if (!supabaseClient) {
      throw new Error('SupabaseClient não disponível');
    }
    
    const newStatus = !currentStatus;
    
    const { data, error } = await supabaseClient
      .from('setores')
      .update({ 
        ativo: newStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', setorId)
      .select();
    
    if (error) throw error;
    
    const statusText = newStatus ? 'ativado' : 'desativado';
    console.log(`✅ Setor ${statusText} com sucesso`);
    showToast(`Setor ${statusText} com sucesso!`, 'success');
    
    // Recarregar setores no estado
    await loadSetores();
    
    return data[0];
    
  } catch (error) {
    console.error('❌ Erro ao alterar status:', error);
    showToast('Erro ao alterar status: ' + error.message, 'error');
    throw error;
  }
}

// ====== CARREGAR OPÇÕES DE STATUS ======
export async function loadStatusOptions() {
  try {
    const { data, error } = await supabaseClient
      .from('status_options')
      .select('*')
      .eq('ativo', true)
      .order('ordem');
    
    if (error) throw error;
    
    updateAppState('statusOptions', data || []);
    return data;
    
  } catch (error) {
    console.error('❌ Erro ao carregar status:', error);
    return [];
  }
}

// ====== SALVAR ANEXOS ======
export async function saveAttachments(taskId, attachments) {
  try {
    console.log('💾 Salvando anexos para tarefa:', taskId);
    
    // Deletar anexos antigos
    await supabaseClient
      .from('task_attachments')
      .delete()
      .eq('task_id', taskId);
    
    // Inserir novos anexos
    if (attachments && attachments.length > 0) {
      const attachmentsData = attachments
        .filter(att => att.dataURL) // Filtrar apenas anexos com dataURL válido
        .map(att => ({
          task_id: taskId,
          file_name: att.name || 'anexo.jpg',
          file_url: att.dataURL
        }));
      
      if (attachmentsData.length > 0) {
        console.log(`📎 Inserindo ${attachmentsData.length} anexos...`);
        
        const { error } = await supabaseClient
          .from('task_attachments')
          .insert(attachmentsData);
        
        if (error) {
          console.error('❌ Erro ao inserir anexos:', error);
          throw error;
        }
        
        console.log('✅ Anexos salvos com sucesso');
      } else {
        console.log('⚠️ Nenhum anexo válido para salvar');
      }
    }
    
  } catch (error) {
    console.error('❌ Erro ao salvar anexos:', error);
    throw error;
  }
}

// ====== MIGRAR TAREFAS EXISTENTES ======
async function migrateExistingTasks() {
  try {
    const tasksWithoutSeqId = APP_STATE.tasks.filter(t => !t.sequential_id);
    
    if (tasksWithoutSeqId.length === 0) return;
    
    console.log(`🔄 Migrando ${tasksWithoutSeqId.length} tarefas sem sequential_id...`);
    
    for (const task of tasksWithoutSeqId) {
      const seqId = await generateSequentialId();
      
      await supabaseClient
        .from('tasks')
        .update({ sequential_id: seqId })
        .eq('id', task.id);
      
      task.sequential_id = seqId;
    }
    
    console.log('✅ Migração concluída');
    
  } catch (error) {
    console.error('Erro na migração:', error);
  }
}

// ====== GERAR ID SEQUENCIAL ======
// Função para gerar ID sequencial no formato ID001, ID002, etc.
async function generateSequentialId() {
  try {
    const { data, error } = await supabaseClient
      .from('tasks')
      .select('sequential_id')
      .order('sequential_id', { ascending: false });
    
    if (error) {
      console.error('Erro ao buscar último ID:', error);
      return 'ID001';
    }
    
    // Encontrar o maior número de ID
    const maxId = (data || []).reduce((max, task) => {
      if (task.sequential_id) {
        const num = parseInt(task.sequential_id.replace('ID', ''));
        return Math.max(max, isNaN(num) ? 0 : num);
      }
      return max;
    }, 0);
    
    // Retornar próximo ID no formato ID001, ID002, etc.
    return `ID${String(maxId + 1).padStart(3, '0')}`;
    
  } catch (error) {
    console.error('Erro ao gerar ID sequencial:', error);
    return 'ID001';
  }
}

// ====== CONFIRMAÇÃO DE CONCLUSÃO ======
export async function requestCompletion(taskId, notes = '') {
  try {
    const { data, error } = await supabaseClient
      .from('tasks')
      .update({
        confirmation_status: 'pending',
        confirmation_requested_at: new Date().toISOString(),
        confirmation_requested_by: APP_STATE.currentUser.email,
        confirmation_notes: notes
      })
      .eq('id', taskId)
      .select()
      .single();
    
    if (error) throw error;
    
    console.log('✅ Solicitação enviada');
    await loadTasksFromSupabase();
    return data;
    
  } catch (error) {
    console.error('❌ Erro ao solicitar confirmação:', error);
    showToast('Erro ao enviar solicitação: ' + error.message, 'error');
    throw error;
  }
}

export async function approveCompletion(taskId, adminNotes = '') {
  try {
    const { data, error } = await supabaseClient
      .from('tasks')
      .update({
        status: 'Concluído',
        confirmation_status: 'approved',
        confirmation_approved_at: new Date().toISOString(),
        confirmation_approved_by: APP_STATE.currentUser.id,
        admin_notes: adminNotes
      })
      .eq('id', taskId)
      .select()
      .single();
    
    if (error) throw error;
    
    console.log('✅ Conclusão aprovada');
    await loadTasksFromSupabase();
    return data;
    
  } catch (error) {
    console.error('❌ Erro ao aprovar:', error);
    showToast('Erro ao aprovar conclusão: ' + error.message, 'error');
    throw error;
  }
}

export async function rejectCompletion(taskId, adminNotes = '') {
  try {
    const { data, error } = await supabaseClient
      .from('tasks')
      .update({
        confirmation_status: 'rejected',
        confirmation_approved_at: new Date().toISOString(),
        confirmation_approved_by: APP_STATE.currentUser.id,
        admin_notes: adminNotes
      })
      .eq('id', taskId)
      .select()
      .single();
    
    if (error) throw error;
    
    console.log('✅ Conclusão rejeitada');
    await loadTasksFromSupabase();
    return data;
    
  } catch (error) {
    console.error('❌ Erro ao rejeitar:', error);
    showToast('Erro ao rejeitar conclusão: ' + error.message, 'error');
    throw error;
  }
}

// ====== GERENCIAMENTO DE USUÁRIOS ======

// Carregar todos os usuários
export async function loadUsers() {
  try {
    console.log('🚀 Carregando usuários...');
    
    if (!supabaseClient) {
      console.log('⚠️ SupabaseClient não disponível');
      return [];
    }
    
    const { data, error } = await supabaseClient
      .from('usuarios')
      .select(`
        *,
        setores(id, nome, cor)
      `)
      .order('nome', { ascending: true });
    
    if (error) throw error;
    
    console.log(`✅ ${data?.length || 0} usuários carregados`);
    return data || [];
    
  } catch (error) {
    console.error('❌ Erro ao carregar usuários:', error);
    showToast('Erro ao carregar usuários: ' + error.message, 'error');
    return [];
  }
}

// Criar novo usuário
export async function createUser(userData) {
  try {
    console.log('🚀 Criando usuário...');
    
    if (!supabaseClient) {
      throw new Error('SupabaseClient não disponível');
    }
    
    // Validar dados obrigatórios
    if (!userData.nome || !userData.email || !userData.setor_id) {
      throw new Error('Nome, email e setor são obrigatórios');
    }
    
    // Verificar se email já existe (com tratamento de erro RLS)
    try {
      const { data: existing, error: emailError } = await supabaseClient
        .from('usuarios')
        .select('email')
        .eq('email', userData.email)
        .maybeSingle(); // Usa maybeSingle() ao invés de single()
      
      // Só verifica se não houve erro e existe registro
      if (!emailError && existing) {
        throw new Error('Este email já está cadastrado');
      }
    } catch (emailCheckError) {
      // Se falhar a verificação (RLS), apenas loga mas continua
      console.warn('⚠️ Não foi possível verificar email duplicado:', emailCheckError.message);
    }
    
    const { data, error } = await supabaseClient
      .from('usuarios')
      .insert([{
        nome: userData.nome,
        email: userData.email,
        setor_id: userData.setor_id,
        is_admin: userData.is_admin || false,
        ativo: userData.ativo !== undefined ? userData.ativo : true,
        created_at: new Date().toISOString()
      }])
      .select(`
        *,
        setores(id, nome, cor)
      `);
    
    if (error) throw error;
    
    console.log('✅ Usuário criado com sucesso');
    showToast(`Usuário ${userData.nome} criado com sucesso!`, 'success');
    return data[0];
    
  } catch (error) {
    console.error('❌ Erro ao criar usuário:', error);
    showToast('Erro ao criar usuário: ' + error.message, 'error');
    throw error;
  }
}

// Atualizar usuário
export async function updateUser(userId, userData) {
  try {
    console.log('🚀 Atualizando usuário...');
    
    if (!supabaseClient) {
      throw new Error('SupabaseClient não disponível');
    }
    
    // Se está mudando email, verificar se já existe (com tratamento de erro RLS)
    if (userData.email) {
      try {
        const { data: existing, error: emailError } = await supabaseClient
          .from('usuarios')
          .select('id, email')
          .eq('email', userData.email)
          .neq('id', userId)
          .maybeSingle(); // Usa maybeSingle() ao invés de single()
        
        // Só verifica se não houve erro e existe registro
        if (!emailError && existing) {
          throw new Error('Este email já está cadastrado');
        }
      } catch (emailCheckError) {
        // Se falhar a verificação (RLS), apenas loga mas continua
        console.warn('⚠️ Não foi possível verificar email duplicado:', emailCheckError.message);
      }
    }
    
    const updateData = {};
    if (userData.nome !== undefined) updateData.nome = userData.nome;
    if (userData.email !== undefined) updateData.email = userData.email;
    if (userData.setor_id !== undefined) updateData.setor_id = userData.setor_id;
    if (userData.is_admin !== undefined) updateData.is_admin = userData.is_admin;
    if (userData.ativo !== undefined) updateData.ativo = userData.ativo;
    updateData.updated_at = new Date().toISOString();
    
    const { data, error } = await supabaseClient
      .from('usuarios')
      .update(updateData)
      .eq('id', userId)
      .select(`
        *,
        setores(id, nome, cor)
      `);
    
    if (error) throw error;
    
    console.log('✅ Usuário atualizado com sucesso');
    showToast('Usuário atualizado com sucesso!', 'success');
    return data[0];
    
  } catch (error) {
    console.error('❌ Erro ao atualizar usuário:', error);
    showToast('Erro ao atualizar usuário: ' + error.message, 'error');
    throw error;
  }
}

// Deletar usuário
export async function deleteUser(userId) {
  try {
    console.log('🚀 Deletando usuário...');
    
    if (!supabaseClient) {
      throw new Error('SupabaseClient não disponível');
    }
    
    // Verificar se há tarefas associadas
    const { data: tasks } = await supabaseClient
      .from('tasks')
      .select('id')
      .eq('assignee', userId);
    
    if (tasks && tasks.length > 0) {
      throw new Error(`Este usuário possui ${tasks.length} tarefa(s) associada(s). Reatribua as tarefas antes de excluir.`);
    }
    
    const { error } = await supabaseClient
      .from('usuarios')
      .delete()
      .eq('id', userId);
    
    if (error) throw error;
    
    console.log('✅ Usuário deletado com sucesso');
    showToast('Usuário removido com sucesso!', 'success');
    
  } catch (error) {
    console.error('❌ Erro ao deletar usuário:', error);
    showToast('Erro ao deletar usuário: ' + error.message, 'error');
    throw error;
  }
}

// Ativar/Desativar usuário
export async function toggleUserStatus(userId, currentStatus) {
  try {
    console.log('🚀 Alterando status do usuário...');
    
    if (!supabaseClient) {
      throw new Error('SupabaseClient não disponível');
    }
    
    const newStatus = !currentStatus;
    
    const { data, error } = await supabaseClient
      .from('usuarios')
      .update({ 
        ativo: newStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select(`
        *,
        setores(id, nome, cor)
      `);
    
    
    if (error) throw error;
    
    const statusText = newStatus ? 'ativado' : 'desativado';
    console.log(`✅ Usuário ${statusText} com sucesso`);
    showToast(`Usuário ${statusText} com sucesso!`, 'success');
    return data[0];
    
  } catch (error) {
    console.error('❌ Erro ao alterar status:', error);
    showToast('Erro ao alterar status: ' + error.message, 'error');
    throw error;
  }
}

// ====== FUNÇÕES DE PENDÊNCIAS ======
export async function loadPendingTasks() {
  try {
    console.log('🔍 Carregando tarefas pendentes de confirmação...');
    
    const { data, error } = await supabaseClient
      .from('tasks')
      .select(`
        *,
        setores(id, nome, cor)
      `)
      .eq('confirmation_status', 'pending')
      .order('confirmation_requested_at', { ascending: false });
    
    if (error) throw error;
    
    // Buscar nomes dos solicitantes usando email
    if (data && data.length > 0) {
      const userEmails = [...new Set(data.map(task => task.confirmation_requested_by).filter(Boolean))];
      
      if (userEmails.length > 0) {
        const { data: users, error: usersError } = await supabaseClient
          .from('usuarios')
          .select('email, nome')
          .in('email', userEmails);
        
        if (!usersError && users) {
          const usersMap = {};
          users.forEach(user => {
            usersMap[user.email] = user.nome;
          });
          
          // Adicionar nome do solicitante em cada tarefa
          data.forEach(task => {
            task.solicitante_nome = usersMap[task.confirmation_requested_by] || task.confirmation_requested_by || 'Não identificado';
          });
        }
      }
    }
    
    console.log(`✅ ${data?.length || 0} tarefas pendentes encontradas`);
    return data || [];
    
  } catch (error) {
    console.error('❌ Erro ao carregar pendências:', error);
    showToast('Erro ao carregar pendências: ' + error.message, 'error');
    return [];
  }
}

export async function approvePendingTask(taskId, adminNotes = '') {
  try {
    console.log('✅ Aprovando tarefa:', taskId);
    
    const { data, error } = await supabaseClient
      .from('tasks')
      .update({
        confirmation_status: 'approved',
        confirmation_approved_at: new Date().toISOString(),
        confirmation_approved_by: APP_STATE.currentUser.id,
        admin_notes: adminNotes,
        status: 'Concluído'
      })
      .eq('id', taskId)
      .select();
    
    if (error) throw error;
    
    console.log('✅ Tarefa aprovada com sucesso');
    showToast('Tarefa aprovada com sucesso!', 'success');
    return data[0];
    
  } catch (error) {
    console.error('❌ Erro ao aprovar tarefa:', error);
    showToast('Erro ao aprovar tarefa: ' + error.message, 'error');
    throw error;
  }
}

export async function rejectPendingTask(taskId, adminNotes = '') {
  try {
    console.log('❌ Rejeitando tarefa:', taskId);
    
    const { data, error } = await supabaseClient
      .from('tasks')
      .update({
        confirmation_status: 'rejected',
        confirmation_approved_at: new Date().toISOString(),
        confirmation_approved_by: APP_STATE.currentUser.id,
        admin_notes: adminNotes,
        status: 'Em andamento'
      })
      .eq('id', taskId)
      .select();
    
    if (error) throw error;
    
    console.log('✅ Tarefa rejeitada');
    showToast('Tarefa rejeitada. Status retornado para "Em Andamento"', 'info');
    return data[0];
    
  } catch (error) {
    console.error('❌ Erro ao rejeitar tarefa:', error);
    showToast('Erro ao rejeitar tarefa: ' + error.message, 'error');
    throw error;
  }
}


