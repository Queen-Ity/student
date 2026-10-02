const API_URL = '/api/students';

const loginForm = document.getElementById('loginForm');
const loginScreen = document.getElementById('loginScreen');
const loginError = document.getElementById('loginError');
const passwordInput = document.getElementById('loginPassword');
const passwordToggle = document.getElementById('togglePassword');
const openEyeIcon = document.getElementById('eyeOpen');
const closedEyeIcon = document.getElementById('eyeClosed');
const recordsDashboard = document.getElementById('recordsDashboard');
const logoutButton = document.getElementById('logoutButton');
const studentForm = document.getElementById('studentForm');
const loadStudentsBtn = document.getElementById('loadStudents');
const studentList = document.getElementById('studentsList');
const formTitle = document.getElementById('studentFormTitle');
const submitButton = document.getElementById('studentSubmit');
const cancelEditBtn = document.getElementById('cancelEdit');
let editingStudentId = null;

function getStudentData() {
    return {
        name: document.getElementById('name').value.trim(),
        email: document.getElementById('email').value.trim(),
        age: Number(document.getElementById('age').value),
        course: document.getElementById('course').value.trim()
    };
}

function resetForm() {
    editingStudentId = null;
    studentForm.reset();
    formTitle.textContent = 'Add New Student';
    submitButton.textContent = 'Add Student';
    cancelEditBtn.hidden = true;
}

async function loadStudents() {
    studentList.replaceChildren();

    try {
        const response = await fetch(API_URL);
        const students = await response.json();
        if (!response.ok) {
            throw new Error(students.message || 'Unable to load students');
        }

        if (students.length === 0) {
            studentList.textContent = 'No students found.';
            return;
        }

        students.forEach((student) => {
            const row = document.createElement('div');
            const details = document.createElement('span');
            const editButton = document.createElement('button');
            const deleteButton = document.createElement('button');

            row.className = 'student-row';
            details.textContent = `${student.name} | ${student.email} | Age ${student.age} | ${student.course}`;
            editButton.type = 'button';
            editButton.textContent = 'Edit';
            editButton.addEventListener('click', () => beginEdit(student));
            deleteButton.type = 'button';
            deleteButton.textContent = 'Delete';
            deleteButton.addEventListener('click', () => deleteStudent(student._id));

            row.append(details, editButton, deleteButton);
            studentList.append(row);
        });
    } catch (error) {
        studentList.textContent = error.message || 'Error loading students';
    }
}

function beginEdit(student) {
    editingStudentId = student._id;
    document.getElementById('name').value = student.name;
    document.getElementById('email').value = student.email;
    document.getElementById('age').value = student.age;
    document.getElementById('course').value = student.course;
    formTitle.textContent = 'Update Student';
    submitButton.textContent = 'Save Changes';
    cancelEditBtn.hidden = false;
    studentForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

async function deleteStudent(studentId) {
    if (!window.confirm('Delete this student?')) {
        return;
    }

    try {
        const response = await fetch(`${API_URL}/${studentId}`, { method: 'DELETE' });
        const result = await response.json();
        if (!response.ok) {
            throw new Error(result.message || 'Unable to delete student');
        }
        if (editingStudentId === studentId) {
            resetForm();
        }
        await loadStudents();
    } catch (error) {
        alert(error.message || 'Error deleting student');
    }
}

studentForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const isEditing = editingStudentId !== null;

    try {
        const response = await fetch(isEditing ? `${API_URL}/${editingStudentId}` : API_URL, {
            method: isEditing ? 'PUT' : 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(getStudentData())
        });
        const result = await response.json();
        if (!response.ok) {
            throw new Error(result.message || `Unable to ${isEditing ? 'update' : 'add'} student`);
        }

        resetForm();
        await loadStudents();
    } catch (error) {
        alert(error.message || `Error ${isEditing ? 'updating' : 'adding'} student`);
    }
});

loadStudentsBtn.addEventListener('click', loadStudents);
cancelEditBtn.addEventListener('click', resetForm);

passwordToggle.addEventListener('click', () => {
    const isPasswordVisible = passwordInput.type === 'text';
    passwordInput.type = isPasswordVisible ? 'password' : 'text';
    passwordToggle.setAttribute('aria-pressed', String(!isPasswordVisible));
    passwordToggle.setAttribute('aria-label', isPasswordVisible ? 'Show password' : 'Hide password');
    openEyeIcon.hidden = !isPasswordVisible;
    closedEyeIcon.hidden = isPasswordVisible;
});

function openDashboard() {
    loginScreen.hidden = true;
    recordsDashboard.hidden = false;
    loadStudents();
}

loginForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    loginError.hidden = true;

    try {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: document.getElementById('loginEmail').value.trim(),
                password: document.getElementById('loginPassword').value
            })
        });
        const result = await response.json();
        if (!response.ok) {
            throw new Error(result.message || 'Unable to sign in');
        }

        document.getElementById('loginPassword').value = '';
        openDashboard();
    } catch (error) {
        loginError.textContent = error.message || 'Unable to sign in';
        loginError.hidden = false;
    }
});

logoutButton.addEventListener('click', async () => {
    try {
        const response = await fetch('/api/auth/logout', { method: 'POST' });
        if (!response.ok) {
            throw new Error('Unable to sign out');
        }

        recordsDashboard.hidden = true;
        loginScreen.hidden = false;
        loginForm.reset();
        studentList.replaceChildren();
        resetForm();
    } catch (error) {
        alert(error.message || 'Unable to sign out');
    }
});

fetch('/api/auth/session')
    .then((response) => {
        if (response.ok) {
            openDashboard();
        }
    })
    .catch(() => {});