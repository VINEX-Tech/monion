import { MOCK_DATA_NOTICE, mockAlerts, mockMetrics, plannedSections } from './mock-data';

export function App() {
  return (
    <main>
      <header>
        <div>
          <span className="mark">M</span>
          <b>MONION</b>
        </div>
        <span>University operations prototype</span>
      </header>
      <p className="mockbanner" role="note">
        <strong>MOCK DATA</strong> {MOCK_DATA_NOTICE}
      </p>
      <section className="title">
        <div>
          <p>OPERATIONS PREVIEW</p>
          <h1>Fleet command</h1>
        </div>
        <button type="button" disabled title="Exports are not built yet">
          Export report (not built yet)
        </button>
      </section>
      <section className="metrics" aria-label="Mock metrics">
        {mockMetrics.map((metric) => (
          <article key={metric.label}>
            <span>{metric.label}</span>
            <strong className={metric.warn ? 'warn' : undefined}>{metric.value}</strong>
            <small>{metric.note}</small>
          </article>
        ))}
      </section>
      <section className="grid">
        <article className="map">
          <div className="sectionhead">
            <h2>Fleet map</h2>
            <span>MOCK</span>
          </div>
          <div className="mapbody">
            <i className="bus b1">12</i>
            <i className="bus b2">08</i>
            <i className="bus b3">21</i>
            <p>
              Placeholder positions. No map provider is connected.
              <br />
              No student identifiers are rendered here.
            </p>
          </div>
        </article>
        <article>
          <div className="sectionhead">
            <h2>Priority alerts</h2>
            <span>MOCK</span>
          </div>
          {mockAlerts.map((alert) => (
            <div className="alert" key={alert.bus}>
              <em>!</em>
              <div>
                <b>{alert.issue}</b>
                <small>{alert.bus}</small>
              </div>
              <time>{alert.age}</time>
            </div>
          ))}
        </article>
      </section>
      <nav aria-label="Planned sections">
        <small>Planned sections, not built yet:</small>
        {plannedSections.map((name) => (
          <span key={name}>{name}</span>
        ))}
      </nav>
    </main>
  );
}
