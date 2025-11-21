// ====================================
// MÓDULO DE INTERFACE DO USUÁRIO
// ====================================

import { APP_STATE, STATUS_COLORS, PRIORITY_COLORS } from './config.js';
import { loadTasks, createTask, updateTask, deleteTask, saveAttachments } from './database.js';
import { updateCharts, updateKPIs } from './charts.js';

// ====== UTILITÁRIOS ======
export function formatDate(dateStr) {
  if (!dateStr) return '—';
  const date = new Date(dateStr);
  return date.toLocaleDateString('pt-BR');
}

// ====== RENDERIZAÇÃO ======
export function refreshAll() {
  updateKPIs();
  updateCharts();
  refreshViews();
}

export function refreshViews() {
  const currentView = document.getElementById('viewKanban').classList.contains('hidden') ? 'list' : 'kanban';
  
  if (currentView === 'list') {
    renderTaskList();
  } else {
    renderKanban();
  }
}

// ====== LISTA DE TAREFAS ======
export function renderTaskList() {
  const tbody = document.getElementById('taskTable');
  if (!tbody) return;

  const filteredTasks = applyFilters(APP_STATE.tasks);
  
  if (filteredTasks.length === 0) {
    tbody.innerHTML = '<tr><td colspan="9" class="text-center py-8 text-slate-500">Nenhuma atividade encontrada</td></tr>';
    return;
  }

  tbody.innerHTML = filteredTasks.map(task => `
    <tr class="hover:bg-slate-50">
      <td class="px-4 py-3">${task.sequential_id || task.id}</td>
      <td class="px-4 py-3 font-medium">${task.title}</td>
      <td class="px-4 py-3">${task.assignee || '—'}</td>
      <td class="px-4 py-3">${formatDate(task.due_date || task.due)}</td>
      <td class="px-4 py-3">
        <span class="px-2 py-1 rounded-full text-xs" style="background: ${PRIORITY_COLORS[task.priority]?.bg || '#e2e8f0'}; color: ${PRIORITY_COLORS[task.priority]?.fg || '#475569'}">
          ${task.priority || 'Média'}
        </span>
      </td>
      <td class="px-4 py-3">
        <span class="px-2 py-1 rounded-full text-xs" style="background: ${STATUS_COLORS[task.status]?.bg || '#e2e8f0'}; color: ${STATUS_COLORS[task.status]?.fg || '#475569'}">
          ${task.status || 'Backlog'}
        </span>
      </td>
      <td class="px-4 py-3">
        <div class="flex flex-wrap gap-1">
          ${(task.tags || []).map(tag => `<span class="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">${tag}</span>`).join('')}
        </div>
      </td>
      <td class="px-4 py-3">${(task.attachments || []).length > 0 ? `📎 ${task.attachments.length}` : '—'}</td>
      <td class="px-4 py-3">
        <button onclick="window.viewTaskDetails('${task.id}')" class="text-blue-600 hover:text-blue-800 mr-2" title="Ver detalhes">👁️</button>
        ${APP_STATE.isAdmin ? `<button onclick="window.editTask('${task.id}')" class="text-green-600 hover:text-green-800 mr-2" title="Editar">✏️</button>` : ''}
        ${APP_STATE.isAdmin ? `<button onclick="window.deleteTaskById('${task.id}')" class="text-red-600 hover:text-red-800" title="Excluir">🗑️</button>` : ''}
      </td>
    </tr>
  `).join('');
}

