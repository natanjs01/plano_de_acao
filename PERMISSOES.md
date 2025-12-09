# 📖 SISTEMA DE PERMISSÕES - DOCUMENTAÇÃO

## 🎯 Visão Geral

Sistema de controle de acesso granular baseado em perfis e permissões, **SEM alterar a estrutura do banco de dados Supabase**.

---

## 👥 PERFIS DISPONÍVEIS

### 1. **Administrador** (nivel 5)
- **Como identificar:** `is_admin = true` no banco
- **Descrição:** Acesso total ao sistema
- **Permissões:** TODAS

### 2. **Consultoria** (nivel 4)
- **Como identificar:** Nome contém "Consultoria" OU regra customizada
- **Descrição:** Visualiza todas as tarefas e cria relatórios
- **Permissões:**
  - ✅ Visualizar todas as tarefas (todos os setores)
  - ✅ Usar filtro de setores no painel principal
  - ✅ Visualizar relatórios
  - ✅ Exportar relatórios
  - ✅ Exportar dados do sistema
  - ✅ Solicitar conclusão de tarefas
  - ❌ Não pode criar, editar ou excluir tarefas
  - ❌ Não pode gerenciar usuários ou setores

### 3. **Coordenador** (nivel 3)
- **Como identificar:** Nome contém "Coordenador" OU regra customizada
- **Descrição:** Gerencia tarefas e aprovações do setor
- **Permissões:**
  - ✅ Criar tarefas
  - ✅ Editar tarefas do setor
  - ✅ Aprovar conclusões do setor
  - ✅ Visualizar relatórios
  - ✅ Exportar dados

### 4. **Supervisor** (nivel 2)
- **Como identificar:** Nome contém "Supervisor" OU regra customizada
- **Descrição:** Cria e edita tarefas do setor
- **Permissões:**
  - ✅ Criar tarefas
  - ✅ Editar tarefas do setor
  - ✅ Solicitar conclusões

### 5. **Usuário** (nivel 1)
- **Como identificar:** Padrão para todos os outros
- **Descrição:** Visualiza e solicita conclusões
- **Permissões:**
  - ✅ Visualizar tarefas do setor
  - ✅ Solicitar conclusões

---

## 🔧 COMO CUSTOMIZAR REGRAS DE PERFIL

Edite o arquivo `assets/js/permissions.js`, função `getUserProfile()`:

```javascript
export function getUserProfile(userData) {
  if (!userData) return 'usuario';
  
  // Admin pelo banco de dados
  if (userData.is_admin === true) {
    return 'admin';
  }
  
  // SUAS REGRAS CUSTOMIZADAS AQUI:
  
  // Exemplo 1: Por nome - Consultoria
  if (userData.nome && userData.nome.toLowerCase().includes('consultoria')) {
    return 'consultoria';
  }
  
  // Exemplo 2: Por nome - Coordenador
  if (userData.nome && userData.nome.toLowerCase().includes('coordenador')) {
    return 'coordenador';
  }
  
  // Exemplo 3: Por nome - Supervisor
  if (userData.nome && userData.nome.toLowerCase().includes('supervisor')) {
    return 'supervisor';
  }
  
  // Exemplo 4: Por email (domínio)
  if (userData.email && userData.email.endsWith('@consultoria.empresa.com')) {
    return 'consultoria';
  }
  
  // Exemplo 5: Por setor específico
  if (userData.setor_id === 'uuid-do-setor-supervisores') {
    return 'supervisor';
  }
  
  // Exemplo 6: Lista de emails
  const coordenadores = ['joao@empresa.com', 'maria@empresa.com'];
  if (coordenadores.includes(userData.email)) {
    return 'coordenador';
  }
  
  // Padrão
  return 'usuario';
}
```

---

## 📋 PERMISSÕES DISPONÍVEIS

### **Tarefas**
```
'tarefas.criar'               - Criar novas tarefas
'tarefas.editar'              - Editar tarefas
'tarefas.editar.todas'        - Editar todas as tarefas (qualquer setor)
'tarefas.editar.setor'        - Editar apenas tarefas do próprio setor
'tarefas.deletar'             - Deletar tarefas
'tarefas.visualizar'          - Visualizar tarefas
'tarefas.aprovar'             - Aprovar solicitações de conclusão
'tarefas.solicitar_conclusao' - Solicitar conclusão de tarefas (Consultoria, Supervisor, Usuário)
```

### **Usuários**
```
'usuarios.gerenciar'          - Acessar painel de usuários
'usuarios.criar'              - Criar novos usuários
'usuarios.editar'             - Editar usuários
'usuarios.deletar'            - Deletar usuários
'usuarios.ativar_desativar'   - Ativar/Desativar usuários
```

### **Setores**
```
'setores.gerenciar'           - Acessar painel de setores
'setores.criar'               - Criar setores
'setores.editar'              - Editar setores
'setores.deletar'             - Deletar setores
```

### **Sistema**
```
'status.gerenciar'            - Gerenciar status customizados
'relatorios.visualizar'       - Visualizar relatórios
'relatorios.exportar'         - Exportar relatórios
'sistema.reset'               - Resetar aplicação
'sistema.importar'            - Importar dados
'sistema.exportar'            - Exportar dados
```

