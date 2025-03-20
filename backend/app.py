"""
Express Auto API - Flask Backend Application

This application provides a RESTful API for user management in the Express Auto system.
It handles user authentication, registration, and profile management operations.
"""

# Authors: Joshua, Rich, , , , ,

from flask import Flask, jsonify, request, session
from flask_cors import CORS
from flask_login import (
    LoginManager,
    UserMixin,
    login_user,
    logout_user,
    login_required,
    current_user,
)
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename  #
import os
import psycopg2
from psycopg2.extras import RealDictCursor
import boto3
import mimetypes
import uuid
import requests
from dotenv import load_dotenv


load_dotenv()


# Initialize Flask application
app = Flask(__name__)

# CONFIGURATION SETTINGS

"""If you dont have env set up"""
"""PASTE IN 'paste-here' BELOW, MAKE SURE TO REMOVE BEFORE YOU PUSH OR YOU WILL GET A COMMIT ERROR"""

# Database Configuration
DB_USER = os.getenv("DB_USER", "paste-here")
DB_PASSWORD = os.getenv("DB_PASSWORD", "paste-here")
DB_HOST = os.getenv("DB_HOST", "paste-here")
DB_PORT = os.getenv("DB_PORT", "paste-here")
DB_NAME = os.getenv("DB_NAME", "paste-here")

# Security Configuration
app.config["SECRET_KEY"] = os.environ.get(
    "SECRET_KEY", "your-secret-key"
)  # Use environment variable in production
app.config["SESSION_COOKIE_HTTPONLY"] = (
    True  # Prevents JavaScript from accessing cookies
)
app.config["SESSION_COOKIE_SAMESITE"] = "Lax"  # Provides CSRF protection

# CORS Configuration for React frontend
CORS(app, supports_credentials=True, origins=["http://localhost:5173"])

# AWS S3 Configuration
AWS_ACCESS_KEY = os.getenv("AWS_ACCESS_KEY", "paste-here")
AWS_SECRET_KEY = os.getenv("AWS_SECRET_KEY", "paste-here")
AWS_REGION = os.getenv("AWS_REGION", "paste-here")
S3_BUCKET_NAME = os.getenv("S3_BUCKET_NAME", "paste-here")


s3_client = boto3.client(
    "s3",
    aws_access_key_id=AWS_ACCESS_KEY,
    aws_secret_access_key=AWS_SECRET_KEY,
    region_name=AWS_REGION,
)

# LOGIN MANAGEMENT

# Initialize Flask-Login
login_manager = LoginManager()
login_manager.init_app(app)

# DATABASE CONNECTION


def get_db_connection():
    """Establishes and returns a connection to the PostgreSQL database"""
    return psycopg2.connect(
        dbname=DB_NAME,
        user=DB_USER,
        password=DB_PASSWORD,
        host=DB_HOST,
        port=DB_PORT,
        cursor_factory=RealDictCursor,  # Returns results as dictionaries
    )


# USER MODEL


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
        return User(user_data["user_id"], user_data["email"])
    return None


# API ROUTES - SYSTEM


@app.route("/api/db-test", methods=["GET"])
def test_db():
    """Tests the database connection and returns the current timestamp"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT NOW();")
        result = cursor.fetchone()
        cursor.close()
        conn.close()
        return (
            jsonify(
                {
                    "status": "success",
                    "message": f"Connected to PostgreSQL at {result['now']}",
                }
            ),
            200,
        )
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


# API ROUTES - AUTHENTICATION


@app.route("/api/login", methods=["POST"])
def login():
    """Authenticates a user and creates a session"""
    data = request.get_json()

    # Validate input data
    if not data or not data.get("email") or not data.get("password"):
        return (
            jsonify({"status": "failed", "message": "Email and password required"}),
            400,
        )

    conn = get_db_connection()
    cursor = conn.cursor()

    # Fetch user data from database
    cursor.execute(
        "SELECT user_id, email, password_hash FROM users WHERE email = %s",
        (data.get("email"),),
    )
    user_data = cursor.fetchone()

    cursor.close()
    conn.close()

    # Verify password and create user session
    if user_data and check_password_hash(
        user_data["password_hash"], data.get("password")
    ):
        user = User(user_data["user_id"], user_data["email"])
        login_user(user)
        return (
            jsonify(
                {"status": "success", "user": {"id": user.id, "email": user.email}}
            ),
            200,
        )

    return jsonify({"status": "failed", "message": "Invalid email or password"}), 401


@app.route("/api/logout", methods=["POST"])
def logout():
    """Ends the user's session"""
    try:
        logout_user()
    except Exception as e:
        # logging error; there's an issue here I just bootlegged it so it just clears the session token
        print(f"Error here during logout {e}")
    session.clear()
    return jsonify({"status": "success"}), 200


