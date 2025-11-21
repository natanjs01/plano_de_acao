// ====================================
// ORQUESTRADOR PRINCIPAL
// ====================================

import { initializeSupabase } from './config.js';
import { checkAuthStatus, sendVerificationCode, verifyCode, backToEmailForm, logout, getTempEmail } from './auth.js';
import { loadTasks } from './database.js';
import { initCharts, updateKPIs } from './charts.js';
import { refreshViews, renderTaskList, renderKanban, openTaskModal } from './ui.js';
import { exportJSON, importJSON, exportDashboardPDF, exportListPDF } from './reports.js';

// ====== INICIALIZAÇÃO ======
document.addEventListener('DOMContentLoaded', async function() {
  console.log('🚀 Inicializando aplicação...');
  
  // Inicializar Supabase
  initializeSupabase();
  
  // Verificar autenticação
  await checkAuthStatus();
  
  // Inicializar gráficos
  initCharts();
  
  // Configurar event listeners
  setupEventListeners();
  
  console.log('✅ Aplicação inicializada');
});

// ====== EVENT LISTENERS ======
function setupEventListeners() {
  // ========== AUTENTICAÇÃO ==========
  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', async function(e) {
      e.preventDefault();
      const email = document.getElementById('emailInput').value;
      await sendVerificationCode(email);
    });
  }
  
  const codeForm = document.getElementById('codeForm');
  if (codeForm) {
    codeForm.addEventListener('submit', async function(e) {
      e.preventDefault();
      const code = document.getElementById('codeInput').value;
      const email = getTempEmail();
      await verifyCode(email, code);
    });
  }
  
  const backToEmail = document.getElementById('backToEmail');
  if (backToEmail) {
    backToEmail.addEventListener('click', backToEmailForm);
  }
  
  const btnLogout = document.getElementById('btnLogout');
  if (btnLogout) {
    btnLogout.addEventListener('click', logout);
  }
  
  // ========== NAVEGAÇÃO ==========
  const btnNew = document.getElementById('btnNew');
  if (btnNew) {
    btnNew.addEventListener('click', () => openTaskModal());
  }
  
  const tabList = document.getElementById('tabList');
  if (tabList) {
    tabList.addEventListener('click', function() {
      document.getElementById('viewKanban').classList.add('hidden');
      document.getElementById('viewList').classList.remove('hidden');
      renderTaskList();
    });
  }
  
  const tabKanban = document.getElementById('tabKanban');
  if (tabKanban) {
    tabKanban.addEventListener('click', function() {
      document.getElementById('viewList').classList.add('hidden');
      document.getElementById('viewKanban').classList.remove('hidden');
      renderKanban();
    });
  }
  
  // ========== FILTROS ==========
  const filterInputs = ['search', 'filterStatus', 'filterPriority', 'filterAssignee', 'searchTagsOnly'];
  filterInputs.forEach(id => {
    const element = document.getElementById(id);
    if (element) {
      element.addEventListener('input', refreshViews);
      element.addEventListener('change', refreshViews);
    }
  });
  
  // Filtro de setor (admin) - recarrega do banco
  const setorSelect = document.getElementById('setorSelect');
  if (setorSelect) {
    setorSelect.addEventListener('change', async function() {
      const { updateAppState } = await import('./config.js');
      updateAppState('selectedSetorFilter', this.value || null);
      await loadTasks();
    });
  }
  
  const btnResetFilters = document.getElementById('btnResetFilters');
  if (btnResetFilters) {
    btnResetFilters.addEventListener('click', function() {
      document.getElementById('search').value = '';
      document.getElementById('filterStatus').value = '';
      document.getElementById('filterPriority').value = '';
      document.getElementById('filterAssignee').value = '';
      document.getElementById('searchTagsOnly').checked = false;
      
      // Resetar filtro de setor (apenas para admin)
      const setorSelect = document.getElementById('setorSelect');
      if (setorSelect) {
        setorSelect.value = '';
      }
      
      refreshViews();
    });
  }
  
  // ========== EXPORTAÇÃO/IMPORTAÇÃO ==========
  const btnExport = document.getElementById('btnExport');
  if (btnExport) {
    btnExport.addEventListener('click', exportJSON);
  }
  
  const inputImport = document.getElementById('inputImport');
  if (inputImport) {
    inputImport.addEventListener('change', function(e) {
      const file = e.target.files[0];
      if (file) {
        importJSON(file);
      }
    });
  }
  
  // ========== RELATÓRIOS ==========
  const btnExportPDF = document.getElementById('btnExportPDF');
  if (btnExportPDF) {
    btnExportPDF.addEventListener('click', exportDashboardPDF);
  }
  
  const btnExportListPDF = document.getElementById('btnExportListPDF');
  if (btnExportListPDF) {
    btnExportListPDF.addEventListener('click', exportListPDF);
  }
  
  // ========== MODAIS ==========
  const btnCloseModal = document.getElementById('btnCloseModal');
  if (btnCloseModal) {
    btnCloseModal.addEventListener('click', function() {
      document.getElementById('taskModal').close();
    });
  }
  
  const btnCloseDetail = document.getElementById('btnCloseDetail');
  if (btnCloseDetail) {
    btnCloseDetail.addEventListener('click', function() {
      document.getElementById('detailModal').close();
    });
  }
  
  const btnCloseDetail2 = document.getElementById('btnCloseDetail2');
  if (btnCloseDetail2) {
    btnCloseDetail2.addEventListener('click', function() {
      document.getElementById('detailModal').close();
    });
  }
  
  // ========== MODAL DE IMAGEM ==========
  const btnCloseImage = document.getElementById('btnCloseImage');
  if (btnCloseImage) {
    btnCloseImage.addEventListener('click', function() {
      const imageModal = document.getElementById('imageModal');
      if (imageModal) {
        imageModal.close();
      }
    });
  }
  
  const btnDownloadImage = document.getElementById('btnDownloadImage');
  if (btnDownloadImage) {
    btnDownloadImage.addEventListener('click', async function() {
      const { downloadCurrentImage } = await import('./ui.js');
      downloadCurrentImage();
    });
  }
  
  const btnOpenImageNewTab = document.getElementById('btnOpenImageNewTab');
  if (btnOpenImageNewTab) {
    btnOpenImageNewTab.addEventListener('click', async function() {
      const { openImageInNewTab } = await import('./ui.js');
      openImageInNewTab();
    });
  }
  
  // ========== MODAL DE SOLICITAÇÃO DE CONCLUSÃO ==========
  const btnCloseConfirmationModal = document.getElementById('btnCloseConfirmationModal');
  if (btnCloseConfirmationModal) {
    btnCloseConfirmationModal.addEventListener('click', function() {
      const modal = document.getElementById('confirmationRequestModal');
      if (modal) modal.close();
    });
  }
  
  const btnCancelConfirmationRequest = document.getElementById('btnCancelConfirmationRequest');
  if (btnCancelConfirmationRequest) {
    btnCancelConfirmationRequest.addEventListener('click', function() {
      const modal = document.getElementById('confirmationRequestModal');
      if (modal) modal.close();
    });
  }
  
  const confirmationForm = document.getElementById('confirmationForm');
  if (confirmationForm) {
    confirmationForm.addEventListener('submit', async function(e) {
      e.preventDefault();
      
      const taskId = this.dataset.taskId;
      const notes = document.getElementById('confirmationNotes').value;
      
      if (!taskId) {
        alert('Erro: ID da tarefa não encontrado!');
        return;
      }
      
      try {
        const { requestCompletion } = await import('./database.js');
        await requestCompletion(taskId, notes || '');
        
        // Fechar modal
        const modal = document.getElementById('confirmationRequestModal');
        if (modal) modal.close();
        
        // Mostrar mensagem de sucesso
        alert('✅ Solicitação de conclusão enviada!\n\nO administrador será notificado e avaliará sua solicitação.');
        
      } catch (error) {
        alert('❌ Erro ao enviar solicitação: ' + error.message);
      }
    });
  }
  
  // ========== MENU LATERAL DE RELATÓRIOS ==========
  const btnRelatorios = document.getElementById('btnRelatorios');
  const offcanvas = document.getElementById('offcanvasRelatorios');
  const btnCloseRelatorios = document.getElementById('btnCloseRelatorios');
  
  if (btnRelatorios && offcanvas) {
    btnRelatorios.addEventListener('click', function() {
      offcanvas.style.display = 'flex';
      setTimeout(() => { offcanvas.classList.remove('translate-x-full'); }, 10);
    });
  }
  
  if (btnCloseRelatorios && offcanvas) {
    btnCloseRelatorios.addEventListener('click', function() {
      offcanvas.classList.add('translate-x-full');
      setTimeout(() => { offcanvas.style.display = 'none'; }, 300);
    });
  }
  
  // Fechar ao clicar fora
  document.addEventListener('mousedown', function(e) {
    if (offcanvas && offcanvas.style.display === 'flex' && !offcanvas.contains(e.target) && e.target !== btnRelatorios) {
      offcanvas.classList.add('translate-x-full');
      setTimeout(() => { offcanvas.style.display = 'none'; }, 300);
    }
  });
  
  // ========== GERENCIAR STATUS ==========
  const btnManageStatus = document.getElementById('btnManageStatus');
  const statusModal = document.getElementById('statusModal');
  
  if (btnManageStatus && statusModal) {
    btnManageStatus.addEventListener('click', function() {
      renderStatusList();
      statusModal.showModal();
    });
  }
  
  const btnCloseStatusModal = document.getElementById('btnCloseStatusModal');
  if (btnCloseStatusModal && statusModal) {
    btnCloseStatusModal.addEventListener('click', function() {
      statusModal.close();
    });
  }
  
  const btnCloseStatusModal2 = document.getElementById('btnCloseStatusModal2');
  if (btnCloseStatusModal2 && statusModal) {
    btnCloseStatusModal2.addEventListener('click', function() {
      statusModal.close();
    });
  }
  
  const btnAddStatus = document.getElementById('btnAddStatus');
  if (btnAddStatus) {
    btnAddStatus.addEventListener('click', function() {
      const name = document.getElementById('newStatusName')?.value || '';
      const color = document.getElementById('newStatusColor')?.value || 'bg-slate-200 text-slate-800';
      
      if (!name.trim()) {
        alert('Nome do status é obrigatório');
        return;
      }
      
      // Por enquanto apenas mostra que foi clicado - a funcionalidade completa virá depois
      console.log('Adicionar status:', name, color);
      alert('Funcionalidade de gerenciamento de status em desenvolvimento.\n\nPor enquanto, use os status padrão:\n- Backlog\n- Em andamento\n- Bloqueado\n- Concluído');
    });
  }
  
  // ========== BOTÃO ADMIN ==========
  const btnAdmin = document.getElementById('btnAdmin');
  if (btnAdmin) {
    btnAdmin.addEventListener('click', function() {
      openAdminPanel();
    });
  }
  
  // ========== BOTÃO PENDÊNCIAS ==========
  const btnPendingApprovals = document.getElementById('btnPendingApprovals');
  if (btnPendingApprovals) {
    btnPendingApprovals.addEventListener('click', function() {
      openPendingApprovals();
    });
  }
  
  // Event listeners do modal de pendências
  const pendingModal = document.getElementById('pendingApprovalsModal');
  const btnClosePendingModal = document.getElementById('btnClosePendingModal');
  const btnClosePendingModal2 = document.getElementById('btnClosePendingModal2');
  const btnRefreshPending = document.getElementById('btnRefreshPending');
  
  if (btnClosePendingModal && pendingModal) {
    btnClosePendingModal.addEventListener('click', function() {
      pendingModal.close();
    });
  }
  
  if (btnClosePendingModal2 && pendingModal) {
    btnClosePendingModal2.addEventListener('click', function() {
      pendingModal.close();
    });
  }
  
  if (btnRefreshPending) {
    btnRefreshPending.addEventListener('click', function() {
      loadAndRenderPendingTasks();
    });
  }
  
  // Event listeners do modal admin
  const adminPanel = document.getElementById('adminPanel');
  const btnCloseAdminPanel = document.getElementById('btnCloseAdminPanel');
  const btnCancelAdminPanel = document.getElementById('btnCancelAdminPanel');
  
  if (btnCloseAdminPanel && adminPanel) {
    btnCloseAdminPanel.addEventListener('click', function() {
      adminPanel.close();
    });
  }
  
  if (btnCancelAdminPanel && adminPanel) {
    btnCancelAdminPanel.addEventListener('click', function() {
      adminPanel.close();
    });
  }
  
  // Event listeners para os botões de opções do admin
  const adminOptions = document.querySelectorAll('.admin-option');
  adminOptions.forEach(button => {
    button.addEventListener('click', function() {
      const option = this.getAttribute('data-option');
      handleAdminOption(option);
      if (adminPanel) adminPanel.close();
    });
  });
  
  console.log('✅ Event listeners configurados');
}

