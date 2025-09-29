import {
  initFirebase,
  authenticateUser,
  saveChecklistProgress,
  registerProductionEvent,
  reportShortage,
  syncQueuedActions
} from "./firebase.js";
import { listenNetworkChanges, bootstrapOfflineQueue } from "./offline-sync.js";

const appState = {
  user: null,
  plantao: "1",
  currentScreen: "dashboardScreen"
};

const selectors = {
  screens: document.querySelectorAll(".screen"),
  tabs: document.querySelectorAll(".tab"),
  navButtons: document.querySelectorAll("[data-nav]"),
  plantaoButtons: document.querySelectorAll("[data-plantao]"),
  connectionStatus: document.getElementById("connectionStatus"),
  topControls: document.getElementById("topControls"),
  loginForm: document.getElementById("loginForm"),
  loginScreen: document.getElementById("loginScreen"),
  tabBar: document.querySelector(".tab-bar"),
  clockBind: document.querySelector("[data-bind='clock']"),
  plantaoBind: document.querySelector("[data-bind='plantao']"),
  plantaoLabel: document.querySelector("[data-bind='plantaoLabel']"),
  prodPercent: document.querySelector("[data-bind='prodPercent']"),
  prodPercentBar: document.querySelector("[data-bind='prodPercentBar']"),
  prodPendentes: document.querySelector("[data-bind='prodPendentes']"),
  prodPendentesBadge: document.querySelector("[data-bind='prodPendentesBadge']"),
  criticalPendencias: document.querySelector("[data-bind='criticalPendencias']")
};

(async function bootstrap() {
  await bootstrapOfflineQueue();
  await initFirebase();
  hydrateLoginFromStorage();
  setupEventBindings();
  updateClock();
  setInterval(updateClock, 30 * 1000);
  updatePlantaoBindings();
  updateProductionSummary();
  updateStepAccessibility();
  manageConnectivity();
  registerServiceWorker();
})();

function hydrateLoginFromStorage() {
  const stored = JSON.parse(localStorage.getItem("five-login") || "null");
  if (!stored) return;

  selectors.loginForm.loginId.value = stored.loginId || "";
  selectors.loginForm.loginPin.value = stored.loginPin || "";
  selectors.loginForm.loginRole.value = stored.loginRole || "garcom";
  selectors.loginForm.loginShift.value = stored.loginShift || "1";
}

function setupEventBindings() {
  selectors.loginForm?.addEventListener("submit", handleLoginSubmit);
  selectors.tabs.forEach((tab) => {
    tab.addEventListener("click", handleTabChange);
    tab.addEventListener("keydown", handleTabKeydown);
  });
  selectors.navButtons.forEach((button) => button.addEventListener("click", handleQuickNav));
  selectors.plantaoButtons.forEach((button) => button.addEventListener("click", handlePlantaoChange));
  document.querySelectorAll("[data-action='marcarSecao']").forEach((btn) => btn.addEventListener("click", markSectionCompleted));
  document.querySelectorAll("[data-action='proximo']").forEach((btn) => btn.addEventListener("click", () => advanceStep(1)));
  document.querySelectorAll("[data-action='anterior']").forEach((btn) => btn.addEventListener("click", () => advanceStep(-1)));
  document.querySelectorAll("#productionList [data-action]").forEach((btn) => btn.addEventListener("click", handleProductionAction));
  document.querySelector("[data-action='salvarConfig']")?.addEventListener("click", handleSaveConfig);
}

async function handleLoginSubmit(event) {
  event.preventDefault();
  const formData = new FormData(event.target);
  const credentials = {
    userId: (formData.get("loginId") || "").toString().trim(),
    pin: (formData.get("loginPin") || "").toString().trim(),
    role: formData.get("loginRole"),
    shift: formData.get("loginShift")
  };

  try {
    const user = await authenticateUser(credentials);
    appState.user = user;
    appState.plantao = credentials.shift;
    persistLogin(credentials);
    showMainApp();
  } catch (error) {
    toast(error.message || "Falha no login", { variant: "error" });
  }
}

function persistLogin({ userId, pin, role, shift }) {
  localStorage.setItem(
    "five-login",
    JSON.stringify({ loginId: userId, loginPin: pin, loginRole: role, loginShift: shift })
  );
}

