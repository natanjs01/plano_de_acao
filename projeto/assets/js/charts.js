// ====================================
// MÓDULO DE GRÁFICOS CHART.JS
// ====================================

import { APP_STATE, CHART_COLORS, STATUS_COLORS, PRIORITY_COLORS } from './config.js';

let statusChart = null;
let priorityChart = null;

// ====== INICIALIZAR GRÁFICOS ======
export function initCharts() {
  initStatusChart();
  initPriorityChart();
}

// ====== GRÁFICO DE STATUS ======
export function initStatusChart() {
  const ctx = document.getElementById('statusChart');
  if (!ctx) return;

  if (statusChart) {
    statusChart.destroy();
  }

  const statusCounts = {};
  APP_STATE.tasks.forEach(task => {
    const status = task.status || 'Backlog';
    statusCounts[status] = (statusCounts[status] || 0) + 1;
  });

  const labels = Object.keys(statusCounts);
  const data = Object.values(statusCounts);
  
  // Cores VIBRANTES para melhor visibilidade
  const colorMap = {
    'Backlog': '#94a3b8',        // Cinza slate mais visível
    'Em andamento': '#3b82f6',   // Azul vivo
    'Bloqueado': '#ef4444',      // Vermelho vivo
    'Concluído': '#10b981'       // Verde vivo
  };
  
  const colors = labels.map(label => colorMap[label] || '#94a3b8');

  statusChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: 'Quantidade',
        data: data,
        backgroundColor: colors,
        borderWidth: 0,
        borderRadius: 8,
        borderSkipped: false
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        datalabels: {
          color: '#ffffff',
          font: { weight: 'bold', size: 18 },
          anchor: 'center',
          align: 'center',
          formatter: (value) => value,
          textStrokeColor: '#00000060',
          textStrokeWidth: 3
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: { 
            stepSize: 1,
            color: '#64748b',
            font: { size: 11 }
          },
          grid: {
            color: '#e2e8f0',
            drawBorder: false
          }
        },
        x: {
          ticks: {
            color: '#1e293b',
            font: { size: 12, weight: '600' }
          },
          grid: {
            display: false
          }
        }
      }
    },
    plugins: [ChartDataLabels]
  });
}

// ====== GRÁFICO DE PRIORIDADE ======
export function initPriorityChart() {
  const ctx = document.getElementById('priorityChart');
  if (!ctx) return;

  if (priorityChart) {
    priorityChart.destroy();
  }

  const priorityCounts = {};
  APP_STATE.tasks.forEach(task => {
    const priority = task.priority || 'Média';
    priorityCounts[priority] = (priorityCounts[priority] || 0) + 1;
  });

  const labels = Object.keys(priorityCounts);
  const data = Object.values(priorityCounts);
  
  // Cores VIBRANTES para melhor visibilidade
  const colorMap = {
    'Baixa': '#06b6d4',      // Ciano vivo
    'Média': '#f59e0b',      // Laranja/Âmbar vivo
    'Alta': '#f97316',       // Laranja escuro vivo
    'Crítica': '#dc2626'     // Vermelho vivo
  };
  
  const colors = labels.map(label => colorMap[label] || '#94a3b8');

  priorityChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: labels,
      datasets: [{
        data: data,
        backgroundColor: colors,
        borderWidth: 3,
        borderColor: '#ffffff'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            padding: 12,
            font: { size: 13, weight: '600' },
            color: '#1e293b'
          }
        },
        datalabels: {
          color: '#ffffff',
          font: { weight: 'bold', size: 18 },
          formatter: (value, context) => {
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const percentage = ((value / total) * 100).toFixed(0);
            return `${percentage}%`;
          },
          textStrokeColor: '#00000040',
          textStrokeWidth: 2
        }
      }
    },
    plugins: [ChartDataLabels]
  });
}

// ====== ATUALIZAR GRÁFICOS ======
export function updateCharts() {
  initStatusChart();
  initPriorityChart();
}

// ====== ATUALIZAR KPIs ======
export function updateKPIs() {
  const kpiContainer = document.getElementById('kpiCards');
  if (!kpiContainer) return;

  const tasks = APP_STATE.tasks;
  
  const total = tasks.length;
  const backlog = tasks.filter(t => t.status === 'Backlog').length;
  const emAndamento = tasks.filter(t => t.status === 'Em andamento').length;
  const bloqueado = tasks.filter(t => t.status === 'Bloqueado').length;
  const concluido = tasks.filter(t => t.status === 'Concluído').length;
  const alta = tasks.filter(t => t.priority === 'Alta' || t.priority === 'Crítica').length;
  
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const atrasadas = tasks.filter(t => {
    if (t.status === 'Concluído') return false;
    if (!t.due_date && !t.due) return false;
    const prazo = new Date(t.due_date || t.due);
    return prazo < hoje;
  }).length;

  const kpis = [
    { label: 'Total', value: total, color: 'bg-slate-100 text-slate-700', icon: 'M3 6h18M3 12h18M3 18h18' },
    { label: 'Backlog', value: backlog, color: 'bg-slate-200 text-slate-700', icon: 'M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2' },
    { label: 'Em Andamento', value: emAndamento, color: 'bg-sky-100 text-sky-700', icon: 'M13 10V3L4 14h7v7l9-11h-7z' },
    { label: 'Bloqueado', value: bloqueado, color: 'bg-rose-100 text-rose-700', icon: 'M12 8v4m0 4h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z' },
    { label: 'Concluído', value: concluido, color: 'bg-emerald-100 text-emerald-700', icon: 'M9 12l2 2 4-4m6 2a9 9 0 1 1-18 0 9 9 0 0 1 18 0z' },
    { label: 'Alta Prioridade', value: alta, color: 'bg-amber-100 text-amber-700', icon: 'M13 10V3L4 14h7v7l9-11h-7z' },
    { label: 'Atrasadas', value: atrasadas, color: 'bg-red-100 text-red-700', icon: 'M12 8v4l3 3m6-3a9 9 0 1 1-18 0 9 9 0 0 1 18 0z' }
  ];

  kpiContainer.innerHTML = kpis.map(kpi => `
    <div class="${kpi.color} rounded-2xl p-4 shadow-sm">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-xs font-medium opacity-75">${kpi.label}</p>
          <p class="text-2xl font-bold mt-1">${kpi.value}</p>
        </div>
        <svg width="28" height="28" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" class="opacity-50">
          <path d="${kpi.icon}"/>
        </svg>
      </div>
    </div>
  `).join('');
}

// Exportar instâncias dos gráficos para uso em relatórios
export function getChartInstances() {
  return { statusChart, priorityChart };
}