// ====== FUNÇÃO PARA RENDERIZAR LISTA DE STATUS ======
function renderStatusList() {
  const statusList = document.getElementById('statusList');
  if (!statusList) return;
  
  const statusNames = ['Backlog', 'Em andamento', 'Bloqueado', 'Concluído'];
  
  statusList.innerHTML = '';
  
  statusNames.forEach(statusName => {
    const statusItem = document.createElement('div');
    statusItem.className = 'flex items-center justify-between p-3 bg-white border border-slate-200 rounded-xl';
    
    const colors = {
      'Backlog': 'bg-slate-100 text-slate-800',
      'Em andamento': 'bg-blue-100 text-blue-800',
      'Bloqueado': 'bg-red-100 text-red-800',
      'Concluído': 'bg-green-100 text-green-800'
    };
    
    statusItem.innerHTML = `
      <div class="flex items-center gap-3">
        <span class="px-3 py-1 rounded-full text-xs font-medium ${colors[statusName] || 'bg-slate-100 text-slate-800'}">${statusName}</span>
        <span class="text-sm text-slate-600">(Padrão)</span>
      </div>
    `;
    
    statusList.appendChild(statusItem);
  });
}

// ====== FUNÇÃO PARA ABRIR PAINEL ADMIN ======
function openAdminPanel() {
  const adminPanel = document.getElementById('adminPanel');
  if (adminPanel) {
    adminPanel.showModal();
  }
}

