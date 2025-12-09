// ====================================
// MÓDULO DE AUTENTICAÇÃO
// ====================================

import { supabaseClient, APP_STATE, updateAppState } from './config.js';
import { loadTasksFromSupabase } from './database.js';
import { updateUserInterface, populateSetorFilter, updatePendingApprovalsButtonVisibility } from './ui.js';

// Variável temporária para armazenar email
let tempEmail = '';

// ====== VERIFICAÇÃO DE SESSÃO ======
export async function checkAuthStatus() {
  try {
    console.log('🔍 Verificando status de autenticação...');
    
    // Verificar se existe sessão ativa
    const { data: { session }, error } = await supabaseClient.auth.getSession();
    
    if (error) {
      console.error('Erro ao verificar sessão:', error);
      showLoginScreen();
      return;
    }
    
    // Se não há sessão, mostrar tela de login
    if (!session) {
      console.log('❌ Nenhuma sessão ativa - mostrando tela de login');
      showLoginScreen();
      return;
    }
    
    // Verificar se o login foi feito via OTP válido
    const validOtpTimestamp = localStorage.getItem('plano-acao-valid-otp');
    if (!validOtpTimestamp) {
      console.log('❌ Sessão encontrada mas sem validação OTP - fazendo logout');
      await supabaseClient.auth.signOut();
      localStorage.removeItem('plano-acao-auth');
      showLoginScreen();
      return;
    }
    
    // Verificar se a sessão OTP está expirada (24 horas)
    const otpTime = new Date(validOtpTimestamp);
    const now = new Date();
    const hoursSinceOtp = (now - otpTime) / (1000 * 60 * 60);
    
    if (hoursSinceOtp > 24) {
      console.log('⏰ Sessão OTP expirada (mais de 24 horas) - fazendo logout');
      await supabaseClient.auth.signOut();
      localStorage.removeItem('plano-acao-auth');
      localStorage.removeItem('plano-acao-valid-otp');
      showLoginScreen();
      return;
    }
    
    // Se há sessão, verificar se usuário existe no banco
    console.log('✅ Sessão ativa encontrada para:', session.user.email);
    
    const { data: userData, error: userError } = await supabaseClient
      .from('usuarios')
      .select('email, ativo')
      .eq('email', session.user.email)
      .single();
    
    // Se usuário não existe ou está inativo, fazer logout
    if (userError || !userData || !userData.ativo) {
      console.log('❌ Usuário não encontrado ou inativo - fazendo logout');
      await supabaseClient.auth.signOut();
      localStorage.removeItem('plano-acao-valid-otp');
      showLoginScreen();
      return;
    }
    
    // Usuário válido com sessão ativa - fazer login automático
    console.log('✅ Sessão válida - fazendo login automático');
    await handleUserLogin(session.user);
    
  } catch (error) {
    console.error('Erro ao verificar autenticação:', error);
    showLoginScreen();
  }
}

// ====== CONTROLE DE TELAS ======
export function showLoginScreen() {
  const loginScreen = document.getElementById('loginScreen');
  const appContent = document.getElementById('appContent');
  const loginForm = document.getElementById('loginForm');
  const codeForm = document.getElementById('codeForm');
  const loginLoading = document.getElementById('loginLoading');
  
  // Mostrar tela de login
  if (loginScreen) loginScreen.classList.remove('hidden');
  if (appContent) appContent.classList.add('hidden');
  
  // Resetar formulários - garantir que volta ao estado inicial
  if (loginForm) {
    loginForm.style.display = 'block';
    loginForm.classList.remove('hidden');
  }
  if (codeForm) {
    codeForm.classList.add('hidden');
    codeForm.style.display = 'none';
  }
  if (loginLoading) {
    loginLoading.classList.add('hidden');
    loginLoading.style.display = 'none';
  }
  
  // Limpar campos
  const emailInput = document.getElementById('emailInput');
  const codeInput = document.getElementById('codeInput');
  if (emailInput) emailInput.value = '';
  if (codeInput) codeInput.value = '';
  
  // Limpar variável temporária do email
  tempEmail = '';
  
  console.log('📺 Tela de login exibida e resetada');
}

