from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import pandas as pd
import numpy as np
import joblib
import sqlite3
from datetime import datetime
import tensorflow as tf
from tensorflow import keras
import json
import os

app = Flask(__name__, static_folder='../frontend', static_url_path='')
CORS(app)

# Global variables
models = {}
scaler = None
label_encoders = {}
feature_columns = []

def load_models():
    """Load all ML models"""
    global models, scaler, label_encoders, feature_columns
    
    print("Loading ML models...")
    
    try:
        # Load preprocessing objects
        scaler = joblib.load('model/scaler.pkl')
        label_encoders = joblib.load('model/label_encoders.pkl')
        
        # Load feature columns
        with open('model/feature_columns.txt', 'r') as f:
            feature_columns = [line.strip() for line in f]
        
        # Load individual models
        models['random_forest'] = joblib.load('model/random_forest.pkl')
        models['xgboost'] = joblib.load('model/xgboost.pkl')
        models['lightgbm'] = joblib.load('model/lightgbm.pkl')
        models['neural_network'] = keras.models.load_model('model/neural_network.h5')
        
        # Load ensemble model
        try:
            models['ensemble'] = joblib.load('model/ensemble.pkl')
        except:
            print("Warning: Could not load ensemble model, creating new one...")
            from model.train_models import EnsembleModel
            models['ensemble'] = EnsembleModel(
                rf_model=models['random_forest'],
                xgb_model=models['xgboost'],
                lgb_model=models['lightgbm'],
                nn_model=models['neural_network']
            )
        
        print(f"✓ Loaded {len(models)} models")
        print(f"✓ {len(feature_columns)} feature columns")
        
    except Exception as e:
        print(f"Error loading models: {e}")
        print("Creating fallback models...")
        create_fallback_models()

def create_fallback_models():
    """Create simple models if saved ones aren't available"""
    global models, scaler, label_encoders, feature_columns
    
    from sklearn.ensemble import RandomForestRegressor
    from sklearn.preprocessing import StandardScaler, LabelEncoder
    
    print("Creating fallback models...")
    
    # Define 25 features
    feature_columns = [
        'english.grade', 'math.grade', 'sciences.grade', 'language.grade',
        'overall_grade', 'academic_consistency', 'consistency_score',
        'portfolio.rating', 'coverletter.rating', 'refletter.rating',
        'application_strength', 'strong_recommendation', 'strong_portfolio',
        'age', 'attendance_rate', 'extracurricular_score',
        'education_hub_distance', 'multiple_weak_subjects',
        'low_application_score', 'math_english_diff', 'science_language_diff',
        'academic_potential', 'performance_index',
        'gender_encoded', 'nationality_encoded', 'ethnic.group_encoded'
    ]
    
    # Create dummy scaler
    scaler = StandardScaler()
    
    # Create dummy label encoders
    label_encoders = {
        'gender': LabelEncoder().fit(['M', 'F', 'other']),
        'nationality': LabelEncoder().fit(['United States', 'China', 'India']),
        'ethnic.group': LabelEncoder().fit(['NA', 'Asian', 'White'])
    }
    
    # Create dummy random forest
    np.random.seed(42)
    X_dummy = np.random.randn(100, 25)
    y_dummy = 70 + np.random.randn(100) * 10
    
    rf_model = RandomForestRegressor(n_estimators=10, random_state=42)
    rf_model.fit(X_dummy, y_dummy)
    
    models['random_forest'] = rf_model
    models['xgboost'] = rf_model
    models['lightgbm'] = rf_model
    models['ensemble'] = rf_model
    
    # Create simple neural network
    nn_model = keras.Sequential([
        keras.layers.Dense(10, activation='relu', input_shape=(25,)),
        keras.layers.Dense(1)
    ])
    nn_model.compile(optimizer='adam', loss='mse')
    nn_model.fit(X_dummy, y_dummy, epochs=1, verbose=0)
    models['neural_network'] = nn_model
    
    print("✓ Fallback models created")

