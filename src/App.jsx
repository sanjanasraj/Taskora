
import { useState, useEffect } from 'react'
import './App.css'
const API_URL = 'https://taskora-backend-5tn1.onrender.com';

function App() {
  const [showForm, setShowForm] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('All')
  const [showAllTasks, setShowAllTasks] = useState(false)
  const [editingTask, setEditingTask] = useState(null)
  const [user, setUser] = useState(null)
  const [authMode, setAuthMode] = useState('login')
  const [authError, setAuthError] = useState('')
  const [authLoading, setAuthLoading] = useState(true)

  const [tasks, setTasks] = useState([
    {
      id: 1,
      title: 'Prepare project documentation',
      description: 'Organize project files and notes',
      dueDate: '2026-11-16',
      priority: 'High',
      status: 'In Progress',
    },
    {
      id: 2,
      title: 'Complete frontend design',
      description: 'Work on the dashboard layout',
      dueDate: '2026-11-17',
      priority: 'Medium',
      status: 'Pending',
    },
    {
      id: 3,
      title: 'Review weekly goals',
      description: 'Check completed goals',
      dueDate: '2026-11-15',
      priority: 'Low',
      status: 'Completed',
    },
  ])
  useEffect(() => {
    const checkLogin = async () => {
      try {
        const response = await fetch(`${API_URL}/api/me`, {
          credentials: 'include',
        })

        if (response.ok) {
          const userData = await response.json()
          setUser(userData)

          const tasksResponse = await fetch(
            `${API_URL}/api/tasks`,
            { credentials: 'include' }
          )

          if (tasksResponse.ok) {
            const tasksData = await tasksResponse.json()

            const formattedTasks = tasksData.map((task) => ({
              id: task.id,
              title: task.title,
              description: task.description,
              dueDate: task.due_date,
              priority: task.priority,
              status: task.status,
            }))

            setTasks(formattedTasks)
          }
        }
      } catch (error) {
        console.error('Session check failed:', error)
      } finally {
        setAuthLoading(false)
      }
    }

    checkLogin()
  }, [])
  const totalTasks = tasks.length

  const inProgressTasks = tasks.filter(
    (task) => task.status === 'In Progress'
  ).length

  const completedTasks = tasks.filter(
    (task) => task.status === 'Completed'
  ).length
  const handleAuthSubmit = async (event) => {
    event.preventDefault()
    setAuthError('')

    const formData = new FormData(event.target)

    const endpoint =
      authMode === 'login' ? '/api/login' : '/api/register'

    const userData = {
      email: formData.get('email'),
      password: formData.get('password'),
    }

    if (authMode === 'register') {
      userData.username = formData.get('username')
    }

    try {
      const response = await fetch(
        `${API_URL}${endpoint}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify(userData),
        }
      )

      const result = await response.json()

      if (!response.ok) {
        setAuthError(result.error || 'Something went wrong')
        return
      }

      if (authMode === 'register') {
        setAuthMode('login')
        setAuthError('Registration successful! Please log in.')
        return
      }

      const userResponse = await fetch(
        `${API_URL}/api/me`,
        { credentials: 'include' }
      )

      const loggedInUser = await userResponse.json()
      setUser(loggedInUser)

      const tasksResponse = await fetch(
        `${API_URL}/api/tasks`,
        { credentials: 'include' }
      )

      if (!tasksResponse.ok) {
        setAuthError('Could not load your tasks. Please refresh.')
        return
      }

      const tasksData = await tasksResponse.json()

      const formattedTasks = tasksData.map((task) => ({
        ...task,
        dueDate: task.due_date,
      }))

      setTasks(formattedTasks)

    } catch (error) {
      setAuthError('Unable to connect to the server.')
    }
  }
  const handleLogout = async () => {
    try {
      await fetch(`${API_URL}/api/logout`, {
        method: 'POST',
        credentials: 'include',
      })

      setUser(null)
      setTasks([])
      setAuthMode('login')
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }
  async function handleAddTask(event) {
    event.preventDefault()

    const formData = new FormData(event.target)

    const newTask = {
      title: formData.get('title'),
      description: formData.get('description'),
      due_date: formData.get('dueDate'),
      priority: formData.get('priority'),
      status: 'Pending',
    }

    try {
      const response = await fetch(`${API_URL}/api/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(newTask),
      })

      const result = await response.json()

      if (!response.ok) {
        alert(result.error || 'Could not create task')
        return
      }

      const savedTask = {
        id: result.task_id,
        title: newTask.title,
        description: newTask.description,
        dueDate: newTask.due_date,
        priority: newTask.priority,
        status: newTask.status,
      }

      setTasks((previousTasks) => [...previousTasks, savedTask])
      setShowForm(false)
      event.target.reset()

    } catch (error) {
      console.error('Task creation failed:', error)
      alert('Unable to connect to the server.')
    }
  }
  async function handleEditTask(event) {
    event.preventDefault()

    const formData = new FormData(event.target)

    const updatedTask = {
      ...editingTask,
      title: formData.get('title'),
      description: formData.get('description'),
      dueDate: formData.get('dueDate'),
      priority: formData.get('priority'),
    }

    try {
      const response = await fetch(
        `${API_URL}/api/tasks/${editingTask.id}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            title: updatedTask.title,
            description: updatedTask.description,
            due_date: updatedTask.dueDate,
            priority: updatedTask.priority,
            status: updatedTask.status,
          }),
        }
      )

      const result = await response.json()

      if (!response.ok) {
        alert(result.error || 'Could not update task')
        return
      }

      setTasks((previousTasks) =>
        previousTasks.map((task) =>
          task.id === editingTask.id ? updatedTask : task
        )
      )

      setEditingTask(null)
      setShowForm(false)

    } catch (error) {
      console.error('Task update failed:', error)
      alert('Unable to connect to the server.')
    }
  }
 
  async function handleDeleteTask(taskId) {
    const confirmed = window.confirm(
      'Are you sure you want to delete this task?'
    )

    if (!confirmed) return

    try {
      const response = await fetch(
        `${API_URL}/api/tasks/${taskId}`,
        {
          method: 'DELETE',
          credentials: 'include',
        }
      )

      const result = await response.json()

      if (!response.ok) {
        alert(result.error || 'Could not delete task')
        return
      }

      setTasks((previousTasks) =>
        previousTasks.filter((task) => task.id !== taskId)
      )
    } catch (error) {
      console.error('Delete error:', error)
      alert('Unable to connect to the server.')
    }
  }
  if (authLoading) {
    return <div className="loading-screen">Loading Taskora...</div>
  }

  if (!user) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <h1>taskora<span>.</span></h1>
          <p>Every Task Has Its Place.</p>

          <h2>{authMode === 'login' ? 'Welcome Back!' : 'Create Account'}</h2>

          <form onSubmit={handleAuthSubmit}>
            {authMode === 'register' && (
              <input
                type="text"
                name="username"
                placeholder="Username"
                required
              />
            )}

            <input
              type="email"
              name="email"
              placeholder="Email address"
              required
            />

            <input
              type="password"
              name="password"
              placeholder="Password (minimum 8 characters)"
              required
              minLength={8}
            />

            {authError && <p className="auth-error">{authError}</p>}

            <button type="submit">
              {authMode === 'login' ? 'Login' : 'Register'}
            </button>
          </form>

          <p>
            {authMode === 'login'
              ? "Don't have an account?"
              : 'Already have an account?'}
            <button
              type="button"
              className="auth-switch"
              onClick={() => {
                setAuthMode(authMode === 'login' ? 'register' : 'login')
                setAuthError('')
              }}
            >
              {authMode === 'login' ? ' Register' : ' Login'}
            </button>
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="app">
      <aside className="sidebar">
        <h2 className="logo">taskora<span>.</span></h2>
        <p className="tagline">PLAN · ORGANIZE · ACHIEVE</p>

        <nav>
          <a className="active" href="#dashboard">▦ Dashboard</a>
          <a href="#tasks">☷ My Tasks</a>
          <a href="#upcoming">◷ Upcoming</a>
          <a href="#completed">✓ Completed</a>
        </nav>

        <div className="sidebar-bottom">
          <p>Every Task Has Its Place.</p>
          <span>Stay focused. Keep growing.</span>
        </div>
      </aside>

      <main className="main-content" id="dashboard">
        <header className="topbar">
          <div>
            <p className="date-label">YOUR PRODUCTIVITY SPACE</p>
            <h1>Good day! 👋</h1>
            <p className="subtitle">Let's make today count.</p>
          </div>
          <div className="topbar-actions">
            <div className="profile">
              {user?.username?.charAt(0).toUpperCase() || 'U'}
            </div>

            <button
              className="logout-btn"
              onClick={handleLogout}
            >
              Logout
            </button>
          </div>
        </header>

        <section className="welcome-card">
          <div>
            <p className="eyebrow">WELCOME TO TASKORA</p>
            <h2>Make space for what matters.</h2>
            <p>Plan your day, organize your work, and celebrate your progress.</p>
            <button
              className="primary-btn"
              onClick={() => {
                setEditingTask(null)
                setShowForm(true)
              }}
            >
              + Create a task
            </button>
          </div>
          <div className="welcome-decoration">✦</div>
        </section>

        {showForm && (
          <div className="modal-overlay">
            <div className="task-modal">
              <div className="modal-header">
                <div>
                  <h2>{editingTask ? 'Edit Task' : 'Create a Task'}</h2>
                  <p>Add something you want to accomplish.</p>
                </div>

                <button
                  className="close-btn"
                  onClick={() => {
                    setShowForm(false)
                    setEditingTask(null)
                  }}
                  type="button"
                >
                  ×
                </button>
              </div>

              <form onSubmit={editingTask ? handleEditTask : handleAddTask}>
                <label>Task Title</label>
                <input
                  type="text"
                  name="title"
                  placeholder="Enter task title"
                  defaultValue={editingTask?.title || ''}
                  required
                />

                <label>Description</label>
                <textarea
                  name="description"
                  placeholder="Add task details..."
                  rows="3"
                  defaultValue={editingTask?.description || ''}
                />

                <label>Due Date</label>
                <input
                  type="date"
                  name="dueDate"
                  defaultValue={editingTask?.dueDate || ''}
                  required
                />

                <label>Priority</label>
                <select name="priority" defaultValue={editingTask?.priority || 'Medium'}>
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </select>

                <div className="form-actions">
                  <button
                    type="button"
                    className="cancel-btn"
                    onClick={() => {
                      setShowForm(false)
                      setEditingTask(null)
                    }}
                  >
                    Cancel
                  </button>

                  <button type="submit" className="primary-btn">
                    {editingTask ? 'Save Changes' : 'Add Task'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <section className="stats-grid">
          <div className="stat-card">
            <span>Total Tasks</span>
            <h2>{totalTasks}</h2>
            <small>All your tasks</small>
          </div>
          <div className="stat-card">
            <span>In Progress</span>
            <h2>{inProgressTasks}</h2>
            <small>Keep it moving</small>
          </div>
          <div className="stat-card">
            <span>Completed</span>
            <h2>{completedTasks}</h2>
            <small>Great progress!</small>
          </div>
        </section>

        <section className="tasks-section" id="tasks">
          <div className="section-heading">
            <div>
              <h2>{showAllTasks ? 'All Tasks' : 'Recent Tasks'}</h2>
              <p>{showAllTasks ? 'Your complete task list' : 'Your task overview'}</p>
            </div>
            <button
              className="view-btn"
              onClick={() => setShowAllTasks((previous) => !previous)}
            >
              {showAllTasks ? 'Show less ↑' : 'View all →'}
            </button>
          </div>
          <input
            type="text"
            className="search-input"
            placeholder="Search tasks..."
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
          <div className="filter-buttons">
            {['All', 'Pending', 'In Progress', 'Completed'].map((status) => (
              <button
                key={status}
                className={`filter-btn ${filterStatus === status ? 'active' : ''}`}
                onClick={() => setFilterStatus(status)}
              >
                {status}
              </button>
            ))}
          </div>

          {tasks
            .filter((task) => {
              const matchesSearch = task.title
                .toLowerCase()
                .includes(searchTerm.toLowerCase())

              const matchesStatus =
                filterStatus === 'All' || task.status === filterStatus

              return matchesSearch && matchesStatus
            })
            .map((task) => (
          <div className="task-row" key={task.id}>
            <div className="task-icon">✎</div>

            <div className="task-info">
              <h3>{task.title}</h3>
              <p>
                {task.dueDate || 'No due date'} · {task.description || 'No description'}
              </p>
            </div>

            <span className={`priority ${task.priority.toLowerCase()}`}>
              {task.priority}
            </span>

            <select
              className="task-status-select"
              value={task.status}
              onChange={async (event) => {
                const newStatus = event.target.value

                try {
                  const response = await fetch(
                    `${API_URL}/api/tasks/${task.id}`,
                    {
                      method: 'PUT',
                      headers: {
                        'Content-Type': 'application/json',
                      },
                      credentials: 'include',
                      body: JSON.stringify({
                        title: task.title,
                        description: task.description,
                        due_date: task.dueDate,
                        priority: task.priority,
                        status: newStatus,
                      }),
                    }
                  )

                  const result = await response.json()

                  if (!response.ok) {
                    alert(result.error || 'Could not update task status')
                    return
                  }

                  setTasks((previousTasks) =>
                    previousTasks.map((item) =>
                      item.id === task.id
                        ? { ...item, status: newStatus }
                        : item
                    )
                  )
                } catch (error) {
                  console.error('Status update error:', error)
                  alert('Unable to connect to the server.')
                }
              }}
            >
              <option value="Pending">Pending</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
            </select>
            <div className="task-actions">
              <button
                className="edit-btn"
                onClick={() => {
                  setEditingTask(task)
                  setShowForm(true)
                }}
              >
                Edit
              </button>

              <button
                className="delete-btn"
                onClick={() => handleDeleteTask(task.id)}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
        </section>
      </main>
    </div>
  )
}

export default App

