"""
Express Auto API - Flask Backend Application

This application provides a RESTful API for user management in the Express Auto system.
It handles user authentication, registration, and profile management operations.
"""

# Authors: Joshua, Rich, , , , ,

from flask import Flask, jsonify, request, session
from flask_mail import Mail, Message
from flask_cors import CORS
from flask_login import (
    LoginManager,
    UserMixin,
    login_user,
    logout_user,
    login_required,
    current_user,
)
from twilio.rest import Client
from twilio.base.exceptions import TwilioRestException
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename  #
import os
import psycopg2
from psycopg2.extras import RealDictCursor
import boto3
import mimetypes
import uuid
import requests
from datetime import datetime
from dotenv import load_dotenv
import stripe
from decimal import Decimal
from functools import wraps

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

# Stripe
stripe.api_key = os.getenv("STRIPE_SECRET_KEY")
STRIPE_WEBHOOK_SECRET = os.getenv(
    "STRIPE_WEBHOOK_SECRET"
)  # For webhook verification later need to pull this from stripe cli tool

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


# Custom Decorator for Admin Users
def admin_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not current_user.is_authenticated or not current_user.isAdmin:
            return (
                jsonify({"status": "error", "message": "Admin access required"}),
                403,
            )  # Forbidden
        return f(*args, **kwargs)

    return decorated_function


class User(UserMixin):
    """User model for authentication purposes"""

    def __init__(self, user_id, email, isAdmin=False):
        self.id = user_id
        self.email = email
        self.isAdmin = isAdmin


@login_manager.user_loader
def load_user(user_id):
    """Loads a user from the database based on user_id"""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        "SELECT user_id, email,  is_admin FROM users WHERE user_id = %s", (user_id,)
    )
    user_data = cursor.fetchone()
    cursor.close()
    conn.close()

    if user_data:
        return User(user_data["user_id"], user_data["email"], user_data["is_admin"])
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
        # Fetch is_admin along with other details
        cursor.execute(
            "SELECT first_name, last_name, profile_picture_url, is_admin FROM users WHERE user_id = %s",
            (current_user.id,),
        )
        user_details = cursor.fetchone() or {}
        first_name = user_details.get("first_name", "")
        last_name = user_details.get("last_name", "")
        profile_photo = user_details.get("profile_picture_url", "")
        # Get the is_admin status from the database fetch
        is_admin = user_details.get("is_admin", False)

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
                    "is_admin": is_admin,  # Include is_admin in the response
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


