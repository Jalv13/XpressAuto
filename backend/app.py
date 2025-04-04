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

        # Format users for display
        formatted_users = []
        for u in users:
            full_name = f"{u.get('first_name', '')} {u.get('last_name', '')}".strip()
            formatted_users.append(
                {
                    "user_id": u["user_id"],
                    "email": u["email"],
                    "full_name": full_name or u["email"],
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
def create_invoice():
    data = request.json
    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        cursor.execute("SELECT user_id FROM users WHERE email = %s", (data["email"],))
        user = cursor.fetchone()
        if not user:
            return jsonify({"status": "error", "message": "User not found"}), 404

        # Generate a unique invoice number
        current_year = datetime.now().year
        cursor.execute(
            "SELECT COUNT(*) as count FROM invoices WHERE EXTRACT(YEAR FROM issue_date) = %s",
            (current_year,),
        )
        count = cursor.fetchone()["count"] + 1
        invoice_number = f"INV-{current_year}-{count:04d}"

        cursor.execute(
            """
            INSERT INTO invoices (user_id, vehicle_id, invoice_number, subtotal, tax_amount, discount_amount, total_amount, status, due_date, notes)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s) RETURNING invoice_id;
        """,
            (
                user["user_id"],
                data["vehicle_id"],
                invoice_number,
                data["subtotal"],
                data["tax_amount"],
                data["discount_amount"],
                data["total_amount"],
                data["status"],
                data["due_date"],
                data["notes"],
            ),
        )

        invoice_id = cursor.fetchone()["invoice_id"]

        for item in data.get("items", []):
            cursor.execute(
                """
                INSERT INTO invoice_items (invoice_id, service_id, history_id, description, quantity, unit_price, discount_amount, total_price)
                VALUES (%s,%s,%s,%s,%s,%s,%s,%s);
            """,
                (
                    invoice_id,
                    item["service_id"],
                    item["history_id"],
                    item["description"],
                    item["quantity"],
                    item["unit_price"],
                    item["discount_amount"],
                    item["total_price"],
                ),
            )

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

    except Exception as e:
        conn.rollback()
        return jsonify({"status": "error", "message": str(e)}), 500
    finally:
        cursor.close()
        conn.close()


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


# SERVICES
# Add this route to your Flask app.py


@app.route("/api/add-service", methods=["POST"])
# @login_required need to implement admin check
def add_service():
    """Adds a new service to the database."""
    data = request.get_json()

    # Basic validation
    if (
        not data
        or not data.get("service_name")
        or not data.get("service_description")
        or not data.get("service_price")
    ):
        return (
            jsonify({"status": "error", "message": "Missing required service fields"}),
            400,
        )

    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        cursor.execute(
            """
            INSERT INTO services (name, description, base_price, is_active)
            VALUES (%s, %s, %s, %s) RETURNING service_id
            """,
            (
                data["service_name"],
                data["service_description"],
                data["service_price"],
                True,  # Default to active, or get from request if needed
            ),
        )
        new_service_id = cursor.fetchone()["service_id"]
        conn.commit()
        return (
            jsonify(
                {
                    "status": "success",
                    "message": "Service added successfully!",
                    "service_id": new_service_id,
                }
            ),
            201,
        )

    except Exception as e:
        conn.rollback()
        app.logger.error(f"Error adding service: {e}")  # Use app logger
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
# @app.route("/api/add-loyalty-points", methods=["POST"])
# @login_required
# def add_loyalty_points():
#     data = request.get_json()
#     conn = get_db_connection()
#     cursor = conn.cursor()

#     try:
#         cursor.execute(
#             """
#             INSERT INTO loyalty_points (user_id, points_balance, total_points_earned, last_updated)
#             VALUES (%s, %s, %s, NOW())
#             ON CONFLICT (user_id)
#             DO UPDATE SET
#                 points_balance = loyalty_points.points_balance + EXCLUDED.points_balance,
#                 total_points_earned = loyalty_points.total_points_earned + EXCLUDED.total_points_earned,
#                 last_updated = NOW()
#             RETURNING points_balance
#             """,
#             (current_user.id, data["points"], data["points"]),
#         )
#         updated_points = cursor.fetchone()
#         if not updated_points:
#             return jsonify({"status": "error", "message": "Failed to add points"}), 500

#         conn.commit()
#         return (
#             jsonify(
#                 {
#                     "status": "success",
#                     "message": "Points added!",
#                     "points_balance": updated_points["points_balance"],
#                 }
#             ),
#             200,
#         )

#     except Exception as e:
#         conn.rollback()
#         return jsonify({"status": "error", "message": str(e)}), 500
#     finally:
#         cursor.close()
#         conn.close()


##DEMO METHOD
@app.route("/api/add-loyalty-points", methods=["POST"])
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
            (data["user_id"], data["points"], data["points"]),
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
                    "points_balance": updated_points[0],  # Fetch by index
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


# APPLICATION ENTRY POINT

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)  # Set debug=False in production
