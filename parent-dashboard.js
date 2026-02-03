// Parent Dashboard - لوحة ولي الأمر

document.addEventListener('DOMContentLoaded', function() {
    initParentDashboard();
});

function initParentDashboard() {
    // Get parent info from URL or localStorage
    const urlParams = new URLSearchParams(window.location.search);
    const parentId = urlParams.get('parentId') || localStorage.getItem('currentParentId') || '1';
    const parentName = urlParams.get('parentName') || localStorage.getItem('currentParentName') || 'ولي الأمر';
    
    // Store for later use
    localStorage.setItem('currentParentId', parentId);
    localStorage.setItem('currentParentName', parentName);
    
    // Display parent name
    document.getElementById('parentName').textContent = parentName;
    
    // Load students for this parent
    loadParentStudents(parentId);
}

function loadParentStudents(parentId) {
    // Get all students from localStorage or use sample data
    let allStudents = JSON.parse(localStorage.getItem('allStudents')) || getSampleStudents();
    
    // Filter students by parent ID
    const parentStudents = allStudents.filter(student => student.parentId === parentId);
    
    const studentsList = document.getElementById('studentsList');
    const noStudents = document.getElementById('noStudents');
    const studentsCount = document.getElementById('studentsCount');
    
    // Update count
    studentsCount.textContent = parentStudents.length + ' طلاب';
    
    if (parentStudents.length === 0) {
        studentsList.style.display = 'none';
        noStudents.style.display = 'block';
        return;
    }
    
    studentsList.style.display = 'flex';
    noStudents.style.display = 'none';
    studentsList.innerHTML = '';
    
    parentStudents.forEach(student => {
        const card = createStudentCard(student);
        studentsList.appendChild(card);
    });
}

function createStudentCard(student) {
    const card = document.createElement('div');
    card.className = 'student-card';
    
    card.innerHTML = `
        <div class="student-info">
            <div class="student-name">${student.name}</div>
            <div class="student-halqa">الحلقة: <span>${student.halqaName || 'غير محدد'}</span></div>
            ${student.age ? `<div class="student-age">العمر: ${student.age} سنة</div>` : ''}
        </div>
        <button class="details-btn" onclick="viewStudentDetails('${student.id}', '${student.name}', '${student.halqaId || '1'}')">
            تفاصيل
        </button>
    `;
    
    return card;
}

function viewStudentDetails(studentId, studentName, halqaId) {
    // Navigate to student details page
    window.location.href = `student-details.html?studentId=${studentId}&studentName=${encodeURIComponent(studentName)}&halqaId=${halqaId}&from=parent`;
}

function goBack() {
    // Go back to index or login page
    window.location.href = 'index.html';
}

// Sample students data with parent associations
function getSampleStudents() {
    const sampleStudents = [
        { id: '1', name: 'أحمد محمد علي', halqaId: '1', halqaName: 'حلقة الفجر', parentId: '1', age: 10 },
        { id: '2', name: 'عبدالله خالد', halqaId: '1', halqaName: 'حلقة الفجر', parentId: '1', age: 12 },
        { id: '3', name: 'يوسف إبراهيم', halqaId: '2', halqaName: 'حلقة النور', parentId: '2', age: 11 },
        { id: '4', name: 'عمر سعيد', halqaId: '1', halqaName: 'حلقة الفجر', parentId: '2', age: 9 },
        { id: '5', name: 'محمد فهد', halqaId: '2', halqaName: 'حلقة النور', parentId: '3', age: 13 },
        { id: '6', name: 'سعد عبدالرحمن', halqaId: '3', halqaName: 'حلقة الإيمان', parentId: '1', age: 8 },
        { id: '7', name: 'فيصل أحمد', halqaId: '2', halqaName: 'حلقة النور', parentId: '3', age: 10 },
        { id: '8', name: 'خالد ناصر', halqaId: '3', halqaName: 'حلقة الإيمان', parentId: '4', age: 11 }
    ];
    
    // Store sample students for consistency
    localStorage.setItem('allStudents', JSON.stringify(sampleStudents));
    
    return sampleStudents;
}

// Function to add a student to a parent (can be called from other pages)
function addStudentToParent(studentData, parentId) {
    let allStudents = JSON.parse(localStorage.getItem('allStudents')) || [];
    studentData.parentId = parentId;
    allStudents.push(studentData);
    localStorage.setItem('allStudents', JSON.stringify(allStudents));
}

// Function to update student's parent
function updateStudentParent(studentId, newParentId) {
    let allStudents = JSON.parse(localStorage.getItem('allStudents')) || [];
    const studentIndex = allStudents.findIndex(s => s.id === studentId);
    if (studentIndex !== -1) {
        allStudents[studentIndex].parentId = newParentId;
        localStorage.setItem('allStudents', JSON.stringify(allStudents));
    }
}
