# Salario en España

<!-- markdownlint-disable MD046 -->

Una primera vertical centrada en salarios agregados por cohorte de edad. La fuente disponible no contiene microdatos individuales ni tramos exactos de renta, así que esta vista representa una distribución observada a partir de medias y volumen de asalariados por grupo.

<section class="hero-panel">
  <div>
    <p class="eyebrow">Vertical 01</p>
    <h2>Distribución salarial reciente</h2>
    <p class="hero-copy">
      Explora cómo cambia el salario medio por cohorte y cómo se reparte el peso laboral en España.
      El selector de modo no altera la fuente: cambia la forma de proyectar la distribución sobre el lienzo.
    </p>
  </div>
  <div class="hero-metrics" data-summary-cards></div>
</section>

<section class="salary-app-shell" data-salary-app>
  <div class="salary-toolbar">
    <label class="control-block">
      <span>Año</span>
      <select data-year-select></select>
    </label>

    <label class="control-block">
      <span>Distribución</span>
      <select data-mode-select>
        <option value="logarithmic">Logarítmica</option>
        <option value="equitable">Equitativa</option>
        <option value="custom">Custom</option>
      </select>
    </label>

    <div class="window-switch" data-window-switch>
      <button type="button" data-window="5">5 años</button>
      <button type="button" data-window="10" class="is-active">10 años</button>
      <button type="button" data-window="all">Serie completa</button>
    </div>
  </div>

  <div class="salary-figure-card">
    <div class="chart-copy">
      <div>
        <p class="eyebrow">Lectura principal</p>
        <h3 data-chart-title>Distribución por cohorte</h3>
      </div>
      <p data-chart-description></p>
    </div>
    <div class="salary-chart" data-chart></div>
  </div>

  <div class="detail-grid">
    <section class="detail-card">
      <p class="eyebrow">Serie temporal</p>
      <h3>Últimos años</h3>
      <div class="timeline-chart" data-timeline></div>
    </section>

    <section class="detail-card">
      <p class="eyebrow">Cohortes</p>
      <h3>Detalle del año seleccionado</h3>
      <div class="bucket-list" data-bucket-list></div>
    </section>
  </div>

  <div class="source-note" data-source-note></div>
</section>

<!-- markdownlint-enable MD046 -->
