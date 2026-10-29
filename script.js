// TaskFlow — organizador de tarefas
// As tarefas ficam salvas no localStorage deste navegador.
const STORAGE_KEY = "taskflow-tarefas-v1";

const taskForm = document.getElementById("taskForm");
const taskTitle = document.getElementById("taskTitle");
const taskDate = document.getElementById("taskDate");
const taskPriority = document.getElementById("taskPriority");
const taskList = document.getElementById("taskList");
const emptyState = document.getElementById("emptyState");
const searchTask = document.getElementById("searchTask");
const filterButtons = document.querySelectorAll(".filter-tab");
const clearCompletedButton = document.getElementById("clearCompleted");

let tasks = loadTasks();
let currentFilter = "todas";
let currentSearch = "";

function loadTasks() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch (error) {
    console.error("Não foi possível carregar as tarefas:", error);
    return [];
  }
}

function saveTasks() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

function createId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function setToday() {
  const now = new Date();
  document.getElementById("todayWeekday").textContent =
    new Intl.DateTimeFormat("pt-BR", { weekday: "long" }).format(now);
  document.getElementById("todayDate").textContent =
    new Intl.DateTimeFormat("pt-BR", { day: "numeric", month: "long", year: "numeric" }).format(now);
  document.getElementById("year").textContent = now.getFullYear();

  // Evita escolher por engano uma data anterior à de hoje.
  const localDate = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
    .toISOString().slice(0, 10);
  taskDate.min = localDate;
}

function formatDate(dateString) {
  if (!dateString) return "";
  const [year, month, day] = dateString.split("-").map(Number);
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short" })
    .format(new Date(year, month - 1, day));
}

function getDueClass(dateString, completed) {
  if (!dateString || completed) return "";
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(`${dateString}T00:00:00`);
  if (due < today) return "overdue";
  if (due.getTime() === today.getTime()) return "due-today";
  return "";
}

function addTask(event) {
  event.preventDefault();
  const title = taskTitle.value.trim();
  if (!title) {
    taskTitle.focus();
    return;
  }

  tasks.unshift({
    id: createId(),
    title,
    dueDate: taskDate.value,
    priority: taskPriority.value,
    completed: false,
    createdAt: new Date().toISOString()
  });

  saveTasks();
  taskForm.reset();
  taskPriority.value = "normal";
  render();
  taskTitle.focus();
}

function toggleTask(id) {
  tasks = tasks.map(task =>
    task.id === id ? { ...task, completed: !task.completed } : task
  );
  saveTasks();
  render();
}

function deleteTask(id) {
  const task = tasks.find(item => item.id === id);
  if (!task) return;
  if (!confirm(`Excluir a tarefa "${task.title}"?`)) return;
  tasks = tasks.filter(item => item.id !== id);
  saveTasks();
  render();
}

function clearCompleted() {
  const completedCount = tasks.filter(task => task.completed).length;
  if (!completedCount) {
    alert("Você ainda não tem tarefas concluídas.");
    return;
  }
  if (!confirm(`Deseja excluir ${completedCount} tarefa(s) concluída(s)?`)) return;
  tasks = tasks.filter(task => !task.completed);
  saveTasks();
  render();
}

function getVisibleTasks() {
  return tasks.filter(task => {
    const matchesFilter =
      currentFilter === "todas" ||
      (currentFilter === "pendentes" && !task.completed) ||
      (currentFilter === "concluidas" && task.completed);
    const matchesSearch = task.title.toLocaleLowerCase("pt-BR")
      .includes(currentSearch.toLocaleLowerCase("pt-BR"));
    return matchesFilter && matchesSearch;
  });
}

function renderStats() {
  const total = tasks.length;
  const completed = tasks.filter(task => task.completed).length;
  const pending = total - completed;
  const progress = total ? Math.round((completed / total) * 100) : 0;

  document.getElementById("totalCount").textContent = total;
  document.getElementById("pendingCount").textContent = pending;
  document.getElementById("completedCount").textContent = completed;
  document.getElementById("progressPercent").textContent = progress;
  document.getElementById("progressBar").style.width = `${progress}%`;

  const summary = pending === 0 && total > 0
    ? "Todas as tarefas concluídas. Mandou bem!"
    : `${pending} tarefa${pending === 1 ? "" : "s"} pendente${pending === 1 ? "" : "s"}`;
  document.getElementById("taskSummary").textContent = total ? summary : "Tudo pronto para começar";
}

function render() {
  renderStats();
  const visibleTasks = getVisibleTasks();
  taskList.innerHTML = "";
  document.getElementById("visibleCount").textContent = visibleTasks.length;
  emptyState.classList.toggle("hidden", visibleTasks.length > 0);

  if (!visibleTasks.length) {
    const hasTasks = tasks.length > 0;
    emptyState.querySelector("h3").textContent = hasTasks
      ? "Nenhuma tarefa encontrada"
      : "Nenhuma tarefa por aqui";
    emptyState.querySelector("p").textContent = hasTasks
      ? "Tente mudar o filtro ou buscar por outro termo."
      : "Adicione sua primeira tarefa e comece a organizar seu dia.";
    return;
  }

  visibleTasks.forEach(task => {
    const item = document.createElement("article");
    item.className = `task-item${task.completed ? " completed" : ""}`;

    const check = document.createElement("button");
    check.className = "check-task";
    check.type = "button";
    check.setAttribute("aria-label", task.completed ? "Marcar como pendente" : "Marcar como concluída");
    check.setAttribute("aria-pressed", String(task.completed));
    check.textContent = task.completed ? "✓" : "";
    check.addEventListener("click", () => toggleTask(task.id));

    const main = document.createElement("div");
    main.className = "task-main";
    const title = document.createElement("div");
    title.className = "task-title";
    title.textContent = task.title;

    const meta = document.createElement("div");
    meta.className = "task-meta";
    const priority = document.createElement("span");
    priority.className = `priority priority-${task.priority}`;
    priority.textContent = `PRIORIDADE ${task.priority.toUpperCase()}`;
    meta.appendChild(priority);

    if (task.dueDate) {
      const due = document.createElement("span");
      due.className = `due-date ${getDueClass(task.dueDate, task.completed)}`;
      due.textContent = `◷ ${formatDate(task.dueDate)}`;
      meta.appendChild(due);
    }

    main.append(title, meta);

    const actions = document.createElement("div");
    actions.className = "task-actions";
    const remove = document.createElement("button");
    remove.type = "button";
    remove.textContent = "×";
    remove.setAttribute("aria-label", `Excluir tarefa ${task.title}`);
    remove.title = "Excluir tarefa";
    remove.addEventListener("click", () => deleteTask(task.id));
    actions.appendChild(remove);

    item.append(check, main, actions);
    taskList.appendChild(item);
  });
}

taskForm.addEventListener("submit", addTask);

filterButtons.forEach(button => {
  button.addEventListener("click", () => {
    currentFilter = button.dataset.filter;
    filterButtons.forEach(tab => tab.classList.toggle("active", tab === button));
    render();
  });
});

searchTask.addEventListener("input", event => {
  currentSearch = event.target.value.trim();
  render();
});

clearCompletedButton.addEventListener("click", clearCompleted);

setToday();
render();
