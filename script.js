const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

const pageNames = {
  inicio: "Início", consultas: "Consultas", exames: "Meus exames", vacinas: "Vacinas",
  medicamentos: "Medicamentos", prontuario: "Prontuário", fila: "Token Fila",
  telemedicina: "Telemedicina", perfil: "Meu perfil"
};

function showToast(message) {
  const toast = $("#toast");
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.remove("show"), 3000);
}

function navigate(page) {
  if (!pageNames[page]) return;
  $$(".page-section").forEach(section => section.classList.toggle("active", section.id === `page-${page}`));
  $$(".nav-link[data-page]").forEach(button => button.classList.toggle("active", button.dataset.page === page));
  $("#breadcrumbCurrent").textContent = pageNames[page];
  $("#sidebar").classList.remove("open");
  $("#menuToggle").setAttribute("aria-expanded", "false");
  window.scrollTo({ top: 0, behavior: "smooth" });
}
$$("[data-page]").forEach(button => button.addEventListener("click", () => navigate(button.dataset.page)));

$("#menuToggle").addEventListener("click", () => {
  const opened = $("#sidebar").classList.toggle("open");
  $("#menuToggle").setAttribute("aria-expanded", String(opened));
});
$("#closeNotice").addEventListener("click", () => $(".notice-banner").remove());

function toggleFont() {
  document.body.classList.toggle("large-text");
  showToast(document.body.classList.contains("large-text") ? "Texto ampliado." : "Tamanho do texto restaurado.");
}
function toggleContrast() {
  document.body.classList.toggle("high-contrast");
  showToast(document.body.classList.contains("high-contrast") ? "Alto contraste ativado." : "Alto contraste desativado.");
}
function toggleTheme() {
  document.body.classList.toggle("dark-mode");
  $("#themeButton").textContent = document.body.classList.contains("dark-mode") ? "☀" : "☾";
  showToast(document.body.classList.contains("dark-mode") ? "Modo escuro ativado." : "Modo claro ativado.");
}
$("#fontButton").addEventListener("click", toggleFont);
$("#accessFont").addEventListener("click", toggleFont);
$("#profileFont").addEventListener("click", toggleFont);
$("#contrastButton").addEventListener("click", toggleContrast);
$("#accessContrast").addEventListener("click", toggleContrast);
$("#profileContrast").addEventListener("click", toggleContrast);
$("#themeButton").addEventListener("click", toggleTheme);
$("#profileTheme").addEventListener("click", toggleTheme);

// Abas de consultas
$$("[data-tab]").forEach(tab => tab.addEventListener("click", () => {
  $$(".tab").forEach(item => item.classList.toggle("active", item === tab));
  $$(".tab-panel").forEach(panel => panel.classList.toggle("active", panel.id === `tab-${tab.dataset.tab}`));
}));

