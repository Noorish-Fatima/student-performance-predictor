document.addEventListener('DOMContentLoaded', function() {
    setDefaultValues();
    
    document.getElementById('predictionForm').addEventListener('submit', handleSubmit);
    
    const attendanceSlider = document.querySelector('input[name="attendance_rate"]');
    if (attendanceSlider) {
        attendanceSlider.addEventListener('input', function() {
            document.getElementById('attendanceValue').textContent = `${this.value}%`;
        });
    }
    
    loadStats();
});

function setDefaultValues() {
    const defaults = {
        'name': 'John Doe',
        'gender': 'M',
        'nationality': 'United States of America',
        'age': '21',
        'english_grade': '3.5',
        'math_grade': '3.2',
        'sciences_grade': '3.7',
        'language_grade': '4.0',
        'portfolio_rating': '4',
        'coverletter_rating': '3',
        'refletter_rating': '5'
    };
    
    Object.entries(defaults).forEach(([name, value]) => {
        const element = document.querySelector(`[name="${name}"]`);
        if (element) element.value = value;
    });
    
    document.getElementById('attendanceValue').textContent = '85%';
}

async function handleSubmit(event) {
    event.preventDefault();
    
    const form = event.target;
    const formData = new FormData(form);
    const data = Object.fromEntries(formData);
    
    data.age = parseInt(data.age);
    data.english_grade = parseFloat(data.english_grade);
    data.math_grade = parseFloat(data.math_grade);
    data.sciences_grade = parseFloat(data.sciences_grade);
    data.language_grade = parseFloat(data.language_grade);
    data.portfolio_rating = parseInt(data.portfolio_rating);
    data.coverletter_rating = parseInt(data.coverletter_rating);
    data.refletter_rating = parseInt(data.refletter_rating);
    data.attendance_rate = parseInt(data.attendance_rate) / 100;
    data.extracurricular_level = parseInt(data.extracurricular_level || 3);
    data.ethnic_group = data.ethnic_group || 'NA';
    
    const btn = document.getElementById('predictBtn');
    const originalText = btn.innerHTML;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Predicting...';
    btn.disabled = true;
    
    try {
        const response = await fetch('/api/predict', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(data)
        });
        
        const result = await response.json();
        
        if (result.success) {
            displayResults(result);
        } else {
            showError(result.error || 'Prediction failed');
            if (result.fallback) {
                displayFallbackResults(result);
            }
        }
    } catch (error) {
        showError('Connection error: ' + error.message);
        displayDemoResults();
    } finally {
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
}

function displayResults(result) {
    const pred = result.prediction;
    
    document.getElementById('predictedScore').textContent = pred.score.toFixed(1);
    
    const gradeBadge = document.getElementById('predictedGrade');
    gradeBadge.textContent = pred.grade;
    gradeBadge.className = 'badge';
    
    const gradeColors = {
        'A': 'bg-success', 'B': 'bg-primary', 
        'C': 'bg-warning', 'D': 'bg-orange', 'F': 'bg-danger'
    };
    gradeBadge.classList.add(gradeColors[pred.grade] || 'bg-secondary');
    
    const progress = document.getElementById('scoreProgress');
    progress.style.width = `${pred.score}%`;
    progress.textContent = `${pred.score.toFixed(1)}%`;
    
    if (pred.score >= 80) {
        progress.className = 'progress-bar bg-success';
    } else if (pred.score >= 60) {
        progress.className = 'progress-bar bg-warning';
    } else {
        progress.className = 'progress-bar bg-danger';
    }
    
    const riskAlert = document.getElementById('riskAlert');
    const riskText = document.getElementById('riskText');
    
    riskAlert.className = 'alert';
    const riskConfig = {
        'Low': ['alert-success', 'Low risk. Strong performance.'],
        'Medium': ['alert-warning', 'Medium risk. Some areas need improvement.'],
        'High': ['alert-danger', 'High risk. Requires immediate intervention.'],
        'Critical': ['alert-dark text-white', 'CRITICAL RISK! Immediate action required.']
    };
    
    const [alertClass, message] = riskConfig[pred.risk_level] || ['alert-info', 'Risk assessment pending'];
    riskAlert.classList.add(alertClass);
    riskText.textContent = message;
    
    document.getElementById('confidenceBar').style.width = `${pred.confidence}%`;
    document.getElementById('confidenceText').textContent = `Confidence: ${pred.confidence.toFixed(1)}%`;
    
    displayQuickActions(result.recommendations || []);
    
    document.getElementById('resultsCard').style.display = 'block';
    document.getElementById('featureCard').style.display = 'block';
    
    animateResults();
}