// ====== KANBAN ======
export function renderKanban() {
  const container = document.getElementById('viewKanban');
  if (!container) return;

  const statuses = ['Backlog', 'Em andamento', 'Bloqueado', 'Concluído'];
  const filteredTasks = applyFilters(APP_STATE.tasks);

  container.innerHTML = statuses.map(status => {
    const tasks = filteredTasks.filter(t => t.status === status);
    
    return `
      <div class="bg-slate-100 rounded-2xl p-4">
        <h3 class="font-semibold mb-3">${status} <span class="text-sm text-slate-600">(${tasks.length})</span></h3>
        <div class="space-y-3">
          ${tasks.map(task => `
            <div class="bg-white rounded-xl p-3 shadow-sm cursor-pointer hover:shadow-md transition" onclick="window.viewTaskDetails('${task.id}')">
              <h4 class="font-medium text-sm mb-2">${task.title}</h4>
              <div class="flex items-center justify-between text-xs text-slate-600">
                <span>${task.assignee || 'Sem responsável'}</span>
                <span class="px-2 py-1 rounded" style="background: ${PRIORITY_COLORS[task.priority]?.bg || '#e2e8f0'}">
                  ${task.priority || 'Média'}
                </span>
              </div>
              ${task.due_date || task.due ? `<div class="text-xs text-slate-500 mt-2">📅 ${formatDate(task.due_date || task.due)}</div>` : ''}
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }).join('');
}

// ====== FILTROS ======
export function applyFilters(tasks) {
  const searchTerm = document.getElementById('search')?.value.toLowerCase() || '';
  const statusFilter = document.getElementById('filterStatus')?.value || '';
  const priorityFilter = document.getElementById('filterPriority')?.value || '';
  const assigneeFilter = document.getElementById('filterAssignee')?.value.toLowerCase() || '';
  const searchTagsOnly = document.getElementById('searchTagsOnly')?.checked || false;

  return tasks.filter(task => {
    // Busca
    if (searchTerm) {
      if (searchTagsOnly) {
        const tags = (task.tags || []).join(' ').toLowerCase();
        if (!tags.includes(searchTerm)) return false;
      } else {
        const searchableText = `${task.title} ${task.description} ${task.assignee} ${(task.tags || []).join(' ')}`.toLowerCase();
        if (!searchableText.includes(searchTerm)) return false;
      }
    }

    // Status
    if (statusFilter && task.status !== statusFilter) return false;

    // Prioridade
    if (priorityFilter && task.priority !== priorityFilter) return false;

    // Responsável
    if (assigneeFilter && !task.assignee?.toLowerCase().includes(assigneeFilter)) return false;

    return true;
  });
}

// ====== MODAL DE TAREFA ======
export async function openTaskModal(taskId = null) {
  const modal = document.getElementById('taskModal');
  const form = document.getElementById('taskForm');
  const title = document.getElementById('modalTitle');
  
  // Carregar setores no dropdown
  await loadSetoresInTaskModal();
  
  if (taskId) {
    const task = APP_STATE.tasks.find(t => t.id === taskId);
    if (!task) return;
    
    title.textContent = 'Editar Atividade';
    document.getElementById('inputTitle').value = task.title || '';
    document.getElementById('inputAssignee').value = task.assignee || '';
    document.getElementById('inputDue').value = task.due_date || task.due || '';
    document.getElementById('inputPriority').value = task.priority || 'Alta';
    document.getElementById('inputStatus').value = task.status || 'Backlog';
    document.getElementById('inputTags').value = (task.tags || []).join(', ');
    document.getElementById('inputDescription').value = task.description || '';
    
    // Definir setor se existir
    if (task.setor_id) {
      const inputSetor = document.getElementById('inputSetor');
      if (inputSetor) {
        inputSetor.value = task.setor_id;
      }
    }
    
    form.dataset.taskId = taskId;
  } else {
    title.textContent = 'Nova Atividade';
    form.reset();
    delete form.dataset.taskId;
  }
  
  modal.showModal();
}

