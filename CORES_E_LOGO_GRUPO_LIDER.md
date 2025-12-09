# 🎨 Identidade Visual - Grupo Líder

## ✅ Implementado

### Cores da Marca
As cores oficiais do Grupo Líder foram aplicadas em todo o sistema:

- **Vermelho Principal**: `#E31E24` - Usado em botões principais, badges, destaques
- **Vermelho Escuro (hover)**: `#B71419` - Estados hover dos botões
- **Cinza Escuro**: `#4A4A4A` - Títulos e textos importantes
- **Cinza Médio**: `#6B6B6B` - Textos secundários

### Elementos com as Cores do Grupo Líder

#### 1. **Tela de Login**
- ✅ Fundo gradiente suave (cinza/vermelho claro)
- ✅ Botão "Enviar Código" em vermelho Grupo Líder
- ✅ Loading em vermelho Grupo Líder
- ✅ Box de segurança com borda vermelha
- ✅ Espaço para logo no topo

#### 2. **Header do Sistema**
- ✅ Logo pequena no canto esquerdo
- ✅ Título em cinza escuro (#4A4A4A)
- ✅ Botão "Relatórios" em vermelho Grupo Líder

#### 3. **Elementos Visuais**
- ✅ Scrollbar em tons de vermelho/rosa
- ✅ Dropzone (área de upload) com borda vermelha
- ✅ Badge de pendências em vermelho
- ✅ Inputs com foco em vermelho

### Classes CSS Disponíveis

```css
/* Botões */
.btn-lider-primary        /* Botão vermelho sólido */
.btn-lider-outline        /* Botão com borda vermelha */

/* Badges */
.badge-lider             /* Badge vermelho claro */

/* Inputs */
.input-lider             /* Input com foco vermelho */

/* Logo */
.logo-lider              /* Logo grande (180px) */
.logo-lider-small        /* Logo pequena (120px) */
```

### Variáveis CSS

```css
--lider-red              /* #E31E24 - Vermelho principal */
--lider-red-dark         /* #B71419 - Hover */
--lider-red-light        /* #FF4449 - Variante clara */
--lider-gray             /* #4A4A4A - Texto principal */
--lider-gray-light       /* #6B6B6B - Texto secundário */
```

## 📋 Próximo Passo: Adicionar a Logo

### Instruções para Adicionar a Logo

1. **Salvar a imagem da logo**
   - Local: `assets/images/logo-grupo-lider.png`
   - Formato recomendado: PNG com fundo transparente
   - Dimensões sugeridas: 400x150px ou superior
   - Resolução: Alta (2x para retina displays)

2. **Onde a logo aparece:**
   - **Tela de Login**: Centralizada no topo (usa classe `logo-lider`)
   - **Header do Sistema**: Canto superior esquerdo (usa classe `logo-lider-small`)
   - **Fallback**: Se a imagem não for encontrada, aparece um ícone vermelho

3. **Como adicionar:**
   ```bash
   # Copie a logo para a pasta correta
   cp /caminho/da/logo.png assets/images/logo-grupo-lider.png
   ```

4. **Verificar:**
   - Abra o sistema no navegador
   - A logo deve aparecer automaticamente
   - Se não aparecer, verifique:
     - Nome do arquivo: `logo-grupo-lider.png`
     - Localização: `assets/images/`
     - Permissões de leitura do arquivo

### Formatos Aceitos
- ✅ PNG (recomendado - suporta transparência)
- ✅ SVG (melhor para escalabilidade)
- ✅ JPG/JPEG (se fundo branco/sólido)

### Dimensões Otimizadas
- **Logo principal (login)**: 360px de largura máxima
- **Logo header**: 240px de largura máxima
- **Altura**: Automática (mantém proporção)

## 🎨 Sugestões de Uso da Logo

### Opção 1: Logo Completa (Atual)
- Logo horizontal "GRUPOLIDER" nas duas telas
- Melhor visibilidade da marca
- ✅ **Implementado e aguardando arquivo de imagem**

### Opção 2: Logo Reduzida (Alternativa)
- Apenas símbolo/ícone no header
- Logo completa só no login
- Economia de espaço

### Opção 3: Favicon
- Adicionar também como ícone da aba do navegador
- Arquivo: `favicon.ico` ou `favicon.png`
- Local: pasta raiz do projeto

## 📊 Paleta de Cores dos Gráficos

Os gráficos (Chart.js) também usam a paleta ajustada:
- 🔴 Vermelho Grupo Líder para dados críticos
- 🟢 Verde para conclusões
- 🟡 Amarelo para pendências
- 🔵 Azul para informações gerais

## 🔧 Customizações Futuras

### Sugestões de Melhorias:
1. **Adicionar marca d'água** nos relatórios PDF
2. **Cor de fundo personalizada** nos cards principais
3. **Animação da logo** no carregamento
4. **Tema escuro** com variações das cores Grupo Líder
5. **Email templates** com identidade visual

## 📝 Notas Técnicas

- Todas as cores estão em variáveis CSS (`:root`)
- Fácil ajuste futuro sem editar múltiplos arquivos
- Classes reutilizáveis para consistência
- Fallback automático se logo não existir
- Compatível com todos os navegadores modernos

---

**Última atualização**: Dezembro 2025  
**Versão**: 2.0 - Identidade Visual Grupo Líder
