import os
import datetime
import sqlite3
from flask import Flask, session, request, jsonify
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_DIR = os.path.join(BASE_DIR, 'database_file')
os.makedirs(DB_DIR, exist_ok=True)

def get_db(db_name):
    path = os.path.join(DB_DIR, db_name)
    conn = sqlite3.connect(path, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn

def query_db(db_name, query, args=(), one=False):
    db = get_db(db_name)
    cur = db.execute(query, args)
    rv = cur.fetchall()
    cur.close()
    db.commit()
    return (rv[0] if rv else None) if one else rv

app = Flask(__name__)
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'dev')

CORS(app, supports_credentials=True, resources={
    r"/usf/*": {
        "origins": "http://localhost:3000",
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type"]
    }
})

# Initialize Databases
def init_db():
    with get_db('users.db') as db:
        db.executescript("""
            CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY,
                pw_hash TEXT NOT NULL,
                email TEXT NOT NULL
            );
        """)

    with get_db('surveys.db') as db:
        db.executescript("""
            CREATE TABLE IF NOT EXISTS surveys (
                survey_id TEXT PRIMARY KEY,
                survey_description TEXT NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );
            
            CREATE TABLE IF NOT EXISTS questions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                survey_id TEXT NOT NULL,
                survey_description TEXT NOT NULL,
                category TEXT NOT NULL,
                description TEXT NOT NULL,
                weight INTEGER NOT NULL,
                FOREIGN KEY (survey_id) REFERENCES surveys (survey_id)
            );
        """)

init_db()

# Authentication Helpers
def login_required(f):
    from functools import wraps
    @wraps(f)
    def wrapper(*args, **kwargs):
        if 'current_user' not in session:
            return jsonify(error="Unauthorized"), 401
        return f(*args, **kwargs)
    return wrapper

def admin_required(f):
    from functools import wraps
    @wraps(f)
    def wrapper(*args, **kwargs):
        if session.get('current_user') != 'ADMIN':
            return jsonify(error="Forbidden"), 403
        return f(*args, **kwargs)
    return wrapper

# User Routes
@app.route('/usf/register', methods=['POST'])
def register():
    data = request.json or {}
    user = data.get('id', '').strip().upper()
    pw = data.get('pw', '')
    email = data.get('email', '').strip()
    if not user or not pw:
        return jsonify(success=False, error="Missing credentials"), 400

    exists = query_db('users.db', 'SELECT id FROM users WHERE id = ?', [user], one=True)
    if exists:
        return jsonify(success=False, error="User already exists"), 409

    pw_hash = generate_password_hash(pw, method='pbkdf2:sha256')
    query_db('users.db', 'INSERT INTO users (id, pw_hash, email) VALUES (?,?,?)',
             [user, pw_hash, email])
    return jsonify(success=True), 201

@app.route('/usf/login', methods=['POST'])
def login():
    data = request.json or {}
    user = data.get('id', '').strip().upper()
    pw = data.get('pw', '')

    row = query_db('users.db', 'SELECT pw_hash FROM users WHERE id = ?', [user], one=True)
    if row and check_password_hash(row['pw_hash'], pw):
        session['current_user'] = user
        return jsonify(success=True)
    return jsonify(success=False, error="Invalid credentials"), 401

@app.route('/usf/logout', methods=['POST'])
@login_required
def logout():
    session.pop('current_user', None)
    return jsonify(success=True)

@app.route('/usf/me', methods=['GET'])
def whoami():
    user = session.get('current_user')
    if not user:
        return jsonify(logged_in=False), 200
    return jsonify(logged_in=True, user=user), 200

# Survey Routes
@app.route('/usf/surveys', methods=['GET'])
@login_required
def get_surveys():
    rows = query_db('surveys.db', 'SELECT * FROM surveys ORDER BY survey_id')
    surveys = [dict(r) for r in rows]
    return jsonify(surveys=surveys)

@app.route('/usf/surveys', methods=['POST'])
@admin_required
def create_survey():
    data = request.json or {}
    survey_id = data.get('survey_id', '').strip()
    survey_description = data.get('survey_description', '').strip()
    
    if not survey_id or not survey_description:
        return jsonify(error="Missing survey_id or survey_description"), 400
    
    # Check if survey already exists
    exists = query_db('surveys.db', 'SELECT survey_id FROM surveys WHERE survey_id = ?', [survey_id], one=True)
    if exists:
        return jsonify(error="Survey ID already exists"), 409
    
    query_db('surveys.db', 'INSERT INTO surveys (survey_id, survey_description) VALUES (?,?)',
             [survey_id, survey_description])
    return jsonify(success=True), 201