@app.route("/api/user", methods=["GET"])
@login_required
def get_user():
    """Returns the currently authenticated user's details"""
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(
            "SELECT first_name, last_name, profile_picture_url FROM users WHERE user_id = %s",
            (current_user.id,),
        )
        user_details = cursor.fetchone() or {}
        first_name = user_details.get("first_name", "")
        last_name = user_details.get("last_name", "")
        profile_photo = user_details.get("profile_picture_url", "")
        name = (
            f"{first_name} {last_name}".strip()
            if (first_name or last_name)
            else current_user.email
        )
        return (
            jsonify(
                {
                    "id": current_user.id,
                    "email": current_user.email,
                    "first_name": first_name,
                    "last_name": last_name,
                    "name": name,
                    "profile_picture_url": profile_photo,
                }
            ),
            200,
        )
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500
    finally:
        cursor.close()
        conn.close()


# API ROUTES - USER MANAGEMENT


@app.route("/api/add-user", methods=["POST"])
def add_user():
    """Creates a new user account"""
    data = request.get_json()

    # Validate input data
    if not data or not data.get("email") or not data.get("password"):
        return (
            jsonify({"status": "failed", "message": "Email and password required"}),
            400,
        )

    # Hash the password for secure storage
    hashed_password = generate_password_hash(data["password"])

    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        # Insert new user into database
        cursor.execute(
            "INSERT INTO users (email, password_hash, first_name, last_name, phone) VALUES (%s, %s, %s, %s, %s) RETURNING user_id",
            (
                data["email"],
                hashed_password,
                data.get("first_name", ""),
                data.get("last_name", ""),
                data.get("phone", ""),
            ),
        )
        new_user_id = cursor.fetchone()["user_id"]
        conn.commit()
        return (
            jsonify(
                {
                    "status": "success",
                    "message": f"User {data['email']} added!",
                    "user_id": new_user_id,
                }
            ),
            201,
        )
    except Exception as e:
        conn.rollback()
        return jsonify({"status": "error", "message": str(e)}), 500
    finally:
        cursor.close()
        conn.close()


@app.route("/api/get-users", methods=["GET"])
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


@app.route("/api/profile", methods=["PUT"])
@login_required
def update_profile():
    """Updates the current user's profile information"""
    data = request.get_json()
    user_id = current_user.id  # Always use the logged in user's ID

    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(
            "UPDATE users SET first_name = %s, last_name = %s, phone = %s WHERE user_id = %s RETURNING user_id",
            (data.get("first_name"), data.get("last_name"), data.get("phone"), user_id),
        )
        updated_user = cursor.fetchone()
        if not updated_user:
            return jsonify({"status": "error", "message": "User not found"}), 404

        conn.commit()
        return (
            jsonify({"status": "success", "message": "User updated successfully"}),
            200,
        )
    except Exception as e:
        conn.rollback()
        return jsonify({"status": "error", "message": str(e)}), 500
    finally:
        cursor.close()
        conn.close()


@app.route("/api/delete-user/<int:user_id>", methods=["DELETE"])
@login_required
def delete_user(user_id):
    """Removes a user from the system"""
    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        # Delete user from database
        cursor.execute(
            "DELETE FROM users WHERE user_id = %s RETURNING user_id", (user_id,)
        )
        deleted_user = cursor.fetchone()
        if not deleted_user:
            return jsonify({"status": "error", "message": "User not found"}), 404

        conn.commit()
        return (
            jsonify({"status": "success", "message": "User deleted successfully"}),
            200,
        )
    except Exception as e:
        conn.rollback()
        return jsonify({"status": "error", "message": str(e)}), 500
    finally:
        cursor.close()
        conn.close()


# VEHICLES


# Add a vehicle
# Update this function in your Flask application to include vehicle_image_url