// ====== FUNÇÃO PARA PROCESSAR OPÇÃO DO ADMIN ======
async function handleAdminOption(option) {
  switch(option) {
    case 'users':
      await openUserManagement();
      break;
    case 'setores':
      await openSetorManagement();
      break;
    case 'relatorios':
      alert('📊 Relatórios Administrativos\n\nFuncionalidade em desenvolvimento.\n\nEm breve você poderá:\n• Relatório de produtividade\n• Análise de prazos\n• Estatísticas por setor\n• Exportação avançada');
      break;
  }
}

// ====== GERENCIAMENTO DE USUÁRIOS ======
let allUsersCache = [];
let allSetoresCache = [];

async function openUserManagement() {
  const { loadUsers } = await import('./database.js');
  const { loadSetores } = await import('./database.js');
  
  // Carregar dados
  allUsersCache = await loadUsers();
  allSetoresCache = await loadSetores();
  
  // Preencher select de setores no formulário
  const newUserSetor = document.getElementById('newUserSetor');
  if (newUserSetor && allSetoresCache.length > 0) {
    newUserSetor.innerHTML = '<option value="">Selecione um setor</option>';
    allSetoresCache.forEach(setor => {
      const option = document.createElement('option');
      option.value = setor.id;
      option.textContent = setor.nome;
      newUserSetor.appendChild(option);
    });
  }
  
  // Preencher select de setores no filtro
  const filterUserSetor = document.getElementById('filterUserSetor');
  if (filterUserSetor && allSetoresCache.length > 0) {
    filterUserSetor.innerHTML = '<option value="">Todos os setores</option>';
    allSetoresCache.forEach(setor => {
      const option = document.createElement('option');
      option.value = setor.id;
      option.textContent = setor.nome;
      filterUserSetor.appendChild(option);
    });
  }
  
  // Renderizar lista
  renderUserList();
  
  // Adicionar event listeners
  setupUserManagementListeners();
  
  // Abrir modal
  const modal = document.getElementById('userManagementModal');
  if (modal) modal.showModal();
}

