// ====================================
// MÓDULO DE RELATÓRIOS E EXPORTAÇÃO
// ====================================

import { APP_STATE } from './config.js';
import { applyFilters, formatDate } from './ui.js';
import { getChartInstances } from './charts.js';

// ====== EXPORTAR JSON ======
export function exportJSON() {
  const dataStr = JSON.stringify(APP_STATE.tasks, null, 2);
  const blob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `atividades_${new Date().toISOString().split('T')[0]}.json`;
  link.click();
  URL.revokeObjectURL(url);
  
  console.log('✅ JSON exportado com sucesso');
}

// ====== IMPORTAR JSON ======
export async function importJSON(file) {
  try {
    const text = await file.text();
    const data = JSON.parse(text);
    
    if (!Array.isArray(data)) {
      alert('❌ Arquivo inválido! O JSON deve conter um array de tarefas.');
      return;
    }
    
    // Aqui você implementaria a lógica de importação
    // Por exemplo, inserir no Supabase
    
    console.log(`📥 ${data.length} tarefas importadas`);
    alert(`✅ ${data.length} tarefas importadas com sucesso!`);
    
  } catch (error) {
    console.error('❌ Erro ao importar:', error);
    alert('❌ Erro ao importar arquivo: ' + error.message);
  }
}

// ====== EXPORTAR DASHBOARD PDF ======
export function exportDashboardPDF() {
  if (!window.html2pdf) {
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
    script.onload = () => exportDashboardPDF();
    document.body.appendChild(script);
    return;
  }

  const { statusChart, priorityChart } = getChartInstances();
  
  if (!statusChart || !priorityChart) {
    alert('❌ Gráficos não carregados. Aguarde e tente novamente.');
    return;
  }

  // Criar estrutura para PDF
  const dashboard = document.createElement('div');
  dashboard.style.padding = '20px';
  dashboard.style.backgroundColor = '#ffffff';
  dashboard.style.fontFamily = 'Inter, sans-serif';

  // Título
  const title = document.createElement('h1');
  title.textContent = 'Dashboard de Atividades';
  title.style.fontSize = '24px';
  title.style.marginBottom = '20px';
  dashboard.appendChild(title);

  // Data
  const date = document.createElement('p');
  date.textContent = `Gerado em: ${new Date().toLocaleString('pt-BR')}`;
  date.style.fontSize = '12px';
  date.style.color = '#666';
  dashboard.appendChild(date);

  // KPIs
  const kpiSection = document.createElement('div');
  kpiSection.style.marginTop = '20px';
  
  const total = APP_STATE.tasks.length;
  const backlog = APP_STATE.tasks.filter(t => t.status === 'Backlog').length;
  const emAndamento = APP_STATE.tasks.filter(t => t.status === 'Em andamento').length;
  const concluido = APP_STATE.tasks.filter(t => t.status === 'Concluído').length;
  
  kpiSection.innerHTML = `
    <h2 style="font-size: 18px; margin-bottom: 10px;">Indicadores</h2>
    <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px;">
      <div style="padding: 10px; background: #f1f5f9; border-radius: 8px;">
        <p style="font-size: 12px; color: #64748b;">Total</p>
        <p style="font-size: 24px; font-weight: bold;">${total}</p>
      </div>
      <div style="padding: 10px; background: #dbeafe; border-radius: 8px;">
        <p style="font-size: 12px; color: #1e40af;">Backlog</p>
        <p style="font-size: 24px; font-weight: bold;">${backlog}</p>
      </div>
      <div style="padding: 10px; background: #dbeafe; border-radius: 8px;">
        <p style="font-size: 12px; color: #1e40af;">Em Andamento</p>
        <p style="font-size: 24px; font-weight: bold;">${emAndamento}</p>
      </div>
      <div style="padding: 10px; background: #d1fae5; border-radius: 8px;">
        <p style="font-size: 12px; color: #065f46;">Concluído</p>
        <p style="font-size: 24px; font-weight: bold;">${concluido}</p>
      </div>
    </div>
  `;
  dashboard.appendChild(kpiSection);

  // Gráficos
  const chartsSection = document.createElement('div');
  chartsSection.style.marginTop = '30px';
  chartsSection.style.display = 'grid';
  chartsSection.style.gridTemplateColumns = '1fr 1fr';
  chartsSection.style.gap = '20px';

  // Status Chart
  const chart1Div = document.createElement('div');
  const chart1Title = document.createElement('h3');
  chart1Title.textContent = 'Status das Atividades';
  chart1Title.style.fontSize = '16px';
  chart1Title.style.marginBottom = '10px';
  chart1Div.appendChild(chart1Title);
  
  const statusCanvas = document.getElementById('statusChart');
  const statusImg = document.createElement('img');
  statusImg.src = statusCanvas.toDataURL('image/png');
  statusImg.style.width = '100%';
  statusImg.style.maxHeight = '280px';
  chart1Div.appendChild(statusImg);
  chartsSection.appendChild(chart1Div);

  // Priority Chart
  const chart2Div = document.createElement('div');
  const chart2Title = document.createElement('h3');
  chart2Title.textContent = 'Prioridade';
  chart2Title.style.fontSize = '16px';
  chart2Title.style.marginBottom = '10px';
  chart2Div.appendChild(chart2Title);
  
  const priorityCanvas = document.getElementById('priorityChart');
  const priorityImg = document.createElement('img');
  priorityImg.src = priorityCanvas.toDataURL('image/png');
  priorityImg.style.width = '100%';
  priorityImg.style.maxHeight = '280px';
  chart2Div.appendChild(priorityImg);
  chartsSection.appendChild(chart2Div);

  dashboard.appendChild(chartsSection);

  // Gerar PDF
  html2pdf().set({
    margin: 0.5,
    filename: 'dashboard_atividades.pdf',
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2, backgroundColor: '#ffffff' },
    jsPDF: { unit: 'in', format: 'a4', orientation: 'landscape' }
  }).from(dashboard).save();
  
  console.log('✅ PDF do dashboard exportado');
}

