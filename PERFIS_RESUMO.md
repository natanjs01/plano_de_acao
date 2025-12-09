# 🎭 RESUMO DOS PERFIS - PLANO DE AÇÃO

## 📊 HIERARQUIA DE PERFIS

```
┌─────────────────────────────────────────────────────────────┐
│  NÍVEL 5: 👑 ADMINISTRADOR                                  │
│  ✅ Acesso total ao sistema                                 │
│  ✅ Gerencia usuários, setores e status                     │
│  ✅ Pode criar, editar, deletar TUDO                        │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  NÍVEL 4: 📊 CONSULTORIA                                    │
│  ✅ Visualiza TODAS as tarefas (todos os setores)           │
│  ✅ Usa filtro de setores no painel principal               │
│  ✅ Acessa relatórios e dashboards                          │
│  ✅ Exporta dados e relatórios                              │
│  ✅ Solicita conclusão de tarefas                           │
│  ❌ NÃO pode criar, editar ou deletar tarefas               │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  NÍVEL 3: 🎯 COORDENADOR                                    │
│  ✅ Cria tarefas                                            │
│  ✅ Edita tarefas DO SEU SETOR                              │
│  ✅ Aprova conclusões DO SEU SETOR                          │
│  ✅ Visualiza relatórios                                    │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  NÍVEL 2: 👷 SUPERVISOR                                     │
│  ✅ Cria tarefas                                            │
│  ✅ Edita tarefas DO SEU SETOR                              │
│  ✅ Solicita conclusões                                     │
│  ❌ NÃO pode aprovar conclusões                             │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  NÍVEL 1: 👤 USUÁRIO COMUM                                  │
│  ✅ Visualiza tarefas DO SEU SETOR                          │
│  ✅ Solicita conclusões                                     │
│  ❌ NÃO pode criar ou editar tarefas                        │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔐 MATRIZ DE PERMISSÕES

| Ação | 👑 Admin | 📊 Consultoria | 🎯 Coordenador | 👷 Supervisor | 👤 Usuário |
|------|----------|----------------|----------------|---------------|------------|
| **TAREFAS** |
| Criar tarefas | ✅ | ❌ | ✅ | ✅ | ❌ |
| Editar tarefas (próprio setor) | ✅ | ❌ | ✅ | ✅ | ❌ |
| Editar tarefas (todos setores) | ✅ | ❌ | ❌ | ❌ | ❌ |
| Deletar tarefas | ✅ | ❌ | ❌ | ❌ | ❌ |
| Visualizar tarefas (próprio setor) | ✅ | ✅ | ✅ | ✅ | ✅ |
| Visualizar tarefas (todos setores) | ✅ | ✅ | ❌ | ❌ | ❌ |
| Aprovar conclusões | ✅ | ❌ | ✅ | ❌ | ❌ |
| Solicitar conclusões | ✅ | ✅ | ❌ | ✅ | ✅ |
| **RELATÓRIOS** |
| Visualizar relatórios | ✅ | ✅ | ✅ | ❌ | ❌ |
| Exportar relatórios | ✅ | ✅ | ✅ | ❌ | ❌ |
| **ADMINISTRAÇÃO** |
| Gerenciar usuários | ✅ | ❌ | ❌ | ❌ | ❌ |
| Gerenciar setores | ✅ | ❌ | ❌ | ❌ | ❌ |
| Gerenciar status | ✅ | ❌ | ❌ | ❌ | ❌ |
| **SISTEMA** |
| Exportar dados | ✅ | ✅ | ✅ | ❌ | ❌ |
| Importar dados | ✅ | ❌ | ❌ | ❌ | ❌ |
| Reset sistema | ✅ | ❌ | ❌ | ❌ | ❌ |

---

## 🎯 COMO CRIAR CADA PERFIL

### 👑 **Administrador**
```sql
-- No Supabase, na tabela usuarios
UPDATE usuarios 
SET is_admin = true 
WHERE email = 'admin@empresa.com';
```

### 📊 **Consultoria**
**Opção 1: Por nome**
```sql
-- Criar usuário com nome contendo "Consultoria"
INSERT INTO usuarios (nome, email, setor_id, is_admin, ativo)
VALUES ('João - Consultoria', 'joao.consultoria@empresa.com', 'uuid-setor', false, true);
```

**Opção 2: Editar permissions.js**
```javascript
// Em getUserProfile()
const consultoria = ['consultoria@empresa.com', 'analise@empresa.com'];
if (consultoria.includes(userData.email)) {
  return 'consultoria';
}
```

### 🎯 **Coordenador**
**Opção 1: Por nome**
```sql
INSERT INTO usuarios (nome, email, setor_id, is_admin, ativo)
VALUES ('Maria - Coordenadora RH', 'maria@empresa.com', 'uuid-setor-rh', false, true);
```

**Opção 2: Por email**
```javascript
const coordenadores = ['coord1@empresa.com', 'coord2@empresa.com'];
if (coordenadores.includes(userData.email)) return 'coordenador';
```

### 👷 **Supervisor**
**Opção 1: Por nome**
```sql
INSERT INTO usuarios (nome, email, setor_id, is_admin, ativo)
VALUES ('Pedro Supervisor Vendas', 'pedro@empresa.com', 'uuid-vendas', false, true);
```

**Opção 2: Por setor específico**
```javascript
const setoresSupervisores = ['uuid-vendas', 'uuid-producao'];
if (setoresSupervisores.includes(userData.setor_id)) return 'supervisor';
```

### 👤 **Usuário Comum**
```sql
-- Usuário padrão - apenas criar normalmente
INSERT INTO usuarios (nome, email, setor_id, is_admin, ativo)
VALUES ('Carlos Silva', 'carlos@empresa.com', 'uuid-setor', false, true);
```

---

## 🚀 CASOS DE USO

### **Caso 1: Empresa de Consultoria Externa**
```
Situação: Consultoria precisa ver todas as tarefas para gerar relatórios,
e poder solicitar conclusões quando necessário.