function displayQuickActions(recommendations) {
    const container = document.getElementById('quickActions');
    let html = '';
    
    recommendations.slice(0, 3).forEach(rec => {
        const priorityClass = rec.priority === 1 ? 'danger' : 
                             rec.priority === 2 ? 'warning' : 'success';
        
        html += `
            <div class="alert alert-light border mb-2">
                <div class="d-flex justify-content-between align-items-center">
                    <div>
                        <strong>${rec.title}</strong>
                        <div class="small text-muted">${rec.description}</div>
                    </div>
                    <span class="badge bg-${priorityClass}">P${rec.priority}</span>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html || '<p class="text-muted">No recommendations</p>';
}

function animateResults() {
    const resultsCard = document.getElementById('resultsCard');
    const featureCard = document.getElementById('featureCard');
    
    resultsCard.style.opacity = '0';
    featureCard.style.opacity = '0';
    resultsCard.style.transform = 'translateY(20px)';
    featureCard.style.transform = 'translateY(20px)';
    
    setTimeout(() => {
        resultsCard.style.transition = 'all 0.5s ease';
        featureCard.style.transition = 'all 0.5s ease';
        resultsCard.style.opacity = '1';
        featureCard.style.opacity = '1';
        resultsCard.style.transform = 'translateY(0)';
        featureCard.style.transform = 'translateY(0)';
    }, 100);
}

function showError(message) {
    const alert = document.createElement('div');
    alert.className = 'alert alert-danger alert-dismissible fade show mt-3';
    alert.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    const container = document.querySelector('.container');
    container.insertBefore(alert, container.firstChild);
    
    setTimeout(() => {
        alert.classList.remove('show');
        setTimeout(() => alert.remove(), 150);
    }, 5000);
}

function displayFallbackResults(result) {
    const pred = result.prediction;
    
    document.getElementById('predictedScore').textContent = pred.score.toFixed(1);
    document.getElementById('predictedGrade').textContent = pred.grade;
    document.getElementById('predictedGrade').className = 'badge bg-warning';
    
    const progress = document.getElementById('scoreProgress');
    progress.style.width = `${pred.score}%`;
    progress.textContent = `${pred.score.toFixed(1)}%`;
    progress.className = 'progress-bar bg-warning';
    
    const riskAlert = document.getElementById('riskAlert');
    riskAlert.className = 'alert alert-warning';
    document.getElementById('riskText').textContent = 'Using fallback prediction (demo mode)';
    
    document.getElementById('confidenceBar').style.width = `${pred.confidence}%`;
    document.getElementById('confidenceText').textContent = `Confidence: ${pred.confidence.toFixed(1)}%`;
    
    document.getElementById('resultsCard').style.display = 'block';
    document.getElementById('featureCard').style.display = 'block';
}

function displayDemoResults() {
    document.getElementById('predictedScore').textContent = '85.5';
    document.getElementById('predictedGrade').textContent = 'B';
    document.getElementById('predictedGrade').className = 'badge bg-success';
    
    const progress = document.getElementById('scoreProgress');
    progress.style.width = '85.5%';
    progress.textContent = '85.5%';
    progress.className = 'progress-bar bg-success';
    
    const riskAlert = document.getElementById('riskAlert');
    riskAlert.className = 'alert alert-success';
    document.getElementById('riskText').textContent = 'Demo mode: Low risk student';
    
    document.getElementById('confidenceBar').style.width = '92%';
    document.getElementById('confidenceText').textContent = 'Confidence: 92%';
    
    document.getElementById('resultsCard').style.display = 'block';
    document.getElementById('featureCard').style.display = 'block';
}

function loadStats() {
    fetch('/api/stats')
        .then(res => res.json())
        .then(data => {
            console.log('Stats loaded:', data);
        })
        .catch(err => console.log('Stats load failed:', err));
}

function clearForm() {
    document.getElementById('predictionForm').reset();
    setDefaultValues();
    
    document.getElementById('resultsCard').style.display = 'none';
    document.getElementById('featureCard').style.display = 'none';
}

async function downloadReport() {
    try {
        if (!currentPrediction) {
            alert('Please make a prediction first to generate a report.');
            return;
        }

        const originalBtn = event.target.innerHTML;
        event.target.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Generating Report...';
        event.target.disabled = true;

        const form = document.getElementById('predictionForm');
        const formData = new FormData(form);
        const studentData = Object.fromEntries(formData);

        const report = generateComprehensiveReport(currentPrediction, studentData);
        
        await generateAndDownloadReport(report, studentData);

        event.target.innerHTML = originalBtn;
        event.target.disabled = false;
        
    } catch (error) {
        console.error('Report generation error:', error);
        alert('Error generating report. Please try again.');
        event.target.innerHTML = originalBtn;
        event.target.disabled = false;
    }
}

function generateComprehensiveReport(prediction, studentData) {
    const now = new Date();
    const reportDate = now.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });

    const scores = {
        academic: prediction.feature_analysis?.academic_strength || 0,
        application: prediction.feature_analysis?.application_strength || 0,
        extracurricular: prediction.feature_analysis?.extracurricular_score || 0,
        attendance: prediction.feature_analysis?.attendance_rate || 0
    };

    const overallScore = prediction.prediction.score;
    const grade = prediction.prediction.grade;
    const risk = prediction.prediction.risk_level;
    const confidence = prediction.prediction.confidence;

    const recommendations = prediction.recommendations || [];
    const highPriority = recommendations.filter(r => r.priority === 1);
    const mediumPriority = recommendations.filter(r => r.priority === 2);
    const lowPriority = recommendations.filter(r => r.priority === 3);

    const swot = generateSWOTAnalysis(scores, overallScore);

    const timeline = generateActionTimeline(recommendations);

    return {
        metadata: {
            title: `Student Performance Report - ${studentData.name || 'Student'}`,
            date: reportDate,
            studentName: studentData.name || 'Unknown Student',
            generatedBy: 'AI Performance Predictor v1.0'
        },
        scores: {
            overall: overallScore,
            grade: grade,
            risk: risk,
            confidence: confidence,
            breakdown: scores
        },
        analysis: {
            strengths: swot.strengths,
            weaknesses: swot.weaknesses,
            opportunities: swot.opportunities,
            threats: swot.threats
        },
        recommendations: {
            all: recommendations,
            highPriority: highPriority,
            mediumPriority: mediumPriority,
            lowPriority: lowPriority,
            timeline: timeline
        },
        studentInfo: {
            name: studentData.name,
            gender: studentData.gender,
            nationality: studentData.nationality,
            age: studentData.age,
            grades: {
                english: studentData.english_grade,
                math: studentData.math_grade,
                science: studentData.sciences_grade,
                language: studentData.language_grade
            },
            application: {
                portfolio: studentData.portfolio_rating,
                coverLetter: studentData.coverletter_rating,
                references: studentData.refletter_rating
            }
        },
        modelInfo: {
            predictionModels: Object.keys(prediction.model_predictions || {}),
            ensembleScore: overallScore,
            predictionDate: now.toISOString()
        }
    };
}

function generateSWOTAnalysis(scores, overallScore) {
    const swot = {
        strengths: [],
        weaknesses: [],
        opportunities: [],
        threats: []
    };

    if (scores.academic >= 3.5) {
        swot.strengths.push('Strong academic performance across subjects');
    }
    if (scores.application >= 3.5) {
        swot.strengths.push('Well-prepared application materials');
    }
    if (scores.extracurricular >= 3.0) {
        swot.strengths.push('Good extracurricular involvement');
    }
    if (scores.attendance >= 0.85) {
        swot.strengths.push('Excellent attendance record');
    }
    if (overallScore >= 80) {
        swot.strengths.push('Overall high performance potential');
    }

    if (scores.academic < 3.0) {
        swot.weaknesses.push('Academic performance needs improvement');
    }
    if (scores.application < 3.0) {
        swot.weaknesses.push('Application materials need enhancement');
    }
    if (scores.extracurricular < 2.5) {
        swot.weaknesses.push('Limited extracurricular activities');
    }
    if (scores.attendance < 0.8) {
        swot.weaknesses.push('Attendance requires attention');
    }

    swot.opportunities.push('Personalized tutoring programs available');
    swot.opportunities.push('Access to academic support resources');
    swot.opportunities.push('Extracurricular development programs');
    swot.opportunities.push('College application workshops');

    if (overallScore < 70) {
        swot.threats.push('Risk of academic underperformance');
    }
    if (scores.attendance < 0.75) {
        swot.threats.push('Attendance issues may impact learning');
    }

    return swot;
}

function generateActionTimeline(recommendations) {
    const timeline = [];
    let startDate = new Date();
    
    recommendations.forEach((rec, index) => {
        const item = {
            intervention: rec.title,
            priority: rec.priority,
            duration: rec.duration || '4 weeks',
            startDate: new Date(startDate.getTime() + (index * 7 * 24 * 60 * 60 * 1000)).toLocaleDateString(),
            tasks: rec.resources || []
        };
        timeline.push(item);
    });

    return timeline;
}

async function generateAndDownloadReport(report, studentData) {
    const htmlReport = generateHTMLReport(report);
    
    if (typeof html2pdf !== 'undefined') {
        const element = document.createElement('div');
        element.innerHTML = htmlReport;
        document.body.appendChild(element);
        
        const opt = {
            margin: 1,
            filename: `Student_Report_${studentData.name || 'Student'}_${Date.now()}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2 },
            jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
        };
        
        await html2pdf().set(opt).from(element).save();
        document.body.removeChild(element);
    } else {
        downloadAsHTML(htmlReport, studentData);
    }
}

