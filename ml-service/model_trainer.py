import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import accuracy_score, classification_report
import joblib
import os

# ================================================================
# MODEL TRAINER - Run this file ONCE to train and save the model
# After running this, model.pkl file will be created
# Flask app then loads model.pkl for every prediction request
# ================================================================

def generate_training_data():
    """
    Generate realistic loan dataset for training
    In real world you would use a Kaggle dataset here
    We generate 5000 realistic samples covering all scenarios
    """
    np.random.seed(42)
    n_samples = 5000

    # Generate realistic applicant data
    ages = np.random.randint(21, 65, n_samples)
    annual_incomes = np.random.randint(150000, 2000000, n_samples)
    loan_amounts = np.random.randint(50000, 5000000, n_samples)
    loan_tenure = np.random.randint(12, 360, n_samples)
    credit_scores = np.random.randint(300, 900, n_samples)
    existing_debts = np.random.randint(0, 1000000, n_samples)

    employment_types = np.random.choice(
        ['SALARIED', 'SELF_EMPLOYED', 'BUSINESS', 'UNEMPLOYED'],
        n_samples,
        p=[0.5, 0.25, 0.2, 0.05]
    )

    loan_purposes = np.random.choice(
        ['HOME', 'EDUCATION', 'VEHICLE', 'PERSONAL', 'BUSINESS'],
        n_samples
    )

    # Generate fraud labels based on realistic rules
    # This makes the ML model learn real fraud patterns
    fraud_labels = []
    for i in range(n_samples):
        fraud_score = 0

        # Low credit score increases fraud risk
        if credit_scores[i] < 500:
            fraud_score += 3
        elif credit_scores[i] < 650:
            fraud_score += 1

        # High loan to income ratio is suspicious
        ratio = loan_amounts[i] / annual_incomes[i]
        if ratio > 10:
            fraud_score += 3
        elif ratio > 5:
            fraud_score += 1

        # Unemployed applicants are higher risk
        if employment_types[i] == 'UNEMPLOYED':
            fraud_score += 2

        # High existing debt is risky
        debt_ratio = existing_debts[i] / annual_incomes[i]
        if debt_ratio > 0.6:
            fraud_score += 2
        elif debt_ratio > 0.3:
            fraud_score += 1

        # Very low income is risky
        if annual_incomes[i] < 200000:
            fraud_score += 1

        # Mark as fraud if score is high enough
        fraud_labels.append(1 if fraud_score >= 4 else 0)

    # Create DataFrame
    df = pd.DataFrame({
        'age': ages,
        'annual_income': annual_incomes,
        'loan_amount': loan_amounts,
        'loan_tenure_months': loan_tenure,
        'credit_score': credit_scores,
        'existing_debt': existing_debts,
        'employment_type': employment_types,
        'loan_purpose': loan_purposes,
        'is_fraud': fraud_labels
    })

    return df


def train_model():
    print("Generating training data...")
    df = generate_training_data()

    print(f"Dataset size: {len(df)} samples")
    print(f"Fraud cases: {df['is_fraud'].sum()} ({df['is_fraud'].mean()*100:.1f}%)")
    print(f"Legitimate cases: {(df['is_fraud']==0).sum()}")

    # Encode categorical columns into numbers
    # ML models only understand numbers, not strings
    le_employment = LabelEncoder()
    le_purpose = LabelEncoder()

    df['employment_type_encoded'] = le_employment.fit_transform(
        df['employment_type'])
    df['loan_purpose_encoded'] = le_purpose.fit_transform(
        df['loan_purpose'])

    # Select features for training
    # These are the exact same features Flask will receive from Spring Boot
    feature_columns = [
        'age',
        'annual_income',
        'loan_amount',
        'loan_tenure_months',
        'credit_score',
        'existing_debt',
        'employment_type_encoded',
        'loan_purpose_encoded'
    ]

    X = df[feature_columns]  # Input features
    y = df['is_fraud']       # Target label (0=legitimate, 1=fraud)

    # Split into training and testing sets
    # 80% for training, 20% for testing accuracy
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )

    print("\nTraining Random Forest model...")

    # Train the Random Forest model
    # n_estimators=100 means 100 decision trees work together
    # This makes it more accurate than a single decision tree
    model = RandomForestClassifier(
        n_estimators=100,
        max_depth=10,
        random_state=42,
        n_jobs=-1  # Use all CPU cores for faster training
    )

    model.fit(X_train, y_train)

    # Test accuracy on unseen data
    y_pred = model.predict(X_test)
    accuracy = accuracy_score(y_test, y_pred)
    print(f"\nModel Accuracy: {accuracy * 100:.2f}%")
    print("\nDetailed Report:")
    print(classification_report(y_test, y_pred,
          target_names=['Legitimate', 'Fraud']))

    # Save everything needed for prediction
    # model.pkl contains the trained model + encoders
    model_data = {
        'model': model,
        'le_employment': le_employment,
        'le_purpose': le_purpose,
        'feature_columns': feature_columns
    }

    joblib.dump(model_data, 'model.pkl')
    print("\nModel saved as model.pkl")
    print("Training complete! You can now run app.py")


if __name__ == "__main__":
    train_model()