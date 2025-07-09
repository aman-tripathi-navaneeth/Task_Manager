// Task Management App - Vanilla JavaScript with Login and Weekly Planner

class TaskManager {
  constructor() {
    this.currentUser = null;
    this.tasks = {};
    this.weeklyTasks = {};
    this.taskIdCounter = 1;
    this.weeklyTaskIdCounter = 1;
    this.timers = new Map();
    this.init();
  }

  init() {
    this.loadUserData();
    this.bindEvents();
    this.checkLogin();
    this.startTimerUpdates();
  }

  bindEvents() {
    // Login events
    const loginForm = document.getElementById('loginForm');
    loginForm.addEventListener('submit', (e) => this.handleLogin(e));

    // Logout event
    const logoutBtn = document.getElementById('logoutBtn');
    logoutBtn.addEventListener('click', () => this.handleLogout());

    // Tab navigation
    const todayTab = document.getElementById('todayTab');
    const weeklyTab = document.getElementById('weeklyTab');
    
    todayTab.addEventListener('click', () => this.switchTab('today'));
    weeklyTab.addEventListener('click', () => this.switchTab('weekly'));

    // Today's tasks events
    const taskInput = document.getElementById('taskInput');
    const createBtn = document.getElementById('createTaskBtn');

    createBtn.addEventListener('click', () => this.createTask());
    taskInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.createTask();
      }
    });

    taskInput.addEventListener('input', () => {
      const isEmpty = taskInput.value.trim() === '';
      createBtn.disabled = isEmpty;
    });

    // Weekly tasks events
    const weeklyTaskInput = document.getElementById('weeklyTaskInput');
    const createWeeklyBtn = document.getElementById('createWeeklyTaskBtn');

    createWeeklyBtn.addEventListener('click', () => this.createWeeklyTask());
    weeklyTaskInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter' && document.getElementById('taskDeadline').value) {
        this.createWeeklyTask();
      }
    });

    // Initial button states
    createBtn.disabled = taskInput.value.trim() === '';
  }

  checkLogin() {
    const savedUser = localStorage.getItem('taskManager_currentUser');
    if (savedUser) {
      this.currentUser = savedUser;
      this.showMainApp();
    } else {
      this.showLoginPage();
    }
  }

  handleLogin(e) {
    e.preventDefault();
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();
    const errorDiv = document.getElementById('loginError');

    if (!username || !password) {
      this.showLoginError('Please enter both username and password');
      return;
    }

    // Simple validation - in a real app, this would be server-side
    if (username.length < 3) {
      this.showLoginError('Username must be at least 3 characters');
      return;
    }

    if (password.length < 3) {
      this.showLoginError('Password must be at least 3 characters');
      return;
    }

    // Store user and login
    this.currentUser = username;
    localStorage.setItem('taskManager_currentUser', username);
    this.loadUserData();
    this.showMainApp();
    this.showSuccess(`Welcome back, ${username}!`);
  }

  showLoginError(message) {
    const errorDiv = document.getElementById('loginError');
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
    setTimeout(() => {
      errorDiv.style.display = 'none';
    }, 5000);
  }

  handleLogout() {
    this.currentUser = null;
    localStorage.removeItem('taskManager_currentUser');
    this.showLoginPage();
    this.showSuccess('Logged out successfully');
  }

  showLoginPage() {
    document.getElementById('loginPage').style.display = 'flex';
    document.getElementById('mainApp').style.display = 'none';
    // Clear form
    document.getElementById('loginForm').reset();
    document.getElementById('loginError').style.display = 'none';
  }

  showMainApp() {
    document.getElementById('loginPage').style.display = 'none';
    document.getElementById('mainApp').style.display = 'block';
    document.getElementById('welcomeUser').textContent = this.currentUser;
    this.renderTasks();
    this.renderWeeklyTasks();
  }

  switchTab(tab) {
    const todayTab = document.getElementById('todayTab');
    const weeklyTab = document.getElementById('weeklyTab');
    const todaySection = document.getElementById('todaySection');
    const weeklySection = document.getElementById('weeklySection');

    if (tab === 'today') {
      todayTab.classList.add('active');
      weeklyTab.classList.remove('active');
      todaySection.classList.add('active');
      weeklySection.classList.remove('active');
    } else {
      weeklyTab.classList.add('active');
      todayTab.classList.remove('active');
      weeklySection.classList.add('active');
      todaySection.classList.remove('active');
    }
  }

  createTask() {
    const taskInput = document.getElementById('taskInput');
    const taskText = taskInput.value.trim();

    if (!taskText) {
      this.showError('Please enter a task');
      return;
    }

    const task = {
      id: this.taskIdCounter++,
      text: taskText,
      completed: false,
      createdAt: new Date(),
      completedAt: null
    };

    if (!this.tasks[this.currentUser]) {
      this.tasks[this.currentUser] = [];
    }

    this.tasks[this.currentUser].push(task);
    this.saveUserData();
    this.renderTasks();

    taskInput.value = '';
    document.getElementById('createTaskBtn').disabled = true;
    taskInput.focus();

    this.showSuccess('Task created successfully!');
  }

  createWeeklyTask() {
    const taskInput = document.getElementById('weeklyTaskInput');
    const deadlineInput = document.getElementById('taskDeadline');
    const taskText = taskInput.value.trim();
    const deadline = deadlineInput.value;

    if (!taskText) {
      this.showError('Please enter a task');
      return;
    }

    if (!deadline) {
      this.showError('Please select a deadline');
      return;
    }

    const deadlineDate = new Date(deadline);
    if (deadlineDate <= new Date()) {
      this.showError('Deadline must be in the future');
      return;
    }

    const task = {
      id: this.weeklyTaskIdCounter++,
      text: taskText,
      deadline: deadlineDate,
      completed: false,
      createdAt: new Date(),
      completedAt: null,
      isOverdue: false
    };

    if (!this.weeklyTasks[this.currentUser]) {
      this.weeklyTasks[this.currentUser] = [];
    }

    this.weeklyTasks[this.currentUser].push(task);
    this.saveUserData();
    this.renderWeeklyTasks();

    taskInput.value = '';
    deadlineInput.value = '';
    taskInput.focus();

    this.showSuccess('Weekly task created successfully!');
  }

  completeTask(taskId) {
    const userTasks = this.tasks[this.currentUser] || [];
    const task = userTasks.find(t => t.id === taskId);
    if (task && !task.completed) {
      task.completed = true;
      task.completedAt = new Date();
      this.saveUserData();
      this.renderTasks();
      this.showSuccess('Task completed! 🎉');
    }
  }

  completeWeeklyTask(taskId) {
    const userTasks = this.weeklyTasks[this.currentUser] || [];
    const task = userTasks.find(t => t.id === taskId);
    if (task && !task.completed) {
      task.completed = true;
      task.completedAt = new Date();
      this.saveUserData();
      this.renderWeeklyTasks();
      this.showSuccess('Weekly task completed! 🎉');
    }
  }

  renderTasks() {
    const pendingContainer = document.getElementById('pendingTasks');
    const completedContainer = document.getElementById('completedTasks');

    const userTasks = this.tasks[this.currentUser] || [];
    const pendingTasks = userTasks.filter(task => !task.completed);
    const completedTasks = userTasks.filter(task => task.completed);

    if (pendingTasks.length === 0) {
      pendingContainer.innerHTML = '<div class="empty-state"><p>No pending tasks. Add one above!</p></div>';
    } else {
      pendingContainer.innerHTML = pendingTasks
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .map(task => this.createTaskHTML(task, false))
        .join('');
    }

    if (completedTasks.length === 0) {
      completedContainer.innerHTML = '<div class="empty-state"><p>No completed tasks yet.</p></div>';
    } else {
      completedContainer.innerHTML = completedTasks
        .sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt))
        .map(task => this.createTaskHTML(task, false))
        .join('');
    }

    this.bindCompleteButtons();
  }

  renderWeeklyTasks() {
    const upcomingContainer = document.getElementById('upcomingTasks');
    const overdueContainer = document.getElementById('overdueTasks');
    const completedContainer = document.getElementById('completedWeeklyTasks');

    const userTasks = this.weeklyTasks[this.currentUser] || [];
    
    // Update overdue status
    const now = new Date();
    userTasks.forEach(task => {
      if (!task.completed && new Date(task.deadline) < now) {
        task.isOverdue = true;
      }
    });

    const upcomingTasks = userTasks.filter(task => !task.completed && !task.isOverdue);
    const overdueTasks = userTasks.filter(task => !task.completed && task.isOverdue);
    const completedTasks = userTasks.filter(task => task.completed);

    if (upcomingTasks.length === 0) {
      upcomingContainer.innerHTML = '<div class="empty-state"><p>No upcoming tasks. Add one above!</p></div>';
    } else {
      upcomingContainer.innerHTML = upcomingTasks
        .sort((a, b) => new Date(a.deadline) - new Date(b.deadline))
        .map(task => this.createTaskHTML(task, true))
        .join('');
    }

    if (overdueTasks.length === 0) {
      overdueContainer.innerHTML = '<div class="empty-state"><p>No overdue tasks.</p></div>';
    } else {
      overdueContainer.innerHTML = overdueTasks
        .sort((a, b) => new Date(a.deadline) - new Date(b.deadline))
        .map(task => this.createTaskHTML(task, true))
        .join('');
    }

    if (completedTasks.length === 0) {
      completedContainer.innerHTML = '<div class="empty-state"><p>No completed weekly tasks yet.</p></div>';
    } else {
      completedContainer.innerHTML = completedTasks
        .sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt))
        .map(task => this.createTaskHTML(task, true))
        .join('');
    }

    this.bindCompleteButtons();
  }

  createTaskHTML(task, isWeekly) {
    const createdDate = new Date(task.createdAt);
    const completedDate = task.completedAt ? new Date(task.completedAt) : null;
    
    const formatDate = (date) => {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    };

    let taskClass = 'task-item';
    if (task.completed) {
      taskClass += ' completed';
    } else if (isWeekly && task.isOverdue) {
      taskClass += ' overdue';
    }

    let actionButton = '';
    if (task.completed) {
      actionButton = '<div class="completed-badge">✓ Done</div>';
    } else if (isWeekly && task.isOverdue) {
      actionButton = `<button class="complete-btn" data-task-id="${task.id}" data-weekly="true">Mark as Done</button>`;
    } else {
      const dataWeekly = isWeekly ? 'data-weekly="true"' : '';
      actionButton = `<button class="complete-btn" data-task-id="${task.id}" ${dataWeekly}>Mark as Done</button>`;
    }

    let deadlineInfo = '';
    let timerInfo = '';
    
    if (isWeekly && task.deadline) {
      const deadlineDate = new Date(task.deadline);
      deadlineInfo = `<div class="task-deadline">📅 Deadline: ${formatDate(deadlineDate)}</div>`;
      
      if (!task.completed) {
        const timerId = `timer-${task.id}`;
        if (task.isOverdue) {
          timerInfo = `<div class="task-timer overdue" id="${timerId}">⚠️ OVERDUE</div>`;
        } else {
          timerInfo = `<div class="task-timer" id="${timerId}">⏱️ Loading...</div>`;
        }
      }
    }

    let metaClass = 'task-meta';
    if (task.completed) {
      metaClass += ' completed';
    } else if (isWeekly && task.isOverdue) {
      metaClass += ' overdue';
    }

    return `
      <div class="${taskClass}" data-task-id="${task.id}">
        <div class="task-content">
          <div class="task-info">
            <div class="task-text ${task.completed ? 'completed' : (isWeekly && task.isOverdue ? 'overdue' : '')}">${this.escapeHtml(task.text)}</div>
            ${deadlineInfo}
            ${timerInfo}
            <div class="${metaClass}">
              <span>📅 Created: ${formatDate(createdDate)}</span>
              ${task.completed ? `<span>✅ Completed: ${formatDate(completedDate)}</span>` : ''}
            </div>
          </div>
          ${actionButton}
        </div>
      </div>
    `;
  }

  bindCompleteButtons() {
    const completeButtons = document.querySelectorAll('.complete-btn');
    completeButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        const taskId = parseInt(e.target.getAttribute('data-task-id'));
        const isWeekly = e.target.getAttribute('data-weekly') === 'true';
        
        if (isWeekly) {
          this.completeWeeklyTask(taskId);
        } else {
          this.completeTask(taskId);
        }
      });
    });
  }

  startTimerUpdates() {
    // Update timers every second
    setInterval(() => {
      this.updateTimers();
    }, 1000);
  }

  updateTimers() {
    const userTasks = this.weeklyTasks[this.currentUser] || [];
    const now = new Date();

    userTasks.forEach(task => {
      if (!task.completed && !task.isOverdue) {
        const timerId = `timer-${task.id}`;
        const timerElement = document.getElementById(timerId);
        
        if (timerElement) {
          const deadline = new Date(task.deadline);
          const timeLeft = deadline - now;
          
          if (timeLeft <= 0) {
            task.isOverdue = true;
            this.saveUserData();
            this.renderWeeklyTasks();
            return;
          }
          
          const timeString = this.formatTimeLeft(timeLeft);
          timerElement.textContent = `⏱️ ${timeString}`;
        }
      }
    });
  }

  formatTimeLeft(milliseconds) {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const days = Math.floor(totalSeconds / (24 * 3600));
    const hours = Math.floor((totalSeconds % (24 * 3600)) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (days > 0) {
      return `${days}d ${hours}h ${minutes}m`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m ${seconds}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    } else {
      return `${seconds}s`;
    }
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  showSuccess(message) {
    this.showNotification(message, 'success');
  }

  showError(message) {
    this.showNotification(message, 'error');
  }

  showNotification(message, type) {
    const existing = document.querySelector('.notification');
    if (existing) {
      existing.remove();
    }

    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 16px 24px;
      border-radius: 8px;
      color: white;
      font-weight: 500;
      z-index: 1000;
      animation: slideIn 0.3s ease;
      background: ${type === 'success' ? '#48bb78' : '#f56565'};
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
      notification.style.animation = 'fadeOut 0.3s ease forwards';
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }

  loadUserData() {
    try {
      const savedTasks = localStorage.getItem('taskManager_tasks');
      const savedWeeklyTasks = localStorage.getItem('taskManager_weeklyTasks');
      const savedCounter = localStorage.getItem('taskManager_counter');
      const savedWeeklyCounter = localStorage.getItem('taskManager_weeklyCounter');

      this.tasks = savedTasks ? JSON.parse(savedTasks) : {};
      this.weeklyTasks = savedWeeklyTasks ? JSON.parse(savedWeeklyTasks) : {};
      this.taskIdCounter = savedCounter ? parseInt(savedCounter) : 1;
      this.weeklyTaskIdCounter = savedWeeklyCounter ? parseInt(savedWeeklyCounter) : 1;

      // Convert deadline strings back to Date objects
      Object.values(this.weeklyTasks).forEach(userTasks => {
        userTasks.forEach(task => {
          if (task.deadline) {
            task.deadline = new Date(task.deadline);
          }
          if (task.createdAt) {
            task.createdAt = new Date(task.createdAt);
          }
          if (task.completedAt) {
            task.completedAt = new Date(task.completedAt);
          }
        });
      });

      // Convert date strings back to Date objects for regular tasks
      Object.values(this.tasks).forEach(userTasks => {
        userTasks.forEach(task => {
          if (task.createdAt) {
            task.createdAt = new Date(task.createdAt);
          }
          if (task.completedAt) {
            task.completedAt = new Date(task.completedAt);
          }
        });
      });

    } catch (error) {
      console.error('Error loading user data:', error);
      this.tasks = {};
      this.weeklyTasks = {};
    }
  }

  saveUserData() {
    try {
      localStorage.setItem('taskManager_tasks', JSON.stringify(this.tasks));
      localStorage.setItem('taskManager_weeklyTasks', JSON.stringify(this.weeklyTasks));
      localStorage.setItem('taskManager_counter', this.taskIdCounter.toString());
      localStorage.setItem('taskManager_weeklyCounter', this.weeklyTaskIdCounter.toString());
    } catch (error) {
      console.error('Error saving user data:', error);
    }
  }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new TaskManager();
});