function showMainApp() {
  selectors.loginScreen?.classList.remove("screen--active");
  selectors.loginScreen?.setAttribute("aria-hidden", "true");
  selectors.tabBar?.classList.add("tab-bar--visible");
  switchScreen(appState.currentScreen, { focusPanel: true });
  updatePlantaoBindings();
}

function handleTabChange(event) {
  const button = event.currentTarget;
  const targetScreen = button.dataset.screen;
  switchScreen(targetScreen, { focusPanel: true });
}

function handleTabKeydown(event) {
  const key = event.key;
  const tabs = Array.from(selectors.tabs);
  const currentIndex = tabs.indexOf(event.currentTarget);
  if (currentIndex === -1) return;

  let nextIndex = currentIndex;
  if (key === "ArrowRight") {
    event.preventDefault();
    nextIndex = (currentIndex + 1) % tabs.length;
  } else if (key === "ArrowLeft") {
    event.preventDefault();
    nextIndex = (currentIndex - 1 + tabs.length) % tabs.length;
  } else if (key === "Home") {
    event.preventDefault();
    nextIndex = 0;
  } else if (key === "End") {
    event.preventDefault();
    nextIndex = tabs.length - 1;
  } else {
    return;
  }

  const nextTab = tabs[nextIndex];
  nextTab?.focus();
  nextTab?.click();
}

function switchScreen(targetId, { focusPanel = false } = {}) {
  if (!targetId) return;

  const targetScreen = document.getElementById(targetId);
  if (!targetScreen) return;

  appState.currentScreen = targetId;

  selectors.screens.forEach((screen) => {
    const isActive = screen.id === targetId;
    screen.classList.toggle("screen--active", isActive);
    const isTabPanel = screen.getAttribute("role") === "tabpanel";
    if (isTabPanel) {
      screen.setAttribute("aria-hidden", isActive ? "false" : "true");
      screen.setAttribute("tabindex", isActive ? "0" : "-1");
      if (isActive && focusPanel) {
        focusActivePanel(screen);
      }
    }
  });

  selectors.tabs.forEach((tab) => {
    const isActive = tab.dataset.screen === targetId;
    tab.classList.toggle("tab--active", isActive);
    tab.setAttribute("aria-selected", isActive ? "true" : "false");
    tab.setAttribute("tabindex", isActive ? "0" : "-1");
  });

  if (targetId === "dashboardScreen" || targetId === "producaoScreen") {
    updateProductionSummary();
  }
}

function focusActivePanel(panel) {
  if (!(panel instanceof HTMLElement)) return;

  panel.focus({ preventScroll: false });

  const preferred = panel.querySelector("[data-focus-initial]");
  if (preferred instanceof HTMLElement) {
    preferred.focus({ preventScroll: false });
  }
}

function handleQuickNav(event) {
  const targetScreen = event.currentTarget.dataset.nav;
  if (!targetScreen) return;

  const screenId = `${targetScreen}Screen`;
  const tabButton = document.querySelector(`.tab[data-screen='${screenId}']`);
  tabButton?.click();
}

function handlePlantaoChange(event) {
  const button = event.currentTarget;
  appState.plantao = button.dataset.plantao;
  updatePlantaoBindings();
}

function updatePlantaoBindings() {
  selectors.plantaoButtons.forEach((btn) => {
    const isActive = btn.dataset.plantao === appState.plantao;
    btn.classList.toggle("chip--active", isActive);
    btn.setAttribute("aria-pressed", isActive ? "true" : "false");
  });

  selectors.plantaoBind?.textContent = appState.plantao;
  selectors.plantaoLabel?.textContent = `Plantão ${appState.plantao}`;
}

function markSectionCompleted(event) {
  const section = event.currentTarget.dataset.section;
  const checkboxes = document.querySelectorAll(`input[data-checklist='${section}']`);
  checkboxes.forEach((checkbox) => {
    checkbox.checked = true;
  });

  saveChecklistProgress({
    id: `${appState.user?.id || "offline"}-${section}-${Date.now()}`,
    section,
    shift: appState.plantao,
    status: "completed"
  }).catch(console.error);
}

function advanceStep(stepDiff) {
  const steps = Array.from(document.querySelectorAll("#stepperAbertura .step"));
  const currentIndex = steps.findIndex((step) => step.classList.contains("step--active"));
  const nextIndex = Math.min(Math.max(currentIndex + stepDiff, 0), steps.length - 1);
  steps.forEach((step, index) => step.classList.toggle("step--active", index === nextIndex));
  updateStepAccessibility(steps);
}