// ====== ATUALIZAR INTERFACE DO USUÁRIO ======
export async function updateUserInterface() {
  const userName = document.getElementById('userName');
  const userSetor = document.getElementById('userSetor');
  
  if (userName && APP_STATE.currentUser) {
    userName.textContent = APP_STATE.currentUser.user_metadata?.full_name || APP_STATE.currentUser.email.split('@')[0];
  }
  
  if (userSetor) {
    if (APP_STATE.isAdmin) {
      userSetor.textContent = 'TODOS OS SETORES';
      userSetor.style.backgroundColor = '#DC2626';
      userSetor.style.color = 'white';
    } else if (APP_STATE.currentSetor) {
      userSetor.textContent = APP_STATE.currentSetor.nome;
      userSetor.style.backgroundColor = APP_STATE.currentSetor.cor || '#3B82F6';
      userSetor.style.color = 'white';
    }
  }
  
  // Mostrar/ocultar botões baseado em permissões
  const adminButtons = ['btnAdmin', 'btnManageStatus', 'btnNew', 'btnReset', 'btnExport', 'btnImport'];
  adminButtons.forEach(btnId => {
    const btn = document.getElementById(btnId);
    if (btn) {
      if (APP_STATE.isAdmin) {
        btn.classList.remove('hidden');
      } else {
        btn.classList.add('hidden');
      }
    }
  });
  
  // Mostrar/ocultar filtro de setores
  const setorFilter = document.getElementById('setorFilter');
  if (setorFilter) {
    if (APP_STATE.isAdmin) {
      setorFilter.classList.remove('hidden');
      // Carregar setores no dropdown
      await populateSetorFilter();
    } else {
      setorFilter.classList.add('hidden');
    }
  }
  
  // Botão "Limpar Filtros" sempre disponível para todos os usuários
  const btnResetFilters = document.getElementById('btnResetFilters');
  if (btnResetFilters) {
    btnResetFilters.classList.remove('hidden');
  }
}

// ====== POPULAR FILTRO DE SETORES (ADMIN) ======
export async function populateSetorFilter() {
  try {
    const { data: setores, error } = await supabaseClient
      .from('setores')
      .select('*')
      .eq('ativo', true)
      .order('nome');

    if (error) throw error;

    const setorSelect = document.getElementById('setorSelect');
    if (setorSelect) {
      setorSelect.innerHTML = '<option value="">🌐 Todos os Setores</option>';
      
      setores.forEach(setor => {
        const option = document.createElement('option');
        option.value = setor.id;
        option.textContent = setor.nome;
        setorSelect.appendChild(option);
      });
    }
  } catch (error) {
    console.error('Erro ao carregar setores:', error);
  }
}

// ====== POPULAR SETORES NO MODAL DE TAREFA ======
export async function loadSetoresInTaskModal() {
  console.log('🎯 Carregando setores para modal de tarefas...');
  
  const select = document.getElementById('inputSetor');
  if (!select) {
    console.log('❌ Select de setor no modal não encontrado');
    return;
  }
  
  // Mostrar carregando
  select.innerHTML = '<option value="">Carregando setores...</option>';
  
  try {
    // Verificar se é admin ou usuário normal
    if (APP_STATE.isAdmin) {
      // Admin pode escolher qualquer setor
      const { data: setores, error } = await supabaseClient
        .from('setores')
        .select('id, nome')
        .eq('ativo', true)
        .order('nome');
        
      if (error || !setores) {
        console.error('❌ Erro ao carregar setores:', error);
        select.innerHTML = '<option value="">Erro ao carregar setores</option>';
        return;
      }
      
      // Limpar e adicionar opção padrão
      select.innerHTML = '<option value="">Selecione um setor</option>';
      
      // Adicionar setores
      setores.forEach(setor => {
        const option = document.createElement('option');
        option.value = setor.id;
        option.textContent = setor.nome;
        select.appendChild(option);
      });
      
      console.log(`✅ ${setores.length} setores carregados para admin`);
    } else {
      // Usuário normal - só pode criar tarefas no seu setor
      let userSetorId = null;
      let userSetorNome = 'Setor não definido';
      
      // Tentar obter setor de várias formas
      if (APP_STATE.currentSetor && APP_STATE.currentSetor.id) {
        userSetorId = APP_STATE.currentSetor.id;
        userSetorNome = APP_STATE.currentSetor.nome;
      } else if (APP_STATE.currentUserData && APP_STATE.currentUserData.setor_id) {
        userSetorId = APP_STATE.currentUserData.setor_id;
        // Buscar nome do setor
        try {
          const { data: setor } = await supabaseClient
            .from('setores')
            .select('nome')
            .eq('id', APP_STATE.currentUserData.setor_id)
            .single();
          if (setor) userSetorNome = setor.nome;
        } catch (e) {
          console.warn('Erro ao buscar nome do setor:', e);
        }
      }
      
      if (userSetorId) {
        select.innerHTML = `<option value="${userSetorId}">${userSetorNome}</option>`;
        select.value = userSetorId;
        select.disabled = true; // Desabilita para usuários normais
        console.log('✅ Setor fixo para usuário normal:', userSetorNome);
      } else {
        select.innerHTML = '<option value="">Usuário sem setor definido</option>';
        select.disabled = true;
        console.error('❌ Usuário sem setor definido');
      }
    }
  } catch (error) {
    console.error('❌ Erro ao carregar setores no modal:', error);
    select.innerHTML = '<option value="">Erro ao carregar</option>';
  }
}

