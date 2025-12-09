# 🐛 Correção: Problema de Data com Timezone

## Problema Identificado

Quando você criava uma tarefa com prazo **10/12/2025**, ela aparecia na lista como **09/12/2025**.

## Causa Raiz

O problema ocorria devido à conversão de timezone UTC:

1. **Input HTML** `type="date"` retorna data no formato: `2025-12-10` (YYYY-MM-DD)
2. **JavaScript** `new Date("2025-12-10")` interpreta como **meia-noite UTC**
3. **Fuso horário brasileiro** (GMT-3) converte para **21:00 do dia anterior** (09/12/2025)
4. **`toLocaleDateString()`** exibe a data local, que já é o dia anterior

### Exemplo do Problema:
```javascript
// ❌ ANTES (com bug)
const date = new Date("2025-12-10"); // Interpreta como 00:00 UTC
// Em horário de Brasília (GMT-3): 09/12/2025 21:00

date.toLocaleDateString('pt-BR'); 
// Resultado: "09/12/2025" ❌ (1 dia a menos!)
```

## Solução Implementada

Criamos duas funções helper em `ui.js`:

### 1. `formatDate()` - Formatação sem conversão UTC

```javascript
export function formatDate(dateStr) {
  if (!dateStr) return '—';
  
  // Se a data está no formato YYYY-MM-DD (do input type="date")
  if (typeof dateStr === 'string' && dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
    const [year, month, day] = dateStr.split('-').map(Number);
    return `${day.toString().padStart(2, '0')}/${month.toString().padStart(2, '0')}/${year}`;
  }
  
  // Para outros formatos, usar Date normal
  const date = new Date(dateStr);
  return date.toLocaleDateString('pt-BR');
}
```

**Como funciona:**
- Detecta se a string está no formato `YYYY-MM-DD`
- Faz parse manual dos componentes (ano, mês, dia)
- Retorna formatado como `DD/MM/YYYY` **sem passar por Date()**
- Evita completamente a conversão UTC

### 2. `parseLocalDate()` - Converte para Date local

```javascript
export function parseLocalDate(dateStr) {
  if (!dateStr) return null;
  
  // Se está no formato YYYY-MM-DD
  if (typeof dateStr === 'string' && dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day); // Cria data LOCAL (não UTC)
  }
  
  return new Date(dateStr);
}
```

**Como funciona:**
- Para datas `YYYY-MM-DD`, cria `new Date(year, month-1, day)`
- Este construtor cria uma data **no timezone local**, não UTC
- Usado para comparações (ex: verificar se está atrasada)

## Exemplo Corrigido:

```javascript
// ✅ DEPOIS (corrigido)
const dateStr = "2025-12-10";

// Formatação direta (sem Date object)
formatDate(dateStr); 
// Resultado: "10/12/2025" ✅ (correto!)

// Conversão para Date local
const date = parseLocalDate(dateStr); // new Date(2025, 11, 10)
// Em horário de Brasília: 10/12/2025 00:00 (local, não UTC)

date.toLocaleDateString('pt-BR');
// Resultado: "10/12/2025" ✅ (correto!)
```

## Arquivos Modificados

### 1. `assets/js/ui.js`
- ✅ Adicionada função `formatDate()` aprimorada
- ✅ Adicionada função `parseLocalDate()`
- ✅ Exportadas para uso em outros módulos

### 2. `assets/js/charts.js`
- ✅ Importado `parseLocalDate` de `ui.js`
- ✅ Atualizada lógica de detecção de tarefas atrasadas
- ✅ Usa `parseLocalDate()` para comparações de data

```javascript
// ANTES
const prazo = new Date(t.due_date || t.due);
return prazo < hoje;

// DEPOIS
const prazo = parseLocalDate(t.due_date || t.due);
if (!prazo) return false;
prazo.setHours(0, 0, 0, 0);
return prazo < hoje;
```

## Casos de Uso

### Onde a correção se aplica:

1. **✅ Criação de tarefa** - Data salva e exibida corretamente
2. **✅ Edição de tarefa** - Data mantém o valor correto
3. **✅ Listagem de tarefas** - Datas aparecem como foram digitadas
4. **✅ Kanban** - Cards mostram data correta
5. **✅ Modal de detalhes** - Data formatada corretamente
6. **✅ Cálculo de atraso** - Comparação precisa com data atual
7. **✅ KPIs** - Contador de tarefas atrasadas preciso
8. **✅ Gráficos** - Filtros por prazo funcionam corretamente
9. **✅ Relatórios** - Datas nos PDFs aparecem corretas
10. **✅ Filtros** - Busca por data funciona corretamente

## Tipos de Data Suportados

A solução funciona com:

✅ **YYYY-MM-DD** (input type="date") - Formato padrão do HTML5  
✅ **ISO 8601** (2025-12-10T00:00:00Z) - Do banco de dados  
✅ **Timestamps** - Numéricos ou strings  
✅ **Datas nulas/vazias** - Retorna "—" ou null  

## Testes Recomendados

Para validar a correção:

1. **Criar tarefa com prazo 10/12/2025**
   - ✅ Deve aparecer como 10/12/2025 na lista
   
2. **Editar tarefa e manter o prazo**
   - ✅ Data não deve mudar
   
3. **Criar tarefa hoje e verificar se não aparece como atrasada**
   - ✅ Não deve marcar como atrasada se o prazo é hoje
   
4. **Criar tarefa com prazo ontem**
   - ✅ Deve aparecer no contador de "Atrasadas"
   
5. **Verificar em diferentes horários do dia**
   - ✅ Data deve permanecer a mesma independente da hora

## Benefícios

- 🎯 **Precisão**: Datas aparecem exatamente como foram digitadas
- 🌍 **Independente de timezone**: Funciona em qualquer fuso horário
- 🔧 **Compatível**: Funciona com diferentes formatos de data
- 🚀 **Performance**: Parse direto é mais rápido que Date()
- 🛡️ **Robusto**: Validação e fallbacks para casos edge

## Notas Técnicas

### Por que não usar apenas Date()?

```javascript
// ❌ Problema com Date()
new Date("2025-12-10")        // Interpreta como UTC
new Date("2025-12-10T00:00")  // Também UTC
new Date("12/10/2025")        // Formato americano (MM/DD/YYYY)

// ✅ Solução com new Date(year, month, day)
new Date(2025, 11, 10)        // SEMPRE horário local
// month é 0-indexed: 11 = dezembro
```

### Alternativas consideradas:

1. **Moment.js** ❌ - Biblioteca muito pesada (67KB)
2. **Day.js** ❌ - Adiciona dependência externa
3. **date-fns** ❌ - Mais código para carregar
4. **Luxon** ❌ - Overkill para o problema
5. **Parse manual** ✅ - Leve, rápido, sem dependências

## Referências

- [MDN - Date](https://developer.mozilla.org/pt-BR/docs/Web/JavaScript/Reference/Global_Objects/Date)
- [HTML input type="date"](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/date)
- [Timezone issues with Date](https://stackoverflow.com/questions/7556591/is-the-javascript-date-object-always-one-day-off)

---

**Status**: ✅ Corrigido  
**Versão**: 2.1  
**Data**: 09/12/2025
