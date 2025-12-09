let interventions = [];
let students = [];

document.addEventListener('DOMContentLoaded', function() {
    console.log("Interventions page loaded");
    function setupEventListeners() {
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            searchInterventions(this.value);
        });
    }
    
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            filterInterventions(this.dataset.filter);
        });
    });
    
    const generateBtn = document.getElementById('generateBtn');
    if (generateBtn) {
        generateBtn.addEventListener('click', generateAIIntervention);
    }
    
    const createForm = document.getElementById('createInterventionForm');
    if (createForm) {
        createForm.addEventListener('submit', handleCreateIntervention);
    }
    
    loadTemplates();
}

    loadInterventions();
    loadStudents();
    setupEventListeners();
});

function setupEventListeners() {
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            searchInterventions(this.value);
        });
    }
    
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            filterInterventions(this.dataset.filter);
        });
    });
    
    const generateBtn = document.getElementById('generateBtn');
    if (generateBtn) {
        generateBtn.addEventListener('click', generateAIIntervention);
    }
    
    const createForm = document.getElementById('createInterventionForm');
    if (createForm) {
        createForm.addEventListener('submit', handleCreateIntervention);
    }
}

async function loadInterventions() {
    try {
        console.log("Loading interventions...");
        showLoading(true);
        
        const response = await fetch('/api/interventions');
        const data = await response.json();
        
        if (data.success) {
            interventions = data.interventions || [];
            console.log(`Loaded ${interventions.length} interventions`);
            displayInterventions(interventions);
            updateStats();
        } else {
            console.warn("No interventions found, loading demo data");
            loadDemoInterventions();
        }
        
        showLoading(false);
        
    } catch (error) {
        console.error('Interventions error:', error);
        showError('Failed to load interventions. Using demo data.');
        loadDemoInterventions();
        showLoading(false);
    }
}