Solução: Criar usuário com perfil "Consultoria"
- Email: consultoria@externa.com
- Nome: "Equipe Consultoria Externa"
- Resultado: Vê tudo, solicita conclusões, não edita tarefas
```

### **Caso 2: Coordenador de RH**
```
Situação: Coordenador precisa gerenciar apenas tarefas do RH.

Solução: Criar com perfil "Coordenador"
- Nome: "Ana - Coordenadora RH"
- Setor: RH
- Resultado: Cria, edita e aprova tarefas APENAS do RH
```

### **Caso 3: Supervisor de Produção**
```
Situação: Supervisor pode criar e editar tarefas, mas não aprovar.

Solução: Criar com perfil "Supervisor"
- Nome: "João Supervisor Produção"
- Setor: Produção
- Resultado: Cria e edita tarefas da Produção, não aprova
```

### **Caso 4: Operador de Linha**
```
Situação: Funcionário só visualiza e solicita conclusões.

Solução: Criar com perfil "Usuário"
- Nome: "Carlos Operador"
- Setor: Produção
- Resultado: Vê tarefas da Produção, solicita conclusões
```

---

## 📝 EXEMPLOS PRÁTICOS

### Criar Usuário Consultoria no Supabase:
```sql
INSERT INTO usuarios (id, nome, email, setor_id, is_admin, ativo)
VALUES (
  gen_random_uuid(),
  'Consultoria Análise',
  'consultoria@empresa.com',
  (SELECT id FROM setores WHERE nome = 'Administração' LIMIT 1),
  false,
  true
);
```

### Verificar Perfil no Console do Navegador:
```javascript
// Abra o console (F12) e digite:
debugPermissions()

// Resultado mostrará:
// 👤 USUÁRIO: Consultoria Análise
// 🎭 PERFIL: Consultoria (nível 4)
// ✅ PERMISSÕES: [tarefas.visualizar, relatorios.visualizar, ...]
```

---

**Última atualização:** 9 de dezembro de 2025
**Versão:** 2.0.0 (com perfil Consultoria)
