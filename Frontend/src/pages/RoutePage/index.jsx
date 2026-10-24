import './style.scss';

function RoutePage({ section }) {
  const recordLabel = section.title === 'Salary' ? 'record' : section.title.slice(0, -1).toLowerCase();

  return (
    <section className="route-page">
      <div className="page-intro route-intro">
        <div>
          <p className="eyebrow">NORTHSTAR WORKSPACE</p>
          <h1>{section.title}<span className="heading-period">.</span></h1>
          <p className="intro-copy">{section.description}</p>
        </div>
        <button className="primary-button" type="button" onClick={() => window.alert(`${section.title} actions are ready to connect.`)}>
          <span aria-hidden="true">+</span> New {recordLabel}
        </button>
      </div>
      <div className="route-summary">
        <span><strong>{section.rows.length}</strong> demo records</span>
        <span className="route-filter">All records <span aria-hidden="true">v</span></span>
      </div>
      <div className="panel route-table-panel">
        <div className="activity-table-wrap">
          <table className="activity-table route-table">
            <thead><tr>{section.columns.map((column) => <th key={column}>{column}</th>)}</tr></thead>
            <tbody>{section.rows.map((row) => (
              <tr key={row[0]}>{row.map((value, index) => (
                <td key={value}>
                  {index === 0 ? <strong>{value}</strong> : index === row.length - 1 ? <span className={`status-pill ${value === 'Active' || value === 'Approved' ? '' : 'status-new'}`}>{value}</span> : value}
                </td>
              ))}</tr>
            ))}</tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

export default RoutePage;