function generateHTMLReport(report) {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>${report.metadata.title}</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 1000px;
            margin: 0 auto;
            padding: 20px;
        }
        .header {
            text-align: center;
            border-bottom: 3px solid #4361ee;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        .header h1 {
            color: #4361ee;
            margin-bottom: 5px;
        }
        .header .subtitle {
            color: #666;
            font-size: 0.9em;
        }
        .section {
            margin-bottom: 30px;
            page-break-inside: avoid;
        }
        .section-title {
            background: #4361ee;
            color: white;
            padding: 10px 15px;
            margin-bottom: 15px;
            border-radius: 5px;
        }
        .score-card {
            background: #f8f9fa;
            border: 1px solid #dee2e6;
            border-radius: 5px;
            padding: 15px;
            margin-bottom: 15px;
        }
        .score-value {
            font-size: 2.5em;
            font-weight: bold;
            color: #4361ee;
        }
        .grade-badge {
            display: inline-block;
            padding: 5px 15px;
            border-radius: 20px;
            color: white;
            font-weight: bold;
            margin-left: 10px;
        }
        .grade-A { background: #198754; }
        .grade-B { background: #0dcaf0; }
        .grade-C { background: #ffc107; }
        .grade-D { background: #fd7e14; }
        .grade-F { background: #dc3545; }
        .risk-low { color: #198754; }
        .risk-medium { color: #ffc107; }
        .risk-high { color: #dc3545; }
        .risk-critical { color: #6c757d; }
        .table {
            width: 100%;
            border-collapse: collapse;
            margin: 15px 0;
        }
        .table th, .table td {
            border: 1px solid #dee2e6;
            padding: 10px;
            text-align: left;
        }
        .table th {
            background: #f8f9fa;
            font-weight: bold;
        }
        .swot-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 20px;
        }
        .swot-box {
            padding: 15px;
            border-radius: 5px;
        }
        .strengths { background: #d4edda; border: 1px solid #c3e6cb; }
        .weaknesses { background: #f8d7da; border: 1px solid #f5c6cb; }
        .opportunities { background: #d1ecf1; border: 1px solid #bee5eb; }
        .threats { background: #fff3cd; border: 1px solid #ffeaa7; }
        .timeline-item {
            border-left: 3px solid #4361ee;
            padding-left: 20px;
            margin-bottom: 20px;
            position: relative;
        }
        .timeline-item:before {
            content: '';
            position: absolute;
            left: -8px;
            top: 0;
            width: 14px;
            height: 14px;
            background: #4361ee;
            border-radius: 50%;
        }
        .priority-high { border-left-color: #dc3545; }
        .priority-medium { border-left-color: #ffc107; }
        .priority-low { border-left-color: #198754; }
        .footer {
            text-align: center;
            margin-top: 50px;
            padding-top: 20px;
            border-top: 1px solid #dee2e6;
            color: #666;
            font-size: 0.9em;
        }
        @media print {
            body { padding: 0; }
            .no-print { display: none; }
            .page-break { page-break-before: always; }
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>${report.metadata.title}</h1>
        <div class="subtitle">
            Generated on ${report.metadata.date} | ${report.metadata.generatedBy}
        </div>
    </div>

    <!-- Executive Summary -->
    <div class="section">
        <h2 class="section-title">Executive Summary</h2>
        <div class="score-card">
            <div style="display: flex; align-items: center; justify-content: space-between;">
                <div>
                    <div class="score-value">${report.scores.overall.toFixed(1)}</div>
                    <div>Overall Performance Score</div>
                </div>
                <div>
                    <span class="grade-badge grade-${report.scores.grade}">
                        Grade: ${report.scores.grade}
                    </span>
                    <br><br>
                    <span class="risk-${report.scores.risk.toLowerCase()}">
                        Risk Level: ${report.scores.risk}
                    </span>
                </div>
                <div>
                    Confidence: ${report.scores.confidence.toFixed(1)}%<br>
                    Student: ${report.studentInfo.name}
                </div>
            </div>
        </div>
        
        <p>
            This report provides a comprehensive analysis of ${report.studentInfo.name}'s 
            academic performance based on predictive modeling. The student shows 
            ${report.scores.overall >= 80 ? 'strong' : report.scores.overall >= 60 ? 'moderate' : 'areas for improvement in'} 
            performance potential with a ${report.scores.risk.toLowerCase()} risk level.
        </p>
    </div>

    <!-- Student Information -->
    <div class="section">
        <h2 class="section-title">Student Information</h2>
        <table class="table">
            <tr>
                <th>Name</th><td>${report.studentInfo.name}</td>
                <th>Gender</th><td>${report.studentInfo.gender}</td>
            </tr>
            <tr>
                <th>Nationality</th><td>${report.studentInfo.nationality}</td>
                <th>Age</th><td>${report.studentInfo.age}</td>
            </tr>
        </table>
    </div>

    <!-- Academic Performance -->
    <div class="section">
        <h2 class="section-title">Academic Performance Analysis</h2>
        <table class="table">
            <tr>
                <th>Subject</th><th>Grade</th><th>Assessment</th>
            </tr>
            <tr>
                <td>English</td><td>${report.studentInfo.grades.english}</td>
                <td>${report.studentInfo.grades.english >= 3.5 ? 'Strong' : report.studentInfo.grades.english >= 3.0 ? 'Satisfactory' : 'Needs Improvement'}</td>
            </tr>
            <tr>
                <td>Mathematics</td><td>${report.studentInfo.grades.math}</td>
                <td>${report.studentInfo.grades.math >= 3.5 ? 'Strong' : report.studentInfo.grades.math >= 3.0 ? 'Satisfactory' : 'Needs Improvement'}</td>
            </tr>
            <tr>
                <td>Sciences</td><td>${report.studentInfo.grades.science}</td>
                <td>${report.studentInfo.grades.science >= 3.5 ? 'Strong' : report.studentInfo.grades.science >= 3.0 ? 'Satisfactory' : 'Needs Improvement'}</td>
            </tr>
            <tr>
                <td>Language</td><td>${report.studentInfo.grades.language}</td>
                <td>${report.studentInfo.grades.language >= 3.5 ? 'Strong' : report.studentInfo.grades.language >= 3.0 ? 'Satisfactory' : 'Needs Improvement'}</td>
            </tr>
        </table>
    </div>

    <div class="section">
        <h2 class="section-title">SWOT Analysis</h2>
        <div class="swot-grid">
            <div class="swot-box strengths">
                <h3>Strengths</h3>
                <ul>
                    ${report.analysis.strengths.map(s => `<li>${s}</li>`).join('')}
                </ul>
            </div>
            <div class="swot-box weaknesses">
                <h3>Weaknesses</h3>
                <ul>
                    ${report.analysis.weaknesses.map(w => `<li>${w}</li>`).join('')}
                </ul>
            </div>
            <div class="swot-box opportunities">
                <h3>Opportunities</h3>
                <ul>
                    ${report.analysis.opportunities.map(o => `<li>${o}</li>`).join('')}
                </ul>
            </div>
            <div class="swot-box threats">
                <h3>Threats</h3>
                <ul>
                    ${report.analysis.threats.map(t => `<li>${t}</li>`).join('')}
                </ul>
            </div>
        </div>
    </div>

    <div class="section">
        <h2 class="section-title">Recommended Interventions</h2>
        
        <h3>High Priority Actions</h3>
        ${report.recommendations.highPriority.map(rec => `
            <div class="timeline-item priority-high">
                <h4>${rec.title}</h4>
                <p>${rec.description}</p>
                <p><strong>Duration:</strong> ${rec.duration}</p>
                <p><strong>Resources:</strong> ${rec.resources.join(', ')}</p>
            </div>
        `).join('')}

        ${report.recommendations.mediumPriority.length > 0 ? `
            <h3>Medium Priority Actions</h3>
            ${report.recommendations.mediumPriority.map(rec => `
                <div class="timeline-item priority-medium">
                    <h4>${rec.title}</h4>
                    <p>${rec.description}</p>
                    <p><strong>Duration:</strong> ${rec.duration}</p>
                </div>
            `).join('')}
        ` : ''}

        ${report.recommendations.lowPriority.length > 0 ? `
            <h3>Low Priority Actions</h3>
            ${report.recommendations.lowPriority.map(rec => `
                <div class="timeline-item priority-low">
                    <h4>${rec.title}</h4>
                    <p>${rec.description}</p>
                    <p><strong>Duration:</strong> ${rec.duration}</p>
                </div>
            `).join('')}
        ` : ''}
    </div>

    <div class="section">
        <h2 class="section-title">Action Plan Timeline</h2>
        ${report.recommendations.timeline.map((item, index) => `
            <div class="timeline-item priority-${item.priority === 1 ? 'high' : item.priority === 2 ? 'medium' : 'low'}">
                <h4>Week ${index + 1}: ${item.intervention}</h4>
                <p><strong>Start Date:</strong> ${item.startDate}</p>
                <p><strong>Duration:</strong> ${item.duration}</p>
                <p><strong>Key Tasks:</strong></p>
                <ul>
                    ${item.tasks.map(task => `<li>${task}</li>`).join('')}
                </ul>
            </div>
        `).join('')}
    </div>

    <div class="section">
        <h2 class="section-title">Prediction Model Information</h2>
        <p><strong>Models Used:</strong> ${report.modelInfo.predictionModels.join(', ')}</p>
        <p><strong>Prediction Date:</strong> ${new Date(report.modelInfo.predictionDate).toLocaleString()}</p>
        <p><strong>Report ID:</strong> STUD-REP-${Date.now()}</p>
    </div>

    <div class="footer">
        <p>This report was generated using AI-powered predictive analytics.</p>
        <p>For questions or additional analysis, contact the academic support team.</p>
        <p class="no-print">© ${new Date().getFullYear()} Student Performance Prediction System</p>
    </div>
</body>
</html>`;
}

function downloadAsHTML(htmlContent, studentData) {
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Student_Report_${studentData.name || 'Student'}_${Date.now()}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showReportPreview(htmlContent);
}

function showReportPreview(htmlContent) {
    const modalHTML = `
        <div class="modal fade" id="reportPreviewModal" tabindex="-1" style="z-index: 1060;">
            <div class="modal-dialog modal-xl">
                <div class="modal-content">
                    <div class="modal-header bg-primary text-white">
                        <h5 class="modal-title">
                            <i class="bi bi-file-earmark-text"></i> Report Preview
                        </h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body p-0">
                        <iframe id="reportFrame" style="width: 100%; height: 70vh; border: none;"></iframe>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                        <button type="button" class="btn btn-primary" onclick="printReport()">
                            <i class="bi bi-printer"></i> Print Report
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    const modal = new bootstrap.Modal(document.getElementById('reportPreviewModal'));
    modal.show();
    
    const iframe = document.getElementById('reportFrame');
    iframe.onload = function() {
        iframe.contentWindow.document.open();
        iframe.contentWindow.document.write(htmlContent);
        iframe.contentWindow.document.close();
    };
    iframe.src = 'about:blank';
    
    document.getElementById('reportPreviewModal').addEventListener('hidden.bs.modal', function() {
        this.remove();
    });
}

function printReport() {
    const iframe = document.getElementById('reportFrame');
    if (iframe && iframe.contentWindow) {
        iframe.contentWindow.print();
    }
}