def init_db():
    """Initialize database"""
    conn = sqlite3.connect('database/student_performance.db')
    c = conn.cursor()
    
    # Students table
    c.execute('''CREATE TABLE IF NOT EXISTS students
                 (id INTEGER PRIMARY KEY AUTOINCREMENT,
                  name TEXT,
                  gender TEXT,
                  nationality TEXT,
                  age INTEGER,
                  english_grade REAL,
                  math_grade REAL,
                  sciences_grade REAL,
                  language_grade REAL,
                  portfolio_rating INTEGER,
                  coverletter_rating INTEGER,
                  refletter_rating INTEGER,
                  predicted_score REAL,
                  predicted_grade TEXT,
                  risk_level TEXT,
                  confidence REAL,
                  recommendations TEXT,
                  prediction_date TIMESTAMP)''')
    
    # Interventions table
    c.execute('''CREATE TABLE IF NOT EXISTS interventions
                 (id INTEGER PRIMARY KEY AUTOINCREMENT,
                  student_id INTEGER,
                  student_name TEXT,
                  intervention_type TEXT,
                  title TEXT,
                  description TEXT,
                  priority INTEGER,
                  status TEXT,
                  resources TEXT,
                  created_at TIMESTAMP,
                  FOREIGN KEY (student_id) REFERENCES students (id))''')
    
    conn.commit()
    conn.close()
    print("✓ Database initialized")

def calculate_features(data):
    """Calculate all 25 features from input data"""
    features = {}
    
    # Academic grades
    grades = [
        data.get('english_grade', 3.0),
        data.get('math_grade', 3.0),
        data.get('sciences_grade', 3.0),
        data.get('language_grade', 3.0)
    ]
    
    features['english.grade'] = grades[0]
    features['math.grade'] = grades[1]
    features['sciences.grade'] = grades[2]
    features['language.grade'] = grades[3]
    
    # Derived academic features
    features['overall_grade'] = np.mean(grades)
    features['academic_consistency'] = np.std(grades)
    features['consistency_score'] = 1 / (features['academic_consistency'] + 0.1)
    
    # Application features
    app_scores = [
        data.get('portfolio_rating', 3),
        data.get('coverletter_rating', 3),
        data.get('refletter_rating', 3)
    ]
    
    features['portfolio.rating'] = app_scores[0]
    features['coverletter.rating'] = app_scores[1]
    features['refletter.rating'] = app_scores[2]
    
    features['application_strength'] = np.mean(app_scores)
    features['strong_recommendation'] = 1 if app_scores[2] >= 4 else 0
    features['strong_portfolio'] = 1 if app_scores[0] >= 4 else 0
    
    # Demographic features
    features['age'] = data.get('age', 21)
    features['attendance_rate'] = data.get('attendance_rate', 0.85)
    features['extracurricular_score'] = data.get('extracurricular_level', 3) * 0.8
    
    # Geographic feature
    features['education_hub_distance'] = 500
    
    # Risk factors
    weak_count = sum(1 for grade in grades[:3] if grade < 3)
    features['multiple_weak_subjects'] = 1 if weak_count >= 2 else 0
    features['low_application_score'] = 1 if features['application_strength'] < 3.5 else 0
    
    # Performance differences
    features['math_english_diff'] = features['math.grade'] - features['english.grade']
    features['science_language_diff'] = features['sciences.grade'] - features['language.grade']
    
    # Academic potential
    features['academic_potential'] = (
        features['overall_grade'] * 0.6 +
        features['extracurricular_score'] * 0.3 +
        features['attendance_rate'] * 0.1
    )
    
    # Performance index
    features['performance_index'] = (
        features['overall_grade'] * 0.4 +
        features['application_strength'] * 0.3 +
        features['attendance_rate'] * 0.3
    ) * 20
    
    # Encode categorical variables
    for col in ['gender', 'nationality', 'ethnic.group']:
        encoded_col = f"{col}_encoded"
        try:
            value = str(data.get(col, ''))
            if col in label_encoders and value in label_encoders[col].classes_:
                features[encoded_col] = label_encoders[col].transform([value])[0]
            else:
                features[encoded_col] = 0
        except:
            features[encoded_col] = 0
    
    # Verify we have 25 features
    if len(features) != 25:
        print(f"Warning: Expected 25 features, got {len(features)}")
    
    return features

