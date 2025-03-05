from flask import Flask, jsonify, request, session
from flask_cors import CORS
from flask_login import LoginManager, UserMixin, login_user, logout_user, login_required, current_user
from werkzeug.security import generate_password_hash, check_password_hash
import os
import psycopg2
from psycopg2.extras import RealDictCursor

app = Flask(__name__)

# Amazon RDS PostgreSQL Connection Details
DB_USER = "postgres"
DB_PASSWORD = "BeachHouse"
DB_HOST = "express-auto.c6bogymw63tm.us-east-1.rds.amazonaws.com"
DB_PORT = "5432"
DB_NAME = "xpressauto"

# Security Configurations
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'your-secret-key')  # Use environment variable in production!
app.config['SESSION_COOKIE_HTTPONLY'] = True
app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'

# Enable CORS for React frontend
CORS(app, supports_credentials=True, origins=["http://localhost:5173"])

# Initialize Flask-Login
login_manager = LoginManager()
login_manager.init_app(app)

# Function to establish a database connection
def get_db_connection():
    return psycopg2.connect(
        dbname=DB_NAME,
        user=DB_USER,
        password=DB_PASSWORD,
        host=DB_HOST,
        port=DB_PORT,
        cursor_factory=RealDictCursor
    )

# User model
class User(UserMixin):
    def __init__(self, id, username, password):
        self.id = id
        self.username = username
        self.password = password

@login_manager.user_loader
def load_user(user_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users WHERE id = %s", (user_id,))
    user_data = cursor.fetchone()
    cursor.close()
    conn.close()
    if user_data:
        return User(user_data['id'], user_data['username'], user_data['password'])
    return None

# Database connection test route
@app.route('/api/db-test', methods=['GET'])
def test_db():
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT NOW();")
        result = cursor.fetchone()
        cursor.close()
        conn.close()
        return jsonify({"status": "success", "message": f"Connected to PostgreSQL at {result['now']}"})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)})

from werkzeug.security import check_password_hash

@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()

    if not data or not data.get("email") or not data.get("password"):
        return jsonify({"status": "failed", "message": "Email and password required"}), 400

    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute("SELECT user_id, email, password_hash FROM users WHERE email = %s", (data.get('email'),))
    user_data = cursor.fetchone()
    
    cursor.close()
    conn.close()

    if user_data and check_password_hash(user_data['password_hash'], data.get('password')):
        user = User(user_data['user_id'], user_data['email'], user_data['password_hash'])
        login_user(user)
        return jsonify({"status": "success", "user": {"id": user.id, "email": user.username}})
    
    return jsonify({"status": "failed", "message": "Invalid email or password"}), 401

@app.route('/api/logout', methods=['POST'])
@login_required
def logout():
    logout_user()
    return jsonify({"status": "success"})

@app.route('/api/user', methods=['GET'])
@login_required
def get_user():
    return jsonify({
        "id": current_user.id,
        "username": current_user.username
    })

# Protected route example
@app.route('/api/protected', methods=['GET'])
@login_required
def protected():
    return jsonify({"message": "This is a protected endpoint", "user": current_user.username})

# Error handling for unauthorized access
@app.errorhandler(401)
def unauthorized(error):
    return jsonify({"status": "error", "message": "Unauthorized access"}), 401

from werkzeug.security import generate_password_hash

@app.route('/api/add-user', methods=['POST'])
def add_user():
    data = request.get_json()
    
    if not data or not data.get("email") or not data.get("password"):
        return jsonify({"status": "failed", "message": "Email and password required"}), 400

    hashed_password = generate_password_hash(data["password"])  # Hash the password

    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        cursor.execute(
            "INSERT INTO users (email, password_hash, first_name, last_name, phone) VALUES (%s, %s, %s, %s, %s) RETURNING user_id",
            (data["email"], hashed_password, data.get("first_name", ""), data.get("last_name", ""), data.get("phone", ""))
        )
        new_user_id = cursor.fetchone()["user_id"]
        conn.commit()
        return jsonify({"status": "success", "message": f"User {data['email']} added!", "user_id": new_user_id})
    except Exception as e:
        conn.rollback()
        return jsonify({"status": "error", "message": str(e)})
    finally:
        cursor.close()
        conn.close()


@app.route('/api/get-users', methods=['GET'])
def get_users():
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT user_id, email FROM users;")  # Use 'user_id' instead of 'id'
        users = cursor.fetchall()
        cursor.close()
        conn.close()
        return jsonify({"status": "success", "users": users})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500
    

@app.route('/api/get-passwords', methods=['GET'])
def get_passwords():
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT user_id, email, password_hash FROM users;")  # Use 'password_hash'
        users = cursor.fetchall()
        cursor.close()
        conn.close()
        return jsonify({"status": "success", "users": users})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


        

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
