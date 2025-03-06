"""
Express Auto API - Flask Backend Application

This application provides a RESTful API for user management in the Express Auto system.
It handles user authentication, registration, and profile management operations.
"""
# ============================================================================

 #Authors: Joshua, , , , , ,

# ============================================================================


from flask import Flask, jsonify, request, session
from flask_cors import CORS
from flask_login import LoginManager, UserMixin, login_user, logout_user, login_required, current_user
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename  # 
import os
import psycopg2
from psycopg2.extras import RealDictCursor
import boto3
import mimetypes


# Initialize Flask application
app = Flask(__name__)

# ============================================================================
# CONFIGURATION SETTINGS
# ============================================================================

# Database Configuration
DB_USER = "postgres"
DB_PASSWORD = "BeachHouse"  # Note: In production, use environment variables for secrets
DB_HOST = "express-auto.c6bogymw63tm.us-east-1.rds.amazonaws.com"
DB_PORT = "5432"
DB_NAME = "xpressauto"

# Security Configuration
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'your-secret-key')  # Use environment variable in production
app.config['SESSION_COOKIE_HTTPONLY'] = True  # Prevents JavaScript from accessing cookies
app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'  # Provides CSRF protection

# CORS Configuration for React frontend
CORS(app, supports_credentials=True, origins=["http://localhost:5173"])

#S3 bucker keys, we should switch these to a .env to make it more secure..

"""PASTE KEYS IN POOP BELOW, MAKE SURE TO REMOVE BEFORE YOU PUSH OR YOU WILL GET A COMMIT ERROR"""

AWS_ACCESS_KEY = "poop"  # Use environment variable in production
AWS_SECRET_KEY = "poop"  # Use environment variable in production
AWS_REGION = "poop"      # Use environment variable in production
S3_BUCKET_NAME = "poop"  # Use environment variable in production


s3_client = boto3.client(
    "s3",
    aws_access_key_id=AWS_ACCESS_KEY,
    aws_secret_access_key=AWS_SECRET_KEY,
    region_name=AWS_REGION
)

# ============================================================================
# LOGIN MANAGEMENT
# ============================================================================

# Initialize Flask-Login
login_manager = LoginManager()
login_manager.init_app(app)

# ============================================================================
# DATABASE CONNECTION
# ============================================================================

def get_db_connection():
    """Establishes and returns a connection to the PostgreSQL database"""
    return psycopg2.connect(
        dbname=DB_NAME,
        user=DB_USER,
        password=DB_PASSWORD,
        host=DB_HOST,
        port=DB_PORT,
        cursor_factory=RealDictCursor  # Returns results as dictionaries
    )

# ============================================================================
# USER MODEL
# ============================================================================

class User(UserMixin):
    """User model for authentication purposes"""
    def __init__(self, user_id, email):
        self.id = user_id
        self.email = email

@login_manager.user_loader
def load_user(user_id):
    """Loads a user from the database based on user_id"""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT user_id, email FROM users WHERE user_id = %s", (user_id,))
    user_data = cursor.fetchone()
    cursor.close()
    conn.close()
    
    if user_data:
        return User(user_data['user_id'], user_data['email'])
    return None

# ============================================================================
# API ROUTES - SYSTEM
# ============================================================================

@app.route('/api/db-test', methods=['GET'])
def test_db():
    """Tests the database connection and returns the current timestamp"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT NOW();")
        result = cursor.fetchone()
        cursor.close()
        conn.close()
        return jsonify({"status": "success", "message": f"Connected to PostgreSQL at {result['now']}"}), 200
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

# ============================================================================
# API ROUTES - AUTHENTICATION
# ============================================================================

@app.route('/api/login', methods=['POST'])
def login():
    """Authenticates a user and creates a session"""
    data = request.get_json()

    # Validate input data
    if not data or not data.get("email") or not data.get("password"):
        return jsonify({"status": "failed", "message": "Email and password required"}), 400

    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Fetch user data from database
    cursor.execute("SELECT user_id, email, password_hash FROM users WHERE email = %s", (data.get('email'),))
    user_data = cursor.fetchone()
    
    cursor.close()
    conn.close()

    # Verify password and create user session
    if user_data and check_password_hash(user_data['password_hash'], data.get('password')):
        user = User(user_data['user_id'], user_data['email'])
        login_user(user)
        return jsonify({"status": "success", "user": {"id": user.id, "email": user.email}}), 200
    
    return jsonify({"status": "failed", "message": "Invalid email or password"}), 401

@app.route('/api/logout', methods=['POST'])

def logout():
    """Ends the user's session"""
    try:
        logout_user()
    except Exception as e:
        #logging error; there's an issue here I just bootlegged it so it just clears the session token
        print(f"Error here during logout {e}")
    session.clear()
    return jsonify({"status": "success"}), 200