function setupUserManagementListeners() {
  // Fechar modal
  const btnClose = document.getElementById('btnCloseUserManagement');
  const btnClose2 = document.getElementById('btnCloseUserManagement2');
  const modal = document.getElementById('userManagementModal');
  
  if (btnClose && modal) {
    btnClose.replaceWith(btnClose.cloneNode(true));
    const newBtnClose = document.getElementById('btnCloseUserManagement');
    newBtnClose.addEventListener('click', () => modal.close());
  }
  
  if (btnClose2 && modal) {
    btnClose2.replaceWith(btnClose2.cloneNode(true));
    const newBtnClose2 = document.getElementById('btnCloseUserManagement2');
    newBtnClose2.addEventListener('click', () => modal.close());
  }
  
  // Adicionar usuário
  const btnAddUser = document.getElementById('btnAddUser');
  if (btnAddUser) {
    btnAddUser.replaceWith(btnAddUser.cloneNode(true));
    const newBtnAddUser = document.getElementById('btnAddUser');
    newBtnAddUser.addEventListener('click', handleAddUser);
  }
  
  // Filtros
  const searchUsers = document.getElementById('searchUsers');
  const filterUserSetor = document.getElementById('filterUserSetor');
  const filterUserStatus = document.getElementById('filterUserStatus');
  
  if (searchUsers) {
    searchUsers.replaceWith(searchUsers.cloneNode(true));
    const newSearchUsers = document.getElementById('searchUsers');
    newSearchUsers.addEventListener('input', renderUserList);
  }
  
  if (filterUserSetor) {
    filterUserSetor.replaceWith(filterUserSetor.cloneNode(true));
    const newFilterUserSetor = document.getElementById('filterUserSetor');
    newFilterUserSetor.addEventListener('change', renderUserList);
  }
  
  if (filterUserStatus) {
    filterUserStatus.replaceWith(filterUserStatus.cloneNode(true));
    const newFilterUserStatus = document.getElementById('filterUserStatus');
    newFilterUserStatus.addEventListener('change', renderUserList);
  }
}

async function handleAddUser() {
  const { createUser } = await import('./database.js');
  
  const nome = document.getElementById('newUserName')?.value.trim();
  const email = document.getElementById('newUserEmail')?.value.trim();
  const setor_id = document.getElementById('newUserSetor')?.value;
  const is_admin = document.getElementById('newUserType')?.value === 'admin';
  const ativo = document.getElementById('newUserActive')?.checked;
  
  if (!nome || !email || !setor_id) {
    alert('❌ Por favor, preencha todos os campos obrigatórios (Nome, Email e Setor)');
    return;
  }
  
  // Validar email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    alert('❌ Por favor, insira um email válido');
    return;
  }
  
  try {
    await createUser({
      nome,
      email,
      setor_id: parseInt(setor_id),
      is_admin,
      ativo
    });
    
    // Limpar campos
    document.getElementById('newUserName').value = '';
    document.getElementById('newUserEmail').value = '';
    document.getElementById('newUserSetor').value = '';
    document.getElementById('newUserType').value = 'user';
    document.getElementById('newUserActive').checked = true;
    
    // Recarregar lista
    const { loadUsers } = await import('./database.js');
    allUsersCache = await loadUsers();
    renderUserList();
    
  } catch (error) {
    console.error('Erro ao adicionar usuário:', error);
  }
}