function updateStepAccessibility(existingSteps) {
  const steps = existingSteps || Array.from(document.querySelectorAll("#stepperAbertura .step"));

  steps.forEach((step, index) => {
    const isActive = step.classList.contains("step--active");
    step.setAttribute("aria-current", isActive ? "step" : "false");

    const title = step.querySelector(".step__title");
    if (title && !title.id) {
      title.id = `step-title-${index + 1}`;
    }

    const content = step.querySelector(".step__content");
    if (content) {
      if (!content.id) {
        content.id = `step-content-${index + 1}`;
      }
      step.setAttribute("aria-describedby", content.id);
    }

    const controls = step.querySelectorAll("button, input[type='checkbox']");
    controls.forEach((control) => {
      if (title) {
        control.setAttribute("aria-describedby", title.id);
      }

      if (control.matches("button")) {
        control.disabled = !isActive;
      }

      if (control.matches("input[type='checkbox']")) {
        control.disabled = !isActive;
      }
    });
  });
}

function handleProductionAction(event) {
  const action = event.currentTarget.dataset.action;
  const item = event.currentTarget.closest(".production-item");
  if (!item) return;

  const quantityNode = item.querySelector("[data-bind='quantidade']");
  const title = item.querySelector(".item-title")?.textContent || "item";
  const currentQty = Number(quantityNode?.textContent || 0);

  const payload = {
    item: title,
    shift: appState.plantao,
    role: appState.user?.role || "desconhecido",
    timestamp: Date.now()
  };

  const actionsMap = {
    incrementar: () => incrementItem(quantityNode, currentQty, payload),
    decrementar: () => decrementItem(quantityNode, currentQty, payload),
    concluir: () => concludeItem(item, payload),
    falta: () => markShortage(item, payload),
    notificar: () => notifyManager(payload)
  };

  actionsMap[action]?.();
  updateProductionSummary();
}

function updateQty(node, value) {
  if (node) {
    node.textContent = value;
    const parent = node.closest(".production-item");
    parent?.querySelector("[data-bind='produzido']")?.textContent = value;
  }
}

function updateProductionSummary() {
  const items = Array.from(document.querySelectorAll("#productionList .production-item"));
  if (!items.length) return;

  let metaTotal = 0;
  let producedTotal = 0;
  let pendingCount = 0;
  let criticalCount = 0;

  items.forEach((item) => {
    const meta = Number(item.dataset.meta || 0);
    if (Number.isFinite(meta) && meta > 0) {
      metaTotal += meta;
    }

    const producedNode = item.querySelector("[data-bind='quantidade']") || item.querySelector("[data-bind='produzido']");
    const produced = Number(producedNode?.textContent || 0);
    if (Number.isFinite(meta) && meta > 0) {
      producedTotal += Math.min(produced, meta);
    }

    const status = (item.dataset.status || "").toLowerCase();
    if (status !== "pronto") {
      pendingCount += 1;
    }
    if (status === "falta") {
      criticalCount += 1;
    }
  });

  const percent = metaTotal > 0 ? Math.round((producedTotal / metaTotal) * 100) : 0;

  selectors.prodPercent?.setAttribute("data-value", String(percent));
  if (selectors.prodPercent) {
    selectors.prodPercent.textContent = String(percent);
  }

  if (selectors.prodPercentBar) {
    selectors.prodPercentBar.style.setProperty("--progress", `${percent}%`);
    selectors.prodPercentBar.parentElement?.setAttribute(
      "aria-label",
      `${percent}% da produção concluída`
    );
  }

  if (selectors.prodPendentes) {
    selectors.prodPendentes.textContent = String(pendingCount);
  }

  if (selectors.prodPendentesBadge) {
    selectors.prodPendentesBadge.textContent = String(pendingCount);
  }

  if (selectors.criticalPendencias) {
    selectors.criticalPendencias.textContent = String(criticalCount);
  }
}

function incrementItem(node, currentQty, payload) {
  const newValue = currentQty + 1;
  updateQty(node, newValue);
  registerProductionEvent({ ...payload, type: "increment", value: newValue });
}