@app.route('/api/user', methods=['GET'])
@login_required
def get_user():
    """Returns the currently authenticated user's details"""
    return jsonify({
        "id": current_user.id,
        "email": current_user.email
        "first_name" : user_details.get("first_name", ""),
        "last_name": user_details.get("last_name", ""),
        "name": f"{user_details.get('first_name', '')} {user_details.get('last_name', '')}".strip()
    }), 200

# ============================================================================
# API ROUTES - USER MANAGEMENT
# ============================================================================

@app.route('/api/add-user', methods=['POST'])
def add_user():
    """Creates a new user account"""
    data = request.get_json()
    
    # Validate input data
    if not data or not data.get("email") or not data.get("password"):
        return jsonify({"status": "failed", "message": "Email and password required"}), 400

    # Hash the password for secure storage
    hashed_password = generate_password_hash(data["password"]) 

    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        # Insert new user into database
        cursor.execute(
            "INSERT INTO users (email, password_hash, first_name, last_name, phone) VALUES (%s, %s, %s, %s, %s) RETURNING user_id",
            (data["email"], hashed_password, data.get("first_name", ""), data.get("last_name", ""), data.get("phone", ""))
        )
        new_user_id = cursor.fetchone()["user_id"]
        conn.commit()
        return jsonify({"status": "success", "message": f"User {data['email']} added!", "user_id": new_user_id}), 201
    except Exception as e:
        conn.rollback()
        return jsonify({"status": "error", "message": str(e)}), 500
    finally:
        cursor.close()
        conn.close()

@app.route('/api/get-users', methods=['GET'])
def get_users():
    """Retrieves a list of all users"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT user_id, email, first_name, last_name FROM users;")
        users = cursor.fetchall()
        cursor.close()
        conn.close()
        return jsonify({"status": "success", "users": users}), 200
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/api/update-user/<int:user_id>', methods=['PUT'])
@login_required
def update_user(user_id):
    """Updates a user's profile information"""
    data = request.get_json()
    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        # Update user data in database
        cursor.execute(
            "UPDATE users SET first_name = %s, last_name = %s, phone = %s WHERE user_id = %s RETURNING user_id",
            (data.get("first_name"), data.get("last_name"), data.get("phone"), user_id)
        )
        updated_user = cursor.fetchone()
        if not updated_user:
            return jsonify({"status": "error", "message": "User not found"}), 404
        
        conn.commit()
        return jsonify({"status": "success", "message": "User updated successfully"}), 200
    except Exception as e:
        conn.rollback()
        return jsonify({"status": "error", "message": str(e)}), 500
    finally:
        cursor.close()
        conn.close()