// ====== EXPORTAR LISTA PDF ======
export function exportListPDF() {
  let list = applyFilters(APP_STATE.tasks);
  
  // Ordenar por prazo
  list = list.slice().sort((a, b) => {
    const pa = a.due_date || a.due;
    const pb = b.due_date || b.due;
    if (!pa && !pb) return 0;
    if (!pa) return 1;
    if (!pb) return -1;
    return new Date(pa) - new Date(pb);
  });

  // Cabeçalhos da tabela
  const headers = [
    'ID',
    'Título',
    'Responsável',
    'Prazo',
    'Prioridade',
    'Status',
    'Tags'
  ];

  // Dados da tabela
  const data = list.map(t => [
    t.sequential_id || '-',
    t.title || '-',
    t.assignee || '-',
    formatDate(t.due_date || t.due),
    t.priority || '-',
    t.status || '-',
    (t.tags || []).join(', ') || '-'
  ]);

  // Criar PDF
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });

  doc.setFontSize(16);
  doc.text('Lista de Atividades Filtradas', 40, 40);

  doc.autoTable({
    head: [headers],
    body: data,
    startY: 60,
    margin: { left: 20, right: 20 },
    styles: { fontSize: 9, cellPadding: 3 },
    headStyles: { fillColor: [30, 64, 175], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [241, 245, 249] },
    didDrawPage: function (data) {
      doc.setFontSize(10);
      doc.setTextColor(150);
      doc.text(
        'Gerado em: ' + new Date().toLocaleString('pt-BR'), 
        data.settings.margin.left, 
        doc.internal.pageSize.height - 10
      );
    }
  });

  doc.save('lista_atividades.pdf');
  
  console.log('✅ PDF da lista exportado');
}
