from flask import Flask, jsonify, request, session
from flask_cors import CORS
from flask_login import LoginManager, UserMixin, login_user, logout_user, login_required, current_user
from werkzeug.security import generate_password_hash, check_password_hash
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
import os
import secrets
import datetime

app = Flask(__name__)
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'your-secret-key')  # Use environment variable in prod!!!
app.config['SESSION_COOKIE_HTTPONLY'] = True
app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'  # Adjust based on security need

# Database Configuration
app.config['SQLALCHEMY_DATABASE_URI'] = 'postgresql://postgres:root@localhost:5432/xpressauto'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Initialize SQLAlchemy and Migrate
db = SQLAlchemy(app)
migrate = Migrate(app, db)

# Enable CORS for React frontend
CORS(app, supports_credentials=True, origins=["http://localhost:5173"])  # React app's URL

# Initialize Flask-Login
login_manager = LoginManager()
login_manager.init_app(app)

class User(UserMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(100), unique=True, nullable=False)
    password = db.Column(db.String(200), nullable=False)
    name = db.Column(db.String(100))
    phone = db.Column(db.String(20))
    address = db.Column(db.Text)
    preferences = db.Column(db.JSON)
    created_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)
    
    def get_id(self):
        return str(self.id)

# Reset Token Model
class ResetToken(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    token = db.Column(db.String(100), unique=True, nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    expiry = db.Column(db.DateTime, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)
    
    # Relationship with User
    user = db.relationship('User', backref=db.backref('reset_tokens', lazy=True))

@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))

# Authentication routes
@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    
    user = User.query.filter_by(username=username).first()
    
    if user and check_password_hash(user.password, password):
        login_user(user)
        return jsonify({"status": "success", "user": {"id": user.id, "username": user.username}})
    
    return jsonify({"status": "failed", "message": "Invalid username or password"}), 401

@app.route('/api/logout', methods=['POST'])
@login_required
def logout():
    logout_user()
    return jsonify({"status": "success"})

# Protected route example
@app.route('/api/protected', methods=['GET'])
@login_required
def protected():
    return jsonify({"message": "This is a protected endpoint", "user": current_user.username})

# Error handling for unauthorized access
@app.errorhandler(401)
def unauthorized(error):
    return jsonify({"status": "error", "message": "Unauthorized access"}), 401

# Request password reset route
@app.route('/api/request-password-reset', methods=['POST'])
def request_password_reset():
    data = request.get_json()
    email = data.get('email')
    
    # Find user by email
    user = User.query.filter_by(username=email).first()
    
    if not user:
        # Don't reveal if user exists or not for security
        return jsonify({"status": "success", "message": "If your email is registered, you will receive a password reset link."})
    
    # Generate a token
    token = secrets.token_urlsafe(32)
    expiry = datetime.datetime.now() + datetime.timedelta(hours=1)
    
    # Store the token with user info and expiry
    reset_token = ResetToken(token=token, user_id=user.id, expiry=expiry)
    
    # Clear old tokens for this user
    ResetToken.query.filter_by(user_id=user.id).delete()
    
    db.session.add(reset_token)
    db.session.commit()
    
    # In a real application, send an email with the token
    print(f"Reset token for {email}: {token}")
    
    return jsonify({
        "status": "success", 
        "message": "If your email is registered, you will receive a password reset link.",
        "debug_token": token  # REMOVE THIS IN PRODUCTION
    })

@app.route('/api/reset-password', methods=['POST'])
def reset_password():
    data = request.get_json()
    token = data.get('token')
    password = data.get('password')
    
    # Find token in database
    reset_record = ResetToken.query.filter_by(token=token).first()
    
    if not reset_record:
        return jsonify({"status": "failed", "message": "Invalid or expired reset token"}), 400
    
    # Check if token is expired
    if datetime.datetime.now() > reset_record.expiry:
        db.session.delete(reset_record)
        db.session.commit()
        return jsonify({"status": "failed", "message": "Reset token has expired"}), 400
    
    # Update the user's password
    user = User.query.get(reset_record.user_id)
    user.password = generate_password_hash(password)
    
    # Remove the used token
    db.session.delete(reset_record)
    db.session.commit()
    
    return jsonify({"status": "success", "message": "Password has been reset successfully"})

# Registration route
@app.route('/api/register', methods=['POST'])
def register():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    
    # Check if username already exists
    existing_user = User.query.filter_by(username=username).first()
    if existing_user:
        return jsonify({"status": "failed", "message": "Username already exists"}), 400
    
    # Create new user
    new_user = User(
        username=username,
        password=generate_password_hash(password)
    )
    
    db.session.add(new_user)
    db.session.commit()
    
    # Login the new user
    login_user(new_user)
    
    return jsonify({"status": "success", "user": {"id": new_user.id, "username": new_user.username}})

# Get user profile
@app.route('/api/profile', methods=['GET'])
@login_required
def get_profile():
    user = User.query.get(current_user.id)
    
    # Create a dictionary with user data, excluding password
    profile_data = {
        'id': user.id,
        'username': user.username,
        'name': user.name or '',
        'phone': user.phone or '',
        'address': user.address or '',
        'preferences': user.preferences or {}
    }
    
    return jsonify({"status": "success", "profile": profile_data})

@app.route('/api/profile', methods=['PUT'])
@login_required
def update_profile():
    data = request.get_json()
    user = User.query.get(current_user.id)
    
    # Fields that can be updated
    allowed_fields = ['name', 'phone', 'address', 'preferences']
    
    for field in allowed_fields:
        if field in data:
            setattr(user, field, data[field])
    
    db.session.commit()
    
    # Return updated profile data
    profile_data = {
        'id': user.id,
        'username': user.username,
        'name': user.name or '',
        'phone': user.phone or '',
        'address': user.address or '',
        'preferences': user.preferences or {}
    }
    
    return jsonify({
        "status": "success", 
        "message": "Profile updated successfully",
        "profile": profile_data
    })

@app.route('/api/change-password', methods=['POST'])
@login_required
def change_password():
    data = request.get_json()
    user = User.query.get(current_user.id)
    
    current_password = data.get('currentPassword')
    new_password = data.get('newPassword')
    
    # Verify current password
    if not check_password_hash(user.password, current_password):
        return jsonify({"status": "failed", "message": "Current password is incorrect"}), 400
    
    # Update password
    user.password = generate_password_hash(new_password)
    db.session.commit()
    
    return jsonify({"status": "success", "message": "Password changed successfully"})

# Add a command to create a test user
@app.cli.command("seed-db")
def seed_db():
    """Seed the database with initial test data."""
    # Create a test user
    test_user = User.query.filter_by(username="test@example.com").first()
    if not test_user:
        test_user = User(
            username="test@example.com",
            password=generate_password_hash("password123"),
            name="Test User",
            phone="555-1234",
            address="123 Test St, Test City"
        )
        db.session.add(test_user)
        db.session.commit()
        print("Test user created")
    else:
        print("Test user already exists")

if __name__ == '__main__':
    with app.app_context():
        # Create all tables
        db.create_all()
    app.run(debug=True)