@app.route('/api/delete-user/<int:user_id>', methods=['DELETE'])
@login_required
def delete_user(user_id):
    """Removes a user from the system"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        # Delete user from database
        cursor.execute("DELETE FROM users WHERE user_id = %s RETURNING user_id", (user_id,))
        deleted_user = cursor.fetchone()
        if not deleted_user:
            return jsonify({"status": "error", "message": "User not found"}), 404
        
        conn.commit()
        return jsonify({"status": "success", "message": "User deleted successfully"}), 200
    except Exception as e:
        conn.rollback()
        return jsonify({"status": "error", "message": str(e)}), 500
    finally:
        cursor.close()
        conn.close()

# ============================================================================
# VEHICLES
# ============================================================================
# Add a vehicle
@app.route('/api/add-vehicle', methods=['POST'])
@login_required
def add_vehicle():
    data = request.get_json()
    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        cursor.execute(
            "INSERT INTO vehicles (user_id, make, model, year, vin, license_plate, color, mileage, engine_type, transmission, is_primary) "
            "VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s) RETURNING vehicle_id",
            (current_user.id, data["make"], data["model"], data["year"], data.get("vin"),
             data.get("license_plate"), data.get("color"), data.get("mileage"), data.get("engine_type"),
             data.get("transmission"), data.get("is_primary", False))
        )
        new_vehicle_id = cursor.fetchone()["vehicle_id"]
        conn.commit()
        return jsonify({"status": "success", "message": "Vehicle added!", "vehicle_id": new_vehicle_id}), 201
    except Exception as e:
        conn.rollback()
        return jsonify({"status": "error", "message": str(e)}), 500
    finally:
        cursor.close()
        conn.close()

# Get all vehicles for the logged-in user
@app.route('/api/get-vehicles', methods=['GET'])
@login_required
def get_vehicles():
    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        cursor.execute("SELECT * FROM vehicles WHERE user_id = %s", (current_user.id,))
        vehicles = cursor.fetchall()
        return jsonify({"status": "success", "vehicles": vehicles}), 200
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500
    finally:
        cursor.close()
        conn.close()

# Update a vehicle
@app.route('/api/update-vehicle/<int:vehicle_id>', methods=['PUT'])
@login_required
def update_vehicle(vehicle_id):
    data = request.get_json()
    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        cursor.execute(
            "UPDATE vehicles SET make = %s, model = %s, year = %s, color = %s, mileage = %s "
            "WHERE vehicle_id = %s AND user_id = %s RETURNING vehicle_id",
            (data["make"], data["model"], data["year"], data.get("color"), data.get("mileage"), vehicle_id, current_user.id)
        )
        updated_vehicle = cursor.fetchone()
        if not updated_vehicle:
            return jsonify({"status": "error", "message": "Vehicle not found or not authorized"}), 404
        
        conn.commit()
        return jsonify({"status": "success", "message": "Vehicle updated!"}), 200
    except Exception as e:
        conn.rollback()
        return jsonify({"status": "error", "message": str(e)}), 500
    finally:
        cursor.close()
        conn.close()

# Delete a vehicle
@app.route('/api/delete-vehicle/<int:vehicle_id>', methods=['DELETE'])
@login_required
def delete_vehicle(vehicle_id):
    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        cursor.execute("DELETE FROM vehicles WHERE vehicle_id = %s AND user_id = %s RETURNING vehicle_id", (vehicle_id, current_user.id))
        deleted_vehicle = cursor.fetchone()
        if not deleted_vehicle:
            return jsonify({"status": "error", "message": "Vehicle not found or not authorized"}), 404

        conn.commit()
        return jsonify({"status": "success", "message": "Vehicle deleted!"}), 200
    except Exception as e:
        conn.rollback()
        return jsonify({"status": "error", "message": str(e)}), 500
    finally:
        cursor.close()
        conn.close()

# ============================================================================
#SERVICE HISTORY
# ============================================================================
# Add service history
@app.route('/api/add-service-history', methods=['POST'])
@login_required
def add_service_history():
    data = request.get_json()
    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        cursor.execute(
            "INSERT INTO service_history (vehicle_id, user_id, service_id, service_date, mileage_at_service, technician_id, price, notes, status) "
            "VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s) RETURNING history_id",
            (data["vehicle_id"], current_user.id, data["service_id"], data["service_date"], data.get("mileage_at_service"),
             data.get("technician_id"), data["price"], data.get("notes", ""), data.get("status", "completed"))
        )
        history_id = cursor.fetchone()["history_id"]
        conn.commit()
        return jsonify({"status": "success", "message": "Service history added!", "history_id": history_id}), 201
    except Exception as e:
        conn.rollback()
        return jsonify({"status": "error", "message": str(e)}), 500
    finally:
        cursor.close()
        conn.close()

# ============================================================================
#PAYMENT INVOICES
# ============================================================================
# Pay an invoice
@app.route('/api/pay-invoice/<int:invoice_id>', methods=['POST'])
@login_required
def pay_invoice(invoice_id):
    data = request.get_json()
    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        cursor.execute(
            "INSERT INTO payments (invoice_id, payment_method, amount, transaction_id) VALUES (%s, %s, %s, %s) RETURNING payment_id",
            (invoice_id, data["payment_method"], data["amount"], data.get("transaction_id"))
        )
        payment_id = cursor.fetchone()["payment_id"]

        # Mark invoice as paid
        cursor.execute("UPDATE invoices SET status = 'paid' WHERE invoice_id = %s", (invoice_id,))
        conn.commit()
        return jsonify({"status": "success", "message": "Invoice paid successfully!", "payment_id": payment_id}), 200
    except Exception as e:
        conn.rollback()
        return jsonify({"status": "error", "message": str(e)}), 500
    finally:
        cursor.close()
        conn.close()

# ============================================================================
#SERVICES AND SERVICE CATEGORIES
# ============================================================================
# Get all service categories
@app.route('/api/service-categories', methods=['GET'])
def get_service_categories():
    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        cursor.execute("SELECT category_id, name, description FROM service_categories;")
        categories = cursor.fetchall()
        return jsonify({"status": "success", "categories": categories}), 200
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500
    finally:
        cursor.close()
        conn.close()

# Add a new service category
@app.route('/api/add-service-category', methods=['POST'])
@login_required
def add_service_category():
    data = request.get_json()
    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        cursor.execute(
            "INSERT INTO service_categories (name, description) VALUES (%s, %s) RETURNING category_id",
            (data["name"], data.get("description", ""))
        )
        category_id = cursor.fetchone()["category_id"]
        conn.commit()
        return jsonify({"status": "success", "message": "Service category added!", "category_id": category_id}), 201
    except Exception as e:
        conn.rollback()
        return jsonify({"status": "error", "message": str(e)}), 500
    finally:
        cursor.close()
        conn.close()

# Get all services
@app.route('/api/services', methods=['GET'])
def get_services():
    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        cursor.execute("SELECT service_id, category_id, name, description, base_price, estimated_hours, is_active FROM services;")
        services = cursor.fetchall()
        return jsonify({"status": "success", "services": services}), 200
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500
    finally:
        cursor.close()
        conn.close()

# Add a new service
@app.route('/api/add-service', methods=['POST'])
@login_required
def add_service():
    data = request.get_json()
    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        cursor.execute(
            "INSERT INTO services (category_id, name, description, base_price, estimated_hours, is_active) VALUES (%s, %s, %s, %s, %s, %s) RETURNING service_id",
            (data["category_id"], data["name"], data["description"], data["base_price"], data.get("estimated_hours", 0), data.get("is_active", True))
        )
        service_id = cursor.fetchone()["service_id"]
        conn.commit()
        return jsonify({"status": "success", "message": "Service added!", "service_id": service_id}), 201
    except Exception as e:
        conn.rollback()
        return jsonify({"status": "error", "message": str(e)}), 500
    finally:
        cursor.close()
        conn.close()


# ============================================================================
# REVIEWS
# ============================================================================

# Add a review
@app.route('/api/add-review', methods=['POST'])
@login_required
def add_review():
    data = request.get_json()
    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        cursor.execute(
            "INSERT INTO reviews (user_id, service_history_id, service_rating, comment) VALUES (%s, %s, %s, %s) RETURNING review_id",
            (current_user.id, data["service_history_id"], data["service_rating"], data.get("comment", ""))
        )
        review_id = cursor.fetchone()["review_id"]
        conn.commit()
        return jsonify({"status": "success", "message": "Review submitted!", "review_id": review_id}), 201
    except Exception as e:
        conn.rollback()
        return jsonify({"status": "error", "message": str(e)}), 500
    finally:
        cursor.close()
        conn.close()

# Get all reviews for a service
@app.route('/api/get-reviews/<int:service_id>', methods=['GET'])
def get_reviews(service_id):
    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        cursor.execute(
            "SELECT r.review_id, r.service_rating, r.comment, u.email, r.created_at FROM reviews r "
            "JOIN users u ON r.user_id = u.user_id "
            "JOIN service_history sh ON r.service_history_id = sh.history_id "
            "WHERE sh.service_id = %s", (service_id,)
        )
        reviews = cursor.fetchall()
        return jsonify({"status": "success", "reviews": reviews}), 200
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500
    finally:
        cursor.close()
        conn.close()

# ============================================================================
#NOTIFICATIONS
# ============================================================================

## Get user notifications
@app.route('/api/get-notifications', methods=['GET'])
@login_required
def get_notifications():
    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        cursor.execute("SELECT * FROM notifications WHERE user_id = %s ORDER BY created_at DESC", (current_user.id,))
        notifications = cursor.fetchall()
        return jsonify({"status": "success", "notifications": notifications}), 200
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500
    finally:
        cursor.close()
        conn.close()

# Mark a notification as read
@app.route('/api/read-notification/<int:notification_id>', methods=['PUT'])
@login_required
def read_notification(notification_id):
    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        cursor.execute("UPDATE notifications SET is_read = TRUE WHERE notification_id = %s AND user_id = %s", (notification_id, current_user.id))
        conn.commit()
        return jsonify({"status": "success", "message": "Notification marked as read"}), 200
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500
    finally:
        cursor.close()
        conn.close()

# ============================================================================
#LOYALTY POINTS
# ============================================================================
# Get user loyalty points
@app.route('/api/get-loyalty-points', methods=['GET'])
@login_required
def get_loyalty_points():
    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        cursor.execute("SELECT points_balance, total_points_earned, last_updated FROM loyalty_points WHERE user_id = %s", (current_user.id,))
        points = cursor.fetchone()
        if not points:
            return jsonify({"status": "error", "message": "No points found"}), 404
        
        return jsonify({"status": "success", "points": points}), 200
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500
    finally:
        cursor.close()
        conn.close()

# Add points after service completion
@app.route('/api/add-loyalty-points', methods=['POST'])
@login_required
def add_loyalty_points():
    data = request.get_json()
    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        cursor.execute(
            "UPDATE loyalty_points SET points_balance = points_balance + %s, total_points_earned = total_points_earned + %s, last_updated = NOW() WHERE user_id = %s RETURNING points_balance",
            (data["points"], data["points"], current_user.id)
        )
        updated_points = cursor.fetchone()
        if not updated_points:
            return jsonify({"status": "error", "message": "Failed to add points"}), 500
        
        conn.commit()
        return jsonify({"status": "success", "message": "Points added!", "points_balance": updated_points["points_balance"]}), 200
    except Exception as e:
        conn.rollback()
        return jsonify({"status": "error", "message": str(e)}), 500
    finally:
        cursor.close()
        conn.close()


# ============================================================================
#Admin Dashboard API
# ============================================================================


# Get system analytics (Admin Only)
@app.route('/api/admin-dashboard', methods=['GET'])
@login_required
def admin_dashboard():
    if not current_user.email.endswith("@admin.com"):  # Simple check for admin role
        return jsonify({"status": "error", "message": "Unauthorized"}), 403

    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        cursor.execute("SELECT COUNT(*) AS total_users FROM users;")
        total_users = cursor.fetchone()["total_users"]

        cursor.execute("SELECT COUNT(*) AS total_services FROM service_history;")
        total_services = cursor.fetchone()["total_services"]

        cursor.execute("SELECT SUM(total_amount) AS total_revenue FROM invoices WHERE status = 'paid';")
        total_revenue = cursor.fetchone()["total_revenue"]

        return jsonify({
            "status": "success",
            "total_users": total_users,
            "total_services": total_services,
            "total_revenue": total_revenue
        }), 200
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500
    finally:
        cursor.close()
        conn.close()


# ============================================================================
#   MEDIA API
# ============================================================================


# Allowed file extensions
ALLOWED_EXTENSIONS = {"png", "jpg", "jpeg", "gif", "pdf"}

def allowed_file(filename):
    """Check if the file has an allowed extension"""
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS
@app.route('/api/upload-media', methods=['POST'])
@login_required
def upload_media():
    """Uploads media files to AWS S3 and stores metadata in the database."""
    if "file" not in request.files:
        return jsonify({"status": "error", "message": "No file uploaded"}), 400

    file = request.files["file"]
    if file.filename == "":
        return jsonify({"status": "error", "message": "No selected file"}), 400

    if not allowed_file(file.filename):
        return jsonify({"status": "error", "message": "File type not allowed"}), 400

    # Secure filename and determine content type
    filename = secure_filename(file.filename)
    content_type = mimetypes.guess_type(filename)[0] or "application/octet-stream"

    try:
        # Upload file to S3
        s3_client.upload_fileobj(
            file,
            S3_BUCKET_NAME,
            filename,
            ExtraArgs={"ContentType": content_type}  
        )

        # Construct file URL
        file_url = f"https://{S3_BUCKET_NAME}.s3.{AWS_REGION}.amazonaws.com/{filename}"

        # Store file info in the database
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute(
            """
            INSERT INTO media (user_id, media_type, file_url, title, description)
            VALUES (%s, %s, %s, %s, %s) RETURNING media_id
            """,
            (current_user.id, content_type, file_url, request.form.get("title", ""), request.form.get("description", ""))
        )
        media_id = cursor.fetchone()["media_id"]
        conn.commit()
        cursor.close()
        conn.close()

        return jsonify({
            "status": "success",
            "message": "File uploaded!",
            "file_url": file_url,
            "media_id": media_id
        }), 201

    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


@app.route('/api/get-media', methods=['GET'])
@login_required
def get_user_media():
    """Retrieves all media files uploaded by the logged-in user."""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT media_id, file_url, title, description FROM media WHERE user_id = %s", (current_user.id,))
        media_files = cursor.fetchall()
        cursor.close()
        conn.close()

        return jsonify({"status": "success", "media": media_files}), 200

    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


@app.route('/api/get-media-url/<int:media_id>', methods=['GET'])
@login_required
def get_presigned_url(media_id):
    """Generates a temporary presigned URL for a media file in S3."""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT file_url FROM media WHERE media_id = %s AND user_id = %s", (media_id, current_user.id))
        result = cursor.fetchone()

        if not result:
            return jsonify({"status": "error", "message": "File not found"}), 404

        file_key = result['file_url'].split("/")[-1]

        presigned_url = s3_client.generate_presigned_url(
            'get_object',
            Params={'Bucket': S3_BUCKET_NAME, 'Key': file_key},
            ExpiresIn=3600  # Link expires in 1 hour
        )

        return jsonify({"status": "success", "presigned_url": presigned_url}), 200

    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


@app.route('/api/delete-media/<int:media_id>', methods=['DELETE'])
@login_required
def delete_media(media_id):
    """Deletes a media file from both S3 and the database."""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT file_url FROM media WHERE media_id = %s AND user_id = %s", (media_id, current_user.id))
        result = cursor.fetchone()

        if not result:
            return jsonify({"status": "error", "message": "File not found"}), 404

        file_key = result['file_url'].split("/")[-1]

        # Delete from S3
        s3_client.delete_object(Bucket=S3_BUCKET_NAME, Key=file_key)

        # Delete from database
        cursor.execute("DELETE FROM media WHERE media_id = %s", (media_id,))
        conn.commit()

        return jsonify({"status": "success", "message": "File deleted successfully"}), 200

    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

    finally:
        cursor.close()
        conn.close()

# ============================================================================
# APPLICATION ENTRY POINT
# ============================================================================

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)  # Set debug=False in production




# ============================================================================
# ============================================================================
# ============================================================================
# ============================================================================
# ============================================================================
# ============================================================================
# ============================================================================
# PLEASE USE THESE TO MAKE CATAGORIES, THIS FILE IS GONNA BE GROSS
# ============================================================================
# if you use a font with ligatures it'll look better
# https://github.com/githubnext/monaspace <- cool font