function renderUserList() {
  const tbody = document.getElementById('userTableBody');
  const emptyMsg = document.getElementById('userListEmpty');
  
  if (!tbody) return;
  
  // Filtros
  const searchTerm = document.getElementById('searchUsers')?.value.toLowerCase() || '';
  const filterSetor = document.getElementById('filterUserSetor')?.value || '';
  const filterStatus = document.getElementById('filterUserStatus')?.value || '';
  
  // Aplicar filtros
  let filteredUsers = allUsersCache.filter(user => {
    const matchSearch = !searchTerm || 
      user.nome.toLowerCase().includes(searchTerm) || 
      user.email.toLowerCase().includes(searchTerm);
    
    const matchSetor = !filterSetor || user.setor_id == filterSetor;
    
    const matchStatus = !filterStatus || 
      (filterStatus === 'true' && user.ativo) || 
      (filterStatus === 'false' && !user.ativo);
    
    return matchSearch && matchSetor && matchStatus;
  });
  
  // Renderizar
  if (filteredUsers.length === 0) {
    tbody.innerHTML = '';
    if (emptyMsg) emptyMsg.classList.remove('hidden');
    return;
  }
  
  if (emptyMsg) emptyMsg.classList.add('hidden');
  
  tbody.innerHTML = filteredUsers.map(user => {
    const setorNome = user.setores?.nome || 'Sem setor';
    const statusBadge = user.ativo 
      ? '<span class="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">Ativo</span>'
      : '<span class="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">Inativo</span>';
    
    const tipoBadge = user.is_admin
      ? '<span class="px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">Admin</span>'
      : '<span class="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">Usuário</span>';
    
    return `
      <tr class="hover:bg-slate-50 transition">
        <td class="px-4 py-3 font-medium">${user.nome}</td>
        <td class="px-4 py-3 text-slate-600">${user.email}</td>
        <td class="px-4 py-3">
          <span class="px-2 py-1 rounded-full text-xs font-medium" style="background-color: ${user.setores?.cor || '#e2e8f0'}">
            ${setorNome}
          </span>
        </td>
        <td class="px-4 py-3">${tipoBadge}</td>
        <td class="px-4 py-3 text-center">${statusBadge}</td>
        <td class="px-4 py-3 text-center">
          <div class="flex items-center justify-center gap-1">
            <button onclick="editUser(${user.id})" class="p-2 rounded-lg hover:bg-blue-100 text-blue-600 transition" title="Editar">
              <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
            </button>
            <button onclick="toggleUserStatusBtn(${user.id}, ${user.ativo})" class="p-2 rounded-lg hover:bg-amber-100 text-amber-600 transition" title="${user.ativo ? 'Desativar' : 'Ativar'}">
              <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                ${user.ativo 
                  ? '<path d="M10 9v6m4-6v6m7-3a9 9 0 1 1-18 0 9 9 0 0 1 18 0z"/>' 
                  : '<path d="M14.752 11.168l-3.197-2.132A1 1 0 0 0 10 9.87v4.263a1 1 0 0 0 1.555.832l3.197-2.132a1 1 0 0 0 0-1.664z"/><path d="M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z"/>'
                }
              </svg>
            </button>
            <button onclick="deleteUserBtn(${user.id}, '${user.nome.replace(/'/g, "\\'")}')" class="p-2 rounded-lg hover:bg-red-100 text-red-600 transition" title="Excluir">
              <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
              </svg>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

// Funções globais para os botões
async function editUser(userId) {
  const user = allUsersCache.find(u => u.id === userId);
  if (!user) return;
  
  const nome = prompt('Nome:', user.nome);
  if (nome === null) return;
  
  const email = prompt('Email:', user.email);
  if (email === null) return;
  
  const isAdmin = confirm('Usuário é administrador?');
  
  if (!nome.trim() || !email.trim()) {
    alert('Nome e email são obrigatórios');
    return;
  }
  
  try {
    const { updateUser } = await import('./database.js');
    await updateUser(userId, {
      nome: nome.trim(),
      email: email.trim(),
      is_admin: isAdmin
    });
    
    const { loadUsers } = await import('./database.js');
    allUsersCache = await loadUsers();
    renderUserList();
  } catch (error) {
    console.error('Erro ao editar usuário:', error);
  }
}

async function toggleUserStatusBtn(userId, currentStatus) {
  try {
    const { toggleUserStatus } = await import('./database.js');
    await toggleUserStatus(userId, currentStatus);
    
    const { loadUsers } = await import('./database.js');
    allUsersCache = await loadUsers();
    renderUserList();
  } catch (error) {
    console.error('Erro ao alterar status:', error);
  }
}

async function deleteUserBtn(userId, userName) {
  if (!confirm(`Tem certeza que deseja excluir o usuário "${userName}"?\n\nEsta ação não pode ser desfeita.`)) {
    return;
  }
  
  try {
    const { deleteUser } = await import('./database.js');
    await deleteUser(userId);
    
    const { loadUsers } = await import('./database.js');
    allUsersCache = await loadUsers();
    renderUserList();
  } catch (error) {
    console.error('Erro ao excluir usuário:', error);
  }
}

// ====== GERENCIAMENTO DE SETORES ======
let allSetoresManagementCache = [];

async function openSetorManagement() {
  const { loadSetores } = await import('./database.js');
  
  // Carregar dados
  allSetoresManagementCache = await loadSetores();
  
  // Renderizar lista
  renderSetorList();
  
  // Adicionar event listeners
  setupSetorManagementListeners();
  
  // Abrir modal
  const modal = document.getElementById('setorManagementModal');
  if (modal) modal.showModal();
}

function setupSetorManagementListeners() {
  // Fechar modal
  const btnClose = document.getElementById('btnCloseSetorManagement');
  const btnClose2 = document.getElementById('btnCloseSetorManagement2');
  const modal = document.getElementById('setorManagementModal');
  
  if (btnClose && modal) {
    btnClose.replaceWith(btnClose.cloneNode(true));
    const newBtnClose = document.getElementById('btnCloseSetorManagement');
    newBtnClose.addEventListener('click', () => modal.close());
  }
  
  if (btnClose2 && modal) {
    btnClose2.replaceWith(btnClose2.cloneNode(true));
    const newBtnClose2 = document.getElementById('btnCloseSetorManagement2');
    newBtnClose2.addEventListener('click', () => modal.close());
  }
  
  // Adicionar setor
  const btnAddSetor = document.getElementById('btnAddSetor');
  if (btnAddSetor) {
    btnAddSetor.replaceWith(btnAddSetor.cloneNode(true));
    const newBtnAddSetor = document.getElementById('btnAddSetor');
    newBtnAddSetor.addEventListener('click', handleAddSetor);
  }
  
  // Filtros
  const searchSetores = document.getElementById('searchSetores');
  const filterSetorStatus = document.getElementById('filterSetorStatus');
  
  if (searchSetores) {
    searchSetores.replaceWith(searchSetores.cloneNode(true));
    const newSearchSetores = document.getElementById('searchSetores');
    newSearchSetores.addEventListener('input', renderSetorList);
  }
  
  if (filterSetorStatus) {
    filterSetorStatus.replaceWith(filterSetorStatus.cloneNode(true));
    const newFilterSetorStatus = document.getElementById('filterSetorStatus');
    newFilterSetorStatus.addEventListener('change', renderSetorList);
  }
}

async function handleAddSetor() {
  const { createSetor } = await import('./database.js');
  
  const nome = document.getElementById('newSetorNome')?.value.trim();
  const cor = document.getElementById('newSetorCor')?.value;
  
  if (!nome || !cor) {
    alert('❌ Por favor, preencha todos os campos obrigatórios (Nome e Cor)');
    return;
  }
  
  try {
    await createSetor({
      nome,
      cor,
      ativo: true
    });
    
    // Limpar campos
    document.getElementById('newSetorNome').value = '';
    document.getElementById('newSetorCor').value = '#3b82f6';
    
    // Recarregar lista
    const { loadSetores } = await import('./database.js');
    allSetoresManagementCache = await loadSetores();
    renderSetorList();
    
  } catch (error) {
    console.error('Erro ao adicionar setor:', error);
  }
}

function renderSetorList() {
  const container = document.getElementById('setorCardContainer');
  const emptyMsg = document.getElementById('setorListEmpty');
  
  if (!container) return;
  
  // Filtros
  const searchTerm = document.getElementById('searchSetores')?.value.toLowerCase() || '';
  const filterStatus = document.getElementById('filterSetorStatus')?.value || '';
  
  // Aplicar filtros
  let filteredSetores = allSetoresManagementCache.filter(setor => {
    const matchSearch = !searchTerm || setor.nome.toLowerCase().includes(searchTerm);
    
    const matchStatus = !filterStatus || 
      (filterStatus === 'true' && setor.ativo) || 
      (filterStatus === 'false' && !setor.ativo);
    
    return matchSearch && matchStatus;
  });
  
  // Renderizar
  if (filteredSetores.length === 0) {
    container.innerHTML = '';
    if (emptyMsg) emptyMsg.classList.remove('hidden');
    return;
  }
  
  if (emptyMsg) emptyMsg.classList.add('hidden');
  
  container.innerHTML = filteredSetores.map(setor => {
    const statusBadge = setor.ativo 
      ? '<span class="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">Ativo</span>'
      : '<span class="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">Inativo</span>';
    
    return `
      <div class="bg-white border-2 border-slate-200 rounded-xl p-4 hover:border-green-300 hover:shadow-md transition">
        <div class="flex items-start justify-between mb-3">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-lg flex-shrink-0" style="background-color: ${setor.cor}"></div>
            <div>
              <h4 class="font-semibold text-gray-800">${setor.nome}</h4>
              <p class="text-xs text-gray-500">ID: ${setor.id}</p>
            </div>
          </div>
          ${statusBadge}
        </div>
        
        <div class="flex items-center gap-2 pt-3 border-t">
          <button class="btn-edit-setor flex-1 px-3 py-2 rounded-lg hover:bg-blue-100 text-blue-600 transition text-sm font-medium flex items-center justify-center gap-1" 
                  data-setor-id="${setor.id}"
                  data-setor-nome="${setor.nome}"
                  data-setor-cor="${setor.cor}"
                  title="Editar">
            <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
            Editar
          </button>
          
          <button class="btn-toggle-setor flex-1 px-3 py-2 rounded-lg hover:bg-amber-100 text-amber-600 transition text-sm font-medium flex items-center justify-center gap-1"
                  data-setor-id="${setor.id}"
                  data-setor-ativo="${setor.ativo}"
                  title="${setor.ativo ? 'Desativar' : 'Ativar'}">
            <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              ${setor.ativo 
                ? '<path d="M10 9v6m4-6v6m7-3a9 9 0 1 1-18 0 9 9 0 0 1 18 0z"/>' 
                : '<path d="M14.752 11.168l-3.197-2.132A1 1 0 0 0 10 9.87v4.263a1 1 0 0 0 1.555.832l3.197-2.132a1 1 0 0 0 0-1.664z"/><path d="M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z"/>'
              }
            </svg>
            ${setor.ativo ? 'Desativar' : 'Ativar'}
          </button>
          
          <button class="btn-delete-setor px-3 py-2 rounded-lg hover:bg-red-100 text-red-600 transition"
                  data-setor-id="${setor.id}"
                  data-setor-nome="${setor.nome}"
                  title="Excluir">
            <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
            </svg>
          </button>
        </div>
      </div>
    `;
  }).join('');
  
  // Adicionar event listeners aos botões
  addSetorButtonListeners();
}

// Adicionar event listeners aos botões de setores
function addSetorButtonListeners() {
  // Botões de editar
  document.querySelectorAll('.btn-edit-setor').forEach(btn => {
    btn.addEventListener('click', function() {
      const id = parseInt(this.getAttribute('data-setor-id'));
      const nome = this.getAttribute('data-setor-nome');
      const cor = this.getAttribute('data-setor-cor');
      editSetor(id, nome, cor);
    });
  });
  
  // Botões de toggle status
  document.querySelectorAll('.btn-toggle-setor').forEach(btn => {
    btn.addEventListener('click', function() {
      const id = parseInt(this.getAttribute('data-setor-id'));
      const ativo = this.getAttribute('data-setor-ativo') === 'true';
      toggleSetorStatusBtn(id, ativo);
    });
  });
  
  // Botões de deletar
  document.querySelectorAll('.btn-delete-setor').forEach(btn => {
    btn.addEventListener('click', function() {
      const id = parseInt(this.getAttribute('data-setor-id'));
      const nome = this.getAttribute('data-setor-nome');
      deleteSetorBtn(id, nome);
    });
  });
}

// Funções globais para os botões de setores
async function editSetor(setorId, currentNome, currentCor) {
  const nome = prompt('Nome do Setor:', currentNome);
  if (nome === null) return;
  
  const cor = prompt('Cor (formato hexadecimal, ex: #3b82f6):', currentCor);
  if (cor === null) return;
  
  if (!nome.trim()) {
    alert('Nome é obrigatório');
    return;
  }
  
  // Validar cor hexadecimal
  if (!/^#[0-9A-F]{6}$/i.test(cor)) {
    alert('Cor inválida. Use formato hexadecimal (ex: #3b82f6)');
    return;
  }
  
  try {
    const { updateSetor } = await import('./database.js');
    await updateSetor(setorId, {
      nome: nome.trim(),
      cor: cor
    });
    
    const { loadSetores } = await import('./database.js');
    allSetoresManagementCache = await loadSetores();
    renderSetorList();
  } catch (error) {
    console.error('Erro ao editar setor:', error);
  }
}

async function toggleSetorStatusBtn(setorId, currentStatus) {
  try {
    const { toggleSetorStatus } = await import('./database.js');
    await toggleSetorStatus(setorId, currentStatus);
    
    const { loadSetores } = await import('./database.js');
    allSetoresManagementCache = await loadSetores();
    renderSetorList();
  } catch (error) {
    console.error('Erro ao alterar status:', error);
  }
}

async function deleteSetorBtn(setorId, setorNome) {
  if (!confirm(`Tem certeza que deseja excluir o setor "${setorNome}"?\n\nEsta ação não pode ser desfeita.\n\nVerifique se não há usuários ou tarefas associados.`)) {
    return;
  }
  
  try {
    const { deleteSetor } = await import('./database.js');
    await deleteSetor(setorId);
    
    const { loadSetores } = await import('./database.js');
    allSetoresManagementCache = await loadSetores();
    renderSetorList();
  } catch (error) {
    console.error('Erro ao excluir setor:', error);
  }
}

// ====== GERENCIAMENTO DE PENDÊNCIAS ======
let pendingTasksCache = [];

async function openPendingApprovals() {
  const modal = document.getElementById('pendingApprovalsModal');
  if (!modal) {
    console.error('Modal de pendências não encontrado');
    return;
  }
  
  modal.showModal();
  await loadAndRenderPendingTasks();
}

async function loadAndRenderPendingTasks() {
  try {
    const { loadPendingTasks } = await import('./database.js');
    pendingTasksCache = await loadPendingTasks();
    
    renderPendingList();
    updatePendingBadges();
  } catch (error) {
    console.error('Erro ao carregar pendências:', error);
  }
}

function renderPendingList() {
  const container = document.getElementById('pendingListContainer');
  const noMessage = document.getElementById('noPendingMessage');
  
  if (!container) return;
  
  if (pendingTasksCache.length === 0) {
    if (noMessage) noMessage.classList.remove('hidden');
    container.innerHTML = `
      <div class="text-center text-gray-500 py-12">
        <svg width="48" height="48" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24" class="mx-auto mb-4 text-gray-400">
          <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
        </svg>
        <p class="text-lg font-medium">Nenhuma pendência no momento</p>
        <p class="text-sm text-gray-400 mt-2">Todas as tarefas foram confirmadas</p>
      </div>
    `;
    return;
  }
  
  if (noMessage) noMessage.classList.add('hidden');
  
  const html = pendingTasksCache.map(task => {
    const requestedDate = task.confirmation_requested_at 
      ? new Date(task.confirmation_requested_at).toLocaleString('pt-BR')
      : 'Data não disponível';
    
    const setorColor = task.setores?.cor || '#3B82F6';
    const setorNome = task.setores?.nome || 'Sem setor';
    const userName = task.assignee || 'Não atribuído';
    const solicitante = task.solicitante_nome || 'Não identificado';
    
    // Título da tarefa (verificar title ou task_title)
    const taskTitle = task.title || task.task_title || 'Sem título';
    
    // Formatar data de prazo
    const prazoFormatted = task.due_date 
      ? new Date(task.due_date).toLocaleDateString('pt-BR')
      : 'Sem prazo';
    
    // Prioridade
    const priorityColors = {
      'Baixa': 'bg-cyan-100 text-cyan-800',
      'Média': 'bg-yellow-100 text-yellow-800',
      'Alta': 'bg-orange-100 text-orange-800',
      'Crítica': 'bg-red-100 text-red-800'
    };
    const priorityClass = priorityColors[task.priority] || 'bg-gray-100 text-gray-800';
    
    // Tags
    const tagsHtml = task.tags && task.tags.length > 0
      ? task.tags.map(tag => `<span class="inline-block px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full">#${tag}</span>`).join(' ')
      : '';
    
    return `
      <div class="bg-white rounded-xl shadow-md p-5 border-l-4" style="border-left-color: ${setorColor}">
        <div class="flex items-start justify-between gap-4 mb-3">
          <div class="flex-1">
            <h4 class="font-bold text-lg text-gray-800 mb-2">${taskTitle}</h4>
            
            <!-- Descrição da tarefa -->
            ${task.description ? `
              <div class="bg-gray-50 rounded-lg p-3 mb-3">
                <p class="text-sm text-gray-700"><strong>Descrição:</strong></p>
                <p class="text-sm text-gray-600 mt-1">${task.description}</p>
              </div>
            ` : ''}
            
            <!-- Informações da tarefa -->
            <div class="flex flex-wrap gap-3 text-sm text-gray-600 mb-3">
              <span class="inline-flex items-center gap-1">
                <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                </svg>
                <strong>Setor:</strong> ${setorNome}
              </span>
              <span class="inline-flex items-center gap-1">
                <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                  <circle cx="8.5" cy="7" r="4"/>
                </svg>
                <strong>Responsável:</strong> ${userName}
              </span>
              <span class="inline-flex items-center gap-1">
                <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                  <line x1="16" y1="2" x2="16" y2="6"/>
                  <line x1="8" y1="2" x2="8" y2="6"/>
                  <line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
                <strong>Prazo:</strong> ${prazoFormatted}
              </span>
            </div>
            
            <!-- Prioridade e Tags -->
            <div class="flex flex-wrap items-center gap-2 mb-3">
              <span class="inline-block px-3 py-1 ${priorityClass} text-xs font-semibold rounded-full">
                ${task.priority || 'Média'}
              </span>
              ${tagsHtml}
            </div>
            
            <div class="text-sm text-gray-500 mb-3">
              <strong>Solicitado por:</strong> ${solicitante} <strong>em:</strong> ${requestedDate}
            </div>
            
            <!-- Observações do usuário -->
            ${task.confirmation_notes ? `
              <div class="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
                <p class="text-sm text-blue-800"><strong>Observações do usuário:</strong></p>
                <p class="text-sm text-blue-700 mt-1">${task.confirmation_notes}</p>
              </div>
            ` : ''}
          </div>
        </div>
        
        <div class="flex gap-2">
          <button 
            data-action="evaluate" 
            data-task-id="${task.id}"
            class="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium text-sm pending-evaluate-btn"
          >
            ⚖️ Avaliar Solicitação
          </button>
        </div>
      </div>
    `;
  }).join('');
  
  container.innerHTML = html;
  
  // Adicionar event listeners aos botões
  const evaluateButtons = container.querySelectorAll('[data-action="evaluate"]');
  
  evaluateButtons.forEach(btn => {
    btn.addEventListener('click', function() {
      const taskId = this.getAttribute('data-task-id');
      openApprovalModal(taskId);
    });
  });
}

