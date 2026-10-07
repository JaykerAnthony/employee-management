import { useEffect, useState } from "react"
import Employee from "./components/Employee"
import "./App.css"

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? "").trim().replace(/\/+$/, "")
const API_URL = `${API_BASE_URL}/api/employees`
const emptyForm = { firstName: "", lastName: "", email: "", department: "" }

function App() {
  const [form, setForm] = useState(emptyForm)
  const [employees, setEmployees] = useState([])
  const [editingId, setEditingId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => { loadEmployees() }, [])

  async function loadEmployees() {
    try {
      const response = await fetch(API_URL)
      if (!response.ok) throw new Error("Unable to load employees")
      setEmployees(await response.json())
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setLoading(false)
    }
  }

  function handleChange(event) {
    const { name, value } = event.target
    setForm((currentForm) => ({ ...currentForm, [name]: value }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError("")
    setSaving(true)
    const isEditing = editingId !== null
    const url = isEditing ? `${API_URL}/${editingId}` : API_URL

    try {
      const response = await fetch(url, {
        method: isEditing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      if (!response.ok) throw new Error("Unable to save employee")
      const savedEmployee = await response.json()
      setEmployees((currentEmployees) => isEditing
        ? currentEmployees.map((employee) => employee.id === editingId ? savedEmployee : employee)
        : [...currentEmployees, savedEmployee])
      resetForm()
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setSaving(false)
    }
  }

  async function deleteEmployee(id) {
    setError("")
    try {
      const response = await fetch(`${API_URL}/${id}`, { method: "DELETE" })
      if (!response.ok) throw new Error("Unable to delete employee")
      setEmployees((currentEmployees) => currentEmployees.filter((employee) => employee.id !== id))
      if (editingId === id) resetForm()
    } catch (requestError) {
      setError(requestError.message)
    }
  }

  function editEmployee(employee) {
    setForm({ firstName: employee.firstName ?? "", lastName: employee.lastName ?? "", email: employee.email ?? "", department: employee.department ?? "" })
    setEditingId(employee.id)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  function resetForm() {
    setForm(emptyForm)
    setEditingId(null)
  }

  return (
    <main className="app-shell">
      <section className="app-container">
        <header className="page-header">
          <p className="eyebrow">People operations</p>
          <h1>Employee directory</h1>
          <p className="subtitle">Manage your team in one simple workspace.</p>
        </header>

        <section className="panel form-panel">
          <div className="section-heading">
            <div><p className="eyebrow">{editingId ? "Edit record" : "New record"}</p><h2>{editingId ? "Update employee" : "Add an employee"}</h2></div>
            {editingId && <button className="text-button" onClick={resetForm}>Cancel</button>}
          </div>
          <form onSubmit={handleSubmit} className="form-grid">
            <label>First name<input name="firstName" value={form.firstName} onChange={handleChange} required /></label>
            <label>Last name<input name="lastName" value={form.lastName} onChange={handleChange} required /></label>
            <label>Email<input type="email" name="email" value={form.email} onChange={handleChange} required /></label>
            <label>Department<input name="department" value={form.department} onChange={handleChange} required /></label>
            <button className="primary-button form-submit" type="submit" disabled={saving}>{saving ? "Saving..." : editingId ? "Save changes" : "Add employee"}</button>
          </form>
        </section>

        {error && <p className="error-message">{error}. Check that the backend and database are running.</p>}

        <section className="directory-section">
          <div className="section-heading">
            <div><p className="eyebrow">Directory</p><h2>All employees</h2></div>
            <span className="count-badge">{employees.length} total</span>
          </div>
          {loading ? <p className="empty-state">Loading employees...</p> : employees.length === 0 ? <p className="empty-state">No employees yet. Add your first record above.</p> : (
            <div className="employee-list">{employees.map((employee) => <Employee key={employee.id} employee={employee} onDelete={deleteEmployee} onEdit={editEmployee} />)}</div>
          )}
        </section>
      </section>
    </main>
  )
}

export default App
