import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.base import BaseEstimator, RegressorMixin
import xgboost as xgb
import lightgbm as lgb
import tensorflow as tf
from tensorflow import keras
from tensorflow.keras import layers, callbacks
import joblib
import warnings
warnings.filterwarnings('ignore')

print("=" * 60)
print("STUDENT PERFORMANCE PREDICTION MODEL TRAINING")
print("=" * 60)

# Define EnsembleModel at module level so it can be pickled
class EnsembleModel(BaseEstimator, RegressorMixin):
    """Ensemble model that combines predictions from multiple models"""
    def __init__(self, rf_model=None, xgb_model=None, lgb_model=None, nn_model=None):
        self.rf_model = rf_model
        self.xgb_model = xgb_model
        self.lgb_model = lgb_model
        self.nn_model = nn_model
        
    def fit(self, X, y):
        # This ensemble doesn't need to fit, just use pre-fitted models
        return self
    
    def predict(self, X):
        if self.rf_model is None or self.xgb_model is None or self.lgb_model is None or self.nn_model is None:
            raise ValueError("All models must be provided before prediction")
        
        rf_pred = self.rf_model.predict(X)
        xgb_pred = self.xgb_model.predict(X)
        lgb_pred = self.lgb_model.predict(X)
        nn_pred = self.nn_model.predict(X).flatten()
        
        # Weighted average
        return (rf_pred * 0.25 + xgb_pred * 0.25 + 
                lgb_pred * 0.25 + nn_pred * 0.25)
    
    def get_params(self, deep=True):
        return {
            'rf_model': self.rf_model,
            'xgb_model': self.xgb_model,
            'lgb_model': self.lgb_model,
            'nn_model': self.nn_model
        }
    
    def set_params(self, **params):
        for key, value in params.items():
            setattr(self, key, value)
        return self

def load_and_prepare_data():
    """Load dataset and create features"""
    print("Loading dataset...")
    df = pd.read_csv('data/student-dataset.csv')
    print(f"Dataset loaded: {df.shape[0]} rows, {df.shape[1]} columns")
    
    # Create features DataFrame
    features = pd.DataFrame()
    
    # 1. Academic grades (4 features)
    grade_cols = ['english.grade', 'math.grade', 'sciences.grade', 'language.grade']
    for col in grade_cols:
        features[col] = df[col]
    
    # 2. Derived academic features (3 features)
    features['overall_grade'] = df[grade_cols].mean(axis=1)
    features['academic_consistency'] = df[grade_cols].std(axis=1)
    features['consistency_score'] = 1 / (features['academic_consistency'] + 0.1)
    
    # 3. Application features (6 features)
    app_cols = ['portfolio.rating', 'coverletter.rating', 'refletter.rating']
    for col in app_cols:
        features[col] = df[col]
    
    features['application_strength'] = df[app_cols].mean(axis=1)
    features['strong_recommendation'] = (df['refletter.rating'] >= 4).astype(int)
    features['strong_portfolio'] = (df['portfolio.rating'] >= 4).astype(int)
    
    # 4. Demographic features (3 features)
    features['age'] = df['age']
    
    # Simulate attendance and extracurricular
    np.random.seed(42)
    features['attendance_rate'] = np.random.uniform(0.7, 0.95, len(df))
    features['extracurricular_score'] = np.random.uniform(2.0, 4.5, len(df))
    
    # 5. Geographic feature (1 feature)
    features['education_hub_distance'] = np.random.uniform(100, 1000, len(df))
    
    # 6. Risk factors (2 features)
    weak_subjects = (df[grade_cols[:3]] < 3).sum(axis=1)
    features['multiple_weak_subjects'] = (weak_subjects >= 2).astype(int)
    features['low_application_score'] = (features['application_strength'] < 3.5).astype(int)
    
    # 7. Performance differences (2 features)
    features['math_english_diff'] = df['math.grade'] - df['english.grade']
    features['science_language_diff'] = df['sciences.grade'] - df['language.grade']
    
    # 8. Academic potential (1 feature)
    features['academic_potential'] = (
        features['overall_grade'] * 0.6 +
        features['extracurricular_score'] * 0.3 +
        features['attendance_rate'] * 0.1
    )
    
    # 9. Performance index (1 feature)
    features['performance_index'] = (
        features['overall_grade'] * 0.4 +
        features['application_strength'] * 0.3 +
        features['attendance_rate'] * 0.3
    ) * 20
    
    # 10. Encode categorical variables (3 features)
    label_encoders = {}
    categorical_cols = ['gender', 'nationality', 'ethnic.group']
    
    for col in categorical_cols:
        le = LabelEncoder()
        # Fill NaN values
        df[col] = df[col].fillna('Unknown')
        features[f'{col}_encoded'] = le.fit_transform(df[col].astype(str))
        label_encoders[col] = le
    
    # Create target variable
    features['performance_score'] = (
        features['overall_grade'] * 0.4 +
        features['application_strength'] * 0.2 +
        features['extracurricular_score'] * 0.2 +
        features['attendance_rate'] * 0.2
    ) * 25
    
    # Add noise for realism
    np.random.seed(42)
    noise = np.random.normal(0, 5, len(features))
    features['performance_score'] += noise
    features['performance_score'] = features['performance_score'].clip(0, 100)
    
    print(f"Created {features.shape[1]} features")
    return features, label_encoders