function updatePendingBadges() {
  const count = pendingTasksCache.length;
  
  // Badge no botão principal
  const badge = document.getElementById('pendingBadge');
  if (badge) {
    if (count > 0) {
      badge.textContent = count;
      badge.classList.remove('hidden');
    } else {
      badge.classList.add('hidden');
    }
  }
  
  // Badge no modal
  const modalBadge = document.getElementById('pendingModalBadge');
  if (modalBadge) {
    if (count > 0) {
      modalBadge.textContent = count;
      modalBadge.classList.remove('hidden');
    } else {
      modalBadge.classList.add('hidden');
    }
  }
}

async function approvePendingTaskBtn(taskId, notes = '') {
  try {
    const { approvePendingTask } = await import('./database.js');
    await approvePendingTask(taskId, notes);
    
    await loadAndRenderPendingTasks();
    
    // Recarregar tarefas
    const { loadTasks } = await import('./database.js');
    await loadTasks();
  } catch (error) {
    console.error('Erro ao aprovar tarefa:', error);
  }
}

async function rejectPendingTaskBtn(taskId, notes = '') {
  try {
    const { rejectPendingTask } = await import('./database.js');
    await rejectPendingTask(taskId, notes);
    
    await loadAndRenderPendingTasks();
    
    // Recarregar tarefas
    const { loadTasks } = await import('./database.js');
    await loadTasks();
  } catch (error) {
    console.error('Erro ao rejeitar tarefa:', error);
  }
}