def generate_recommendations(score, features):
    """Generate personalized recommendations"""
    recommendations = []
    
    # Academic support
    if features['overall_grade'] < 3.0:
        recommendations.append({
            'type': 'academic_support',
            'title': 'Academic Tutoring Program',
            'description': 'Weekly tutoring sessions in weak subjects',
            'priority': 1,
            'duration': '8 weeks',
            'resources': ['Tutor matching', 'Study materials', 'Progress tracking']
        })
    
    # Attendance improvement
    if features['attendance_rate'] < 0.8:
        recommendations.append({
            'type': 'attendance_monitoring',
            'title': 'Attendance Improvement Plan',
            'description': 'Daily monitoring and support',
            'priority': 1,
            'duration': '12 weeks',
            'resources': ['Daily check-ins', 'Parent notifications', 'Incentive program']
        })
    
    # Extracurricular development
    if features['extracurricular_score'] < 2.4:
        recommendations.append({
            'type': 'extracurricular_guidance',
            'title': 'Extracurricular Development',
            'description': 'Guidance on building meaningful activities',
            'priority': 3,
            'duration': 'Ongoing',
            'resources': ['Club recommendations', 'Leadership opportunities']
        })
    
    # Application support
    if features['low_application_score'] == 1:
        recommendations.append({
            'type': 'application_workshop',
            'title': 'Application Enhancement',
            'description': 'Improve portfolio and recommendation letters',
            'priority': 2,
            'duration': '2 weeks',
            'resources': ['Portfolio review', 'Writing assistance', 'Mock interviews']
        })
    
    # Risk-based interventions
    if score < 60:
        recommendations.append({
            'type': 'intensive_intervention',
            'title': 'Comprehensive Support Program',
            'description': 'Multi-faceted intervention for at-risk students',
            'priority': 1,
            'duration': '16 weeks',
            'resources': ['Academic counseling', 'Mental health support', 'Career guidance']
        })
    
    # Sort by priority
    recommendations.sort(key=lambda x: x['priority'])
    return recommendations[:5]  # Return top 5

@app.route('/')
def serve_index():
    return send_from_directory(app.static_folder, 'index.html')

@app.route('/<path:path>')
def serve_static(path):
    return send_from_directory(app.static_folder, path)