@app.route('/usf/surveys/<survey_id>', methods=['GET'])
@login_required
def get_survey(survey_id):
    survey = query_db('surveys.db', 'SELECT * FROM surveys WHERE survey_id = ?', [survey_id], one=True)
    if not survey:
        return jsonify(error="Survey not found"), 404
    return jsonify(survey=dict(survey))

@app.route('/usf/surveys/<survey_id>', methods=['DELETE'])
@admin_required
def delete_survey(survey_id):
    # Delete all questions for this survey first
    query_db('surveys.db', 'DELETE FROM questions WHERE survey_id = ?', [survey_id])
    # Delete the survey
    query_db('surveys.db', 'DELETE FROM surveys WHERE survey_id = ?', [survey_id])
    return jsonify(success=True)

# Question Routes
@app.route('/usf/questions', methods=['GET'])
@login_required
def get_questions():
    survey_id = request.args.get('survey_id')
    if survey_id:
        rows = query_db('surveys.db', 'SELECT * FROM questions WHERE survey_id=? ORDER BY id', [survey_id])
    else:
        rows = query_db('surveys.db', 'SELECT * FROM questions ORDER BY survey_id, id')
    questions = [dict(r) for r in rows]
    return jsonify(questions=questions)

@app.route('/usf/questions', methods=['POST'])
@admin_required
def create_question():
    data = request.json or {}
    required = ['survey_id', 'survey_description', 'category', 'description', 'weight']
    if not all(field in data for field in required):
        return jsonify(error="Missing fields"), 400

    # Verify survey exists
    survey_exists = query_db('surveys.db', 'SELECT survey_id FROM surveys WHERE survey_id = ?', [data['survey_id']], one=True)
    if not survey_exists:
        return jsonify(error="Survey does not exist"), 404

    query_db('surveys.db',
             '''INSERT INTO questions (survey_id, survey_description, category, description, weight)
                VALUES (?,?,?,?,?)''',
             [data['survey_id'], data['survey_description'],
              data['category'], data['description'], int(data['weight'])])
    return jsonify(success=True), 201

@app.route('/usf/questions/<int:q_id>', methods=['PUT'])
@admin_required
def update_question(q_id):
    data = request.json or {}
    required = ['survey_id', 'survey_description', 'category', 'description', 'weight']
    if not all(field in data for field in required):
        return jsonify(error="Missing fields"), 400

    query_db('surveys.db',
             '''UPDATE questions SET survey_id=?, survey_description=?, category=?, description=?, weight=?
                WHERE id=?''',
             [data['survey_id'], data['survey_description'],
              data['category'], data['description'], int(data['weight']), q_id])
    return jsonify(success=True)

@app.route('/usf/questions/<int:q_id>', methods=['DELETE'])
@admin_required
def delete_question(q_id):
    query_db('surveys.db', 'DELETE FROM questions WHERE id=?', [q_id])
    return jsonify(success=True)

# Response Routes (for storing survey responses)
@app.route('/usf/responses', methods=['POST'])
@login_required
def submit_response():
    data = request.json or {}
    survey_id = data.get('survey_id')
    responses = data.get('responses', {})
    user_id = session.get('current_user')
    
    if not survey_id or not responses:
        return jsonify(error="Missing survey_id or responses"), 400
    
    # Create responses table if it doesn't exist
    with get_db('surveys.db') as db:
        db.execute('''CREATE TABLE IF NOT EXISTS responses (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            survey_id TEXT NOT NULL,
            user_id TEXT NOT NULL,
            question_id INTEGER NOT NULL,
            response_value INTEGER NOT NULL,
            submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (survey_id) REFERENCES surveys (survey_id),
            FOREIGN KEY (question_id) REFERENCES questions (id)
        )''')
    
    # Delete existing responses for this user/survey
    query_db('surveys.db', 'DELETE FROM responses WHERE survey_id = ? AND user_id = ?', [survey_id, user_id])
    
    # Insert new responses
    for question_id, response_value in responses.items():
        query_db('surveys.db', 
                 'INSERT INTO responses (survey_id, user_id, question_id, response_value) VALUES (?,?,?,?)',
                 [survey_id, user_id, int(question_id), int(response_value)])
    
    return jsonify(success=True), 201

# OPTIONS handler
@app.route('/usf/<path:subpath>', methods=['OPTIONS'])
def handle_options(subpath):
    return '', 200

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001, debug=True)