def create_neural_network(input_dim):
    """Create a neural network model"""
    model = keras.Sequential([
        layers.Input(shape=(input_dim,)),
        layers.Dense(128, activation='relu'),
        layers.BatchNormalization(),
        layers.Dropout(0.3),
        
        layers.Dense(64, activation='relu'),
        layers.BatchNormalization(),
        layers.Dropout(0.3),
        
        layers.Dense(32, activation='relu'),
        layers.BatchNormalization(),
        layers.Dropout(0.2),
        
        layers.Dense(16, activation='relu'),
        layers.Dense(1)
    ])
    
    model.compile(
        optimizer=keras.optimizers.Adam(learning_rate=0.001),
        loss='mse',
        metrics=['mae', 'mse']
    )
    
    return model

def train_models():
    """Train all models"""
    print("\nPreparing data for training...")
    features, label_encoders = load_and_prepare_data()
    
    # Define feature columns (EXACTLY 25 features)
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
    
    X = features[feature_columns]
    y = features['performance_score']
    
    print(f"X shape: {X.shape}, y shape: {y.shape}")
    
    # Split data
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )
    
    # Scale features
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)
    
    print("\nTraining models...")
    print("-" * 40)
    
    # 1. Random Forest
    print("1. Training Random Forest...")
    rf_model = RandomForestRegressor(
        n_estimators=100,
        max_depth=15,
        min_samples_split=5,
        min_samples_leaf=2,
        random_state=42
    )
    rf_model.fit(X_train_scaled, y_train)
    
    # 2. XGBoost
    print("2. Training XGBoost...")
    xgb_model = xgb.XGBRegressor(
        n_estimators=100,
        max_depth=6,
        learning_rate=0.05,
        random_state=42
    )
    xgb_model.fit(X_train_scaled, y_train)
    
    # 3. LightGBM
    print("3. Training LightGBM...")
    lgb_model = lgb.LGBMRegressor(
        n_estimators=100,
        max_depth=7,
        learning_rate=0.05,
        random_state=42
    )
    lgb_model.fit(X_train_scaled, y_train)
    
    # 4. Neural Network
    print("4. Training Neural Network...")
    nn_model = create_neural_network(X_train_scaled.shape[1])
    
    early_stopping = callbacks.EarlyStopping(
        monitor='val_loss',
        patience=20,
        restore_best_weights=True
    )
    
    nn_model.fit(
        X_train_scaled, y_train,
        validation_split=0.2,
        epochs=100,
        batch_size=32,
        callbacks=[early_stopping],
        verbose=0
    )
    
    # 5. Create Ensemble Model using the module-level class
    print("5. Creating Ensemble Model...")
    ensemble_model = EnsembleModel(
        rf_model=rf_model,
        xgb_model=xgb_model,
        lgb_model=lgb_model,
        nn_model=nn_model
    )
    
    # Evaluate models
    print("\n" + "=" * 60)
    print("MODEL EVALUATION")
    print("=" * 60)
    
    models = {
        'Random Forest': rf_model,
        'XGBoost': xgb_model,
        'LightGBM': lgb_model,
        'Neural Network': nn_model,
        'Ensemble': ensemble_model
    }
    
    results = {}
    for name, model in models.items():
        if name == 'Neural Network':
            y_pred = model.predict(X_test_scaled).flatten()
        else:
            y_pred = model.predict(X_test_scaled)
        
        mae = mean_absolute_error(y_test, y_pred)
        rmse = np.sqrt(mean_squared_error(y_test, y_pred))
        r2 = r2_score(y_test, y_pred)
        
        results[name] = {'MAE': mae, 'RMSE': rmse, 'R2': r2}
        
        print(f"\n{name}:")
        print(f"  MAE:  {mae:.2f}")
        print(f"  RMSE: {rmse:.2f}")
        print(f"  R²:   {r2:.3f}")
    
    # Save models
    print("\n" + "=" * 60)
    print("SAVING MODELS")
    print("=" * 60)
    
    joblib.dump(rf_model, 'model/random_forest.pkl')
    joblib.dump(xgb_model, 'model/xgboost.pkl')
    joblib.dump(lgb_model, 'model/lightgbm.pkl')
    nn_model.save('model/neural_network.h5')
    
    # Save ensemble model
    joblib.dump(ensemble_model, 'model/ensemble.pkl')
    
    # Save preprocessing objects
    joblib.dump(scaler, 'model/scaler.pkl')
    joblib.dump(label_encoders, 'model/label_encoders.pkl')
    
    # Save feature columns
    with open('model/feature_columns.txt', 'w') as f:
        f.write('\n'.join(feature_columns))
    
    print("\n✓ Models saved successfully!")
    print(f"✓ {len(feature_columns)} features")
    print("✓ Ready for deployment!")
    
    # Save evaluation results
    with open('model/model_performance.txt', 'w') as f:
        f.write("MODEL PERFORMANCE METRICS\n")
        f.write("=" * 40 + "\n\n")
        for name, metrics in results.items():
            f.write(f"{name}:\n")
            f.write(f"  MAE:  {metrics['MAE']:.2f}\n")
            f.write(f"  RMSE: {metrics['RMSE']:.2f}\n")
            f.write(f"  R²:   {metrics['R2']:.3f}\n\n")
    
    return results

if __name__ == '__main__':
    train_models()