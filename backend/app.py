
from flask import Flask, jsonify, request, session
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash
import sqlite3

app = Flask(__name__)
app.secret_key = 'taskora-development-secret-key'

CORS(app, supports_credentials=True, origins=[
    "http://localhost:5173",
    "http://localhost:5174"
])

DATABASE = 'taskora.db'


def get_db_connection():
    connection = sqlite3.connect(DATABASE)
    connection.row_factory = sqlite3.Row
    return connection


def create_tables():
    connection = get_db_connection()

    connection.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL
        )
    ''')

    connection.execute('''
        CREATE TABLE IF NOT EXISTS tasks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            title TEXT NOT NULL,
            description TEXT,
            due_date TEXT,
            priority TEXT DEFAULT 'Medium',
            status TEXT DEFAULT 'Pending',
            FOREIGN KEY (user_id) REFERENCES users (id)
        )
    ''')

    connection.commit()
    connection.close()


@app.route('/')
def home():
    return jsonify({
        "message": "Taskora backend is running!",
        "status": "success"
    })


@app.route('/api/register', methods=['POST'])
def register():
    data = request.get_json()

    username = data.get('username', '').strip()
    email = data.get('email', '').strip().lower()
    password = data.get('password', '')

    if not username or not email or not password:
        return jsonify({"error": "All fields are required"}), 400

    if len(password) < 8:
        return jsonify({"error": "Password must contain at least 8 characters"}), 400

    hashed_password = generate_password_hash(password)

    connection = get_db_connection()

    try:
        connection.execute(
            'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
            (username, email, hashed_password)
        )
        connection.commit()

        return jsonify({"message": "Registration successful!"}), 201

    except sqlite3.IntegrityError:
        return jsonify({"error": "Email already registered"}), 409

    finally:
        connection.close()


@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()

    email = data.get('email', '').strip().lower()
    password = data.get('password', '')

    connection = get_db_connection()
    user = connection.execute(
        'SELECT * FROM users WHERE email = ?', (email,)
    ).fetchone()
    connection.close()

    if user is None or not check_password_hash(user['password'], password):
        return jsonify({"error": "Invalid email or password"}), 401

    session.clear()
    session['user_id'] = user['id']

    return jsonify({
        "message": "Login successful!",
        "username": user['username']
    })


@app.route('/api/logout', methods=['POST'])
def logout():
    session.clear()
    return jsonify({"message": "Logged out successfully"})


@app.route('/api/me')
def current_user():
    if 'user_id' not in session:
        return jsonify({"error": "Not logged in"}), 401

    connection = get_db_connection()
    user = connection.execute(
        'SELECT id, username, email FROM users WHERE id = ?',
        (session['user_id'],)
    ).fetchone()
    connection.close()

    if user is None:
        session.clear()
        return jsonify({"error": "User not found"}), 404

    return jsonify(dict(user))


@app.route('/api/tasks', methods=['GET'])
def get_tasks():
    if 'user_id' not in session:
        return jsonify({"error": "Please log in"}), 401

    connection = get_db_connection()

    tasks = connection.execute(
        'SELECT * FROM tasks WHERE user_id = ? ORDER BY id DESC',
        (session['user_id'],)
    ).fetchall()

    connection.close()

    return jsonify([dict(task) for task in tasks])


@app.route('/api/tasks', methods=['POST'])
def add_task():
    if 'user_id' not in session:
        return jsonify({"error": "Please log in"}), 401

    data = request.get_json() or {}

    title = data.get('title', '').strip()

    if not title:
        return jsonify({"error": "Task title is required"}), 400

    connection = get_db_connection()

    cursor = connection.execute('''
        INSERT INTO tasks
        (user_id, title, description, due_date, priority, status)
        VALUES (?, ?, ?, ?, ?, ?)
    ''', (
        session['user_id'],
        title,
        data.get('description', ''),
        data.get('due_date', ''),
        data.get('priority', 'Medium'),
        'Pending'
    ))

    connection.commit()
    task_id = cursor.lastrowid
    connection.close()

    return jsonify({
        "message": "Task created successfully!",
        "task_id": task_id
    }), 201


@app.route('/api/tasks/<int:task_id>', methods=['PUT'])
def update_task(task_id):
    if 'user_id' not in session:
        return jsonify({"error": "Please log in"}), 401

    data = request.get_json() or {}

    connection = get_db_connection()

    cursor = connection.execute('''
        UPDATE tasks
        SET title = ?, description = ?, due_date = ?,
            priority = ?, status = ?
        WHERE id = ? AND user_id = ?
    ''', (
        data.get('title', ''),
        data.get('description', ''),
        data.get('due_date', ''),
        data.get('priority', 'Medium'),
        data.get('status', 'Pending'),
        task_id,
        session['user_id']
    ))

    connection.commit()
    updated = cursor.rowcount
    connection.close()

    if updated == 0:
        return jsonify({"error": "Task not found"}), 404

    return jsonify({"message": "Task updated successfully!"})


@app.route('/api/tasks/<int:task_id>', methods=['DELETE'])
def delete_task(task_id):
    if 'user_id' not in session:
        return jsonify({"error": "Please log in"}), 401

    connection = get_db_connection()

    cursor = connection.execute(
        'DELETE FROM tasks WHERE id = ? AND user_id = ?',
        (task_id, session['user_id'])
    )

    connection.commit()
    deleted = cursor.rowcount
    connection.close()

    if deleted == 0:
        return jsonify({"error": "Task not found"}), 404

    return jsonify({"message": "Task deleted successfully!"})

if __name__ == '__main__':
    create_tables()
    app.run(debug=True, port=5000)