function displayInterventions(interventionList) {
    const container = document.getElementById('interventionsContainer');
    if (!container) return;
    
    if (!interventionList || interventionList.length === 0) {
        container.innerHTML = `
            <div class="text-center py-5">
                <div class="mb-4">
                    <i class="bi bi-inbox display-1 text-muted"></i>
                </div>
                <h4 class="mb-3">No interventions found</h4>
                <p class="text-muted mb-4">Create your first intervention to help students succeed</p>
                <button class="btn btn-primary btn-lg" onclick="showCreateModal()">
                    <i class="bi bi-plus-circle"></i> Create First Intervention
                </button>
            </div>
        `;
        if (intervention.template_id) {
            html += `
                <span class="badge bg-light text-dark ms-2">
                    <i class="bi bi-file-earmark-text me-1"></i>Template
                </span>
            `;
}
        return;
    }


async function createQuickInterventionFromTemplate(templateId, studentId) {
    const templates = {
        1: {
            type: 'academic_support',
            title: 'Academic Tutoring Program',
            description: 'Weekly tutoring sessions for weak subjects',
            priority: 1,
            resources: ['Tutor matching', 'Study materials', 'Progress tracking', 'Parent reports']
        },
    };
    
    const template = templates[templateId];
    if (!template) return false;
    
    const student = students.find(s => s.id == studentId);
    if (!student) return false;
    
    const interventionData = {
        student_id: studentId,
        student_name: student.name,
        type: template.type,
        title: `${template.title} - ${student.name}`,
        description: template.description,
        priority: template.priority,
        status: 'pending',
        resources: template.resources
    };
    
    try {
        const response = await fetch('/api/interventions/create', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(interventionData)
        });
        
        const result = await response.json();
        return result.success;
    } catch (error) {
        console.error('Error creating intervention:', error);
        return false;
    }
}
    
    let html = '';
    
    interventionList.forEach(intervention => {
        const priorityClass = getPriorityClass(intervention.priority);
        const statusClass = getStatusClass(intervention.status);
        
        let resources = [];
        try {
            if (typeof intervention.resources === 'string') {
                resources = JSON.parse(intervention.resources);
            } else if (Array.isArray(intervention.resources)) {
                resources = intervention.resources;
            }
        } catch (e) {
            resources = ['No resources specified'];
        }
        
        html += `
            <div class="card mb-4 intervention-card ${priorityClass}">
                <div class="card-body">
                    <div class="d-flex justify-content-between align-items-start mb-3">
                        <div>
                            <div class="d-flex align-items-center mb-2">
                                <span class="badge ${statusClass} me-2">${intervention.status || 'Pending'}</span>
                                <span class="badge bg-${priorityClass}">Priority ${intervention.priority || 3}</span>
                            </div>
                            <h5 class="card-title mb-2">${intervention.title || 'Untitled Intervention'}</h5>
                            <p class="card-text text-muted mb-3">${intervention.description || 'No description provided'}</p>
                        </div>
                        
                        <div class="dropdown">
                            <button class="btn btn-sm btn-outline-secondary dropdown-toggle" 
                                    type="button" 
                                    data-bs-toggle="dropdown">
                                <i class="bi bi-three-dots"></i>
                            </button>
                            <ul class="dropdown-menu">
                                <li><a class="dropdown-item" href="#" onclick="editIntervention(${intervention.id})">
                                    <i class="bi bi-pencil"></i> Edit
                                </a></li>
                                <li><a class="dropdown-item" href="#" onclick="updateStatus(${intervention.id}, 'completed')">
                                    <i class="bi bi-check-circle"></i> Mark Complete
                                </a></li>
                                <li><hr class="dropdown-divider"></li>
                                <li><a class="dropdown-item text-danger" href="#" onclick="deleteIntervention(${intervention.id})">
                                    <i class="bi bi-trash"></i> Delete
                                </a></li>
                            </ul>
                        </div>
                    </div>
                    
                    <div class="row mb-3">
                        <div class="col-md-6">
                            <div class="mb-2">
                                <small class="text-muted">Student</small>
                                <div class="fw-bold">${intervention.student_name || 'Not assigned'}</div>
                            </div>
                        </div>
                        <div class="col-md-6">
                            <div class="mb-2">
                                <small class="text-muted">Type</small>
                                <div>
                                    <span class="badge bg-info">
                                        ${(intervention.intervention_type || 'general').replace('_', ' ')}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="mb-3">
                        <small class="text-muted">Resources</small>
                        <div class="d-flex flex-wrap gap-1 mt-1">
                            ${resources.map(resource => 
                                `<span class="badge bg-light text-dark">${resource}</span>`
                            ).join('')}
                        </div>
                    </div>
                    
                    <div class="d-flex justify-content-between align-items-center">
                        <small class="text-muted">
                            <i class="bi bi-calendar"></i> Created: ${formatDate(intervention.created_at)}
                        </small>
                        <button class="btn btn-sm btn-outline-primary" onclick="viewDetails(${intervention.id})">
                            View Details
                        </button>
                    </div>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

async function loadStudents() {
    try {
        const response = await fetch('/api/students');
        const data = await response.json();
        
        if (data.success) {
            students = data.students || [];
            populateStudentSelect();
        }
    } catch (error) {
        console.error('Students load error:', error);
        // Load demo students
        students = [
            {id: 1, name: 'John Smith', predicted_score: 85.5},
            {id: 2, name: 'Maria Garcia', predicted_score: 92.3},
            {id: 3, name: 'David Chen', predicted_score: 67.8}
        ];
        populateStudentSelect();
    }
}

function populateStudentSelect() {
    const select = document.getElementById('studentSelect');
    if (!select) return;
    
    select.innerHTML = '<option value="">Select a student...</option>';
    
    students.forEach(student => {
        const option = document.createElement('option');
        option.value = student.id;
        option.textContent = `${student.name} (Score: ${student.predicted_score || 'N/A'})`;
        select.appendChild(option);
    });
}

function showCreateModal() {
    const modalHTML = `
        <div class="modal fade" id="createModal" tabindex="-1">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Create New Intervention</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <form id="createInterventionForm">
                            <div class="row">
                                <div class="col-md-6 mb-3">
                                    <label class="form-label">Student</label>
                                    <select class="form-select" id="modalStudentSelect" required>
                                        <option value="">Select a student...</option>
                                        ${students.map(s => 
                                            `<option value="${s.id}">${s.name}</option>`
                                        ).join('')}
                                    </select>
                                </div>
                                <div class="col-md-6 mb-3">
                                    <label class="form-label">Type</label>
                                    <select class="form-select" name="type" required>
                                        <option value="academic_support">Academic Support</option>
                                        <option value="attendance_monitoring">Attendance Monitoring</option>
                                        <option value="extracurricular_guidance">Extracurricular Guidance</option>
                                        <option value="application_workshop">Application Workshop</option>
                                        <option value="behavioral_support">Behavioral Support</option>
                                    </select>
                                </div>
                            </div>
                            
                            <div class="mb-3">
                                <label class="form-label">Title</label>
                                <input type="text" class="form-control" name="title" required 
                                       placeholder="e.g., Math Tutoring Program">
                            </div>
                            
                            <div class="mb-3">
                                <label class="form-label">Description</label>
                                <textarea class="form-control" name="description" rows="3" required
                                          placeholder="Describe the intervention..."></textarea>
                            </div>
                            
                            <div class="row">
                                <div class="col-md-6 mb-3">
                                    <label class="form-label">Priority</label>
                                    <select class="form-select" name="priority" required>
                                        <option value="1">High (Immediate Action)</option>
                                        <option value="2">Medium (Within 2 Weeks)</option>
                                        <option value="3">Low (Long-term)</option>
                                    </select>
                                </div>
                                <div class="col-md-6 mb-3">
                                    <label class="form-label">Status</label>
                                    <select class="form-select" name="status" required>
                                        <option value="pending">Pending</option>
                                        <option value="active">Active</option>
                                        <option value="completed">Completed</option>
                                    </select>
                                </div>
                            </div>
                            
                            <div class="mb-3">
                                <label class="form-label">Resources (one per line)</label>
                                <textarea class="form-control" name="resources" rows="3"
                                          placeholder="Tutor matching\nStudy materials\nProgress tracking"></textarea>
                                <div class="form-text">Enter each resource on a new line</div>
                            </div>
                            
                            <div class="modal-footer">
                                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                                <button type="submit" class="btn btn-primary">Create Intervention</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    const modal = new bootstrap.Modal(document.getElementById('createModal'));
    modal.show();
    
    document.getElementById('createModal').addEventListener('hidden.bs.modal', function() {
        this.remove();
    });
}

async function handleCreateIntervention(event) {
    event.preventDefault();
    
    const form = event.target;
    const formData = new FormData(form);
    const data = Object.fromEntries(formData);
    
    data.resources = data.resources.split('\n')
        .map(r => r.trim())
        .filter(r => r.length > 0);
    
    const studentSelect = document.getElementById('modalStudentSelect');
    const studentId = studentSelect.value;
    const student = students.find(s => s.id == studentId);
    data.student_name = student ? student.name : 'Unknown';
    data.student_id = studentId;
    
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Creating...';
    submitBtn.disabled = true;
    
    try {
        const response = await fetch('/api/interventions/create', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(data)
        });
        
        const result = await response.json();
        
        if (result.success) {
            showSuccess('Intervention created successfully!');
            
            const modal = bootstrap.Modal.getInstance(document.getElementById('createModal'));
            modal.hide();
            
            loadInterventions();
        } else {
            showError(result.error || 'Failed to create intervention');
        }
    } catch (error) {
        showError('Network error: ' + error.message);
    } finally {
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
}

async function generateAIIntervention() {
    const studentSelect = document.getElementById('studentSelect');
    const focusSelect = document.getElementById('focusArea');
    const prioritySelect = document.getElementById('priorityLevel');
    
    const studentId = studentSelect.value;
    const focusArea = focusSelect.value;
    
    if (!studentId) {
        showError('Please select a student first');
        return;
    }
    
    const generateBtn = document.getElementById('generateBtn');
    const originalText = generateBtn.innerHTML;
    generateBtn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Generating...';
    generateBtn.disabled = true;
    
    try {
        const response = await fetch('/api/interventions/ai-generate', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                student_id: studentId,
                focus_area: focusArea
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            showGeneratedIntervention(result.intervention, studentId);
        } else {
            showFallbackIntervention(studentId, focusArea);
        }
    } catch (error) {
        console.error('AI generation error:', error);
        showFallbackIntervention(studentId, focusArea);
    } finally {
        generateBtn.innerHTML = originalText;
        generateBtn.disabled = false;
    }
}

function showGeneratedIntervention(intervention, studentId) {
    const student = students.find(s => s.id == studentId);
    const studentName = student ? student.name : 'Selected Student';
    
    const modalHTML = `
        <div class="modal fade" id="generatedModal" tabindex="-1">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header bg-info text-white">
                        <h5 class="modal-title">
                            <i class="bi bi-robot"></i> AI-Generated Intervention
                        </h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div class="alert alert-info">
                            <i class="bi bi-lightbulb"></i>
                            AI has generated a personalized intervention for <strong>${studentName}</strong>
                        </div>
                        
                        <div class="card mb-4">
                            <div class="card-body">
                                <h5 class="card-title">${intervention.title}</h5>
                                <p class="card-text">${intervention.description}</p>
                                
                                <div class="row mb-3">
                                    <div class="col-md-6">
                                        <strong>Type:</strong>
                                        <span class="badge bg-info ms-2">
                                            ${intervention.type.replace('_', ' ')}
                                        </span>
                                    </div>
                                    <div class="col-md-6">
                                        <strong>Priority:</strong>
                                        <span class="badge bg-${getPriorityClass(intervention.priority)} ms-2">
                                            Level ${intervention.priority}
                                        </span>
                                    </div>
                                </div>
                                
                                <h6>Resources:</h6>
                                <div class="d-flex flex-wrap gap-2 mb-3">
                                    ${intervention.resources.map(resource => 
                                        `<span class="badge bg-light text-dark">${resource}</span>`
                                    ).join('')}
                                </div>
                                
                                <div class="alert alert-light">
                                    <h6><i class="bi bi-lightning"></i> Implementation Steps:</h6>
                                    <ol class="mb-0">
                                        <li>Schedule initial assessment meeting</li>
                                        <li>Assign resources and set timeline</li>
                                        <li>Monitor progress weekly</li>
                                        <li>Adjust plan based on student response</li>
                                    </ol>
                                </div>
                            </div>
                        </div>
                        
                        <div class="d-grid gap-2">
                            <button class="btn btn-success" onclick="saveGeneratedIntervention(${studentId}, '${intervention.type}', '${intervention.title}', '${intervention.description}', ${intervention.priority})">
                                <i class="bi bi-save"></i> Save This Intervention
                            </button>
                            <button class="btn btn-outline-secondary" onclick="generateAIIntervention()">
                                <i class="bi bi-arrow-repeat"></i> Generate Another
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    const modal = new bootstrap.Modal(document.getElementById('generatedModal'));
    modal.show();
    
    document.getElementById('generatedModal').addEventListener('hidden.bs.modal', function() {
        this.remove();
    });
}

async function saveGeneratedIntervention(studentId, type, title, description, priority) {
    const student = students.find(s => s.id == studentId);
    
    const interventionData = {
        student_id: studentId,
        student_name: student ? student.name : 'Unknown',
        type: type,
        title: title,
        description: description,
        priority: priority,
        status: 'pending',
        resources: ['AI-generated resources', 'Customizable plan']
    };
    
    try {
        const response = await fetch('/api/interventions/create', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(interventionData)
        });
        
        const result = await response.json();
        
        if (result.success) {
            showSuccess('Intervention saved successfully!');
            
            const modal = bootstrap.Modal.getInstance(document.getElementById('generatedModal'));
            if (modal) modal.hide();
            
            loadInterventions();
        } else {
            showError('Failed to save intervention');
        }
    } catch (error) {
        showError('Network error: ' + error.message);
    }
}

function showFallbackIntervention(studentId, focusArea) {
    const student = students.find(s => s.id == studentId);
    const studentName = student ? student.name : 'Selected Student';
    
    const templates = {
        academic: {
            title: `Academic Excellence Program for ${studentName}`,
            description: 'Personalized academic support focusing on weak subjects identified in performance analysis.',
            type: 'academic_support',
            priority: 1,
            resources: ['Weekly tutoring sessions', 'Customized study materials', 'Progress assessments']
        },
        attendance: {
            title: `Attendance Improvement Plan for ${studentName}`,
            description: 'Structured program to improve attendance and punctuality through monitoring and incentives.',
            type: 'attendance_monitoring',
            priority: 1,
            resources: ['Daily check-in system', 'Parent notification system', 'Attendance rewards']
        }
    };
    
    const template = templates[focusArea] || templates.academic;
    showGeneratedIntervention(template, studentId);
}

async function deleteIntervention(interventionId) {
    if (!confirm('Are you sure you want to delete this intervention?')) {
        return;
    }
    
    try {
        const response = await fetch(`/api/interventions/${interventionId}`, {
            method: 'DELETE'
        });
        
        const result = await response.json();
        
        if (result.success) {
            showSuccess('Intervention deleted successfully');
            loadInterventions(); 
        } else {
            showError('Failed to delete intervention');
        }
    } catch (error) {
        showError('Network error: ' + error.message);
    }
}

async function updateStatus(interventionId, status) {
    try {
        const response = await fetch(`/api/interventions/${interventionId}/status`, {
            method: 'PUT',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({status: status})
        });
        
        const result = await response.json();
        
        if (result.success) {
            showSuccess(`Intervention marked as ${status}`);
            loadInterventions();
        } else {
            showError('Failed to update status');
        }
    } catch (error) {
        showError('Network error: ' + error.message);
    }
}

function searchInterventions(query) {
    if (!query.trim()) {
        displayInterventions(interventions);
        return;
    }
    
    const searchLower = query.toLowerCase();
    const filtered = interventions.filter(intervention => {
        return (
            (intervention.title && intervention.title.toLowerCase().includes(searchLower)) ||
            (intervention.description && intervention.description.toLowerCase().includes(searchLower)) ||
            (intervention.student_name && intervention.student_name.toLowerCase().includes(searchLower)) ||
            (intervention.intervention_type && intervention.intervention_type.toLowerCase().includes(searchLower))
        );
    });
    
    displayInterventions(filtered);
}

function filterInterventions(filterType) {
    let filtered = interventions;
    
    switch(filterType) {
        case 'high':
            filtered = interventions.filter(i => i.priority === 1);
            break;
        case 'active':
            filtered = interventions.filter(i => i.status === 'active');
            break;
        case 'completed':
            filtered = interventions.filter(i => i.status === 'completed');
            break;
        case 'pending':
            filtered = interventions.filter(i => i.status === 'pending');
            break;
        case 'template-1':
            filtered = interventions.filter(i => i.template_id === 1);
            break;
        case 'template-2':
            filtered = interventions.filter(i => i.template_id === 2);
            break;
        default:
            filtered = interventions;
    }
    
    displayInterventions(filtered);
    
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.filter === filterType) {
            btn.classList.add('active');
        }
    });
}

function updateStats() {
    if (!interventions || interventions.length === 0) {
        document.getElementById('activeInterventions').textContent = '0';
        document.getElementById('completedInterventions').textContent = '0';
        document.getElementById('successRate').textContent = '0%';
        document.getElementById('studentsImpacted').textContent = '0';
        document.getElementById('templateUsage').textContent = '0%';
        return;
    }
    
    const active = interventions.filter(i => i.status === 'active').length;
    const completed = interventions.filter(i => i.status === 'completed').length;
    const total = interventions.length;
    const templateBased = interventions.filter(i => i.template_id).length;
    
    const successRate = total > 0 ? Math.round((completed / total) * 100) : 0;
    const uniqueStudents = new Set(interventions.map(i => i.student_id)).size;
    const templateUsage = total > 0 ? Math.round((templateBased / total) * 100) : 0;
    
    document.getElementById('activeInterventions').textContent = active;
    document.getElementById('completedInterventions').textContent = completed;
    document.getElementById('successRate').textContent = `${successRate}%`;
    document.getElementById('studentsImpacted').textContent = uniqueStudents;
    
    const templateUsageEl = document.getElementById('templateUsage');
    if (templateUsageEl) {
        templateUsageEl.textContent = `${templateUsage}%`;
    }
}

function getPriorityClass(priority) {
    switch(parseInt(priority)) {
        case 1: return 'high-priority';
        case 2: return 'medium-priority';
        case 3: return 'low-priority';
        default: return '';
    }
}

function getStatusClass(status) {
    switch(status?.toLowerCase()) {
        case 'active': return 'bg-primary';
        case 'completed': return 'bg-success';
        case 'pending': return 'bg-warning';
        default: return 'bg-secondary';
    }
}

function formatDate(dateString) {
    if (!dateString) return 'Unknown date';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    });
}

function showLoading(show) {
    const loading = document.getElementById('interventionsLoading');
    const content = document.getElementById('interventionsContent');
    
    if (loading && content) {
        loading.classList.toggle('d-none', !show);

        content.classList.toggle('d-none', show);
    }
}

function showSuccess(message) {
    const alertDiv = document.createElement('div');
    alertDiv.className = 'alert alert-success alert-dismissible fade show position-fixed top-0 start-50 translate-middle-x mt-3 z-3';
    alertDiv.style.minWidth = '300px';
    alertDiv.innerHTML = `
        <i class="bi bi-check-circle me-2"></i>
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    document.body.appendChild(alertDiv);
    
    setTimeout(() => {
        alertDiv.classList.remove('show');
        setTimeout(() => alertDiv.remove(), 150);
    }, 3000);
}

function showError(message) {
    const alertDiv = document.createElement('div');
    alertDiv.className = 'alert alert-danger alert-dismissible fade show position-fixed top-0 start-50 translate-middle-x mt-3 z-3';
    alertDiv.style.minWidth = '300px';
    alertDiv.innerHTML = `
        <i class="bi bi-exclamation-triangle me-2"></i>
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    document.body.appendChild(alertDiv);
    
    setTimeout(() => {
        alertDiv.classList.remove('show');
        setTimeout(() => alertDiv.remove(), 150);
    }, 5000);
}

function editIntervention(interventionId) {
    const intervention = interventions.find(i => i.id == interventionId);
    if (!intervention) {
        showError('Intervention not found');
        return;
    }
    
    const modalHTML = `
        <div class="modal fade" id="editModal" tabindex="-1">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Edit Intervention</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <form id="editInterventionForm">
                            <input type="hidden" name="intervention_id" value="${intervention.id}">
                            
                            <div class="mb-3">
                                <label class="form-label">Title</label>
                                <input type="text" class="form-control" name="title" 
                                       value="${intervention.title || ''}" required>
                            </div>
                            
                            <div class="mb-3">
                                <label class="form-label">Description</label>
                                <textarea class="form-control" name="description" rows="3" required>${intervention.description || ''}</textarea>
                            </div>
                            
                            <div class="row">
                                <div class="col-md-6 mb-3">
                                    <label class="form-label">Priority</label>
                                    <select class="form-select" name="priority" required>
                                        <option value="1" ${intervention.priority == 1 ? 'selected' : ''}>High</option>
                                        <option value="2" ${intervention.priority == 2 ? 'selected' : ''}>Medium</option>
                                        <option value="3" ${intervention.priority == 3 ? 'selected' : ''}>Low</option>
                                    </select>
                                </div>
                                <div class="col-md-6 mb-3">
                                    <label class="form-label">Status</label>
                                    <select class="form-select" name="status" required>
                                        <option value="pending" ${intervention.status == 'pending' ? 'selected' : ''}>Pending</option>
                                        <option value="active" ${intervention.status == 'active' ? 'selected' : ''}>Active</option>
                                        <option value="completed" ${intervention.status == 'completed' ? 'selected' : ''}>Completed</option>
                                    </select>
                                </div>
                            </div>
                            
                            <div class="modal-footer">
                                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                                <button type="submit" class="btn btn-primary">Save Changes</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    const modal = new bootstrap.Modal(document.getElementById('editModal'));
    modal.show();
    
    document.getElementById('editInterventionForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const formData = new FormData(this);
        const data = Object.fromEntries(formData);
        
        try {
            const response = await fetch(`/api/interventions/${data.intervention_id}/status`, {
                method: 'PUT',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    status: data.status,
                    priority: parseInt(data.priority)
                })
            });
            
            const result = await response.json();
            
            if (result.success) {
                showSuccess('Intervention updated successfully');
                modal.hide();
                loadInterventions();
            } else {
                showError(result.error || 'Failed to update');
            }
        } catch (error) {
            showError('Network error: ' + error.message);
        }
    });
    
    document.getElementById('editModal').addEventListener('hidden.bs.modal', function() {
        this.remove();
    });
}