function decrementItem(node, currentQty, payload) {
  if (currentQty === 0) return;
  const newValue = currentQty - 1;
  updateQty(node, newValue);
  registerProductionEvent({ ...payload, type: "decrement", value: newValue });
}

function concludeItem(item, payload) {
  item.dataset.status = "pronto";
  reportCompletionUI(item, "Pronto", "badge--green");
  registerProductionEvent({ ...payload, type: "completed" });
}

function markShortage(item, payload) {
  item.dataset.status = "falta";
  reportCompletionUI(item, "Falta insumo", "badge--red");
  reportShortage({ ...payload, reason: "manual" });
}

function notifyManager(payload) {
  reportShortage({ ...payload, reason: "notified" });
  toast("Gerente notificado", {
    variant: "success",
    duration: 4000
  });
}

function reportCompletionUI(item, label, badgeClass) {
  const container = item.querySelector(".production-actions");
  if (!container) return;

  container.innerHTML = `<span class="badge ${badgeClass}">${label}</span>`;
}

function handleSaveConfig() {
  const form = document.querySelector(".config-form");
  if (!form) return;

  const prefs = {
    setor: form.querySelector("[data-config='setor']")?.value,
    altoContraste: form.querySelector("[data-config='altoContraste']")?.checked,
    vibracao: form.querySelector("[data-config='vibracao']")?.checked,
    idioma: form.querySelector("[data-config='idioma']")?.value
  };

  localStorage.setItem("five-preferences", JSON.stringify(prefs));
  toast("Preferências salvas", { variant: "success" });
}

function manageConnectivity() {
  updateConnectivityUI(navigator.onLine);
  if (navigator.onLine) {
    syncQueuedActions().catch(console.error);
  }

  listenNetworkChanges({
    onOnline: async () => {
      updateConnectivityUI(true);
      const synced = await syncQueuedActions();
      if (synced > 0) {
        toast(`${synced} ações sincronizadas`);
      }
    },
    onOffline: () => updateConnectivityUI(false)
  });
}

function updateConnectivityUI(isOnline) {
  const indicator = selectors.connectionStatus;
  if (!indicator) return;

  indicator.querySelector(".indicator-dot").style.backgroundColor = isOnline ? "#2e7d32" : "#d32f2f";
  indicator.querySelector(".indicator-text").textContent = isOnline ? "Online" : "Offline";
}

function toast(message, options = {}) {
  const { variant = "default", duration = 3200, action } = options;
  const region = ensureToastRegion();

  const toastNode = document.createElement("div");
  toastNode.className = `toast toast--${variant}`;
  toastNode.setAttribute("role", "status");
  toastNode.setAttribute("aria-live", "polite");

  const textNode = document.createElement("span");
  textNode.className = "toast__message";
  textNode.textContent = message;
  toastNode.appendChild(textNode);

  if (action?.label && typeof action?.onPress === "function") {
    const actionBtn = document.createElement("button");
    actionBtn.type = "button";
    actionBtn.className = "toast__action";
    actionBtn.textContent = action.label;
    actionBtn.addEventListener("click", () => {
      action.onPress();
      dismissToast(toastNode);
    });
    toastNode.appendChild(actionBtn);
  }

  region.appendChild(toastNode);

  requestAnimationFrame(() => {
    toastNode.classList.add("toast--visible");
  });

  if (Number.isFinite(duration) && duration > 0) {
    setTimeout(() => dismissToast(toastNode), duration);
  }

  return {
    dismiss: () => dismissToast(toastNode)
  };
}

function ensureToastRegion() {
  let region = document.getElementById("toastRegion");
  if (!region) {
    region = document.createElement("div");
    region.id = "toastRegion";
    region.className = "toast-region";
    region.setAttribute("aria-live", "polite");
    region.setAttribute("role", "status");
    document.body.appendChild(region);
  }
  return region;
}

function dismissToast(toastNode) {
  if (!toastNode) return;
  toastNode.classList.remove("toast--visible");
  toastNode.setAttribute("aria-hidden", "true");
  setTimeout(() => toastNode.remove(), 400);
}

function updateClock() {
  const now = new Date();
  const formatted = now.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  if (selectors.clockBind) {
    selectors.clockBind.textContent = formatted;
  }
}

function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;

  navigator.serviceWorker
    .register("/sw.js")
    .then(() => console.info("Service worker registrado"))
    .catch((error) => console.error("Falha ao registrar service worker", error));
}