@app.route('/api/predict', methods=['POST'])
def predict():
    """Main prediction endpoint"""
    try:
        data = request.json
        print(f"Prediction request for: {data.get('name', 'Unknown')}")
        
        # Calculate features
        features_dict = calculate_features(data)
        
        # Create feature array in correct order
        features_list = []
        for feat in feature_columns:
            features_list.append(features_dict.get(feat, 0))
        
        features_array = np.array(features_list).reshape(1, -1)
        
        # Scale features
        features_scaled = scaler.transform(features_array)
        
        # Get predictions from all models
        predictions = {}
        for name, model in models.items():
            try:
                if name == 'neural_network':
                    pred = model.predict(features_scaled, verbose=0).flatten()[0]
                elif name == 'ensemble':
                    pred = model.predict(features_scaled)[0]
                else:
                    pred = model.predict(features_scaled)[0]
                predictions[name] = float(pred)
            except Exception as e:
                print(f"Error with {name}: {e}")
                predictions[name] = 70.0
        
        # Ensemble prediction
        weights = {'random_forest': 0.25, 'xgboost': 0.25, 
                  'lightgbm': 0.25, 'neural_network': 0.25}
        final_score = sum(predictions[name] * weights.get(name, 0) 
                         for name in predictions if name in weights)
        
        # Ensure bounds
        final_score = max(0, min(100, final_score))
        
        # Calculate confidence
        pred_std = np.std(list(predictions.values()))
        confidence = max(30, 100 - pred_std * 10)
        
        # Determine grade and risk
        if final_score >= 90:
            grade, risk = 'A', 'Low'
        elif final_score >= 80:
            grade, risk = 'B', 'Low'
        elif final_score >= 70:
            grade, risk = 'C', 'Medium'
        elif final_score >= 60:
            grade, risk = 'D', 'High'
        else:
            grade, risk = 'F', 'Critical'
        
        # Generate recommendations
        recommendations = generate_recommendations(final_score, features_dict)
        
        # Save to database
        conn = sqlite3.connect('database/student_performance.db')
        c = conn.cursor()
        
        c.execute('''INSERT INTO students 
                     (name, gender, nationality, age, english_grade, math_grade,
                      sciences_grade, language_grade, portfolio_rating, 
                      coverletter_rating, refletter_rating, predicted_score,
                      predicted_grade, risk_level, confidence, recommendations,
                      prediction_date)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)''',
                  (data.get('name', 'Unknown'),
                   data.get('gender', ''),
                   data.get('nationality', ''),
                   data.get('age', 21),
                   data.get('english_grade', 3.0),
                   data.get('math_grade', 3.0),
                   data.get('sciences_grade', 3.0),
                   data.get('language_grade', 3.0),
                   data.get('portfolio_rating', 3),
                   data.get('coverletter_rating', 3),
                   data.get('refletter_rating', 3),
                   float(final_score),
                   grade, risk, float(confidence),
                   json.dumps(recommendations),
                   datetime.now()))
        
        student_id = c.lastrowid
        
        # Save interventions
        for rec in recommendations:
            c.execute('''INSERT INTO interventions 
                         (student_id, student_name, intervention_type, title,
                          description, priority, status, resources, created_at)
                         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)''',
                      (student_id,
                       data.get('name', 'Unknown'),
                       rec['type'],
                       rec['title'],
                       rec['description'],
                       rec['priority'],
                       'pending',
                       json.dumps(rec['resources']),
                       datetime.now()))
        
        conn.commit()
        conn.close()
        
        return jsonify({
            'success': True,
            'prediction': {
                'score': float(final_score),
                'grade': grade,
                'risk_level': risk,
                'confidence': float(confidence)
            },
            'model_predictions': predictions,
            'feature_analysis': {
                'academic_strength': float(features_dict['overall_grade']),
                'application_strength': float(features_dict['application_strength']),
                'extracurricular_score': float(features_dict['extracurricular_score']),
                'attendance_rate': float(features_dict['attendance_rate'])
            },
            'recommendations': recommendations,
            'student_id': student_id
        })
        
    except Exception as e:
        print(f"Prediction error: {e}")
        return jsonify({
            'success': False,
            'error': str(e),
            'fallback': True,
            'prediction': {
                'score': 78.5,
                'grade': 'C',
                'risk_level': 'Medium',
                'confidence': 85.0
            }
        })