@app.route("/api/add-vehicle", methods=["POST"])
@login_required
def add_vehicle():
    data = request.get_json()
    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        # Check if we need to include vehicle_image_url in the query
        if data.get("vehicle_image_url"):
            cursor.execute(
                """
                INSERT INTO vehicles (
                    user_id, make, model, year, vin, license_plate, 
                    color, mileage, engine_type, transmission, 
                    is_primary, vehicle_image_url
                ) 
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s) 
                RETURNING vehicle_id
                """,
                (
                    current_user.id,
                    data["make"],
                    data["model"],
                    data["year"],
                    data.get("vin"),
                    data.get("license_plate"),
                    data.get("color"),
                    data.get("mileage"),
                    data.get("engine_type"),
                    data.get("transmission"),
                    data.get("is_primary", False),
                    data.get("vehicle_image_url"),
                ),
            )
        else:
            # Original query without vehicle_image_url
            cursor.execute(
                """
                INSERT INTO vehicles (
                    user_id, make, model, year, vin, license_plate, 
                    color, mileage, engine_type, transmission, is_primary
                ) 
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s) 
                RETURNING vehicle_id
                """,
                (
                    current_user.id,
                    data["make"],
                    data["model"],
                    data["year"],
                    data.get("vin"),
                    data.get("license_plate"),
                    data.get("color"),
                    data.get("mileage"),
                    data.get("engine_type"),
                    data.get("transmission"),
                    data.get("is_primary", False),
                ),
            )

        new_vehicle_id = cursor.fetchone()["vehicle_id"]
        conn.commit()
        return (
            jsonify(
                {
                    "status": "success",
                    "message": "Vehicle added!",
                    "vehicle_id": new_vehicle_id,
                }
            ),
            201,
        )
    except Exception as e:
        conn.rollback()
        return jsonify({"status": "error", "message": str(e)}), 500
    finally:
        cursor.close()
        conn.close()


# Get all vehicles for the logged-in user
@app.route("/api/get-vehicles", methods=["GET"])
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
@app.route("/api/update-vehicle/<int:vehicle_id>", methods=["PUT"])
@login_required
def update_vehicle(vehicle_id):
    data = request.get_json()
    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        cursor.execute(
            "UPDATE vehicles SET make = %s, model = %s, year = %s, color = %s, mileage = %s "
            "WHERE vehicle_id = %s AND user_id = %s RETURNING vehicle_id",
            (
                data["make"],
                data["model"],
                data["year"],
                data.get("color"),
                data.get("mileage"),
                vehicle_id,
                current_user.id,
            ),
        )
        updated_vehicle = cursor.fetchone()
        if not updated_vehicle:
            return (
                jsonify(
                    {
                        "status": "error",
                        "message": "Vehicle not found or not authorized",
                    }
                ),
                404,
            )

        conn.commit()
        return jsonify({"status": "success", "message": "Vehicle updated!"}), 200
    except Exception as e:
        conn.rollback()
        return jsonify({"status": "error", "message": str(e)}), 500
    finally:
        cursor.close()
        conn.close()


# Vehicle Photo:
@app.route("/api/upload-vehicle-photo", methods=["POST"])
@login_required
def upload_vehicle_photo():
    """Handles upload of vehicle photos to S3 and updates vehicle records"""
    # Check if file is present in request
    if "file" not in request.files:
        return jsonify({"status": "error", "message": "No file uploaded"}), 400

    file = request.files["file"]
    vehicle_id = request.form.get("vehicle_id")

    # Validate file
    if file.filename == "":
        return jsonify({"status": "error", "message": "No file selected"}), 400

    if not allowed_file(file.filename):
        return jsonify({"status": "error", "message": "File type not allowed"}), 400

    # Create unique filename
    filename = f"vehicle_{uuid.uuid4().hex}_{secure_filename(file.filename)}"

    # Properly detect content type based on file extension
    content_type = mimetypes.guess_type(filename)[0] or "image/jpeg"

    # Debug logging
    print(f"Uploading file: {filename}, Content-Type: {content_type}")

    try:
        # Upload to S3
        s3_client.upload_fileobj(
            file,
            S3_BUCKET_NAME,
            filename,
            ExtraArgs={
                "CacheControl": "max-age=86400",  # Cache for 1 day
                "ContentType": content_type,
                "ACL": "public-read",  # Make it publicly accessible
            },
        )

        # Construct the URL to the uploaded file
        file_url = f"https://{S3_BUCKET_NAME}.s3.{AWS_REGION}.amazonaws.com/{filename}"

        # Debug logging
        print(f"File uploaded successfully. URL: {file_url}")

        # If vehicle_id is provided, update the existing vehicle
        if vehicle_id and vehicle_id.isdigit():
            conn = get_db_connection()
            cursor = conn.cursor()

            try:
                # Update the vehicle record with the new image URL
                cursor.execute(
                    "UPDATE vehicles SET vehicle_image_url = %s WHERE vehicle_id = %s AND user_id = %s RETURNING vehicle_id",
                    (file_url, vehicle_id, current_user.id),
                )

                updated = cursor.fetchone()
                if not updated:
                    # If no rows were updated, either the vehicle doesn't exist or doesn't belong to this user
                    return (
                        jsonify(
                            {
                                "status": "error",
                                "message": "Vehicle not found or you don't have permission to update it",
                            }
                        ),
                        404,
                    )

                conn.commit()
            except Exception as db_error:
                conn.rollback()
                print(f"Database error: {str(db_error)}")
                raise db_error  # Re-raise to be caught by the outer try/except
            finally:
                cursor.close()
                conn.close()

        # Return success response with the URL
        return (
            jsonify(
                {
                    "status": "success",
                    "message": "Vehicle photo uploaded successfully",
                    "vehicle_image_url": file_url,
                }
            ),
            200,
        )

    except Exception as e:
        print(f"Error uploading vehicle photo: {str(e)}")
        return (
            jsonify({"status": "error", "message": f"Error uploading file: {str(e)}"}),
            500,
        )


