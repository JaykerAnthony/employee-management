function Employee({ employee, onDelete, onEdit }) {
  return (
    <article className="employee-card">
      <div className="avatar">{employee.firstName?.charAt(0)}{employee.lastName?.charAt(0)}</div>
      <div className="employee-info">
        <h3>{employee.firstName} {employee.lastName}</h3>
        <p>{employee.email}</p>
        <span className="department-tag">{employee.department}</span>
      </div>
      <div className="employee-actions">
        <button className="text-button" onClick={() => onEdit(employee)}>Edit</button>
        <button className="delete-button" onClick={() => onDelete(employee.id)}>Delete</button>
      </div>
    </article>
  )
}

export default Employee
