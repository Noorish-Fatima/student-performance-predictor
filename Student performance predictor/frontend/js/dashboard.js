// Enhanced Dashboard JavaScript with Chart.js integration
document.addEventListener('DOMContentLoaded', function() {
    loadDashboard();
    
    // Add refresh button listener if exists
    const refreshBtn = document.getElementById('refreshBtn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', function() {
            this.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Refreshing...';
            loadDashboard();
            setTimeout(() => {
                this.innerHTML = '<i class="bi bi-arrow-clockwise"></i> Refresh';
            }, 1000);
        });
    }
    
    // Load Chart.js if available
    if (typeof Chart !== 'undefined') {
        initializeCharts();
    }
});

// Chart instances
let performanceChart = null;
let riskChart = null;

async function loadDashboard() {
    try {
        showLoading(true);
        
        const response = await fetch('/api/analytics/dashboard');
        const data = await response.json();
        
        if (data.empty) {
            showEmptyDashboard();
        } else {
            updateDashboard(data);
        }
        
        showLoading(false);
        
    } catch (error) {
        console.error('Dashboard error:', error);
        showError('Failed to load dashboard data. Using demo data.');
        loadDemoDashboard();
        showLoading(false);
    }
}

function updateDashboard(data) {
    // Update summary stats
    updateSummaryStats(data.summary);
    
    // Update charts
    updatePerformanceChart(data.performance_distribution);
    updateRiskChart(data.risk_distribution);
    
    // Update recent predictions
    updateRecentPredictions(data.recent_predictions);
    
    // Update nationality stats
    updateNationalityStats(data.nationality_stats);
    
    // Update intervention stats
    updateInterventionStats(data.intervention_stats);
    
    // Show demo warning if using demo data
    if (data.demo) {
        showDemoWarning();
    }
}

function updateSummaryStats(summary) {
    // Update all stat cards
    const elements = {
        'totalStudents': summary.total_students,
        'avgScore': summary.average_score.toFixed(1),
        'highRiskCount': summary.high_risk_count,
        'interventionCount': summary.intervention_count
    };
    
    for (const [id, value] of Object.entries(elements)) {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = value;
            // Animate the number change
            animateValue(element, 0, value, 1000);
        }
    }
}