---

## 💻 COMO USAR NO CÓDIGO

### Verificar Permissão Simples

```javascript
import { hasPermission } from './permissions.js';

if (hasPermission('tarefas.criar')) {
  // Mostrar botão de criar tarefa
}
```

### Verificar se Pode Editar Tarefa Específica

```javascript
import { canEditTask } from './permissions.js';

if (canEditTask(task)) {
  // Mostrar botão de editar
}
```

### Verificar se Pode Deletar Tarefa

```javascript
import { canDeleteTask } from './permissions.js';

if (canDeleteTask(task)) {
  // Mostrar botão de deletar
}
```

### Verificar se Pode Aprovar Tarefa

```javascript
import { canApproveTask } from './permissions.js';

if (canApproveTask(task)) {
  // Mostrar botão de aprovar
}
```

### Filtrar Tarefas por Permissão

```javascript
import { filterTasksByPermission } from './permissions.js';

const tasksFiltradas = filterTasksByPermission(todasAsTarefas);
```

---

## 🔍 DEBUG E TESTES

### Ver Informações do Usuário Atual

Abra o console do navegador (F12) e digite:

```javascript
debugPermissions()
```

**Resultado:**
```
👤 USUÁRIO: João Silva
🎭 PERFIL: Coordenador (nível 3)
📋 DESCRIÇÃO: Pode gerenciar tarefas e aprovar conclusões do seu setor
✅ PERMISSÕES: [
  'tarefas.criar',
  'tarefas.editar',
  'tarefas.editar.setor',
  'tarefas.aprovar',
  'relatorios.visualizar',
  'relatorios.exportar',
  'sistema.exportar'
]
🏢 SETOR: Vendas
🔑 IS_ADMIN (banco): false
```

---

## 🎨 CUSTOMIZAR PERMISSÕES

Edite o objeto `PERMISSOES` no arquivo `assets/js/permissions.js`:

```javascript
export const PERMISSOES = {
  'tarefas.criar': ['admin', 'coordenador', 'supervisor'],
  'tarefas.editar': ['admin', 'coordenador', 'supervisor'],
  'tarefas.deletar': ['admin'], // ← Apenas admin pode deletar
  
  // Adicione suas permissões customizadas:
  'tarefas.arquivar': ['admin', 'coordenador'],
  'tarefas.compartilhar': ['admin', 'coordenador', 'supervisor'],
  'comentarios.moderar': ['admin', 'coordenador']
};
```

---

## 📊 EXEMPLOS DE USO

### Exemplo 1: Configurar Consultoria e Coordenadores por Email

```javascript
export function getUserProfile(userData) {
  if (!userData) return 'usuario';
  
  if (userData.is_admin === true) return 'admin';
  
  // Lista de consultoria
  const consultoria = [
    'analise@empresa.com',
    'relatorios@empresa.com',
    'consultoria@empresa.com'
  ];
  
  if (consultoria.includes(userData.email)) {
    return 'consultoria';
  }
  
  // Lista de coordenadores
  const coordenadores = [
    'joao.silva@empresa.com',
    'maria.santos@empresa.com',
    'pedro.oliveira@empresa.com'
  ];
  
  if (coordenadores.includes(userData.email)) {
    return 'coordenador';
  }
  
  return 'usuario';
}
```

### Exemplo 2: Supervisores por Setor e Consultoria por Nome

```javascript
export function getUserProfile(userData) {
  if (!userData) return 'usuario';
  
  if (userData.is_admin === true) return 'admin';
  
  // Consultoria por nome
  if (userData.nome && userData.nome.toLowerCase().includes('consultoria')) {
    return 'consultoria';
  }
  
  // Setores com supervisores
  const setoresSupervisores = [
    'uuid-setor-vendas',
    'uuid-setor-producao',
    'uuid-setor-logistica'
  ];
  
  if (setoresSupervisores.includes(userData.setor_id)) {
    if (userData.nome && userData.nome.toLowerCase().includes('supervisor')) {
      return 'supervisor';
    }
  }
  
  return 'usuario';
}
```

---

## ✅ VANTAGENS DESTE SISTEMA

1. ✅ **Sem alterações no banco** - Usa apenas `is_admin` existente
2. ✅ **Flexível** - Regras customizáveis em JavaScript
3. ✅ **Fácil manutenção** - Tudo em um arquivo
4. ✅ **Granular** - Controle fino de permissões
5. ✅ **Escalável** - Fácil adicionar novos perfis/permissões
6. ✅ **Debug simples** - Função `debugPermissions()` mostra tudo

---

## 🚀 MIGRAÇÃO FUTURA

Se no futuro quiser salvar o perfil no banco:

1. Adicionar coluna `perfil VARCHAR` na tabela `usuarios`
2. Atualizar `getUserProfile()`:

```javascript
export function getUserProfile(userData) {
  if (!userData) return 'usuario';
  
  // Se tem perfil no banco, usar
  if (userData.perfil) {
    return userData.perfil;
  }
  
  // Senão, usar regras antigas
  if (userData.is_admin === true) return 'admin';
  // ... resto das regras
}
```

---

**Última atualização:** Dezembro 2025
**Versão:** 1.0.0