@app.route("/api/make-admin", methods=["POST"])
@login_required  # Ensure the requesting user is logged in
@admin_required  # Ensure the requesting user is an admin
def make_admin():
    """
    Toggles the is_admin status for a specified user.
    Expects a JSON payload with 'user_id'.
    """
    data = request.get_json()
    target_user_id = data.get("user_id")

    # --- Input Validation ---
    if not target_user_id:
        return (
            jsonify(
                {"status": "error", "message": "Missing 'user_id' in request body"}
            ),
            400,
        )

    # Prevent admin from accidentally removing their own admin status via this route
    # Admins should manage their status through direct DB access or a dedicated profile setting
    if target_user_id == current_user.id:
        return (
            jsonify(
                {
                    "status": "error",
                    "message": "Cannot change your own admin status via this endpoint.",
                }
            ),
            403,
        )

    conn = None
    cursor = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        # --- Fetch current admin status ---
        cursor.execute(
            "SELECT is_admin FROM users WHERE user_id = %s", (target_user_id,)
        )
        user_record = cursor.fetchone()

        if not user_record:
            return (
                jsonify(
                    {
                        "status": "error",
                        "message": f"User with ID {target_user_id} not found",
                    }
                ),
                404,
            )

        current_status = user_record["is_admin"]
        new_status = not current_status  # Toggle the boolean value

        # --- Update the user's admin status ---
        cursor.execute(
            "UPDATE users SET is_admin = %s WHERE user_id = %s",
            (new_status, target_user_id),
        )

        # --- Check if update was successful ---
        if cursor.rowcount == 0:
            # Should not happen if fetch succeeded, but good safety check
            conn.rollback()  # Rollback any potential partial changes
            return (
                jsonify(
                    {"status": "error", "message": "Failed to update user status."}
                ),
                500,
            )

        conn.commit()  # Commit the transaction

        status_message = "promoted to admin" if new_status else "demoted from admin"
        app.logger.info(
            f"Admin user {current_user.id} {status_message} user {target_user_id}"
        )  # Add logging

        return (
            jsonify(
                {
                    "status": "success",
                    "message": f"User ID {target_user_id} has been {status_message}.",
                    "user_id": target_user_id,
                    "is_admin": new_status,
                }
            ),
            200,
        )

    except psycopg2.Error as db_error:
        app.logger.error(
            f"Database error in make_admin for user {target_user_id}: {db_error}"
        )
        if conn:
            conn.rollback()  # Rollback on database error
        return jsonify({"status": "error", "message": "Database error occurred."}), 500
    except Exception as e:
        app.logger.error(
            f"Unexpected error in make_admin for user {target_user_id}: {e}"
        )
        if conn:
            conn.rollback()  # Rollback on general error
        return (
            jsonify(
                {
                    "status": "error",
                    "message": f"An unexpected error occurred: {str(e)}",
                }
            ),
            500,
        )
    finally:

        if cursor:
            cursor.close()
        if conn:
            conn.close()


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
@login_required
@admin_required
def get_users():
    """Retrieves a list of all users"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute(
            "SELECT user_id, email, first_name, last_name, phone FROM users;"
        )  # Added phone field
        users = cursor.fetchall()
        cursor.close()
        conn.close()

        # Format users for display
        formatted_users = []
        for u in users:
            full_name = f"{u.get('first_name', '')} {u.get('last_name', '')}".strip()
            formatted_users.append(
                {
                    "user_id": u["user_id"],
                    "email": u["email"],
                    "full_name": full_name or u["email"],
                    "phone": u.get("phone", ""),  # Include phone in the response
                }
            )

        return jsonify({"status": "success", "users": formatted_users}), 200

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
@admin_required
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


# VEHICLES-vehicle


@app.route("/api/update-vehicle-status/<int:vehicle_id>", methods=["PUT"])
@login_required
@admin_required
def update_vehicle_status(vehicle_id):
    data = request.get_json()
    new_status = data.get("vehicle_status")

    if new_status not in ["Waiting", "Active", "OffLot"]:
        return jsonify({"status": "error", "message": "Invalid vehicle status"}), 400

    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(
            "UPDATE vehicles SET vehicle_status = %s WHERE vehicle_id = %s RETURNING vehicle_id",
            (new_status, vehicle_id),
        )
        updated = cursor.fetchone()
        if not updated:
            return jsonify({"status": "error", "message": "Vehicle not found"}), 404

        conn.commit()
        return jsonify({"status": "success", "message": "Vehicle status updated!"}), 200
    except Exception as e:
        conn.rollback()
        return jsonify({"status": "error", "message": str(e)}), 500
    finally:
        cursor.close()
        conn.close()


def allowed_file(filename):
    ALLOWED_EXTENSIONS = {"png", "jpg", "jpeg", "gif", "webp"}
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS


@app.route("/api/add-vehicle", methods=["POST"])
@login_required
def add_vehicle():
    data = request.get_json()
    print("==== ADD VEHICLE DEBUG ====")
    print(f"Current user ID: {current_user.id}")
    print(f"Raw data received: {data}")

    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        # Get is_primary value (default to False if not provided)
        is_primary = data.get("is_primary", False)
        print(f"is_primary: {is_primary}, type: {type(is_primary)}")

        # Get the vehicle status from data or use default 'OffLot'
        vehicle_status = data.get("vehicle_status", "OffLot")
        print(f"vehicle_status: {vehicle_status}")

        # Make sure it's one of the allowed values
        if vehicle_status not in ["Waiting", "Active", "OffLot"]:
            vehicle_status = "OffLot"  # Default to OffLot if invalid
            print(f"Adjusted vehicle_status to: {vehicle_status}")

        # Check if we need to include vehicle_image_url in the query
        vehicle_image_url = data.get("vehicle_image_url")
        print(f"vehicle_image_url: {vehicle_image_url}")

        if vehicle_image_url:
            sql_query = """
                INSERT INTO vehicles (
                    user_id, make, model, year, vin, license_plate, 
                    color, mileage, engine_type, transmission,
                    is_primary, vehicle_image_url, vehicle_status
                ) 
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s) 
                RETURNING vehicle_id
                """

            params = (
                current_user.id,
                data["make"],
                data["model"],
                data["year"],
                data.get("vin") or None,  # Convert empty string to None
                data.get("license_plate") or None,
                data.get("color") or None,
                data.get("mileage") or None,
                data.get("engine_type") or None,
                data.get("transmission") or None,
                is_primary,
                vehicle_image_url,
                vehicle_status,
            )

            print(f"SQL query (with image): {sql_query}")
            print(f"SQL params (with image): {params}")

            cursor.execute(sql_query, params)
        else:
            sql_query = """
                INSERT INTO vehicles (
                    user_id, make, model, year, vin, license_plate, 
                    color, mileage, engine_type, transmission,
                    is_primary, vehicle_status
                ) 
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s) 
                RETURNING vehicle_id
                """

            params = (
                current_user.id,
                data["make"],
                data["model"],
                data["year"],
                data.get("vin") or None,
                data.get("license_plate") or None,
                data.get("color") or None,
                data.get("mileage") or None,
                data.get("engine_type") or None,
                data.get("transmission") or None,
                is_primary,
                vehicle_status,
            )

            print(f"SQL query (without image): {sql_query}")
            print(f"SQL params (without image): {params}")

            cursor.execute(sql_query, params)

        new_vehicle_id = cursor.fetchone()["vehicle_id"]
        conn.commit()
        print(f"Vehicle added successfully with ID: {new_vehicle_id}")
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
        print(f"Error adding vehicle: {str(e)}")
        import traceback

        print("Full traceback:")
        traceback.print_exc()
        return jsonify({"status": "error", "message": str(e)}), 500
    finally:
        cursor.close()
        conn.close()
        print("==== END ADD VEHICLE DEBUG ====")


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


ALLOWED_EXTENSIONS = {"png", "jpg", "jpeg", "gif", "pdf", "webp"}


# Vehicle Photo:
@app.route("/api/upload-vehicle-photo", methods=["POST"])
@login_required
def upload_vehicle_photo():
    """Handles upload of vehicle photos to S3 and updates vehicle records"""
    # Check if file is present in request
    if "file" not in request.files:
        print("No file part in request")
        return jsonify({"status": "error", "message": "No file uploaded"}), 400

    file = request.files["file"]
    vehicle_id = request.form.get("vehicle_id")

    # Validate file
    if file.filename == "":
        print("No selected file")
        return jsonify({"status": "error", "message": "No file selected"}), 400

    if not allowed_file(file.filename):
        print(f"File type not allowed: {file.filename}")
        return jsonify({"status": "error", "message": "File type not allowed"}), 400

    # Create unique filename
    filename = f"vehicle_{uuid.uuid4().hex}_{secure_filename(file.filename)}"
    content_type = mimetypes.guess_type(filename)[0] or "image/jpeg"

    print(f"Processing upload for file: {filename}, content_type: {content_type}")
    print(f"S3 bucket name: {S3_BUCKET_NAME}, AWS region: {AWS_REGION}")

    # Verify AWS credentials are available
    if not AWS_ACCESS_KEY or not AWS_SECRET_KEY or not AWS_REGION or not S3_BUCKET_NAME:
        print("ERROR: Missing AWS credentials or configuration")
        return (
            jsonify({"status": "error", "message": "Server configuration error"}),
            500,
        )

    try:
        print("Attempting to upload file to S3...")
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

        print("File uploaded successfully to S3")

        # Construct the URL to the uploaded file
        file_url = f"https://{S3_BUCKET_NAME}.s3.{AWS_REGION}.amazonaws.com/{filename}"
        print(f"Generated S3 URL: {file_url}")

        # If vehicle_id is provided, update the existing vehicle
        if vehicle_id and vehicle_id.isdigit():
            print(f"Updating existing vehicle with ID: {vehicle_id}")
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
                    print(
                        f"Vehicle not found or permission denied for update: {vehicle_id}"
                    )
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
                print(f"Vehicle {vehicle_id} updated with image URL")
            except Exception as db_error:
                conn.rollback()
                print(f"Database error during vehicle update: {str(db_error)}")
                raise db_error  # Re-raise to be caught by the outer try/except
            finally:
                cursor.close()
                conn.close()

        # Return success response with the URL
        print(f"Upload successful, returning URL: {file_url}")
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
        print(f"ERROR uploading vehicle photo: {str(e)}")
        import traceback

        traceback.print_exc()
        return (
            jsonify({"status": "error", "message": f"Error uploading file: {str(e)}"}),
            500,
        )

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


@app.route("/api/get-vehicles/<int:user_id>", methods=["GET"])
def get_vehicles_for_user(user_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT * FROM vehicles WHERE user_id = %s", (user_id,))
        vehicles = cursor.fetchall()
        return jsonify({"status": "success", "vehicles": vehicles}), 200
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500
    finally:
        cursor.close()
        conn.close()


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


# INVOICES


@app.route("/api/create-invoice", methods=["POST"])
@login_required
@admin_required
def create_invoice():
    try:
        data = request.json
        if not data:
            raise BadRequest("No JSON data received.")
    except BadRequest as e:
        return (
            jsonify(
                {"status": "error", "message": f"Invalid request: {e.description}"}
            ),
            400,
        )

    # --- Get required data from payload ---
    try:
        user_id = data["user_id"]  # Get user_id directly
        vehicle_id = data["vehicle_id"]
        subtotal = data[
            "subtotal"
        ]  # Ensure frontend sends this if needed, or calculate it
        tax_amount = data.get("tax_amount", 0)  # Use .get for optional fields
        discount_amount = data.get("discount_amount", 0)
        total_amount = data["total_amount"]
        status = data["status"]
        due_date = data["due_date"]
        notes = data.get("notes", None)  # Use .get for optional fields
        invoice_items = data.get("items", [])  # Expect items if needed
    except KeyError as e:
        # Handle missing required fields
        return (
            jsonify({"status": "error", "message": f"Missing required field: {e}"}),
            400,
        )

    conn = None  # Initialize conn to None
    cursor = None  # Initialize cursor to None
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        # --- Optional: Validate user_id and vehicle_id exist ---
        cursor.execute("SELECT 1 FROM users WHERE user_id = %s", (user_id,))
        if not cursor.fetchone():
            return jsonify({"status": "error", "message": "User not found"}), 404

        cursor.execute("SELECT 1 FROM vehicles WHERE vehicle_id = %s", (vehicle_id,))
        if not cursor.fetchone():
            return jsonify({"status": "error", "message": "Vehicle not found"}), 404
        # --- End Optional Validation ---

        # --- Generate Invoice Number ---
        current_year = datetime.now().year
        cursor.execute(
            "SELECT COUNT(*) as count FROM invoices WHERE EXTRACT(YEAR FROM issue_date) = %s",
            (current_year,),
        )
        # Ensure fetchone() didn't return None before accessing 'count'
        count_result = cursor.fetchone()
        count = (count_result["count"] + 1) if count_result else 1
        invoice_number = f"INV-{current_year}-{count:04d}"

        # --- Insert Invoice ---
        cursor.execute(
            """
            INSERT INTO invoices (user_id, vehicle_id, invoice_number, subtotal, tax_amount, discount_amount, total_amount, status, due_date, notes)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s) RETURNING invoice_id;
            """,
            (
                user_id,  # Use the user_id from the payload
                vehicle_id,
                invoice_number,
                subtotal,
                tax_amount,
                discount_amount,
                total_amount,
                status,
                due_date,
                notes,
            ),
        )
        # Ensure fetchone() didn't return None before accessing 'invoice_id'
        invoice_result = cursor.fetchone()
        if not invoice_result:
            raise Exception(
                "Failed to insert invoice or retrieve invoice_id."
            )  # Or a more specific exception
        invoice_id = invoice_result["invoice_id"]

        # --- Insert Invoice Items (if any) ---
        for item in invoice_items:
            # Validate item structure before accessing keys
            required_keys = [
                "description",
                "quantity",
                "unit_price",
            ]  # Add other required keys like service_id/history_id if mandatory
            if not all(key in item for key in required_keys):
                raise ValueError("Missing required key in invoice item.")

            cursor.execute(
                """
                INSERT INTO invoice_items (invoice_id, service_id, history_id, description, quantity, unit_price, discount_amount, total_price)
                VALUES (%s,%s,%s,%s,%s,%s,%s,%s);
                """,
                (
                    invoice_id,
                    item.get("service_id"),  # Use .get() if optional
                    item.get("history_id"),  # Use .get() if optional
                    item["description"],
                    item["quantity"],
                    item["unit_price"],
                    item.get("discount_amount", 0),  # Use .get() if optional
                    item.get("total_price"),  # Use .get() if optional or calculate
                ),
            )

        # --- Commit and Respond ---
        conn.commit()
        return (
            jsonify(
                {
                    "status": "success",
                    "invoice_id": invoice_id,
                    "invoice_number": invoice_number,
                }
            ),
            201,
        )

    except (
        Exception,
        psycopg2.DatabaseError,
    ) as e:  # Catch specific DB errors too if using psycopg2
        if conn:
            conn.rollback()
        # Log the detailed error for debugging on the server
        print(f"Error creating invoice: {e}")  # Or use proper logging
        # Return a more generic error to the client
        return (
            jsonify(
                {
                    "status": "error",
                    "message": "An internal error occurred while creating the invoice.",
                }
            ),
            500,
        )
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()


# Create Invoice
@app.route("/api/create-payment-intent", methods=["POST"])
@login_required
# Ensure user is logged in
def create_payment_intent():
    conn = None  # Initialize conn to None for finally block safety
    cursor = None  # Initialize cursor to None
    try:
        # 1. Get invoice_id from the frontend request
        data = request.get_json()
        invoice_id = data.get("invoice_id")

        if not invoice_id:
            return jsonify(error={"message": "Missing invoice_id"}), 400

        # 2. Database Lookup (using established pattern)
        conn = get_db_connection()
        cursor = conn.cursor()

        # Fetch invoice details AND verify ownership by current_user
        cursor.execute(
            """SELECT invoice_id, total_amount, status, currency 
               FROM invoices 
               WHERE invoice_id = %s AND user_id = %s""",
            (invoice_id, current_user.id),  # Check user_id!
        )
        invoice = cursor.fetchone()

        if not invoice:
            # Either invoice doesn't exist OR it doesn't belong to this user
            return (
                jsonify(error={"message": "Invoice not found or not authorized"}),
                404,
            )

        total_amount_decimal = invoice["total_amount"]
        status = invoice["status"]
        # Assumes you added the currency column, defaults to 'usd' if somehow NULL
        currency = invoice.get("currency", "usd").lower()

        # 3. Check Invoice Status
        # Modify this check based on your exact status names ('unpaid', 'due', etc.)
        if status.lower() not in ["unpaid", "due"]:
            return (
                jsonify(
                    error={"message": f'Invoice status is "{status}", not payable'}
                ),
                400,
            )

        # 4. Convert amount to cents (or smallest currency unit)
        amount_in_cents = int(total_amount_decimal * 100)

        # 5. Create Payment Intent with Stripe
        payment_intent = stripe.PaymentIntent.create(
            amount=amount_in_cents,
            currency=currency,
            # Add metadata to link back to your system - ESSENTIAL for webhook
            metadata={"invoice_id": invoice_id, "user_id": current_user.id},
            description=f"Payment for Invoice ID {invoice_id}",  # Optional but helpful
        )

        # 6. Send client_secret back to the frontend
        return jsonify(clientSecret=payment_intent.client_secret)

    except stripe.error.StripeError as e:
        app.logger.error(f"Stripe API error: {e}")
        return jsonify(error={"message": str(e)}), 500
    except psycopg2.Error as db_error:
        app.logger.error(f"Database error: {db_error}")
        # Don't rollback here as it was likely a SELECT, but log it
        return jsonify(error={"message": "Database error accessing invoice"}), 500
    except Exception as e:
        app.logger.error(f"Error creating payment intent: {e}")
        return jsonify(error={"message": "Internal server error"}), 500
    finally:
        # Ensure cursor and connection are closed
        if cursor:
            cursor.close()
        if conn:
            conn.close()


# mark invoices as paid - CORRECTED VERSION
@app.route("/api/mark-invoice-paid", methods=["POST"])
@login_required
def mark_invoice_paid():
    """
    Endpoint called by the frontend immediately after successful
    client-side Stripe payment confirmation. Marks the invoice as paid.
    Uses the integer invoice_id (Primary Key).
    """
    # Add logging to see received data
    app.logger.info(f"Received request data for /mark-invoice-paid: {request.data}")
    received_json = request.get_json()
    app.logger.info(f"Parsed JSON for /mark-invoice-paid: {received_json}")

    # 1. Get data from the JSON request body
    data = received_json  # Use the already parsed JSON
    if not data:
        app.logger.warning("Mark invoice paid request missing JSON body.")
        return jsonify({"status": "error", "message": "Missing JSON request body"}), 400

    # --- CHANGE HERE: Expect 'invoice_id' (integer) ---
    invoice_id = data.get("invoice_id")
    payment_intent_id = data.get("paymentIntentId")

    # 2. Validate input presence - Check for invoice_id now
    if not invoice_id or not payment_intent_id:
        app.logger.warning(
            f"Mark invoice paid request missing invoice_id ({invoice_id}) or paymentIntentId ({payment_intent_id})."
        )
        # Corrected error message to reflect expected keys
        return (
            jsonify(
                {
                    "status": "error",
                    "message": "Missing 'invoice_id' or 'paymentIntentId'",
                }
            ),
            400,
        )

    # 3. Validate/Convert invoice_id type to integer
    try:
        invoice_id = int(invoice_id)
    except (ValueError, TypeError):
        app.logger.warning(
            f"Mark invoice paid request received invalid invoice_id type: {invoice_id}"
        )
        return (
            jsonify({"status": "error", "message": "'invoice_id' must be an integer"}),
            400,
        )

    conn = None
    cursor = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor()  # Assumes RealDictCursor

        # 4. Verify Ownership & Check Status using integer invoice_id
        # --- CHANGE HERE: Query by invoice_id ---
        cursor.execute(
            """SELECT status FROM invoices
               WHERE invoice_id = %s AND user_id = %s""",
            (invoice_id, current_user.id),
        )
        invoice_record = cursor.fetchone()

        if not invoice_record:
            app.logger.warning(
                f"User {current_user.id} tried to mark non-existent/unauthorized invoice ID {invoice_id} as paid."
            )
            # Corrected error message
            return (
                jsonify(
                    {
                        "status": "error",
                        "message": "Invoice not found or not authorized",
                    }
                ),
                404,
            )

        current_status = invoice_record.get("status", "").lower()

        if current_status == "paid":
            app.logger.info(
                f"Invoice ID {invoice_id} already marked as paid. Client confirmation received for PI: {payment_intent_id}"
            )
            return (
                jsonify(
                    {"status": "success", "message": "Invoice already marked as paid"}
                ),
                200,
            )

        # 5. Update the Invoice Status using integer invoice_id
        # --- CHANGE HERE: Update using invoice_id ---
        cursor.execute(
            """UPDATE invoices
               SET status = 'paid'
               WHERE invoice_id = %s AND user_id = %s AND status != 'paid'""",
            (invoice_id, current_user.id),
        )

        if cursor.rowcount == 0:
            app.logger.info(
                f"Invoice ID {invoice_id} status update via client had no effect (likely already paid by webhook). PI: {payment_intent_id}"
            )
            pass

        # 6. Commit the transaction
        conn.commit()
        # Use invoice_id in log
        app.logger.info(
            f"Invoice ID {invoice_id} successfully marked as paid by user {current_user.id} via client confirmation. PI: {payment_intent_id}"
        )

        # 7. Return success response
        return (
            jsonify(
                {"status": "success", "message": "Invoice successfully marked as paid"}
            ),
            200,
        )

    except psycopg2.Error as db_error:
        # Use invoice_id in log
        app.logger.error(
            f"Database error marking invoice ID {invoice_id} paid (Client Confirm - User {current_user.id}): {db_error}"
        )
        if conn:
            conn.rollback()
        return jsonify({"status": "error", "message": "Database error occurred."}), 500
    except Exception as e:
        app.logger.error(
            f"Unexpected error marking invoice ID {invoice_id} paid (Client Confirm - User {current_user.id}): {e}"
        )
        if conn:
            conn.rollback()
        return (
            jsonify(
                {"status": "error", "message": "An unexpected server error occurred."}
            ),
            500,
        )
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()


@app.route("/api/webhook", methods=["POST"])
def stripe_webhook():
    payload = request.data  # Raw request body
    sig_header = request.headers.get("Stripe-Signature")
    event = None

    # Ensure the webhook secret is configured
    if not STRIPE_WEBHOOK_SECRET:
        app.logger.error("Stripe webhook secret not configured.")
        return jsonify(error="Webhook secret not configured"), 500

    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, STRIPE_WEBHOOK_SECRET
        )
    except ValueError as e:
        # Invalid payload
        app.logger.error(f"Webhook ValueError: {e}")
        return jsonify(error="Invalid payload"), 400
    except stripe.error.SignatureVerificationError as e:
        # Invalid signature
        app.logger.error(f"Webhook SignatureVerificationError: {e}")
        return jsonify(error="Invalid signature"), 400
    except Exception as e:
        app.logger.error(f"Webhook general error during construct_event: {e}")
        return jsonify(error=str(e)), 500

    # Webhook Handler
    # --- Handle the event ---
    conn = None
    cursor = None
    try:
        # Handle the payment_intent.succeeded event
        if event["type"] == "payment_intent.succeeded":
            payment_intent = event["data"]["object"]  # contains a stripe.PaymentIntent
            app.logger.info(
                f"Webhook received: PaymentIntent {payment_intent['id']} succeeded."
            )

            # Extract metadata
            metadata = payment_intent.get("metadata", {})
            invoice_id = metadata.get("invoice_id")
            user_id = metadata.get("user_id")  # Good to have if stored

            if not invoice_id:
                app.logger.error(
                    f"Webhook Error: Missing invoice_id in metadata for PaymentIntent {payment_intent['id']}"
                )
                # Still return 200 to Stripe, but log the error
                return jsonify(success=True)

            amount_received = payment_intent["amount_received"]  # Amount in cents

            # TODO: Connect to DB and update invoice status & record payment
            #       using invoice_id and payment_intent details.
            #       Remember to handle idempotency (check if already processed).

            conn = get_db_connection()
            cursor = conn.cursor()

            # ---- Database Update Logic (To be refined/added) ----

            # 1. Check if payment already recorded (Idempotency)
            cursor.execute(
                "SELECT 1 FROM payments WHERE transaction_id = %s",
                (payment_intent["id"],),
            )
            if cursor.fetchone():
                app.logger.info(
                    f"Webhook: Payment for transaction_id {payment_intent['id']} already recorded."
                )
                # Already processed, acknowledge successfully
                return jsonify(success=True)

            # 2. Use a transaction
            conn.autocommit = False  # Start transaction block (psycopg2 specific)

            # 3. Update Invoice Status
            cursor.execute(
                """UPDATE invoices 
                   SET status = 'paid' 
                   WHERE invoice_id = %s AND status != 'paid'""",  # Avoid re-updating if somehow already paid
                (invoice_id,),
            )
            if cursor.rowcount == 0:
                app.logger.warning(
                    f"Webhook: Invoice {invoice_id} not found or already marked paid during update attempt for PI {payment_intent['id']}."
                )
                # Decide if this is an error or just info. Maybe proceed to log payment anyway?
                # For now, let's proceed to log the payment, but log a warning.

            # 4. Insert into Payments Table
            paid_amount_decimal = (
                Decimal(amount_received) / 100
            )  # Convert cents to decimal

            cursor.execute(
                """INSERT INTO payments 
                   (invoice_id, payment_method, amount, payment_date, transaction_id, status, notes) 
                   VALUES (%s, %s, %s, %s, %s, %s, %s)""",
                (
                    invoice_id,
                    "stripe",  # Payment method
                    paid_amount_decimal,  # Amount paid (Decimal)
                    datetime.fromtimestamp(
                        payment_intent["created"]
                    ),  # Use PaymentIntent creation time or now()
                    payment_intent["id"],  # Stripe Payment Intent ID
                    "completed",  # Payment status
                    f"Stripe PaymentIntent ID: {payment_intent['id']}",  # Optional notes
                ),
            )

            # 5. Commit Transaction
            conn.commit()
            app.logger.info(
                f"Webhook: Successfully processed PaymentIntent {payment_intent['id']} for invoice {invoice_id}. Invoice marked paid, payment logged."
            )

        # Handle other event types (optional)
        elif event["type"] == "payment_intent.payment_failed":
            payment_intent = event["data"]["object"]
            # Optional: Update invoice status to 'failed' or log the failure
            app.logger.warning(
                f"Webhook received: PaymentIntent {payment_intent['id']} failed."
            )

        else:
            app.logger.info(f"Webhook received unhandled event type: {event['type']}")

    except psycopg2.Error as db_error:
        app.logger.error(f"Webhook DB Error: {db_error}")
        if conn:
            conn.rollback()  # Rollback on error
        # Don't return 500 to Stripe here, let it retry if possible.
        # Log it aggressively. Maybe return 200 but log? Or let it retry?
        # For now, let's return 500 to signal a processing failure.
        return jsonify(error="Database processing error"), 500
    except Exception as e:
        app.logger.error(f"Webhook handler general error: {e}")
        if conn:
            conn.rollback()  # Rollback on error
        return jsonify(error="Internal processing error"), 500
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.autocommit = True  # Reset autocommit
            conn.close()

    # Acknowledge receipt to Stripe
    return jsonify(success=True)


# Get Invoice
@app.route("/api/get-user-invoices", methods=["GET"])
@login_required
def get_user_invoices():
    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        cursor.execute(
            """
            SELECT invoice_id, invoice_number, subtotal, tax_amount, discount_amount, 
                   total_amount, status, issue_date, due_date, notes,
                   v.make, v.model, v.year
            FROM invoices i
            LEFT JOIN vehicles v ON i.vehicle_id = v.vehicle_id
            WHERE i.user_id = %s
            ORDER BY i.issue_date DESC;
        """,
            (current_user.id,),
        )

        invoices = cursor.fetchall()

        return jsonify({"status": "success", "invoices": invoices}), 200
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500
    finally:
        cursor.close()
        conn.close()


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
@login_required
@admin_required
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


# Add points
@app.route("/api/add-loyalty-points", methods=["POST"])
@login_required
@admin_required
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


#   MEDIA API's


@app.route("/api/upload-media", methods=["POST"])
@login_required
def upload_media():
    if "file" not in request.files:
        return jsonify({"status": "error", "message": "No file uploaded"}), 400

    file = request.files["file"]

    if file.filename == "":
        return jsonify({"status": "error", "message": "No file selected"}), 400

    vehicle_id = request.form.get("vehicle_id")
    description = request.form.get("description", "")
    title = secure_filename(file.filename)  # using filename as title by default
    media_type = "image"

    filename = f"media_{uuid.uuid4().hex}_{secure_filename(file.filename)}"
    content_type = mimetypes.guess_type(filename)[0] or "application/octet-stream"

    try:
        # Upload file to S3
        s3_client.upload_fileobj(
            file,
            S3_BUCKET_NAME,
            filename,
            ExtraArgs={
                "ContentType": content_type,
                "CacheControl": "max-age=86400",
                "ACL": "public-read",
            },
        )

        file_url = f"https://{S3_BUCKET_NAME}.s3.{AWS_REGION}.amazonaws.com/{filename}"

        # Insert into database
        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute(
            """
            INSERT INTO media (
                user_id, vehicle_id, media_type, file_url, title, description, is_public
            ) VALUES (%s, %s, %s, %s, %s, %s, %s)
            RETURNING media_id
            """,
            (
                current_user.id,
                vehicle_id if vehicle_id else None,
                media_type,
                file_url,
                description or None,
                title,
                True,
            ),
        )

        media_id = cursor.fetchone()["media_id"]
        conn.commit()

        return (
            jsonify(
                {
                    "status": "success",
                    "message": "Media uploaded successfully!",
                    "media_id": media_id,
                    "file_url": file_url,
                }
            ),
            201,
        )

    except Exception as e:
        print(f"Error uploading media: {e}")
        return jsonify({"status": "error", "message": str(e)}), 500

    finally:
        cursor.close()
        conn.close()


@app.route("/api/get-user-media", methods=["GET"])
@login_required
def get_user_media():
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        # Retrieve all media linked to the user's ID, along with associated vehicle info
        cursor.execute(
            """
            SELECT 
                m.media_id, m.vehicle_id, m.file_url, m.thumbnail_url, m.title, m.description, m.upload_date, m.media_type,
                v.make, v.model, v.year, v.license_plate
            FROM media m
            LEFT JOIN vehicles v ON m.vehicle_id = v.vehicle_id
            WHERE m.user_id = %s
            ORDER BY m.upload_date DESC;
        """,
            (current_user.id,),
        )

        media_records = cursor.fetchall()

        # Organize media by vehicle
        vehicles_media = {}
        for media in media_records:
            vehicle_id = media["vehicle_id"] or "unassigned"

            vehicle_info = {
                "vehicle_id": vehicle_id,
                "make": media.get("make", "Unassigned"),
                "model": media.get("model", ""),
                "year": media.get("year", ""),
                "license_plate": media.get("license_plate", ""),
            }

            if vehicle_id not in vehicles_media:
                vehicles_media[vehicle_id] = {"vehicle_info": vehicle_info, "media": []}

            vehicles_media[vehicle_id]["media"].append(
                {
                    "media_id": media["media_id"],
                    "file_url": media["file_url"],
                    "thumbnail_url": media["thumbnail_url"],
                    "title": media["title"],
                    "description": media["description"],
                    "upload_date": media["upload_date"],
                    "media_type": media["media_type"],
                }
            )

        # Convert the dictionary to a list for easier frontend handling
        organized_media = list(vehicles_media.values())

        return jsonify({"status": "success", "vehicles_media": organized_media}), 200

    except Exception as e:
        conn.rollback()
        print(f"Error fetching user media: {e}")
        return jsonify({"status": "error", "message": str(e)}), 500

    finally:
        cursor.close()
        conn.close()


@app.route("/api/delete-media/<int:media_id>", methods=["DELETE"])
@login_required
def delete_media(media_id):
    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        # First, verify media ownership and retrieve URL for deletion from S3
        cursor.execute(
            """
            SELECT file_url FROM media
            WHERE media_id = %s AND user_id = %s
        """,
            (media_id, current_user.id),
        )

        media = cursor.fetchone()

        if not media:
            return (
                jsonify(
                    {"status": "error", "message": "Media not found or unauthorized"}
                ),
                404,
            )

        file_url = media["file_url"]

        # Delete media record from database
        cursor.execute(
            """
            DELETE FROM media WHERE media_id = %s AND user_id = %s
        """,
            (media_id, current_user.id),
        )
        conn.commit()

        # Extract S3 object key from file_url
        file_key = file_url.split(
            f"https://{S3_BUCKET_NAME}.s3.{AWS_REGION}.amazonaws.com/"
        )[-1]

        # Delete from S3
        s3_client.delete_object(Bucket=S3_BUCKET_NAME, Key=file_key)

        return (
            jsonify({"status": "success", "message": "Media deleted successfully"}),
            200,
        )

    except Exception as e:
        conn.rollback()
        print(f"Error deleting media: {e}")
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
        s3_client.upload_fileobj(
            file,
            S3_BUCKET_NAME,
            filename,
            ExtraArgs={
                "CacheControl": "public, max-age=86400",
                "ContentType": content_type,
                "ACL": "public-read",  # Include ACL: public-read to make the object accessible
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


# EMAIL
@app.route("/api/contact", methods=["POST"])
def contact():
    app.config["MAIL_SERVER"] = "smtp.gmail.com"
    app.config["MAIL_PORT"] = 587
    app.config["MAIL_USERNAME"] = os.environ.get("MAIL_USERNAME")
    app.config["MAIL_PASSWORD"] = os.environ.get("MAIL_PASSWORD")
    app.config["MAIL_RECIPIENT"] = os.environ.get("MAIL_RECIPIENT")
    app.config["MAIL_USE_TLS"] = True
    app.config["MAIL_USE_SSL"] = False
    mail = Mail(app)

    data = request.json
    captcha_token = data.get("captchaToken")

    # Verify with hCaptcha API
    verification_data = {
        "secret": os.environ.get("HCAPTCHA_SECRET_KEY"),
        "response": captcha_token,
        "sitekey": "939e59b0-e52e-48d0-a2a2-0aa4d41a5cde",
    }

    response = requests.post(
        "https://api.hcaptcha.com/siteverify", data=verification_data
    )
    result = response.json()

    # Check if verification was successful
    if not result.get("success", False):
        return jsonify({"error": "Captcha verification failed"}), 400

    try:
        # Get form data from request
        data = request.json
        name = data.get("name", "")
        email = data.get("email", "")
        message_body = data.get("message", "")

        # Create email subject with sender's name
        subject = f"Contact Form Submission from {name}"

        # Create email message
        msg = Message(
            subject=subject,
            sender=app.config["MAIL_USERNAME"],
            recipients=[
                app.config["MAIL_RECIPIENT"]
            ],  # replace with env with client's email on deployment or demo user
        )

        # Format email body with sender's information
        msg.body = f"""
        Name: {name}
        Email: {email}
        
        Message:
        {message_body}
        """

        # Send email
        mail.send(msg)

        return (
            jsonify({"status": "success", "message": "Email sent successfully!"}),
            200,
        )

    except Exception as e:
        # Log the error (in a production environment, use a proper logging system)
        print(f"Error sending email: {str(e)}")
        return jsonify({"status": "error", "message": str(e)}), 500


@app.route("/api/send-sms", methods=["POST"])
@login_required
@admin_required
def send_sms():
    TWILIO_ACCOUNT_SID = os.getenv("TWILIO_ACCOUNT_SID")
    TWILIO_AUTH_TOKEN = os.getenv("TWILIO_AUTH_TOKEN")
    TWILIO_PHONE_NUMBER = os.getenv("TWILIO_PHONE_NUMBER")

    # Get JSON data from request
    data = request.get_json()

    # Validate required fields
    if not all(k in data for k in ("to", "message")):
        return (
            jsonify(
                {
                    "success": False,
                    "error": 'Missing required fields: "to" and "message" are required',
                }
            ),
            400,
        )

    # Extract data
    to_number = data["to"]
    message_body = data["message"]

    # Initialize Twilio client
    try:
        client = Client(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)

        # Send message
        message = client.messages.create(
            body=message_body, from_=TWILIO_PHONE_NUMBER, to=to_number
        )

        # Return success response with message SID
        return jsonify({"success": True, "message_sid": message.sid}), 200

    except TwilioRestException as e:
        # Handle Twilio-specific errors
        return jsonify({"success": False, "error": str(e)}), 400
    except Exception as e:
        # Handle any other exceptions
        return (
            jsonify(
                {"success": False, "error": f"An unexpected error occurred: {str(e)}"}
            ),
            500,
        )


@app.route("/api/get-vehicles/<int:user_id>", methods=["GET"])
def get_user_vehicles(user_id):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute(
            "SELECT vehicle_id, make, model, year FROM vehicles WHERE user_id = %s",
            (user_id,),
        )
        vehicles = cursor.fetchall()
        cursor.close()
        conn.close()
        return jsonify({"status": "success", "vehicles": vehicles}), 200
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


@app.route("/api/get-vehicle-photos/<int:vehicle_id>", methods=["GET"])
def get_vehicle_photos(vehicle_id):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute(
            """
            SELECT media_id, file_url, title, description 
            FROM media 
            WHERE vehicle_id = %s
            ORDER BY upload_date DESC
        """,
            (vehicle_id,),
        )
        photos = cursor.fetchall()
        cursor.close()
        conn.close()
        return jsonify({"status": "success", "photos": photos}), 200
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


# Active jobs endpoint
@app.route("/api/active-jobs", methods=["GET"])
@login_required
@admin_required
def get_active_jobs():
    """
    Returns all vehicles marked as Waiting or Active,
    along with their owner’s info.
    """
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute(
        """
        SELECT
          v.vehicle_id,
          v.license_plate,
          v.make,
          v.model,
          v.year,
          u.user_id,
          u.first_name,
          u.last_name,
          u.email
        FROM vehicles v
        JOIN users u ON v.user_id = u.user_id
        WHERE v.vehicle_status IN ('Waiting', 'Active')
        ORDER BY v.license_plate;
    """
    )

    rows = cursor.fetchall()
    cursor.close()
    conn.close()

    active_jobs = []
    for r in rows:
        # Build a display name, falling back to email if no names set
        full_name = f"{r['first_name']} {r['last_name']}".strip() or r["email"]
        active_jobs.append(
            {
                "vehicle_id": r["vehicle_id"],
                "license_plate": r["license_plate"],
                "make": r["make"],
                "model": r["model"],
                "year": r["year"],
                "owner": {
                    "user_id": r["user_id"],
                    "full_name": full_name,
                    "email": r["email"],
                },
            }
        )

    return jsonify({"status": "success", "active_jobs": active_jobs}), 200


# Unpaid Invoices Endpoint
@app.route("/api/get-unpaid-invoices", methods=["GET"])
@login_required
@admin_required
def get_unpaid_invoices():
    """Retrieves all invoices with 'unpaid' or 'overdue' status, including user details."""
    conn = None
    cursor = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor()  # Assumes RealDictCursor

        cursor.execute(
            """
            SELECT
                i.invoice_id,
                i.invoice_number,
                i.total_amount,
                i.status,
                i.due_date,
                i.issue_date,
                u.user_id,
                u.first_name,
                u.last_name,
                u.email,
                u.phone,
                v.make,
                v.model,
                v.year,
                v.license_plate
            FROM invoices i
            JOIN users u ON i.user_id = u.user_id
            LEFT JOIN vehicles v ON i.vehicle_id = v.vehicle_id  -- Optional: Join vehicle info if needed for context
            WHERE i.status IN ('unpaid', 'overdue')
            ORDER BY i.due_date ASC, i.user_id;
        """
        )
        invoices_data = cursor.fetchall()

        # Format data slightly for easier frontend use
        unpaid_invoices = []
        for inv in invoices_data:
            full_name = (
                f"{inv.get('first_name', '')} {inv.get('last_name', '')}".strip()
            )
            vehicle_desc = (
                f"{inv.get('year', '')} {inv.get('make', '')} {inv.get('model', '')} ({inv.get('license_plate', 'N/A')})".strip()
                if inv.get("make")
                else "N/A"
            )
            unpaid_invoices.append(
                {
                    "invoice_id": inv["invoice_id"],
                    "invoice_number": inv["invoice_number"],
                    "total_amount": float(
                        inv["total_amount"]
                    ),  # Ensure it's float for display
                    "status": inv["status"],
                    "due_date": (
                        inv["due_date"].isoformat() if inv["due_date"] else None
                    ),  # Format date
                    "issue_date": (
                        inv["issue_date"].isoformat() if inv["issue_date"] else None
                    ),
                    "user_id": inv["user_id"],
                    "user_full_name": full_name or inv["email"],
                    "user_email": inv["email"],
                    "user_phone": inv["phone"],  # Crucial for SMS
                    "vehicle_description": vehicle_desc,
                }
            )

        return jsonify({"status": "success", "unpaid_invoices": unpaid_invoices}), 200

    except psycopg2.Error as db_err:
        app.logger.error(f"Database error fetching unpaid invoices: {db_err}")
        return jsonify({"status": "error", "message": "Database error occurred."}), 500
    except Exception as e:
        app.logger.error(f"Unexpected error fetching unpaid invoices: {e}")
        return jsonify({"status": "error", "message": str(e)}), 500
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()


# APPLICATION ENTRY POINT

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)  # Set debug=False in production