// Fluxo de agendamento: especialidade > profissional > data/horário > confirmação
let currentStep = 1;
let demoAppointments = [];
const appointmentForm = $("#appointmentForm");
function goToStep(step) {
  currentStep = step;
  $$(".form-step").forEach(panel => panel.classList.toggle("active", Number(panel.dataset.formStep) === step));
  $$(".step[data-step-indicator]").forEach(indicator => {
    const n = Number(indicator.dataset.stepIndicator);
    indicator.classList.toggle("active", n === step);
    indicator.classList.toggle("complete", n < step);
  });
  if (step === 4) renderAppointmentSummary();
}
function validateStep(step) {
  const panel = $(`[data-form-step="${step}"]`);
  const required = $$("select[required], input[required]", panel);
  for (const field of required) {
    if (!field.reportValidity()) return false;
  }
  if (step === 3) {
    const chosen = new Date(`${$("#appointmentDate").value}T00:00:00`);
    const today = new Date(); today.setHours(0,0,0,0);
    if (chosen < today) {
      showToast("Escolha uma data de hoje ou futura.");
      $("#appointmentDate").focus();
      return false;
    }
  }
  return true;
}
function renderAppointmentSummary() {
  const values = [
    ["Especialidade", $("#specialty").value],
    ["Profissional", $("#doctor").value],
    ["Data desejada", new Date(`${$("#appointmentDate").value}T00:00:00`).toLocaleDateString("pt-BR")],
    ["Horário", $("#appointmentTime").value]
  ];
  $("#appointmentSummary").innerHTML = values.map(([label, value]) =>
    `<div class="summary-line"><span>${label}</span><strong>${escapeHTML(value)}</strong></div>`
  ).join("");
}
function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, char => ({
    "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;"
  }[char]));
}
$$(".next-step").forEach(button => button.addEventListener("click", () => {
  if (validateStep(currentStep)) goToStep(Math.min(4, currentStep + 1));
}));
$$(".prev-step").forEach(button => button.addEventListener("click", () => goToStep(Math.max(1, currentStep - 1))));
appointmentForm.addEventListener("submit", event => {
  event.preventDefault();
  if (!validateStep(3)) return;
  const item = {
    specialty: $("#specialty").value,
    doctor: $("#doctor").value,
    date: $("#appointmentDate").value,
    time: $("#appointmentTime").value
  };
  demoAppointments.push(item);
  appointmentForm.hidden = true;
  $("#appointmentSuccess").hidden = false;
  renderAppointments();
  showToast("Demonstração concluída. Nenhuma consulta real foi marcada.");
});
$("#newAppointment").addEventListener("click", () => {
  appointmentForm.reset();
  appointmentForm.hidden = false;
  $("#appointmentSuccess").hidden = true;
  goToStep(1);
});
function renderAppointments() {
  const list = $("#appointmentsList");
  if (!demoAppointments.length) return;
  list.className = "";
  list.innerHTML = demoAppointments.map(item => `
    <div class="record-row">
      <span class="record-icon purple">▦</span>
      <div><strong>${escapeHTML(item.specialty)} · ${escapeHTML(item.doctor)}</strong>
      <p class="muted">${new Date(`${item.date}T00:00:00`).toLocaleDateString("pt-BR")} às ${escapeHTML(item.time)} · criado nesta sessão</p></div>
      <span class="status-pill status-orange">Demo</span>
    </div>`).join("");
}

// Busca de exames
$("#examSearch").addEventListener("input", event => {
  const term = event.target.value.toLocaleLowerCase("pt-BR");
  $$("#examRows tr").forEach(row => {
    row.hidden = !row.textContent.toLocaleLowerCase("pt-BR").includes(term);
  });
});
document.addEventListener("click", event => {
  const button = event.target.closest(".view-exam");
  if (!button) return;
  const exam = button.dataset.exam;
  if (exam === "Ultrassonografia") {
    showToast("Solicitação fictícia pendente. Nenhum exame real está disponível.");
  } else {
    showToast(`Resultado demonstrativo de “${exam}”. Não é um resultado clínico real.`);
  }
});

// Formulários demonstrativos
$("#vaccineForm").addEventListener("submit", event => {
  event.preventDefault();
  showToast(`Solicitação demo de ${$("#vaccineType").value} registrada apenas nesta sessão.`);
  event.target.reset();
});
$("#teleForm").addEventListener("submit", event => {
  event.preventDefault();
  showToast("Solicitação de teleconsulta demonstrativa concluída. Não há consulta real marcada.");
  event.target.reset();
});
$("#profileForm").addEventListener("submit", event => {
  event.preventDefault();
  showToast("Alterações demonstrativas salvas apenas durante esta sessão.");
});
$("#officialInfo").addEventListener("click", () => showToast("Consulte sempre os canais oficiais para informações atualizadas."));

let tokenCounter = 100;
$("#generateToken").addEventListener("click", () => {
  tokenCounter += Math.floor(Math.random() * 8) + 1;
  $("#tokenDisplay").innerHTML = `<small>SEU TOKEN DEMO</small><strong>F-${tokenCounter}</strong><span>Token ilustrativo · sem validade real</span>`;
  showToast("Token demonstrativo gerado. Não o utilize em uma unidade de saúde.");
});

// Impede seleção de datas anteriores ao dia atual nos formulários.
const todayISO = new Date();
todayISO.setMinutes(todayISO.getMinutes() - todayISO.getTimezoneOffset());
const todayValue = todayISO.toISOString().slice(0, 10);
["appointmentDate", "vaccineDate", "teleDate"].forEach(id => { $(`#${id}`).min = todayValue; });