function viewDetails(interventionId) {
    const intervention = interventions.find(i => i.id == interventionId);
    if (!intervention) {
        showError('Intervention not found');
        return;
    }
    
    let resources = [];
    try {
        if (typeof intervention.resources === 'string') {
            resources = JSON.parse(intervention.resources);
        } else if (Array.isArray(intervention.resources)) {
            resources = intervention.resources;
        }
    } catch (e) {
        resources = ['No resources specified'];
    }
    
    const modalHTML = `
        <div class="modal fade" id="detailsModal" tabindex="-1">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header bg-primary text-white">
                        <h5 class="modal-title">Intervention Details</h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div class="mb-4">
                            <h4>${intervention.title || 'Untitled Intervention'}</h4>
                            <p class="text-muted">${intervention.description || 'No description'}</p>
                        </div>
                        
                        <div class="row mb-4">
                            <div class="col-md-6">
                                <div class="card">
                                    <div class="card-body">
                                        <h6 class="card-title">Student Information</h6>
                                        <p class="mb-1"><strong>Name:</strong> ${intervention.student_name || 'Not assigned'}</p>
                                        <p class="mb-0"><strong>ID:</strong> ${intervention.student_id || 'N/A'}</p>
                                    </div>
                                </div>
                            </div>
                            <div class="col-md-6">
                                <div class="card">
                                    <div class="card-body">
                                        <h6 class="card-title">Intervention Details</h6>
                                        <p class="mb-1"><strong>Type:</strong> ${(intervention.intervention_type || 'general').replace('_', ' ')}</p>
                                        <p class="mb-1"><strong>Priority:</strong> 
                                            <span class="badge bg-${getPriorityClass(intervention.priority)}">
                                                ${intervention.priority == 1 ? 'High' : intervention.priority == 2 ? 'Medium' : 'Low'}
                                            </span>
                                        </p>
                                        <p class="mb-0"><strong>Status:</strong> 
                                            <span class="badge ${getStatusClass(intervention.status)}">
                                                ${intervention.status || 'Pending'}
                                            </span>
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="mb-4">
                            <h6>Resources</h6>
                            <div class="d-flex flex-wrap gap-2">
                                ${resources.map(resource => 
                                    `<span class="badge bg-light text-dark p-2">${resource}</span>`
                                ).join('')}
                            </div>
                        </div>
                        
                        <div class="card">
                            <div class="card-body">
                                <h6 class="card-title">Timeline</h6>
                                <p class="mb-1"><strong>Created:</strong> ${formatDate(intervention.created_at)}</p>
                                ${intervention.completed_at ? 
                                    `<p class="mb-1"><strong>Completed:</strong> ${formatDate(intervention.completed_at)}</p>` : 
                                    '<p class="text-warning"><i class="bi bi-clock"></i> Intervention is still in progress</p>'
                                }
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                        <button type="button" class="btn btn-primary" onclick="editIntervention(${intervention.id})">
                            <i class="bi bi-pencil"></i> Edit
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    const modal = new bootstrap.Modal(document.getElementById('detailsModal'));
    modal.show();
    
    document.getElementById('detailsModal').addEventListener('hidden.bs.modal', function() {
        this.remove();
    });
}

function loadDemoInterventions() {
    console.log("Loading demo interventions...");
    
    interventions = [
        {
            id: 1,
            student_id: 1,
            student_name: 'John Smith',
            intervention_type: 'academic_support',
            title: 'Mathematics Improvement Program (Template-based)',
            description: 'Based on Academic Tutoring Program template. Weekly algebra tutoring sessions to improve math performance.',
            priority: 2,
            status: 'active',
            resources: JSON.stringify(['Math tutor', 'Algebra workbook', 'Online practice platform', 'Weekly assessments']),
            created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
            completed_at: null,
            template_id: 1
        },
    ];
    
    displayInterventions(interventions);
    updateStats();
    showError('Using demo data. The database might not be properly initialized.');
}

function loadTemplates() {
    const templates = [
        {
            id: 1,
            title: "Academic Tutoring Program",
            description: "Weekly tutoring sessions for weak subjects",
            type: "academic_support",
            priority: 1,
            duration: "8 weeks",
            resources: ["Tutor matching", "Study materials", "Progress tracking", "Parent reports"]
        },
        {
            id: 2,
            title: "Attendance Improvement Plan",
            description: "Daily monitoring and parent notifications",
            type: "attendance_monitoring",
            priority: 1,
            duration: "12 weeks",
            resources: ["Check-in system", "Parent portal", "Incentive program", "Weekly meetings"]
        },
        {
            id: 3,
            title: "Extracurricular Development",
            description: "Guidance on building meaningful activities",
            type: "extracurricular_guidance",
            priority: 3,
            duration: "Ongoing",
            resources: ["Club recommendations", "Leadership training", "Community service", "Skill workshops"]
        },
        {
            id: 4,
            title: "Application Enhancement",
            description: "Improve portfolio and recommendation letters",
            type: "application_workshop",
            priority: 2,
            duration: "2 weeks",
            resources: ["Portfolio review", "Writing assistance", "Mock interviews", "Feedback sessions"]
        }
    ];
    
    const container = document.getElementById('templateGallery');
    if (!container) return;
    
    let html = '';
    
    templates.forEach(template => {
        html += `
            <div class="col-md-3 mb-3">
                <div class="card h-100">
                    <div class="card-body">
                        <h6 class="card-title">${template.title}</h6>
                        <p class="card-text small text-muted">${template.description}</p>
                        <div class="mb-2">
                            <span class="badge priority-badge bg-${getPriorityClass(template.priority)}">
                                Priority ${template.priority}
                            </span>
                            <span class="badge priority-badge bg-info">${template.type.replace('_', ' ')}</span>
                        </div>
                        <div class="small mb-3">
                            <strong>Duration:</strong> ${template.duration}
                        </div>
                        <button class="btn btn-sm btn-outline-primary w-100" 
                                onclick="useTemplate(${template.id})">
                            <i class="bi bi-plus-circle"></i> Use Template
                        </button>
                    </div>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

function useTemplate(templateId) {
    const templates = [
        {
            id: 1,
            title: "Academic Tutoring Program",
            description: "Structured weekly tutoring sessions focused on identified weak subjects to improve academic performance.",
            detailedDescription: "This program provides personalized academic support through one-on-one tutoring sessions. Each week, students meet with qualified tutors who help them understand challenging concepts, complete assignments, and prepare for assessments. Progress is tracked through regular assessments and parent-teacher meetings.",
            type: "academic_support",
            priority: 1,
            duration: "8 weeks",
            resources: ["Tutor matching", "Study materials", "Progress tracking", "Parent reports", "Weekly assessments", "Online learning platform"],
            implementationSteps: [
                "Week 1: Initial assessment and goal setting",
                "Week 2-7: Weekly tutoring sessions",
                "Week 4: Mid-program review",
                "Week 8: Final assessment and program evaluation"
            ],
            successMetrics: [
                "Improvement in subject grades",
                "Increased confidence in academic abilities",
                "Better homework completion rates",
                "Positive feedback from teachers"
            ],
            estimatedTime: "2-4 hours per week"
        },
        {
            id: 2,
            title: "Attendance Improvement Plan",
            description: "Comprehensive monitoring system with incentives to improve regular school attendance.",
            detailedDescription: "This intervention uses a multi-faceted approach to address attendance issues. It combines daily check-ins, parental involvement, and positive reinforcement to establish consistent attendance habits. The program includes regular progress reviews and adjustments based on student response.",
            type: "attendance_monitoring",
            priority: 1,
            duration: "12 weeks",
            resources: ["Check-in system", "Parent portal access", "Incentive program", "Weekly progress reports", "Attendance tracker app", "Counselor support"],
            implementationSteps: [
                "Setup: Implement check-in system and parent notifications",
                "Phase 1 (Weeks 1-4): Daily monitoring and feedback",
                "Phase 2 (Weeks 5-8): Positive reinforcement implementation",
                "Phase 3 (Weeks 9-12): Habit consolidation and graduation"
            ],
            successMetrics: [
                "Attendance rate improvement",
                "Reduced tardiness",
                "Parent engagement level",
                "Student satisfaction with the program"
            ],
            estimatedTime: "30 minutes daily monitoring"
        },
        {
            id: 3,
            title: "Extracurricular Development Program",
            description: "Guidance and support for building meaningful extracurricular activities and leadership skills.",
            detailedDescription: "This program helps students discover and engage in extracurricular activities that match their interests and college goals. It includes mentorship, skill-building workshops, and opportunities to take on leadership roles within school clubs and community organizations.",
            type: "extracurricular_guidance",
            priority: 3,
            duration: "Ongoing (recommended 6+ months)",
            resources: ["Club recommendations", "Leadership workshops", "Community service opportunities", "Mentor matching", "Skill-building sessions", "Portfolio development"],
            implementationSteps: [
                "Assessment: Identify student interests and goals",
                "Matching: Connect with relevant clubs/activities",
                "Development: Attend workshops and training",
                "Leadership: Take on increasing responsibilities",
                "Documentation: Build activity portfolio"
            ],
            successMetrics: [
                "Number of meaningful activities joined",
                "Leadership positions held",
                "Skill development progress",
                "College application enhancement"
            ],
            estimatedTime: "3-5 hours per week"
        },
        {
            id: 4,
            title: "Application Enhancement Workshop",
            description: "Comprehensive support for improving college application portfolios and materials.",
            detailedDescription: "This intensive workshop provides hands-on assistance with all aspects of college applications. Students receive personalized feedback on essays, guidance on recommendation letters, portfolio development support, and mock interview practice to prepare them for the competitive application process.",
            type: "application_workshop",
            priority: 2,
            duration: "4 weeks (intensive)",
            resources: ["Essay editing assistance", "Portfolio review sessions", "Mock interview practice", "College list development", "Recommendation letter guidance", "Timeline planning"],
            implementationSteps: [
                "Week 1: Portfolio assessment and goal setting",
                "Week 2: Essay development and editing",
                "Week 3: Interview preparation and practice",
                "Week 4: Final review and submission planning"
            ],
            successMetrics: [
                "Quality of application materials",
                "Interview confidence improvement",
                "Application completion rate",
                "Acceptance rates to target schools"
            ],
            estimatedTime: "5-8 hours per week during workshop"
        },
        {
            id: 5,
            title: "Behavioral Support Program",
            description: "Structured intervention to address behavioral challenges and improve classroom engagement.",
            detailedDescription: "This evidence-based program uses positive behavior support strategies to help students develop appropriate classroom behaviors and social skills. It includes regular check-ins, behavior tracking, and collaboration between teachers, counselors, and parents.",
            type: "behavioral_support",
            priority: 2,
            duration: "10 weeks",
            resources: ["Behavior tracking system", "Counselor sessions", "Teacher collaboration tools", "Parent communication platform", "Social skills training materials", "Progress monitoring forms"],
            implementationSteps: [
                "Assessment: Identify target behaviors and triggers",
                "Planning: Develop individualized behavior plan",
                "Implementation: Daily tracking and feedback",
                "Review: Weekly progress meetings",
                "Adjustment: Modify strategies as needed"
            ],
            successMetrics: [
                "Reduction in disruptive behaviors",
                "Improved classroom participation",
                "Positive teacher feedback",
                "Better peer relationships"
            ],
            estimatedTime: "1-2 hours per week coordination"
        }
    ];

    const template = templates.find(t => t.id === templateId);
    if (!template) {
        showError('Template not found');
        return;
    }

    const modalHTML = `
        <div class="modal fade" id="templateDetailsModal" tabindex="-1">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header bg-primary text-white">
                        <h5 class="modal-title">
                            <i class="bi bi-file-earmark-text"></i> Intervention Template
                        </h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div class="mb-4">
                            <div class="d-flex justify-content-between align-items-start mb-2">
                                <h4>${template.title}</h4>
                                <div>
                                    <span class="badge bg-${getPriorityClass(template.priority)} me-1">
                                        Priority ${template.priority}
                                    </span>
                                    <span class="badge bg-info">
                                        ${template.type.replace('_', ' ')}
                                    </span>
                                </div>
                            </div>
                            <p class="lead">${template.description}</p>
                            <p class="text-muted">${template.detailedDescription}</p>
                        </div>

                        <div class="row mb-4">
                            <div class="col-md-6">
                                <div class="card h-100">
                                    <div class="card-body">
                                        <h6 class="card-title">
                                            <i class="bi bi-calendar-week"></i> Program Details
                                        </h6>
                                        <div class="mb-2">
                                            <strong>Duration:</strong> ${template.duration}
                                        </div>
                                        <div class="mb-2">
                                            <strong>Time Commitment:</strong> ${template.estimatedTime}
                                        </div>
                                        <div>
                                            <strong>Focus Area:</strong> 
                                            <span class="badge bg-light text-dark">${template.type.replace('_', ' ')}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div class="col-md-6">
                                <div class="card h-100">
                                    <div class="card-body">
                                        <h6 class="card-title">
                                            <i class="bi bi-graph-up"></i> Success Metrics
                                        </h6>
                                        <ul class="mb-0">
                                            ${template.successMetrics.map(metric => 
                                                `<li class="mb-1">${metric}</li>`
                                            ).join('')}
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div class="mb-4">
                            <h6><i class="bi bi-list-check"></i> Implementation Steps</h6>
                            <div class="timeline">
                                ${template.implementationSteps.map((step, index) => `
                                    <div class="timeline-item d-flex mb-2">
                                        <div class="timeline-marker bg-primary rounded-circle me-3" style="width: 24px; height: 24px; line-height: 24px; text-align: center;">
                                            ${index + 1}
                                        </div>
                                        <div class="timeline-content">
                                            ${step}
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>

                        <div class="mb-4">
                            <h6><i class="bi bi-tools"></i> Required Resources</h6>
                            <div class="d-flex flex-wrap gap-2">
                                ${template.resources.map(resource => 
                                    `<span class="badge bg-light text-dark p-2">
                                        <i class="bi bi-check-circle text-success me-1"></i>${resource}
                                    </span>`
                                ).join('')}
                            </div>
                        </div>

                        <div class="alert alert-info">
                            <div class="d-flex">
                                <div class="me-3">
                                    <i class="bi bi-lightbulb display-6"></i>
                                </div>
                                <div>
                                    <h6>Best Practices for Implementation</h6>
                                    <ul class="mb-0">
                                        <li>Schedule regular check-ins with the student</li>
                                        <li>Involve parents/guardians in the process</li>
                                        <li>Track progress using the provided metrics</li>
                                        <li>Be flexible and adjust the plan as needed</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
                            <i class="bi bi-x-circle"></i> Close
                        </button>
                        <button type="button" class="btn btn-outline-primary" onclick="applyTemplateToStudent(${templateId})">
                            <i class="bi bi-person-plus"></i> Apply to Student
                        </button>
                        <button type="button" class="btn btn-primary" onclick="createFromTemplate(${templateId})">
                            <i class="bi bi-plus-circle"></i> Create Intervention
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    const modal = new bootstrap.Modal(document.getElementById('templateDetailsModal'));
    modal.show();
    
    document.getElementById('templateDetailsModal').addEventListener('hidden.bs.modal', function() {
        this.remove();
    });
}

async function applyTemplateToStudent(templateId) {
     if (students.length === 0) {
        await loadStudents(); 
    }
    
    if (students.length === 0) {
        showError('No students available. Please add students first.');
  }
    const studentSelectHTML = `
        <div class="modal fade" id="selectStudentModal" tabindex="-1">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Select Student</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <p class="mb-3">Select a student to apply this template to:</p>
                        <select class="form-select" id="templateStudentSelect">
                            <option value="">Choose a student...</option>
                            ${students.map(student => 
                                `<option value="${student.id}">
                                    ${student.name} (Score: ${student.predicted_score || 'N/A'})
                                </option>`
                            ).join('')}
                        </select>
                        <div class="form-text mt-2">
                            The selected student will receive a customized intervention based on this template.
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                        <button type="button" class="btn btn-primary" onclick="confirmApplyTemplate(${templateId})">
                            Apply Template
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', studentSelectHTML);
    
    const modal = new bootstrap.Modal(document.getElementById('selectStudentModal'));
    modal.show();
    
    const templateModal = bootstrap.Modal.getInstance(document.getElementById('templateDetailsModal'));
    if (templateModal) templateModal.hide();
    
    document.getElementById('selectStudentModal').addEventListener('hidden.bs.modal', function() {
        this.remove();
    });
}

async function confirmApplyTemplate(templateId) {
    const studentSelect = document.getElementById('templateStudentSelect');
    const studentId = studentSelect.value;
    
    if (!studentId) {
        showError('Please select a student first');
        return;
    }
    
    const templates = {
        1: {
            type: 'academic_support',
            title: 'Academic Tutoring Program',
            description: 'Weekly tutoring sessions for weak subjects',
            priority: 1,
            resources: ['Tutor matching', 'Study materials', 'Progress tracking', 'Parent reports']
        },
        2: {
            type: 'attendance_monitoring',
            title: 'Attendance Improvement Plan',
            description: 'Daily monitoring and parent notifications',
            priority: 1,
            resources: ['Check-in system', 'Parent portal', 'Incentive program', 'Weekly meetings']
        },
        3: {
            type: 'extracurricular_guidance',
            title: 'Extracurricular Development Program',
            description: 'Guidance on building meaningful activities',
            priority: 3,
            resources: ['Club recommendations', 'Leadership training', 'Community service', 'Skill workshops']
        },
        4: {
            type: 'application_workshop',
            title: 'Application Enhancement Workshop',
            description: 'Improve portfolio and recommendation letters',
            priority: 2,
            resources: ['Portfolio review', 'Writing assistance', 'Mock interviews', 'Feedback sessions']
        },
        5: {
            type: 'behavioral_support',
            title: 'Behavioral Support Program',
            description: 'Address behavioral challenges and improve engagement',
            priority: 2,
            resources: ['Behavior tracking', 'Counselor sessions', 'Teacher collaboration', 'Parent communication']
        }
    };
    
    const template = templates[templateId];
    if (!template) {
        showError('Template not found');
        return;
    }
    
    const student = students.find(s => s.id == studentId);
    const studentName = student ? student.name : 'Selected Student';
    
    const interventionData = {
        student_id: studentId,
        student_name: studentName,
        type: template.type,
        title: `${template.title} - ${studentName}`,
        description: `Customized ${template.description.toLowerCase()} for ${studentName}`,
        priority: template.priority,
        status: 'pending',
        resources: template.resources
    };
    
    try {
        const response = await fetch('/api/interventions/create', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(interventionData)
        });
        
        const result = await response.json();
        
        if (result.success) {
            showSuccess(`Template applied to ${studentName} successfully!`);
            
            const modal = bootstrap.Modal.getInstance(document.getElementById('selectStudentModal'));
            if (modal) modal.hide();
            
            loadInterventions(); 
            
            setTimeout(() => {
                const intervention = result.intervention;
                if (intervention) {
                    showSuccess(`Created intervention: "${intervention.title}"`);
                }
            }, 500);
        } else {
            showError('Failed to apply template');
        }
    } catch (error) {
        showError('Network error: ' + error.message);
    }
}

function createFromTemplate(templateId) {
    const templateModal = bootstrap.Modal.getInstance(document.getElementById('templateDetailsModal'));
    if (templateModal) templateModal.hide();
    
    setTimeout(() => {
        showCreateModal();
        
        setTimeout(() => {
            const templates = {
                1: {
                    title: 'Academic Tutoring Program',
                    description: 'Weekly tutoring sessions for weak subjects',
                    type: 'academic_support',
                    priority: '1',
                    resources: 'Tutor matching\nStudy materials\nProgress tracking\nParent reports'
                },
                2: {
                    title: 'Attendance Improvement Plan',
                    description: 'Daily monitoring and parent notifications',
                    type: 'attendance_monitoring',
                    priority: '1',
                    resources: 'Check-in system\nParent portal\nIncentive program\nWeekly meetings'
                },
                3: {
                    title: 'Extracurricular Development',
                    description: 'Guidance on building meaningful activities',
                    type: 'extracurricular_guidance',
                    priority: '3',
                    resources: 'Club recommendations\nLeadership training\nCommunity service\nSkill workshops'
                },
                4: {
                    title: 'Application Enhancement',
                    description: 'Improve portfolio and recommendation letters',
                    type: 'application_workshop',
                    priority: '2',
                    resources: 'Portfolio review\nWriting assistance\nMock interviews\nFeedback sessions'
                },
                5: {
                    title: 'Behavioral Support Program',
                    description: 'Address behavioral challenges and improve engagement',
                    type: 'behavioral_support',
                    priority: '2',
                    resources: 'Behavior tracking\nCounselor sessions\nTeacher collaboration\nParent communication'
                }
            };
            
            const template = templates[templateId];
            if (template) {
                const modal = document.getElementById('createModal');
                if (modal) {
                    modal.querySelector('input[name="title"]').value = template.title;
                    modal.querySelector('textarea[name="description"]').value = template.description;
                    modal.querySelector('select[name="type"]').value = template.type;
                    modal.querySelector('select[name="priority"]').value = template.priority;
                    modal.querySelector('textarea[name="resources"]').value = template.resources;
                }
            }
        }, 300);
    }, 200);
}

function loadTemplates() {
    const templates = [
        {
            id: 1,
            title: "Academic Tutoring Program",
            description: "Weekly tutoring sessions for weak subjects",
            type: "academic_support",
            priority: 1,
            duration: "8 weeks",
            resources: ["Tutor matching", "Study materials", "Progress tracking", "Parent reports"]
        },
        {
            id: 2,
            title: "Attendance Improvement Plan",
            description: "Daily monitoring and parent notifications",
            type: "attendance_monitoring",
            priority: 1,
            duration: "12 weeks",
            resources: ["Check-in system", "Parent portal", "Incentive program", "Weekly meetings"]
        },
        {
            id: 3,
            title: "Extracurricular Development",
            description: "Guidance on building meaningful activities",
            type: "extracurricular_guidance",
            priority: 3,
            duration: "Ongoing",
            resources: ["Club recommendations", "Leadership training", "Community service", "Skill workshops"]
        },
        {
            id: 4,
            title: "Application Enhancement",
            description: "Improve portfolio and recommendation letters",
            type: "application_workshop",
            priority: 2,
            duration: "2 weeks",
            resources: ["Portfolio review", "Writing assistance", "Mock interviews", "Feedback sessions"]
        },
        {
            id: 5,
            title: "Behavioral Support",
            description: "Address behavioral challenges and engagement",
            type: "behavioral_support",
            priority: 2,
            duration: "10 weeks",
            resources: ["Behavior tracking", "Counselor sessions", "Teacher collaboration", "Parent communication"]
        }
    ];
    
    const container = document.getElementById('templateGallery');
    if (!container) return;
    
    let html = '';
    
    templates.forEach(template => {
        html += `
            <div class="col-md-6 col-lg-4 mb-4">
                <div class="card h-100 template-card border-hover">
                    <div class="card-body">
                        <div class="d-flex justify-content-between align-items-start mb-3">
                            <h6 class="card-title mb-0">${template.title}</h6>
                            <span class="badge bg-${getPriorityClass(template.priority)}">
                                P${template.priority}
                            </span>
                        </div>
                        <p class="card-text small text-muted mb-3">${template.description}</p>
                        
                        <div class="mb-3">
                            <div class="d-flex align-items-center mb-1">
                                <small class="text-muted me-2">Type:</small>
                                <span class="badge bg-info bg-opacity-10 text-info border border-info border-opacity-25">
                                    ${template.type.replace('_', ' ')}
                                </span>
                            </div>
                            <div class="d-flex align-items-center">
                                <small class="text-muted me-2">Duration:</small>
                                <span class="small">${template.duration}</span>
                            </div>
                        </div>
                        
                        <div class="mb-3">
                            <small class="text-muted d-block mb-1">Key Resources:</small>
                            <div class="d-flex flex-wrap gap-1">
                                ${template.resources.slice(0, 3).map(resource => 
                                    `<span class="badge bg-light text-dark small">${resource}</span>`
                                ).join('')}
                                ${template.resources.length > 3 ? 
                                    `<span class="badge bg-light text-dark small">+${template.resources.length - 3} more</span>` : 
                                    ''
                                }
                            </div>
                        </div>
                        
                        <button class="btn btn-sm btn-outline-primary w-100" 
                                onclick="useTemplate(${template.id})">
                            <i class="bi bi-eye me-1"></i> View Details
                        </button>
                    </div>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
    
    const style = document.createElement('style');
    style.textContent = `
        .template-card.border-hover {
            transition: all 0.2s ease;
            border: 1px solid #dee2e6;
        }
        .template-card.border-hover:hover {
            border-color: #0d6efd;
            box-shadow: 0 0.125rem 0.25rem rgba(13, 110, 253, 0.1);
            transform: translateY(-2px);
        }
        .timeline {
            position: relative;
            padding-left: 20px;
        }
        .timeline::before {
            content: '';
            position: absolute;
            left: 7px;
            top: 0;
            bottom: 0;
            width: 2px;
            background-color: #e9ecef;
        }
        .timeline-item {
            position: relative;
        }
        .timeline-marker {
            flex-shrink: 0;
            color: white;
            font-size: 0.875rem;
            font-weight: bold;
        }
    `;
    document.head.appendChild(style);
}