function updatePerformanceChart(distribution) {
    const container = document.getElementById('performanceChart');
    if (!container) return;
    
    if (distribution.length === 0) {
        container.innerHTML = `
            <div class="text-center py-5">
                <i class="bi bi-bar-chart display-1 text-muted"></i>
                <p class="text-muted mt-3">No performance data available yet</p>
                <p class="small text-muted">Make some predictions to see the distribution</p>
            </div>
        `;
        return;
    }
    
    // Use Chart.js if available
    if (typeof Chart !== 'undefined' && document.getElementById('performanceCanvas')) {
        updateChartJsPerformance(distribution);
        return;
    }
    
    // Fallback to HTML chart
    let html = '<div class="chart-container">';
    
    distribution.forEach(item => {
        const total = distribution.reduce((sum, d) => sum + d.count, 0);
        const percentage = total > 0 ? (item.count / total * 100).toFixed(1) : 0;
        
        // Color based on grade
        let color = 'primary';
        if (item.grade_range.includes('A')) color = 'success';
        else if (item.grade_range.includes('B')) color = 'info';
        else if (item.grade_range.includes('C')) color = 'warning';
        else if (item.grade_range.includes('D')) color = 'orange';
        else if (item.grade_range.includes('F')) color = 'danger';
        
        html += `
            <div class="mb-3">
                <div class="d-flex justify-content-between mb-1">
                    <span><strong>${item.grade_range}</strong></span>
                    <span>${item.count} students (${percentage}%)</span>
                </div>
                <div class="progress" style="height: 25px;">
                    <div class="progress-bar bg-${color}" style="width: ${percentage}%">
                        Avg: ${item.avg_score?.toFixed(1) || 'N/A'}
                    </div>
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    container.innerHTML = html;
}

function updateRiskChart(riskData) {
    const container = document.getElementById('riskChart');
    if (!container) return;
    
    if (riskData.length === 0) {
        container.innerHTML = `
            <div class="text-center py-5">
                <i class="bi bi-pie-chart display-1 text-muted"></i>
                <p class="text-muted mt-3">No risk analysis data yet</p>
            </div>
        `;
        return;
    }
    
    // Use Chart.js if available
    if (typeof Chart !== 'undefined' && document.getElementById('riskCanvas')) {
        updateChartJsRisk(riskData);
        return;
    }
    
    // Fallback to HTML chart
    let html = '<div class="chart-container">';
    const total = riskData.reduce((sum, item) => sum + item.count, 0);
    
    riskData.forEach(item => {
        const percentage = total > 0 ? (item.count / total * 100).toFixed(1) : 0;
        const color = getRiskColor(item.risk_level);
        
        html += `
            <div class="d-flex align-items-center mb-3">
                <span class="badge bg-${color} me-3" style="width: 100px; font-size: 0.9rem;">
                    ${item.risk_level}
                </span>
                <div class="flex-grow-1">
                    <div class="d-flex justify-content-between mb-1">
                        <span>${percentage}%</span>
                        <span>${item.count} students</span>
                    </div>
                    <div class="progress" style="height: 20px;">
                        <div class="progress-bar bg-${color}" style="width: ${percentage}%"></div>
                    </div>
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    container.innerHTML = html;
}

function updateRecentPredictions(predictions) {
    const container = document.getElementById('recentPredictions');
    if (!container) return;
    
    if (predictions.length === 0) {
        container.innerHTML = `
            <div class="text-center py-4">
                <p class="text-muted">No recent predictions</p>
                <a href="index.html" class="btn btn-sm btn-primary">
                    <i class="bi bi-plus-circle"></i> Make First Prediction
                </a>
            </div>
        `;
        return;
    }
    
    let html = '';
    
    predictions.forEach(pred => {
        const riskColor = getRiskColor(pred.risk_level);
        const gradeColor = getGradeColor(pred.predicted_grade);
        
        html += `
            <div class="list-group-item border-0 border-bottom py-3">
                <div class="d-flex justify-content-between align-items-center">
                    <div class="flex-grow-1">
                        <div class="d-flex align-items-center mb-1">
                            <h6 class="mb-0 me-2">${pred.name}</h6>
                            <span class="badge bg-${gradeColor} me-2">${pred.predicted_grade}</span>
                            <span class="badge bg-${riskColor}">${pred.risk_level}</span>
                        </div>
                        <small class="text-muted">
                            <i class="bi bi-clock"></i> ${formatDate(pred.date)}
                        </small>
                    </div>
                    <div class="text-end">
                        <div class="display-6 fw-bold text-${gradeColor}">${pred.predicted_score.toFixed(1)}</div>
                        <small class="text-muted">Score</small>
                    </div>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

function updateNationalityStats(stats) {
    const container = document.getElementById('nationalityStats');
    if (!container) return;
    
    if (!stats || stats.length === 0) {
        container.innerHTML = '<p class="text-muted text-center py-3">No nationality data</p>';
        return;
    }
    
    let html = '<div class="table-responsive"><table class="table table-sm table-hover">';
    html += '<thead><tr><th>Nationality</th><th>Students</th><th>Avg Score</th><th>Confidence</th></tr></thead><tbody>';
    
    stats.forEach(stat => {
        html += `
            <tr>
                <td><strong>${stat.nationality}</strong></td>
                <td>${stat.count}</td>
                <td>
                    <span class="badge bg-${getScoreColor(stat.avg_score)}">
                        ${stat.avg_score?.toFixed(1) || 'N/A'}
                    </span>
                </td>
                <td>
                    <div class="progress" style="height: 6px;">
                        <div class="progress-bar bg-info" style="width: ${stat.avg_confidence || 0}%"></div>
                    </div>
                    <small>${stat.avg_confidence?.toFixed(1) || '0'}%</small>
                </td>
            </tr>
        `;
    });
    
    html += '</tbody></table></div>';
    container.innerHTML = html;
}

function updateInterventionStats(stats) {
    const container = document.getElementById('interventionStats');
    if (!container) return;
    
    if (!stats || stats.length === 0) {
        container.innerHTML = '<p class="text-muted text-center py-3">No intervention data</p>';
        return;
    }
    
    let html = '<div class="row">';
    
    stats.forEach(stat => {
        const effectiveness = (stat.avg_effectiveness || 0) * 100;
        
        html += `
            <div class="col-md-6 mb-3">
                <div class="card">
                    <div class="card-body">
                        <h6 class="card-title">${stat.intervention_type.replace('_', ' ')}</h6>
                        <div class="d-flex justify-content-between mb-2">
                            <span>Applied to:</span>
                            <strong>${stat.count} students</strong>
                        </div>
                        <div class="d-flex justify-content-between mb-2">
                            <span>Avg Priority:</span>
                            <span class="badge bg-${getPriorityColor(stat.avg_priority)}">
                                ${stat.avg_priority?.toFixed(1) || 'N/A'}
                            </span>
                        </div>
                        <div class="mt-3">
                            <small class="text-muted">Effectiveness</small>
                            <div class="progress" style="height: 10px;">
                                <div class="progress-bar bg-success" style="width: ${effectiveness}%"></div>
                            </div>
                            <small class="float-end">${effectiveness.toFixed(0)}%</small>
                        </div>
                    </div>
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    container.innerHTML = html;
}

// Helper functions
function getRiskColor(riskLevel) {
    switch(riskLevel?.toLowerCase()) {
        case 'low': return 'success';
        case 'medium': return 'warning';
        case 'high': return 'danger';
        case 'critical': return 'dark';
        default: return 'secondary';
    }
}

function getGradeColor(grade) {
    switch(grade?.toUpperCase()) {
        case 'A': return 'success';
        case 'B': return 'primary';
        case 'C': return 'warning';
        case 'D': return 'orange';
        case 'F': return 'danger';
        default: return 'secondary';
    }
}

function getScoreColor(score) {
    if (score >= 90) return 'success';
    if (score >= 80) return 'primary';
    if (score >= 70) return 'warning';
    if (score >= 60) return 'orange';
    return 'danger';
}

function getPriorityColor(priority) {
    if (priority <= 1.5) return 'danger';
    if (priority <= 2.5) return 'warning';
    return 'success';
}

function formatDate(dateString) {
    if (!dateString) return 'Unknown';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function animateValue(element, start, end, duration) {
    if (start === end) return;
    
    const range = end - start;
    const increment = end > start ? 1 : -1;
    const stepTime = Math.abs(Math.floor(duration / range));
    let current = start;
    
    const timer = setInterval(() => {
        current += increment;
        element.textContent = current;
        
        if (current === end) {
            clearInterval(timer);
        }
    }, stepTime);
}

function showLoading(show) {
    const loading = document.getElementById('dashboardLoading');
    const content = document.getElementById('dashboardContent');
    
    if (loading && content) {
        if (show) {
            loading.classList.remove('d-none');
            content.classList.add('d-none');
        } else {
            loading.classList.add('d-none');
            content.classList.remove('d-none');
        }
    }
}

function showEmptyDashboard() {
    const content = document.getElementById('dashboardContent');
    if (!content) return;
    
    content.innerHTML = `
        <div class="text-center py-5">
            <i class="bi bi-bar-chart display-1 text-muted mb-4"></i>
            <h3 class="mb-3">Welcome to Your Dashboard!</h3>
            <p class="text-muted mb-4">
                Your dashboard is waiting for data. Start making predictions to see insights and analytics.
            </p>
            <a href="index.html" class="btn btn-primary btn-lg">
                <i class="bi bi-calculator"></i> Make Your First Prediction
            </a>
            <div class="mt-5">
                <div class="row justify-content-center">
                    <div class="col-md-4 mb-3">
                        <div class="card">
                            <div class="card-body">
                                <i class="bi bi-graph-up text-primary display-6 mb-3"></i>
                                <h5>Performance Analytics</h5>
                                <p class="small text-muted">Track student performance trends</p>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-4 mb-3">
                        <div class="card">
                            <div class="card-body">
                                <i class="bi bi-shield-check text-success display-6 mb-3"></i>
                                <h5>Risk Analysis</h5>
                                <p class="small text-muted">Identify at-risk students early</p>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-4 mb-3">
                        <div class="card">
                            <div class="card-body">
                                <i class="bi bi-lightbulb text-warning display-6 mb-3"></i>
                                <h5>Interventions</h5>
                                <p class="small text-muted">Personalized support recommendations</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function showError(message) {
    const alertDiv = document.createElement('div');
    alertDiv.className = 'alert alert-warning alert-dismissible fade show mt-3';
    alertDiv.innerHTML = `
        <i class="bi bi-exclamation-triangle me-2"></i>
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    const container = document.querySelector('.container');
    if (container) {
        container.insertBefore(alertDiv, container.firstChild);
        
        setTimeout(() => {
            alertDiv.classList.remove('show');
            setTimeout(() => alertDiv.remove(), 150);
        }, 5000);
    }
}

function showDemoWarning() {
    const alertDiv = document.createElement('div');
    alertDiv.className = 'alert alert-info alert-dismissible fade show mt-3';
    alertDiv.innerHTML = `
        <i class="bi bi-info-circle me-2"></i>
        Displaying demo data. Make predictions to see your actual analytics.
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    const container = document.querySelector('.container');
    if (container) {
        container.insertBefore(alertDiv, container.firstChild);
    }
}

function loadDemoDashboard() {
    // Load comprehensive demo data
    const demoData = {
        performance_distribution: [
            {grade_range: 'A (90-100)', count: 45, avg_score: 94.2},
            {grade_range: 'B (80-89)', count: 98, avg_score: 84.7},
            {grade_range: 'C (70-79)', count: 87, avg_score: 74.3},
            {grade_range: 'D (60-69)', count: 52, avg_score: 64.8},
            {grade_range: 'F (<60)', count: 24, avg_score: 48.5}
        ],
        risk_distribution: [
            {risk_level: 'Low', count: 185},
            {risk_level: 'Medium', count: 79},
            {risk_level: 'High', count: 32},
            {risk_level: 'Critical', count: 10}
        ],
        nationality_stats: [
            {nationality: 'United States', count: 120, avg_score: 82.5, avg_confidence: 88.3},
            {nationality: 'China', count: 45, avg_score: 85.2, avg_confidence: 86.7},
            {nationality: 'India', count: 38, avg_score: 81.8, avg_confidence: 87.1},
            {nationality: 'Mexico', count: 32, avg_score: 79.2, avg_confidence: 85.4},
            {nationality: 'Brazil', count: 28, avg_score: 77.8, avg_confidence: 84.2}
        ],
        intervention_stats: [
            {intervention_type: 'academic_support', count: 45, avg_priority: 1.8, avg_effectiveness: 0.75},
            {intervention_type: 'attendance_monitoring', count: 28, avg_priority: 1.5, avg_effectiveness: 0.82},
            {intervention_type: 'extracurricular_guidance', count: 12, avg_priority: 2.8, avg_effectiveness: 0.65},
            {intervention_type: 'application_workshop', count: 4, avg_priority: 2.2, avg_effectiveness: 0.78}
        ],
        recent_predictions: [
            {name: 'John Smith', predicted_score: 85.5, predicted_grade: 'B', risk_level: 'Low', date: '2024-01-15 14:30:00'},
            {name: 'Maria Garcia', predicted_score: 92.3, predicted_grade: 'A', risk_level: 'Low', date: '2024-01-15 13:45:00'},
            {name: 'David Chen', predicted_score: 67.8, predicted_grade: 'D', risk_level: 'High', date: '2024-01-15 12:20:00'},
            {name: 'Sarah Johnson', predicted_score: 88.9, predicted_grade: 'B', risk_level: 'Low', date: '2024-01-15 11:15:00'},
            {name: 'James Wilson', predicted_score: 73.2, predicted_grade: 'C', risk_level: 'Medium', date: '2024-01-15 10:30:00'},
            {name: 'Emma Brown', predicted_score: 95.1, predicted_grade: 'A', risk_level: 'Low', date: '2024-01-15 09:45:00'},
            {name: 'Michael Lee', predicted_score: 58.4, predicted_grade: 'F', risk_level: 'Critical', date: '2024-01-15 09:00:00'}
        ],
        summary: {
            total_students: 306,
            average_score: 78.5,
            high_risk_count: 42,
            intervention_count: 89
        }
    };
    
    updateDashboard(demoData);
    showDemoWarning();
}

function initializeCharts() {
    const performanceContainer = document.getElementById('performanceChart');
    const riskContainer = document.getElementById('riskChart');
    
    if (performanceContainer && !performanceContainer.querySelector('canvas')) {
        performanceContainer.innerHTML = '<canvas id="performanceCanvas" height="250"></canvas>';
    }
    
    if (riskContainer && !riskContainer.querySelector('canvas')) {
        riskContainer.innerHTML = '<canvas id="riskCanvas" height="250"></canvas>';
    }
}

function updateChartJsPerformance(distribution) {
    const ctx = document.getElementById('performanceCanvas');
    if (!ctx) return;
    
    if (performanceChart) {
        performanceChart.destroy();
    }
    
    const labels = distribution.map(d => d.grade_range);
    const data = distribution.map(d => d.count);
    const avgScores = distribution.map(d => d.avg_score);
    
    performanceChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Number of Students',
                data: data,
                backgroundColor: [
                    'rgba(76, 201, 240, 0.7)',
                    'rgba(72, 149, 239, 0.7)',
                    'rgba(247, 37, 133, 0.7)',
                    'rgba(181, 23, 158, 0.7)',
                    'rgba(114, 9, 183, 0.7)'
                ],
                borderColor: [
                    'rgb(76, 201, 240)',
                    'rgb(72, 149, 239)',
                    'rgb(247, 37, 133)',
                    'rgb(181, 23, 158)',
                    'rgb(114, 9, 183)'
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const avg = avgScores[context.dataIndex];
                            return [
                                `Students: ${context.parsed.y}`,
                                `Avg Score: ${avg.toFixed(1)}`
                            ];
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Number of Students'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Grade Range'
                    }
                }
            }
        }
    });
}

function updateChartJsRisk(riskData) {
    const ctx = document.getElementById('riskCanvas');
    if (!ctx) return;
    
    if (riskChart) {
        riskChart.destroy();
    }
    
    const labels = riskData.map(d => d.risk_level);
    const data = riskData.map(d => d.count);
    
    riskChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: [
                    'rgba(76, 201, 240, 0.7)',
                    'rgba(72, 149, 239, 0.7)',
                    'rgba(247, 37, 133, 0.7)',
                    'rgba(114, 9, 183, 0.7)'
                ],
                borderColor: [
                    'rgb(76, 201, 240)',
                    'rgb(72, 149, 239)',
                    'rgb(247, 37, 133)',
                    'rgb(114, 9, 183)'
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'right',
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = Math.round((context.parsed / total) * 100);
                            return `${context.label}: ${context.parsed} (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
}