# Get vehicle image


@app.route("/api/get-vehicle-image/<int:vehicle_id>", methods=["GET"])
@login_required
def get_vehicle_image(vehicle_id):
    """Retrieves the image URL for a specific vehicle"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        # Only return the image URL for vehicles belonging to the current user
        cursor.execute(
            "SELECT vehicle_image_url FROM vehicles WHERE vehicle_id = %s AND user_id = %s",
            (vehicle_id, current_user.id),
        )

        result = cursor.fetchone()
        cursor.close()
        conn.close()

        if not result:
            return (
                jsonify(
                    {
                        "status": "error",
                        "message": "Vehicle not found or not authorized",
                    }
                ),
                404,
            )

        # Return the image URL (could be null)
        return (
            jsonify(
                {"status": "success", "vehicle_image_url": result["vehicle_image_url"]}
            ),
            200,
        )

    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


# REVIEWS


# Fetch Google reviews for a business using its place_id.
@app.route("/api/reviews", methods=["GET"])
def get_reviews():
    try:
        place_id = "ChIJv55qw2fuwIkReDtLLJcfUYk"

        # First, get the place details which include reviews
        url = "https://maps.googleapis.com/maps/api/place/details/json"

        params = {
            "reviews_sort": "highest",  # Get highest reviews first
            "place_id": place_id,
            "fields": "name,formatted_address,reviews",
            "key": os.getenv("GOOGLE_MAPS_API_KEY"),  # make a env file and add api key
        }

        # Make the request to Google Places API
        response = requests.get(url, params=params)
        response.raise_for_status()  # Raise exception for HTTP errors

        # Parse the response
        data = response.json()

        # Check if the request was successful
        if data["status"] != "OK":
            return (
                jsonify(
                    {
                        "error": f"Google API returned error: {data['status']}",
                        "details": data.get("error_message", "No details provided"),
                    }
                ),
                400,
            )

        # Extract business name and reviews
        business_name = data["result"].get("name", "Unknown Business")
        reviews = data["result"].get("reviews", [])

        # Filter reviews to only include those with a rating of 4 or higher
        filtered_reviews = [
            review for review in reviews if review.get("rating", 0) >= 4
        ]

        # Format the response using filtered reviews
        result = {
            "business_name": business_name,
            "place_id": place_id,
            "reviews_count": len(filtered_reviews),
            "reviews": filtered_reviews,
        }

        return jsonify(result)

    # Handle request-related errors (network issues, invalid responses, etc.)
    except requests.exceptions.RequestException as e:
        return jsonify({"error": f"Error fetching reviews: {str(e)}"}), 500

    # Catch any other unexpected errors
    except Exception as e:
        return jsonify({"error": f"Unexpected error: {str(e)}"}), 500


# NOTIFICATIONS


## Get user notifications
@app.route("/api/get-notifications", methods=["GET"])
@login_required
def get_notifications():
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(
            "SELECT * FROM notifications WHERE user_id = %s AND is_read = FALSE ORDER BY created_at DESC",
            (current_user.id,),
        )
        notifications = cursor.fetchall()
        return jsonify({"status": "success", "notifications": notifications}), 200
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500
    finally:
        cursor.close()
        conn.close()


@app.route("/api/send-notification", methods=["POST"])
def send_notification():
    data = request.get_json()
    user_id = data.get("user_id")
    title = data.get("title", "Notification")
    message = data.get("message", "")
    notification_type = data.get("type", "info")  # default type
    related_id = data.get("related_id")  # optional

    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(
            """
            INSERT INTO notifications (user_id, title, message, type, related_id)
            VALUES (%s, %s, %s, %s, %s) RETURNING notification_id
            """,
            (user_id, title, message, notification_type, related_id),
        )
        notification_id = cursor.fetchone()["notification_id"]
        conn.commit()
        return jsonify({"status": "success", "notification_id": notification_id}), 201
    except Exception as e:
        conn.rollback()
        return jsonify({"status": "error", "message": str(e)}), 500
    finally:
        cursor.close()
        conn.close()


@app.route("/api/mark-notification-read/<int:notification_id>", methods=["PUT"])
@login_required
def mark_notification_read(notification_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(
            "UPDATE notifications SET is_read = TRUE WHERE notification_id = %s AND user_id = %s",
            (notification_id, current_user.id),
        )
        if cursor.rowcount == 0:
            return (
                jsonify(
                    {
                        "status": "error",
                        "message": "Notification not found or not authorized",
                    }
                ),
                404,
            )

        conn.commit()
        return (
            jsonify({"status": "success", "message": "Notification marked as read"}),
            200,
        )

    except Exception as e:
        conn.rollback()
        return jsonify({"status": "error", "message": str(e)}), 500
    finally:
        cursor.close()
        conn.close()


# LOYALTY POINTS
# # Get user loyalty points
@app.route("/api/get-loyalty-points", methods=["GET"])
@login_required
def get_loyalty_points():
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(
            "SELECT points_balance, total_points_earned, last_updated FROM loyalty_points WHERE user_id = %s",
            (current_user.id,),
        )
        points = cursor.fetchone()
        if not points:
            # Return default loyalty points values if record is missing
            points = {
                "points_balance": 0,
                "total_points_earned": 0,
                "last_updated": None,
            }
        return jsonify({"status": "success", "points": points}), 200
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500
    finally:
        cursor.close()
        conn.close()


# Add points after service completion
@app.route("/api/add-loyalty-points", methods=["POST"])
@login_required
def add_loyalty_points():
    data = request.get_json()
    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        cursor.execute(
            """
            INSERT INTO loyalty_points (user_id, points_balance, total_points_earned, last_updated)
            VALUES (%s, %s, %s, NOW())
            ON CONFLICT (user_id)
            DO UPDATE SET
                points_balance = loyalty_points.points_balance + EXCLUDED.points_balance,
                total_points_earned = loyalty_points.total_points_earned + EXCLUDED.total_points_earned,
                last_updated = NOW()
            RETURNING points_balance
            """,
            (current_user.id, data["points"], data["points"]),
        )
        updated_points = cursor.fetchone()
        if not updated_points:
            return jsonify({"status": "error", "message": "Failed to add points"}), 500

        conn.commit()
        return (
            jsonify(
                {
                    "status": "success",
                    "message": "Points added!",
                    "points_balance": updated_points["points_balance"],
                }
            ),
            200,
        )

    except Exception as e:
        conn.rollback()
        return jsonify({"status": "error", "message": str(e)}), 500
    finally:
        cursor.close()
        conn.close()


# Admin Dashboard API


# Get system analytics (Admin Only)
@app.route("/api/admin-dashboard", methods=["GET"])
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

        cursor.execute(
            "SELECT SUM(total_amount) AS total_revenue FROM invoices WHERE status = 'paid';"
        )
        total_revenue = cursor.fetchone()["total_revenue"]

        return (
            jsonify(
                {
                    "status": "success",
                    "total_users": total_users,
                    "total_services": total_services,
                    "total_revenue": total_revenue,
                }
            ),
            200,
        )
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500
    finally:
        cursor.close()
        conn.close()


#   MEDIA API

# Allowed file extensions
ALLOWED_EXTENSIONS = {"png", "jpg", "jpeg", "gif", "pdf"}


def allowed_file(filename):
    """Check if the file has an allowed extension"""
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS


@app.route("/api/upload-media", methods=["POST"])
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
            ExtraArgs={
                "CacheControl": "public, max-age=86400",
                "ContentType": "image/jpeg",
                "ACL": "public-read",
                # TODO: Probably want to change this, its not secure
            },
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
            (
                current_user.id,
                content_type,
                file_url,
                request.form.get("title", ""),
                request.form.get("description", ""),
            ),
        )
        media_id = cursor.fetchone()["media_id"]
        conn.commit()
        cursor.close()
        conn.close()

        return (
            jsonify(
                {
                    "status": "success",
                    "message": "File uploaded!",
                    "file_url": file_url,
                    "media_id": media_id,
                }
            ),
            201,
        )

    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


@app.route("/api/get-media", methods=["GET"])
@login_required
def get_user_media():
    """Retrieves all media files uploaded by the logged-in user."""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute(
            "SELECT media_id, file_url, title, description FROM media WHERE user_id = %s",
            (current_user.id,),
        )
        media_files = cursor.fetchall()
        cursor.close()
        conn.close()

        return jsonify({"status": "success", "media": media_files}), 200

    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


@app.route("/api/get-media-url/<int:media_id>", methods=["GET"])
@login_required
def get_presigned_url(media_id):
    """Generates a temporary presigned URL for a media file in S3."""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute(
            "SELECT file_url FROM media WHERE media_id = %s AND user_id = %s",
            (media_id, current_user.id),
        )
        result = cursor.fetchone()

        if not result:
            return jsonify({"status": "error", "message": "File not found"}), 404

        file_key = result["file_url"].split("/")[-1]

        presigned_url = s3_client.generate_presigned_url(
            "get_object",
            Params={"Bucket": S3_BUCKET_NAME, "Key": file_key},
            ExpiresIn=3600,  # Link expires in 1 hour
        )

        return jsonify({"status": "success", "presigned_url": presigned_url}), 200

    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


@app.route("/api/delete-media/<int:media_id>", methods=["DELETE"])
@login_required
def delete_media(media_id):
    """Deletes a media file from both S3 and the database."""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute(
            "SELECT file_url FROM media WHERE media_id = %s AND user_id = %s",
            (media_id, current_user.id),
        )
        result = cursor.fetchone()

        if not result:
            return jsonify({"status": "error", "message": "File not found"}), 404

        file_key = result["file_url"].split("/")[-1]

        # Delete from S3
        s3_client.delete_object(Bucket=S3_BUCKET_NAME, Key=file_key)

        # Delete from database
        cursor.execute("DELETE FROM media WHERE media_id = %s", (media_id,))
        conn.commit()

        return (
            jsonify({"status": "success", "message": "File deleted successfully"}),
            200,
        )

    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

    finally:
        cursor.close()
        conn.close()


# USER PROFILE TEST POINT
@app.route("/api/upload-profile-photo", methods=["POST"])
@login_required
def upload_profile_photo():
    if "file" not in request.files:
        return jsonify({"success": False, "message": "No file uploaded"}), 400

    file = request.files["file"]

    if file.filename == "":
        return jsonify({"success": False, "message": "No file selected"}), 400

    if not allowed_file(file.filename):
        return jsonify({"success": False, "message": "File type not allowed"}), 400

    filename = f"{uuid.uuid4().hex}_{secure_filename(file.filename)}"
    content_type = mimetypes.guess_type(filename)[0] or "application/octet-stream"

    try:
        # Include ACL: public-read to make the object accessible
        s3_client.upload_fileobj(
            file,
            S3_BUCKET_NAME,
            filename,
            ExtraArgs={
                "CacheControl": "public, max-age=86400",
                "ContentType": content_type,
                "ACL": "public-read",  # <-- Add this line
            },
        )
        file_url = f"https://{S3_BUCKET_NAME}.s3.{AWS_REGION}.amazonaws.com/{filename}"

        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        cursor.execute(
            "UPDATE users SET profile_picture_url = %s WHERE user_id = %s RETURNING profile_picture_url",
            (file_url, current_user.id),
        )
        updated = cursor.fetchone()
        conn.commit()
        cursor.close()
        conn.close()

        return (
            jsonify(
                {
                    "success": True,
                    "message": "Profile photo updated",
                    "profile_picture_url": updated["profile_picture_url"],
                }
            ),
            200,
        )

    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500


# APPLICATION ENTRY POINT

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)  # Set debug=False in production