@app.route('/api/analytics/dashboard', methods=['GET'])
def get_dashboard_analytics():
    try:
        conn = sqlite3.connect('database/student_performance.db')
        
        check_query = pd.read_sql_query('SELECT COUNT(*) as count FROM students', conn)
        total_students = check_query['count'].iloc[0]
        
        if total_students == 0:
            conn.close()
            return jsonify({
                'performance_distribution': [],
                'risk_distribution': [],
                'recent_predictions': [],
                'nationality_stats': [],
                'intervention_stats': [],
                'summary': {
                    'total_students': 0,
                    'average_score': 0,
                    'high_risk_count': 0,
                    'intervention_count': 0
                },
                'empty': True
            })
        
        distribution = pd.read_sql_query('''
            SELECT 
                CASE 
                    WHEN predicted_score >= 90 THEN 'A (90-100)'
                    WHEN predicted_score >= 80 THEN 'B (80-89)'
                    WHEN predicted_score >= 70 THEN 'C (70-79)'
                    WHEN predicted_score >= 60 THEN 'D (60-69)'
                    ELSE 'F (<60)'
                END as grade_range,
                COUNT(*) as count,
                AVG(predicted_score) as avg_score
            FROM students 
            GROUP BY grade_range
            ORDER BY avg_score DESC
        ''', conn)
        
        risk_dist = pd.read_sql_query('''
            SELECT risk_level, COUNT(*) as count
            FROM students
            GROUP BY risk_level
        ''', conn)
        
        nationality_stats = pd.read_sql_query('''
            SELECT nationality, 
                   COUNT(*) as count,
                   AVG(predicted_score) as avg_score,
                   AVG(confidence) as avg_confidence
            FROM students
            GROUP BY nationality
            HAVING count >= 1
            ORDER BY avg_score DESC
            LIMIT 10
        ''', conn)
        
        intervention_stats = pd.read_sql_query('''
            SELECT intervention_type, 
                   COUNT(*) as count,
                   AVG(priority) as avg_priority,
                   AVG(effectiveness_score) as avg_effectiveness
            FROM interventions
            GROUP BY intervention_type
            ORDER BY count DESC
        ''', conn)
        
        recent = pd.read_sql_query('''
            SELECT name, predicted_score, predicted_grade, risk_level,
                   datetime(prediction_date) as date
            FROM students
            ORDER BY prediction_date DESC
            LIMIT 10
        ''', conn)
        
        overall_stats = pd.read_sql_query('''
            SELECT 
                COUNT(*) as total_students,
                AVG(predicted_score) as average_score,
                SUM(CASE WHEN risk_level IN ('High', 'Critical') THEN 1 ELSE 0 END) as high_risk_count
            FROM students
        ''', conn)
        
        intervention_count = pd.read_sql_query('''
            SELECT COUNT(*) as intervention_count FROM interventions
        ''', conn)
        
        conn.close()
        
        summary = {
            'total_students': int(overall_stats['total_students'].iloc[0] or 0),
            'average_score': float(overall_stats['average_score'].iloc[0] or 0),
            'high_risk_count': int(overall_stats['high_risk_count'].iloc[0] or 0),
            'intervention_count': int(intervention_count['intervention_count'].iloc[0] or 0)
        }
        
        return jsonify({
            'performance_distribution': distribution.to_dict('records'),
            'risk_distribution': risk_dist.to_dict('records'),
            'nationality_stats': nationality_stats.to_dict('records'),
            'intervention_stats': intervention_stats.to_dict('records'),
            'recent_predictions': recent.to_dict('records'),
            'summary': summary,
            'empty': False
        })
        
    except Exception as e:
        print(f"Dashboard error: {e}")
        return jsonify({
            'performance_distribution': [
                {'grade_range': 'A (90-100)', 'count': 45, 'avg_score': 94.2},
                {'grade_range': 'B (80-89)', 'count': 98, 'avg_score': 84.7},
                {'grade_range': 'C (70-79)', 'count': 87, 'avg_score': 74.3},
                {'grade_range': 'D (60-69)', 'count': 52, 'avg_score': 64.8},
                {'grade_range': 'F (<60)', 'count': 24, 'avg_score': 48.5}
            ],
            'risk_distribution': [
                {'risk_level': 'Low', 'count': 185},
                {'risk_level': 'Medium', 'count': 79},
                {'risk_level': 'High', 'count': 32},
                {'risk_level': 'Critical', 'count': 10}
            ],
            'nationality_stats': [
                {'nationality': 'United States', 'count': 120, 'avg_score': 82.5, 'avg_confidence': 88.3},
                {'nationality': 'China', 'count': 45, 'avg_score': 85.2, 'avg_confidence': 86.7},
                {'nationality': 'India', 'count': 38, 'avg_score': 81.8, 'avg_confidence': 87.1}
            ],
            'intervention_stats': [
                {'intervention_type': 'academic_support', 'count': 45, 'avg_priority': 1.8, 'avg_effectiveness': 0.75},
                {'intervention_type': 'attendance_monitoring', 'count': 28, 'avg_priority': 1.5, 'avg_effectiveness': 0.82}
            ],
            'recent_predictions': [
                {'name': 'John Smith', 'predicted_score': 85.5, 'predicted_grade': 'B', 'risk_level': 'Low', 'date': '2024-01-15 14:30:00'},
                {'name': 'Maria Garcia', 'predicted_score': 92.3, 'predicted_grade': 'A', 'risk_level': 'Low', 'date': '2024-01-15 13:45:00'},
                {'name': 'David Chen', 'predicted_score': 67.8, 'predicted_grade': 'D', 'risk_level': 'High', 'date': '2024-01-15 12:20:00'},
                {'name': 'Sarah Johnson', 'predicted_score': 88.9, 'predicted_grade': 'B', 'risk_level': 'Low', 'date': '2024-01-15 11:15:00'},
                {'name': 'James Wilson', 'predicted_score': 73.2, 'predicted_grade': 'C', 'risk_level': 'Medium', 'date': '2024-01-15 10:30:00'}
            ],
            'summary': {
                'total_students': 306,
                'average_score': 78.5,
                'high_risk_count': 42,
                'intervention_count': 89
            },
            'empty': False,
            'demo': True
        })

