from flask import Flask, request, jsonify
import joblib
import numpy as np
import os

# ================================================================
# FLASK ML SERVICE
# This is the Python microservice that Spring Boot calls
# It runs on port 5000 separately from Spring Boot (port 8080)
# 
# Flow:
# Spring Boot sends loan data → Flask receives it →
# Loads trained model → Makes prediction →
# Returns risk score back to Spring Boot
# ================================================================

app = Flask(__name__)

# Load the trained model when Flask starts
# This way model is ready in memory for every request
# No need to reload it for each prediction - much faster
MODEL_PATH = 'model.pkl'
model_data = None

def load_model():
    global model_data
    if os.path.exists(MODEL_PATH):
        model_data = joblib.load(MODEL_PATH)
        print("Model loaded successfully!")
    else:
        print("WARNING: model.pkl not found!")
        print("Please run: python model_trainer.py first")

# Load model when app starts
load_model()

# ================================================================
# HEALTH CHECK ENDPOINT
# Spring Boot calls this to verify Python service is running
# GET http://localhost:5000/health
# ================================================================
@app.route('/health', methods=['GET'])
def health():
    status = "ready" if model_data is not None else "model_not_loaded"
    return jsonify({
        "status": status,
        "service": "LoanGuard ML Service",
        "port": 5000
    })

# ================================================================
# PREDICTION ENDPOINT - Main endpoint called by Spring Boot
# POST http://localhost:5000/predict
# Receives loan data, returns fraud risk score (0-100)
# ================================================================
@app.route('/predict', methods=['POST'])
def predict():
    # Check if model is loaded
    if model_data is None:
        return jsonify({
            "error": "Model not loaded. Run model_trainer.py first"
        }), 500

    try:
        # Get loan data sent by Spring Boot
        data = request.get_json()

        if not data:
            return jsonify({"error": "No data received"}), 400

        # Extract the model components
        model = model_data['model']
        le_employment = model_data['le_employment']
        le_purpose = model_data['le_purpose']

        # Safely encode employment type
        # If value not seen during training, default to SALARIED
        employment_type = data.get('employment_type', 'SALARIED')
        try:
            employment_encoded = le_employment.transform([employment_type])[0]
        except ValueError:
            employment_encoded = le_employment.transform(['SALARIED'])[0]

        # Safely encode loan purpose
        loan_purpose = data.get('loan_purpose', 'PERSONAL')
        try:
            purpose_encoded = le_purpose.transform([loan_purpose])[0]
        except ValueError:
            purpose_encoded = le_purpose.transform(['PERSONAL'])[0]

        # Build feature array in exact same order as training
        features = np.array([[
            data.get('age', 30),
            float(data.get('annual_income', 0)),
            float(data.get('loan_amount', 0)),
            data.get('loan_tenure_months', 12),
            data.get('credit_score', 600),
            float(data.get('existing_debt', 0)),
            employment_encoded,
            purpose_encoded
        ]])

        # Get fraud probability from model
        # predict_proba returns [probability_legitimate, probability_fraud]
        # We take index [1] which is fraud probability
        fraud_probability = model.predict_proba(features)[0][1]

        # Convert probability (0.0-1.0) to risk score (0-100)
        risk_score = round(fraud_probability * 100, 2)

        # Determine risk level from score
        if risk_score <= 30:
            risk_level = "LOW"
        elif risk_score <= 60:
            risk_level = "MEDIUM"
        elif risk_score <= 80:
            risk_level = "HIGH"
        else:
            risk_level = "CRITICAL"

        print(f"Prediction: {data.get('applicant_name', 'Unknown')} "
              f"- Risk Score: {risk_score}% - Level: {risk_level}")

        return jsonify({
            "risk_score": risk_score,
            "risk_level": risk_level,
            "fraud_probability": fraud_probability
        })

    except Exception as e:
        print(f"Prediction error: {str(e)}")
        return jsonify({
            "error": f"Prediction failed: {str(e)}"
        }), 500


# ================================================================
# RUN THE FLASK SERVER
# Runs on port 5000
# debug=True means it auto-reloads when you change code
# ================================================================
if __name__ == '__main__':
    print("Starting LoanGuard ML Service on port 5000...")
    print("Make sure model.pkl exists (run model_trainer.py first)")
    app.run(debug=True, port=5000, host='0.0.0.0')