export function showApp() {
  document.getElementById('loginScreen').classList.add('hidden');
  document.getElementById('appContent').classList.remove('hidden');
}

// ====== PROCESSAR LOGIN ======
export async function handleUserLogin(user) {
  try {
    updateAppState('currentUser', user);
    console.log('👤 Processando login do usuário:', user.email);
    console.log('📋 Dados completos do usuário:', user);
    
    // Verificar se usuário existe no banco
    console.log('🔍 Buscando usuário no banco:', user.email);
    
    let { data: userData, error } = await supabaseClient
      .from('usuarios')
      .select(`
        *,
        setores(id, nome, cor)
      `)
      .eq('email', user.email)
      .single();

    console.log('📊 Resultado da busca:', { userData, error });

    if (error && error.code === 'PGRST116') {
      console.error('❌ ERRO CRÍTICO: Usuário autenticou mas não existe no banco!');
      alert('❌ Seu usuário não está autorizado!\n\nProcure um administrador para realizar seu cadastro de acesso.');
      await supabaseClient.auth.signOut();
      localStorage.removeItem('plano-acao-auth');
      localStorage.removeItem('plano-acao-valid-otp');
      showLoginScreen();
      return;
    }

    if (error) {
      console.error('❌ Erro ao buscar usuário:', error);
      alert('Erro ao buscar usuário no sistema: ' + (error.message || 'Erro desconhecido'));
      await supabaseClient.auth.signOut();
      localStorage.removeItem('plano-acao-auth');
      localStorage.removeItem('plano-acao-valid-otp');
      showLoginScreen();
      return;
    }

    // Verificar se usuário está ativo
    if (!userData.ativo) {
      console.log('❌ Usuário inativo:', userData.email);
      alert('❌ Acesso bloqueado!\n\nSua conta foi desativada.\n\n📞 Entre em contato com o administrador.');
      await supabaseClient.auth.signOut();
      localStorage.removeItem('plano-acao-auth');
      localStorage.removeItem('plano-acao-valid-otp');
      showLoginScreen();
      return;
    }

    // Usuário existe, configurar sessão
    updateAppState('currentUserData', userData);
    updateAppState('currentSetor', userData.setores);
    updateAppState('isAdmin', userData.is_admin);
    
    // Atualizar visibilidade do botão de pendências (não-bloqueante)
    setTimeout(() => {
      try {
        updatePendingApprovalsButtonVisibility();
      } catch (error) {
        console.error('Erro ao atualizar botão de pendências:', error);
      }
    }, 0);
    
    console.log('🔍 Debug dados do usuário:', {
      userData: userData,
      setor_id_campo: userData.setor_id,
      currentSetor: userData.setores,
      isAdmin: userData.is_admin,
      has_setor_id: !!userData.setores?.id,
      setor_nome: userData.setores?.nome,
      complete_user_data: JSON.stringify(userData, null, 2)
    });
    
    console.log('✅ Login realizado:', { 
      user: userData.nome, 
      setor: userData.setores?.nome || (userData.is_admin ? 'TODOS OS SETORES (Admin)' : 'Nenhum'),
      isAdmin: userData.is_admin
    });

    showApp();
    await loadTasksFromSupabase();
    updateUserInterface();

  } catch (error) {
    console.error('Erro no login:', error);
    alert('Erro no sistema de autenticação. Tente novamente.');
  }
}