// Função para abrir modal de avaliação
async function openApprovalModal(taskId) {
  const task = pendingTasksCache.find(t => t.id === taskId);
  if (!task) {
    alert('Tarefa não encontrada!');
    return;
  }
  
  const modal = document.getElementById('approvalModal');
  const titleEl = document.getElementById('approvalTaskTitle');
  const descEl = document.getElementById('approvalTaskDescription');
  const assigneeEl = document.getElementById('approvalTaskAssignee');
  const dueEl = document.getElementById('approvalTaskDue');
  const statusEl = document.getElementById('approvalTaskStatus');
  const requestedByEl = document.getElementById('approvalRequestedBy');
  const requestedAtEl = document.getElementById('approvalRequestedAt');
  const userNotesEl = document.getElementById('approvalUserNotes');
  const adminNotesEl = document.getElementById('adminNotes');
  
  // Preencher informações
  titleEl.textContent = task.title || task.task_title || 'Sem título';
  descEl.textContent = task.description || 'Sem descrição';
  assigneeEl.textContent = task.assignee || 'Não atribuído';
  dueEl.textContent = task.due_date ? new Date(task.due_date).toLocaleDateString('pt-BR') : 'Sem prazo';
  statusEl.textContent = task.status || 'Backlog';
  requestedByEl.textContent = task.solicitante_nome || 'Não identificado';
  requestedAtEl.textContent = task.confirmation_requested_at 
    ? new Date(task.confirmation_requested_at).toLocaleString('pt-BR')
    : 'Data não disponível';
  userNotesEl.textContent = task.confirmation_notes || 'Sem observações';
  adminNotesEl.value = '';
  
  // Limpar seleção de radio
  document.querySelectorAll('input[name="approvalDecision"]').forEach(radio => radio.checked = false);
  
  // Armazenar taskId no modal
  modal.dataset.taskId = taskId;
  
  // Abrir modal
  modal.showModal();
}