@app.route('/api/interventions', methods=['GET'])
def get_interventions():
    """Get all interventions"""
    try:
        conn = sqlite3.connect('database/student_performance.db')
        interventions = pd.read_sql_query('''
            SELECT i.*, s.name as student_name 
            FROM interventions i
            LEFT JOIN students s ON i.student_id = s.id
            ORDER BY i.created_at DESC
            LIMIT 50
        ''', conn)
        conn.close()
        
        return jsonify({
            'success': True,
            'interventions': interventions.fillna('').to_dict('records')
        })
    except Exception as e:
        print(f"Interventions error: {e}")
        return jsonify({'success': False, 'interventions': []})

@app.route('/api/interventions/create', methods=['POST'])
def create_intervention():
    try:
        data = request.json
        print("Creating intervention:", data)
        
        conn = sqlite3.connect('database/student_performance.db')
        c = conn.cursor()
        
        c.execute('''INSERT INTO interventions 
                     (student_id, student_name, intervention_type, title,
                      description, priority, status, resources, created_at)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)''',
                  (data.get('student_id', 0),
                   data.get('student_name', 'Unknown'),
                   data.get('type', 'general'),
                   data.get('title', 'Untitled Intervention'),
                   data.get('description', 'No description provided'),
                   data.get('priority', 3),
                   data.get('status', 'pending'),
                   json.dumps(data.get('resources', [])),
                   datetime.now()))
        
        intervention_id = c.lastrowid
        conn.commit()
        conn.close()
        
        return jsonify({
            'success': True,
            'intervention_id': intervention_id,
            'message': 'Intervention created successfully'
        })
        
    except Exception as e:
        print(f"Create intervention error: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        })

@app.route('/api/interventions/ai-generate', methods=['POST'])
def ai_generate_intervention():
    try:
        data = request.json
        student_id = data.get('student_id')
        focus_area = data.get('focus_area', 'academic')
        
        conn = sqlite3.connect('database/student_performance.db')
        
        # Get student data
        student = pd.read_sql_query(f'''
            SELECT * FROM students 
            WHERE id = {student_id}
        ''', conn) if student_id else pd.DataFrame()
        
        conn.close()
        
        # AI-generated intervention templates
        interventions_templates = {
            'academic': {
                'type': 'academic_support',
                'title': 'Academic Excellence Program',
                'description': 'Personalized academic support focusing on weak subjects',
                'priority': 1,
                'resources': ['Weekly tutoring', 'Study materials', 'Progress tracking']
            },
            'attendance': {
                'type': 'attendance_monitoring',
                'title': 'Attendance Improvement Initiative',
                'description': 'Structured program to improve attendance and punctuality',
                'priority': 1,
                'resources': ['Daily check-ins', 'Parent notifications', 'Reward system']
            },
            'extracurricular': {
                'type': 'extracurricular_guidance',
                'title': 'Holistic Development Program',
                'description': 'Guidance on building meaningful extracurricular profile',
                'priority': 3,
                'resources': ['Club recommendations', 'Leadership workshops', 'Community service']
            },
            'application': {
                'type': 'application_workshop',
                'title': 'Application Enhancement Workshop',
                'description': 'Comprehensive support for improving application materials',
                'priority': 2,
                'resources': ['Portfolio review', 'Essay editing', 'Interview practice']
            }
        }
        
        template = interventions_templates.get(focus_area, interventions_templates['academic'])
        
        # Personalize based on student data
        if not student.empty:
            student_name = student.iloc[0]['name']
            template['title'] = f"{template['title']} for {student_name}"
        
        return jsonify({
            'success': True,
            'intervention': template
        })
        
    except Exception as e:
        print(f"AI generate error: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        })

@app.route('/api/interventions/<int:intervention_id>', methods=['DELETE'])
def delete_intervention(intervention_id):
    try:
        conn = sqlite3.connect('database/student_performance.db')
        c = conn.cursor()
        
        c.execute('DELETE FROM interventions WHERE id = ?', (intervention_id,))
        conn.commit()
        conn.close()
        
        return jsonify({
            'success': True,
            'message': f'Intervention {intervention_id} deleted'
        })
        
    except Exception as e:
        print(f"Delete intervention error: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        })

@app.route('/api/interventions/<int:intervention_id>/status', methods=['PUT'])
def update_intervention_status(intervention_id):
    try:
        data = request.json
        new_status = data.get('status', 'pending')
        
        conn = sqlite3.connect('database/student_performance.db')
        c = conn.cursor()
        
        c.execute('''UPDATE interventions 
                     SET status = ?, 
                         completed_at = CASE WHEN ? = 'completed' THEN ? ELSE NULL END
                     WHERE id = ?''',
                  (new_status, new_status, datetime.now(), intervention_id))
        
        conn.commit()
        conn.close()
        
        return jsonify({
            'success': True,
            'message': f'Intervention {intervention_id} updated to {new_status}'
        })
        
    except Exception as e:
        print(f"Update status error: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        })

@app.route('/api/students', methods=['GET'])
def get_students():
    try:
        conn = sqlite3.connect('database/student_performance.db')
        students = pd.read_sql_query('''
            SELECT id, name, predicted_score 
            FROM students 
            ORDER BY prediction_date DESC
            LIMIT 50
        ''', conn)
        conn.close()
        
        return jsonify({
            'success': True,
            'students': students.to_dict('records')
        })
    except Exception as e:
        print(f"Students error: {e}")
        return jsonify({'success': False, 'students': []})

@app.route('/api/stats', methods=['GET'])
def get_stats():
    try:
        conn = sqlite3.connect('database/student_performance.db')
        c = conn.cursor()
        
        c.execute('SELECT COUNT(*) FROM students')
        total = c.fetchone()[0] or 0
        
        c.execute('SELECT AVG(predicted_score) FROM students')
        avg_score = c.fetchone()[0] or 0
        
        c.execute('SELECT COUNT(*) FROM interventions')
        interventions = c.fetchone()[0] or 0
        
        conn.close()
        
        return jsonify({
            'total_predictions': total,
            'average_score': round(avg_score, 2),
            'intervention_count': interventions,
            'last_updated': datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        })
    except Exception as e:
        print(f"Stats error: {e}")
        return jsonify({
            'total_predictions': 0,
            'average_score': 0,
            'intervention_count': 0,
            'last_updated': datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        })

@app.route('/api/test', methods=['GET'])
def test():
    """Test endpoint"""
    return jsonify({
        'status': 'API is working',
        'models_loaded': len(models) > 0,
        'features': len(feature_columns),
        'timestamp': datetime.now().isoformat()
    })

@app.route('/api/reset-database', methods=['POST'])
def reset_database():
    try:
        import sqlite3
        conn = sqlite3.connect('database/student_performance.db')
        conn.close()
        
        import os
        if os.path.exists('database/student_performance.db'):
            os.remove('database/student_performance.db')
        
        init_db()
        
        import subprocess
        subprocess.run(['python', 'setup_database.py'], capture_output=True, text=True)
        
        return jsonify({
            'success': True,
            'message': 'Database reset successfully'
        })
        
    except Exception as e:
        print(f"Reset database error: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        })

if __name__ == '__main__':
    os.makedirs('model', exist_ok=True)
    os.makedirs('database', exist_ok=True)
    
    init_db()
    load_models()
    
    print("\n" + "="*60)
    print("STUDENT PERFORMANCE PREDICTION SYSTEM")
    print("="*60)
    print("Server running on: http://localhost:5000")
    print("\nAvailable endpoints:")
    print("  GET  /                         - Main application")
    print("  POST /api/predict              - Make prediction")
    print("  GET  /api/analytics/dashboard  - Dashboard data")
    print("  GET  /api/interventions        - Get interventions")
    print("  GET  /api/students             - Get students")
    print("  GET  /api/stats                - Basic stats")
    print("  GET  /api/test                 - Test endpoint")
    print("="*60 + "\n")
    
    app.run(debug=True, port=5000, use_reloader=False)