// ====== ENVIAR CÓDIGO DE VERIFICAÇÃO ======
export async function sendVerificationCode(email) {
  try {
    console.log('📧 Tentando enviar código para:', email);
    
    const loginForm = document.getElementById('loginForm');
    const loginLoading = document.getElementById('loginLoading');
    
    if (!loginForm || !loginLoading) {
      console.error('❌ Elementos do formulário não encontrados!', { loginForm, loginLoading });
      alert('Erro: Elementos da interface não encontrados. Recarregue a página.');
      return;
    }
    
    loginForm.style.display = 'none';
    loginLoading.classList.remove('hidden');

    // 🔒 VERIFICAÇÃO DE SEGURANÇA: Email deve estar pré-autorizado
    // TEMPORARIAMENTE COMENTADO - RLS impede acesso antes de autenticar
    // A validação será feita APÓS o login com OTP
    console.log('⏭️ Pulando verificação prévia (será validado após OTP)...');

    // Enviar código OTP
    console.log('📤 Enviando OTP via Supabase...');
    const { data, error } = await supabaseClient.auth.signInWithOtp({
      email: email,
      options: {
        shouldCreateUser: true
      }
    });

    console.log('📧 Resposta do Supabase:', { data, error });

    if (error) {
      console.error('Erro ao enviar código:', error);
      let errorMessage = 'Erro ao enviar código: ' + error.message;
      
      // Mensagens de erro mais específicas
      if (error.message.includes('Email rate limit exceeded')) {
        errorMessage = 'Muitas tentativas de envio. Aguarde alguns minutos antes de tentar novamente.';
      } else if (error.message.includes('Invalid email')) {
        errorMessage = 'Email inválido. Verifique se o endereço está correto.';
      } else if (error.message.includes('Email not enabled')) {
        errorMessage = 'Sistema de email não configurado. Entre em contato com o administrador.';
      }
      
      alert(errorMessage);
      loginForm.style.display = 'block';
      loginLoading.classList.add('hidden');
    } else {
      console.log('✅ Código enviado com sucesso');
      tempEmail = email;
      const loginFormEl = document.getElementById('loginForm');
      const sentToEmailEl = document.getElementById('sentToEmail');
      const codeFormEl = document.getElementById('codeForm');
      const codeInputEl = document.getElementById('codeInput');
      
      console.log('🔍 Debug - loginFormEl:', loginFormEl);
      console.log('🔍 Debug - codeFormEl:', codeFormEl);
      console.log('🔍 Debug - codeFormEl classes antes:', codeFormEl?.classList.toString());
      
      if (sentToEmailEl) sentToEmailEl.textContent = email;
      
      // Esconder loading e formulário de email
      loginLoading.classList.add('hidden');
      if (loginFormEl) {
        loginFormEl.style.display = 'none';
        loginFormEl.classList.add('hidden');
      }
      
      // Mostrar formulário de código
      if (codeFormEl) {
        codeFormEl.classList.remove('hidden');
        codeFormEl.style.display = 'block';
        console.log('🔍 Debug - codeFormEl classes depois:', codeFormEl.classList.toString());
      }
      
      if (codeInputEl) {
        setTimeout(() => codeInputEl.focus(), 100);
      }
      
      showToast('Código enviado para seu email!', 'success');
    }
  } catch (error) {
    console.error('Erro ao enviar código:', error);
    alert('Erro no sistema. Tente novamente.');
    const loginForm = document.getElementById('loginForm');
    const loginLoading = document.getElementById('loginLoading');
    if (loginForm) loginForm.style.display = 'block';
    if (loginLoading) loginLoading.classList.add('hidden');
  }
}

// ====== VERIFICAR CÓDIGO ======
export async function verifyCode(email, code) {
  try {
    document.getElementById('codeForm').style.display = 'none';
    document.getElementById('loginLoading').classList.remove('hidden');

    const { data, error } = await supabaseClient.auth.verifyOtp({
      email: email,
      token: code,
      type: 'email'
    });

    if (error) {
      console.error('Erro na verificação:', error);
      alert('Código inválido ou expirado: ' + error.message);
      document.getElementById('codeForm').style.display = 'block';
      document.getElementById('loginLoading').classList.add('hidden');
      document.getElementById('codeInput').value = '';
      document.getElementById('codeInput').focus();
    } else {
      console.log('Login realizado com sucesso:', data);
      
      // Marcar que o login foi feito via OTP válido
      localStorage.setItem('plano-acao-valid-otp', new Date().toISOString());
      
      await handleUserLogin(data.user);
    }
  } catch (error) {
    console.error('Erro na verificação:', error);
    alert('Erro no sistema. Tente novamente.');
    document.getElementById('codeForm').style.display = 'block';
    document.getElementById('loginLoading').classList.add('hidden');
  }
}