// Event listeners para o modal de aprovação
const btnCloseApprovalModal = document.getElementById('btnCloseApprovalModal');
if (btnCloseApprovalModal) {
  btnCloseApprovalModal.addEventListener('click', function() {
    document.getElementById('approvalModal').close();
  });
}

const btnCancelApproval = document.getElementById('btnCancelApproval');
if (btnCancelApproval) {
  btnCancelApproval.addEventListener('click', function() {
    document.getElementById('approvalModal').close();
  });
}

const btnConfirmApproval = document.getElementById('btnConfirmApproval');
if (btnConfirmApproval) {
  btnConfirmApproval.addEventListener('click', async function() {
    const modal = document.getElementById('approvalModal');
    const taskId = modal.dataset.taskId;
    const decision = document.querySelector('input[name="approvalDecision"]:checked')?.value;
    const adminNotes = document.getElementById('adminNotes').value;
    
    if (!decision) {
      alert('Por favor, selecione uma decisão (Aprovar ou Rejeitar).');
      return;
    }
    
    try {
      if (decision === 'approve') {
        await approvePendingTaskBtn(taskId, adminNotes);
      } else {
        await rejectPendingTaskBtn(taskId, adminNotes);
      }
      
      modal.close();
    } catch (error) {
      alert('Erro ao processar decisão: ' + error.message);
    }
  });
}

// Expor funções globalmente (apenas as que são chamadas de fora)
window.editUser = editUser;
window.toggleUserStatusBtn = toggleUserStatusBtn;
window.deleteUserBtn = deleteUserBtn;

// ====== EXPOR FUNÇÕES GLOBALMENTE (para compatibilidade) ======
window.loadTasks = loadTasks;
window.refreshViews = refreshViews;
window.openTaskModal = openTaskModal;
window.updateKPIs = updateKPIs;