// ====== FUNÇÕES AUXILIARES ======
export async function updatePendingApprovalsButtonVisibility() {
  const btn = document.getElementById('btnPendingApprovals');
  const badge = document.getElementById('pendingBadge');
  
  if (!btn) {
    console.log('⚠️ Botão de pendências não encontrado na página');
    return;
  }
  
  if (APP_STATE.isAdmin) {
    btn.classList.remove('hidden');
    
    // Carregar contagem de pendências após 2 segundos (não bloqueia login)
    setTimeout(async () => {
      try {
        const { loadPendingTasks } = await import('./database.js');
        const pendingTasks = await loadPendingTasks();
        const count = pendingTasks.length;
        
        if (badge) {
          if (count > 0) {
            badge.textContent = count;
            badge.classList.remove('hidden');
          } else {
            badge.classList.add('hidden');
          }
        }
        console.log(`✅ ${count} pendência(s) carregada(s)`);
      } catch (error) {
        console.error('Erro ao carregar pendências:', error);
      }
    }, 2000); // 2 segundos de delay
  } else {
    btn.classList.add('hidden');
    if (badge) badge.classList.add('hidden');
  }
}

// ====== MODAL DE DETALHES ======
export function openDetail(task) {
  const detailModal = document.getElementById('detailModal');
  const body = document.getElementById('detailBody');
  
  if (!detailModal || !body) {
    console.error('Modal de detalhes não encontrado');
    return;
  }
  
  // Armazenar referência da tarefa atual
  window.currentDetailTask = task;
  
  // Função auxiliar para badge de prioridade
  const badgePriority = (priority) => {
    const colors = PRIORITY_COLORS[priority] || { bg: '#e2e8f0', fg: '#475569' };
    return `<span class="px-2 py-1 rounded-full text-xs" style="background: ${colors.bg}; color: ${colors.fg}">${priority || 'Média'}</span>`;
  };
  
  // Função auxiliar para badge de status
  const badgeStatus = (status) => {
    const colors = STATUS_COLORS[status] || { bg: '#e2e8f0', fg: '#475569' };
    return `<span class="px-2 py-1 rounded-full text-xs" style="background: ${colors.bg}; color: ${colors.fg}">${status || 'Backlog'}</span>`;
  };
  
  body.innerHTML = `
    <div class='flex items-center gap-2 mb-3'>
      <span class='text-slate-500'>ID:</span>
      <span class='text-xs font-mono bg-slate-200 px-2 py-1 rounded text-slate-600'>${task.sequential_id || task.id || '-'}</span>
    </div>
    <div><span class='text-slate-500'>Título:</span> <span class='font-medium'>${task.title}</span></div>
    <div class='grid grid-cols-2 gap-2'>
      <div><span class='text-slate-500'>Responsável:</span> ${task.assignee || '-'}</div>
      <div><span class='text-slate-500'>Prazo:</span> ${formatDate(task.due_date || task.due)}</div>
      <div><span class='text-slate-500'>Prioridade:</span> ${badgePriority(task.priority)}</div>
      <div><span class='text-slate-500'>Status:</span> ${badgeStatus(task.status)}</div>
    </div>
    <div><span class='text-slate-500'>Descrição:</span><div class='mt-1'>${task.description || '-'}</div></div>
    <div><span class='text-slate-500'>Tags:</span> ${(task.tags || []).map(x => `<span class='text-xs bg-slate-100 rounded px-2 py-0.5 mr-1'>${x}</span>`).join('') || '-'}</div>
    <div>
      <span class='text-slate-500'>Anexos:</span>
      <div class='mt-2 flex flex-wrap gap-2' id='detailAttachments'>
        ${(task.attachments || []).map((a, idx) => {
          const isDataUrl = a.dataURL && a.dataURL.startsWith('data:');
          
          if (isDataUrl) {
            return `<div class='relative group'>
              <img src='${a.dataURL}' 
                   class='h-24 w-24 object-cover rounded-xl border hover:shadow-lg transition cursor-pointer attachment-img' 
                   alt='Anexo: ${a.name || 'imagem'}' 
                   loading='lazy' 
                   data-filename='${a.name}' 
                   data-index='${idx}'
                   title='Clique para visualizar ${a.name}'/>
              <div class='absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 rounded-xl transition-all flex items-center justify-center pointer-events-none'>
                <span class='text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity'>👁️</span>
              </div>
            </div>`;
          } else {
            return `<div class='h-24 w-24 bg-slate-100 rounded-xl border flex items-center justify-center text-xs text-slate-500 text-center' title='${a.name}'>
              <span>📎<br/>${a.name}</span>
            </div>`;
          }
        }).join('') || '<span class="text-slate-400">Nenhum anexo</span>'}
      </div>
    </div>`;
  
  detailModal.showModal();
  
  // Adicionar event listeners para as imagens
  const attachmentImgs = detailModal.querySelectorAll('.attachment-img');
  attachmentImgs.forEach(img => {
    img.addEventListener('click', function() {
      const index = parseInt(this.getAttribute('data-index'));
      const currentTask = window.currentDetailTask;
      
      if (currentTask && currentTask.attachments && currentTask.attachments[index]) {
        const attachment = currentTask.attachments[index];
        openImageModal(attachment.dataURL, attachment.name);
      } else {
        const dataURL = this.src;
        const fileName = this.getAttribute('data-filename') || 'Imagem';
        openImageModal(dataURL, fileName);
      }
    });
  });
}