// ====== VOLTAR PARA FORMULÁRIO DE EMAIL ======
export function backToEmailForm() {
  document.getElementById('codeForm').classList.add('hidden');
  document.getElementById('loginForm').style.display = 'block';
  document.getElementById('emailInput').focus();
  document.getElementById('codeInput').value = '';
  tempEmail = '';
}

// ====== LOGOUT ======
export async function logout() {
  if (confirm('Deseja realmente sair?')) {
    console.log('🚪 Realizando logout...');
    
    // Fazer logout no Supabase
    await supabaseClient.auth.signOut();
    
    // Limpar COMPLETAMENTE o localStorage
    localStorage.removeItem('plano-acao-auth');
    localStorage.removeItem('plano-acao-valid-otp');
    localStorage.removeItem('sb-iynsvuugjjbvjacrjmig-auth-token');
    
    // Limpar estado da aplicação
    updateAppState('currentUser', null);
    updateAppState('currentUserData', null);
    updateAppState('currentSetor', null);
    updateAppState('isAdmin', false);
    updateAppState('tasks', []);
    
    // Limpar variável temporária
    tempEmail = '';
    
    // Mostrar tela de login
    showLoginScreen();
    
    console.log('✅ Logout realizado com sucesso');
  }
}

// ====== SISTEMA DE NOTIFICAÇÕES ======
export function showToast(message, type = 'info') {
  const icons = {
    success: '✅',
    error: '❌', 
    warning: '⚠️',
    info: 'ℹ️'
  };
  
  const icon = icons[type] || icons.info;
  alert(`${icon} ${message}`);
  
  console.log(`Toast ${type}: ${message}`);
}

// ====== CRIAR NOVO USUÁRIO (primeiro acesso) ======
export async function createNewUser(user) {
  try {
    console.log('Iniciando criação de usuário para:', user.email);

    // Buscar setor "Controladoria" (padrão)
    const { data: setorDefault, error: setorError } = await supabaseClient
      .from('setores')
      .select('id')
      .eq('nome', 'Controladoria')
      .single();

    if (setorError) {
      console.error('Erro ao buscar setor:', setorError);
      throw new Error('Setor Controladoria não encontrado');
    }

    console.log('Criando usuário como ADMINISTRADOR...');
    
    const { data: newUser, error } = await supabaseClient
      .from('usuarios')
      .insert({
        email: user.email,
        nome: user.user_metadata?.full_name || user.email.split('@')[0],
        avatar_url: user.user_metadata?.avatar_url || null,
        setor_id: setorDefault.id,
        is_admin: true,
        ativo: true
      })
      .select('*, setores(nome, cor)')
      .single();

    if (error) {
      console.error('Erro ao criar usuário:', error);
      console.error('Detalhes do erro:', JSON.stringify(error, null, 2));
      
      let errorMsg = 'Erro ao criar conta de usuário:\n\n';
      if (error.message) errorMsg += error.message;
      if (error.details) errorMsg += '\n' + error.details;
      if (error.hint) errorMsg += '\n' + error.hint;
      
      alert(errorMsg);
      return;
    }

    updateAppState('currentUserData', newUser);
    updateAppState('currentSetor', newUser.setores);
    updateAppState('isAdmin', newUser.is_admin);
    
    console.log('✅ Usuário criado com sucesso:', newUser);
    
    alert(`🎉 Bem-vindo ${newUser.nome}!\n\nVocê foi criado como ADMINISTRADOR!\nSetor: ${newUser.setores?.nome || 'Controladoria'}`);
    
    showApp();
    await loadTasksFromSupabase();
    updateUserInterface();

  } catch (error) {
    console.error('❌ Erro CRÍTICO ao criar usuário:', error);
    console.error('Stack trace:', error.stack);
    
    let errorMsg = '❌ Erro no sistema ao criar usuário:\n\n';
    errorMsg += error.message || 'Erro desconhecido';
    
    alert(errorMsg + '\n\n📞 Contate o suporte técnico.');
    showLoginScreen();
  }
}

// Expor tempEmail para acesso externo se necessário
export function getTempEmail() {
  return tempEmail;
}