// ====== MODAL DE VISUALIZAÇÃO DE IMAGEM ======
let currentImageData = null;

export function openImageModal(dataURL, fileName) {
  const imageModal = document.getElementById('imageModal');
  const img = document.getElementById('imageModalImg');
  const title = document.getElementById('imageModalTitle');
  
  if (!imageModal || !img || !title) {
    console.error('Modal de imagem não encontrado');
    return;
  }
  
  img.src = dataURL;
  img.alt = fileName || 'Imagem';
  title.textContent = fileName || 'Visualizar Imagem';
  currentImageData = { dataURL, fileName };
  
  imageModal.showModal();
}

export function closeImageModal() {
  const imageModal = document.getElementById('imageModal');
  if (imageModal) {
    imageModal.close();
    currentImageData = null;
  }
}

export function downloadCurrentImage() {
  if (currentImageData) {
    const link = document.createElement('a');
    link.href = currentImageData.dataURL;
    link.download = currentImageData.fileName || 'imagem.jpg';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

export function openImageInNewTab() {
  if (currentImageData) {
    const newWindow = window.open();
    if (newWindow) {
      newWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>${currentImageData.fileName || 'Imagem'}</title>
          <style>
            body { margin: 0; display: flex; justify-content: center; align-items: center; min-height: 100vh; background: #1e293b; }
            img { max-width: 100%; max-height: 100vh; object-fit: contain; }
          </style>
        </head>
        <body>
          <img src="${currentImageData.dataURL}" alt="${currentImageData.fileName || 'Imagem'}">
        </body>
        </html>
      `);
    }
  }
}

// Exportar funções para uso global
window.viewTaskDetails = (taskId) => {
  const task = APP_STATE.tasks.find(t => t.id === taskId);
  if (task) {
    openDetail(task);
  }
};

window.editTask = (taskId) => {
  openTaskModal(taskId);
};

window.deleteTaskById = async (taskId) => {
  if (confirm('Deseja realmente excluir esta tarefa?')) {
    await deleteTask(taskId);
  }
};
