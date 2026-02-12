if (
  window.location.hostname === "127.0.0.1" ||
  window.location.hostname === "::1" ||
  window.location.hostname === "[::1]"
) {
  const port = window.location.port ? `:${window.location.port}` : "";
  const target = `${window.location.protocol}//localhost${port}${window.location.pathname}${window.location.search}${window.location.hash}`;
  window.location.replace(target);
}

const form = document.getElementById("po-form");
const itemsBody = document.getElementById("items-body");
const previewItems = document.getElementById("preview-items");
const dateInput = document.getElementById("date");
const addRowButton = document.getElementById("add-row");
const clearRowsButton = document.getElementById("clear-rows");
const exportButton = document.getElementById("export");
const resetButton = document.getElementById("reset");
const logoutButton = document.getElementById("logout");
const saveButton = document.getElementById("save");
const saveAsNewButton = document.getElementById("save-as-new");
const saveStatus = document.getElementById("save-status");
const editorSaveStatus = document.getElementById("editor-save-status");
const savedBody = document.getElementById("saved-body");
const savedTableWrap = document.querySelector(".saved-panel .table-wrap");
const trashBody = document.getElementById("trash-body");
const trashTableWrap = document.querySelector(".trash-panel .table-wrap");
const appHeader = document.querySelector(".app-header");
const headerActions = document.getElementById("header-actions");
const headerSettings = document.getElementById("header-settings");
const settingsToggleButton = document.getElementById("settings-toggle");
const settingsLoginRequestsDot = document.getElementById("settings-login-requests-dot");
const settingsMenu = document.getElementById("settings-menu");
const settingsThemeToggleButton = document.getElementById("settings-theme-toggle");
const settingsLoginRequestsButton = document.getElementById("settings-login-requests");
const settingsLoginRequestsBadge = document.getElementById("settings-login-requests-badge");
const settingsDbToolsButton = document.getElementById("settings-db-tools");
const settingsLogoutButton = document.getElementById("settings-logout");
const mobileMenuToggle = document.getElementById("mobile-menu-toggle");
const mobileMenuIcon = document.querySelector(".nav-toggle__icon");
const mobileLoginRequestsButton = document.getElementById("mobile-login-requests");
const mobileLoginRequestsDot = document.getElementById("mobile-login-requests-dot");
const openTrashButton = document.getElementById("open-trash");
const trashModal = document.getElementById("trash-modal");
const trashCloseButton = document.getElementById("trash-close");
const openDbToolsButton = document.getElementById("db-tools");
const dbToolsModal = document.getElementById("db-tools-modal");
const dbToolsCloseButton = document.getElementById("db-tools-close");
const dbRefreshBackupsButton = document.getElementById("db-refresh-backups");
const dbRestoreSelectedButton = document.getElementById("db-restore-selected");
const dbCheckUpdatesButton = document.getElementById("db-check-updates");
const dbApplyUpdatesButton = document.getElementById("db-apply-updates");
const dbBackupSelect = document.getElementById("db-backup-select");
const dbBackupsBody = document.getElementById("db-backups-body");
const dbToolsStatus = document.getElementById("db-tools-status");
const dbAutoSummary = document.getElementById("db-auto-summary");
const dbUpdatesSummary = document.getElementById("db-updates-summary");
const reportStyleOpenButton = document.getElementById("report-style-open");
const reportStyleModal = document.getElementById("report-style-modal");
const reportStyleCloseButton = document.getElementById("report-style-close");
const reportStyleResetButton = document.getElementById("report-style-reset");
const reportStyleSaveButton = document.getElementById("report-style-save");
const reportStyleSaveDefaultButton = document.getElementById("report-style-save-default");
const reportStyleDensityInput = document.getElementById("report-style-density");
const reportStyleTableThemeInput = document.getElementById("report-style-table-theme");
const reportStyleTitleAlignInput = document.getElementById("report-style-title-align");
const reportStyleFontScaleInput = document.getElementById("report-style-font-scale");
const reportStyleFontScaleValue = document.getElementById("report-style-font-scale-value");
const reportStyleTitleTextInput = document.getElementById("report-style-title-text");
const reportStyleNoteTextInput = document.getElementById("report-style-note-text");
const reportStyleEmptyTextInput = document.getElementById("report-style-empty-text");
const reportStyleFormLabelInput = document.getElementById("report-style-form-label");
const reportStyleDateLabelInput = document.getElementById("report-style-date-label");
const reportStyleToLabelInput = document.getElementById("report-style-to-label");
const reportStylePostalLabelInput = document.getElementById("report-style-postal-label");
const reportStyleShowRowNumberInput = document.getElementById("report-style-show-row-number");
const reportStyleShowSignaturesInput = document.getElementById("report-style-show-signatures");
const reportStyleSignatureTitleInput = document.getElementById("report-style-signature-title");
const reportStyleSignLabelFormCreatorInput = document.getElementById(
  "report-style-sign-label-form-creator"
);
const reportStyleSignLabelProductionManagerInput = document.getElementById(
  "report-style-sign-label-production-manager"
);
const reportStyleSignLabelManagerInput = document.getElementById(
  "report-style-sign-label-manager"
);
const reportStyleHeadIndexInput = document.getElementById("report-style-head-index");
const reportStyleHeadModelInput = document.getElementById("report-style-head-model");
const reportStyleHeadItemInput = document.getElementById("report-style-head-item");
const reportStyleHeadQtyInput = document.getElementById("report-style-head-qty");
const reportStyleHeadUnitInput = document.getElementById("report-style-head-unit");
const reportStyleHeadPlanInput = document.getElementById("report-style-head-plan");
const reportStyleShowLogoInput = document.getElementById("report-style-show-logo");
const reportStyleLogoAlignInput = document.getElementById("report-style-logo-align");
const reportStyleLogoScaleInput = document.getElementById("report-style-logo-scale");
const reportStyleLogoScaleValue = document.getElementById("report-style-logo-scale-value");
const reportStyleLogoFileInput = document.getElementById("report-style-logo-file");
const reportStyleLogoClearButton = document.getElementById("report-style-logo-clear");
const reportStylePaperColorInput = document.getElementById("report-style-paper-color");
const reportStyleTextColorInput = document.getElementById("report-style-text-color");
const reportStyleHeaderBgColorInput = document.getElementById("report-style-header-bg-color");
const reportStyleHeaderTextColorInput = document.getElementById("report-style-header-text-color");
const reportStyleBorderOuterColorInput = document.getElementById("report-style-border-outer-color");
const reportStyleBorderInnerColorInput = document.getElementById("report-style-border-inner-color");
const reportStyleRowOddColorInput = document.getElementById("report-style-row-odd-color");
const reportStyleRowEvenColorInput = document.getElementById("report-style-row-even-color");
const previewTableHeadIndex = document.querySelector('.preview-table thead th[data-column="index"]');
const searchInput = document.getElementById("search");
const signatureClearButtons = document.querySelectorAll(".signature-clear");
const editorBackdrop = document.getElementById("editor-backdrop");
const editorCloseButton = document.getElementById("editor-close");
const pdfModal = document.getElementById("pdf-preview-modal");
const pdfFrame = document.getElementById("pdf-frame");
const pdfCloseButton = document.getElementById("pdf-close");
const pdfDownloadButton = document.getElementById("pdf-download");
const authModal = document.getElementById("auth-modal");
const authTitle = document.getElementById("auth-title");
const authSubtitle = document.getElementById("auth-subtitle");
const authModeSwitch = document.getElementById("auth-mode-switch");
const authModePasskeyButton = document.getElementById("auth-mode-passkey");
const authModeCodeButton = document.getElementById("auth-mode-code");
const authSetupField = document.getElementById("auth-setup-field");
const authSetupCodeInput = document.getElementById("auth-setup-code");
const authCodePanel = document.getElementById("auth-code-panel");
const authCodeInput = document.getElementById("auth-code-input");
const authRegisterButton = document.getElementById("auth-register");
const authLoginButton = document.getElementById("auth-login");
const authCodeLoginButton = document.getElementById("auth-code-login");
const authStatus = document.getElementById("auth-status");
const loginApprovalModal = document.getElementById("login-approval-modal");
const loginApprovalCloseButton = document.getElementById("login-approval-close");
const loginApprovalApproveButton = document.getElementById("login-approval-approve");
const loginApprovalRejectButton = document.getElementById("login-approval-reject");
const loginApprovalStatus = document.getElementById("login-approval-status");
const loginApprovalUserValue = document.getElementById("login-approval-user");
const loginApprovalIpValue = document.getElementById("login-approval-ip");
const loginApprovalCreatedValue = document.getElementById("login-approval-created");
const loginApprovalExpiresValue = document.getElementById("login-approval-expires");
const loginApprovalDeviceValue = document.getElementById("login-approval-device");
const authActions = authModal?.querySelector(".auth-actions");
const authMethodsPanel = document.getElementById("auth-methods");
const authMethodList = document.getElementById("auth-method-list");
const themeToggleButtons = [...document.querySelectorAll(".theme-toggle")];
const AUTH_CODE_ONLY = Boolean(window.__PO_AUTH_CODE_ONLY__);
const authLockTargets = [appHeader, ...document.querySelectorAll("main > :not(#auth-modal)")].filter(
  Boolean
);
const authModalCard = authModal?.querySelector(".auth-modal-card");
const poPreviewRoot = document.getElementById("po-preview");
const reportLogoPreview = document.getElementById("report-logo-preview");
const previewBrand = document.querySelector(".preview-brand");
const legacyAuthUsernameField = document.getElementById("auth-username")?.closest(".auth-field");
if (legacyAuthUsernameField) {
  legacyAuthUsernameField.remove();
}
const ensureAuthThemeToggle = () => {
  if (!authModalCard) return;
  let toggle = document.getElementById("auth-theme-toggle");
  if (!toggle) {
    toggle = document.createElement("button");
    toggle.type = "button";
    toggle.id = "auth-theme-toggle";
    toggle.className = "ghost theme-toggle auth-theme-toggle";
    toggle.setAttribute("aria-label", "Toggle theme");
    toggle.setAttribute("title", "Toggle theme");
    toggle.innerHTML = `
      <img class="theme-toggle__icon" src="/static/img/sun.png" alt="" aria-hidden="true" />
      <span class="sr-only">Toggle theme</span>
    `;
    authModalCard.classList.add("auth-modal-card--floating-toggle");
    authModalCard.prepend(toggle);
  }
  if (!themeToggleButtons.includes(toggle)) {
    themeToggleButtons.push(toggle);
  }
};
ensureAuthThemeToggle();

const fieldIds = [
  "to",
  "formNo",
  "date",
  "companyName",
  "companyLine1",
  "companyLine2",
  "companyLine3",
  "postalCode",
  "formCreator",
  "productionManager",
  "manager",
];

const signatureKeys = ["formCreator", "productionManager", "manager"];
const requiredFieldIds = [
  "to",
  "formNo",
  "date",
  "companyName",
  "companyLine1",
  "companyLine2",
  "companyLine3",
  "postalCode",
  "formCreator",
  "productionManager",
  "manager",
];

const fieldLabels = {
  to: "To",
  formNo: "Form No",
  date: "Date",
  companyName: "Company Name",
  companyLine1: "Address Line 1",
  companyLine2: "Address Line 2",
  companyLine3: "Address Line 3",
  postalCode: "Postal Code",
  formCreator: "Form Creator",
  productionManager: "Production Manager",
  manager: "Manager",
};

const reportStyleColorPalette = {
  light: {
    paperColor: "#ffffff",
    textColor: "#0f172a",
    tableHeaderBg: "#0f172a",
    tableHeaderText: "#ffffff",
    tableBorderOuter: "#cbd5e1",
    tableBorderInner: "#e2e8f0",
    tableRowOdd: "#ffffff",
    tableRowEven: "#f8fafc",
  },
  dark: {
    paperColor: "#0f172a",
    textColor: "#e5e7eb",
    tableHeaderBg: "#111c33",
    tableHeaderText: "#e5e7eb",
    tableBorderOuter: "#334155",
    tableBorderInner: "#475569",
    tableRowOdd: "#0f172a",
    tableRowEven: "#111c33",
  },
};

const reportStyleDefaults = {
  density: "normal",
  tableTheme: "zebra",
  titleAlign: "center",
  fontScale: 100,
  titleText: "PURCHASING ORDER",
  noteText: "Kindly present your offer for the following items:",
  emptyText: "No items yet",
  formLabel: "form no.",
  dateLabel: "Date",
  toLabel: "To :",
  postalLabel: "POSTAL CODE :",
  showRowNumber: true,
  showSignatures: false,
  signatureTitle: "Signature",
  signLabelFormCreator: "Form Creator",
  signLabelProductionManager: "Production Manager",
  signLabelManager: "Manager",
  headIndex: "#",
  headModel: "NO (Model)",
  headItem: "Item",
  headQty: "Qty",
  headUnit: "Unit",
  headPlan: "plan number",
  showLogo: true,
  logoAlign: "left",
  logoScale: 100,
  logoDataUrl: "",
  colorMode: "auto",
  ...reportStyleColorPalette.light,
};

const state = {
  currentId: null,
  currentUpdatedAt: "",
  isDirty: false,
  savedList: [],
  trashList: [],
  backups: [],
  dbToolsBusy: false,
  initialState: null,
  signatures: {},
  initialSignatures: {},
  modalOpen: false,
  loadedFormNo: "",
  isAuthenticated: false,
  authUser: "",
  hasPasskey: false,
  passkeySupported: false,
  codeLoginEnabled: false,
  canApproveLoginRequests: false,
  updatesAvailable: false,
  reportStyle: { ...reportStyleDefaults },
};

const autosaveEnabled = true;
const autosaveDelayMs = 1200;
let autosaveTimer = null;
let previewUrl = null;
let previewFileName = null;
let currentTheme = "light";
let authStatusTimer = null;
let updatesReloadTimer = null;
let authMethodsToken = 0;
let authLoginMode = "passkey";
let authLockCountdownTimer = null;
let authLockCountdownEndAt = 0;
let loginApprovalPollTimer = null;
let loginApprovalPromptBusy = false;
const loginApprovalPromptSnoozeUntil = new Map();
let loginApprovalDecisionResolver = null;
let loginApprovalCountdownTimer = null;
let loginApprovalActiveRequestId = "";
const loginApprovalPendingCache = new Map();
const LOGIN_APPROVAL_LATER_SNOOZE_MS = 120000;
const DATA_SYNC_POLL_INTERVAL_MS = 5000;
let dataSyncPollTimer = null;
let dataSyncBusy = false;
let dataSyncSnapshot = null;

const authMethodDefinitions = [
  {
    id: "platform",
    label: "This device (PIN/Biometrics)",
    disabledReason: "Device passkey is not available on this browser/device.",
  },
  {
    id: "phone",
    label: "Phone passkey (iPhone/Android)",
    disabledReason: "Cross-device phone passkey is not available here.",
  },
  {
    id: "security",
    label: "Security key (USB/NFC/Bluetooth)",
    disabledReason: "Security key sign-in is not available here.",
  },
];

const syncViewportVars = () => {
  const vh = window.innerHeight * 0.01;
  document.documentElement.style.setProperty("--app-vh", `${vh}px`);
  if (!appHeader || window.innerWidth < 1025) {
    document.documentElement.style.setProperty("--header-offset", "0px");
    return;
  }
  const topRaw = Number.parseFloat(getComputedStyle(appHeader).top);
  const top = Number.isFinite(topRaw) ? topRaw : 0;
  const offset = Math.max(0, Math.ceil(appHeader.offsetHeight + top + 8));
  document.documentElement.style.setProperty("--header-offset", `${offset}px`);
};

const setText = (bind, value) => {
  document.querySelectorAll(`[data-bind="${bind}"]`).forEach((node) => {
    node.textContent = value || "";
  });
};

const colorKeys = [
  "paperColor",
  "textColor",
  "tableHeaderBg",
  "tableHeaderText",
  "tableBorderOuter",
  "tableBorderInner",
  "tableRowOdd",
  "tableRowEven",
];

const getReportThemeColors = (theme) =>
  theme === "dark" ? reportStyleColorPalette.dark : reportStyleColorPalette.light;

const colorsMatchPalette = (style, palette) =>
  colorKeys.every((key) => String(style?.[key] || "").toLowerCase() === String(palette[key]).toLowerCase());

const resolveReportStyleThemeColors = (style, theme = currentTheme) => {
  if (!style || style.colorMode !== "auto") return style;
  return {
    ...style,
    ...getReportThemeColors(theme),
  };
};

const applyAutoReportTheme = () => {
  if (!state?.reportStyle || state.reportStyle.colorMode !== "auto") return;
  applyReportStyle(state.reportStyle, { syncControls: true, markDirtyNow: false });
};

const applyTheme = (theme) => {
  document.documentElement.classList.toggle("theme-dark", theme === "dark");
  document.body.classList.toggle("theme-dark", theme === "dark");
  const nextThemeLabel = theme === "dark" ? "Light" : "Dark";
  const nextThemeIcon = theme === "dark" ? "/static/img/sun.png" : "/static/img/full-moon.png";
  themeToggleButtons.forEach((button) => {
    const label = theme === "dark" ? "Switch to light mode" : "Switch to dark mode";
    button.setAttribute("aria-label", label);
    button.setAttribute("title", label);
    const icon = button.querySelector(".theme-toggle__icon");
    if (icon) {
      icon.src = nextThemeIcon;
    }
    const text = button.querySelector(".theme-toggle__text");
    if (text) {
      text.textContent = nextThemeLabel;
    }
  });
  if (mobileMenuIcon) {
    mobileMenuIcon.src =
      theme === "dark" ? "/static/img/menu%20(1).png" : "/static/img/menu.png";
  }
  currentTheme = theme;
  applyAutoReportTheme();
};

const initTheme = () => {
  const stored = localStorage.getItem("theme");
  if (stored === "dark" || stored === "light") {
    applyTheme(stored);
    return;
  }
  const prefersDark = window.matchMedia?.("(prefers-color-scheme: dark)")?.matches;
  applyTheme(prefersDark ? "dark" : "light");
};

const toggleTheme = () => {
  const next = currentTheme === "dark" ? "light" : "dark";
  applyTheme(next);
  localStorage.setItem("theme", next);
};

const closeHeaderSettingsMenu = () => {
  if (!headerSettings || !settingsToggleButton || !settingsMenu) return;
  headerSettings.classList.remove("open");
  settingsToggleButton.setAttribute("aria-expanded", "false");
  settingsMenu.setAttribute("aria-hidden", "true");
};

const openHeaderSettingsMenu = () => {
  if (!headerSettings || !settingsToggleButton || !settingsMenu) return;
  headerSettings.classList.add("open");
  settingsToggleButton.setAttribute("aria-expanded", "true");
  settingsMenu.setAttribute("aria-hidden", "false");
};

const toggleHeaderSettingsMenu = () => {
  if (!headerSettings) return;
  if (headerSettings.classList.contains("open")) {
    closeHeaderSettingsMenu();
    return;
  }
  openHeaderSettingsMenu();
};

const closeMobileMenu = () => {
  if (!appHeader || !mobileMenuToggle) return;
  appHeader.classList.remove("menu-open");
  mobileMenuToggle.setAttribute("aria-expanded", "false");
  mobileMenuToggle.setAttribute("aria-label", "Open menu");
  mobileMenuToggle.setAttribute("title", "Open menu");
  closeHeaderSettingsMenu();
};

const syncMobileMenuByViewport = () => {
  if (!appHeader || !mobileMenuToggle) return;
  if (window.innerWidth > 900) {
    closeMobileMenu();
    return;
  }
  closeHeaderSettingsMenu();
};

const formatDate = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

const formatShortDate = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatUpdated = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const schedulePageReload = (delayMs = 12000) => {
  if (updatesReloadTimer) {
    clearTimeout(updatesReloadTimer);
    updatesReloadTimer = null;
  }
  updatesReloadTimer = setTimeout(() => {
    updatesReloadTimer = null;
    window.location.reload();
  }, delayMs);
};

const formatFileSize = (bytes) => {
  const size = Number(bytes) || 0;
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  if (size < 1024 * 1024 * 1024) return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  return `${(size / (1024 * 1024 * 1024)).toFixed(1)} GB`;
};

const normalizeReportStyle = (rawStyle = {}) => {
  const normalized = { ...reportStyleDefaults };
  const normalizeHex = (value, fallback) => {
    const raw = String(value || "").trim();
    if (!raw) return fallback;
    const hex = raw.startsWith("#") ? raw : `#${raw}`;
    return /^#[0-9a-fA-F]{6}$/.test(hex) ? hex.toLowerCase() : fallback;
  };
  const normalizeText = (value, fallback, maxLen = 120) => {
    const text = String(value || "").trim();
    if (!text) return fallback;
    return text.slice(0, maxLen);
  };
  const normalizeDataUrl = (value) => {
    const raw = String(value || "").trim();
    if (!raw) return "";
    if (/^data:image\/[a-zA-Z0-9.+-]+;base64,/i.test(raw)) {
      return raw;
    }
    return "";
  };
  const density = String(rawStyle.density || "").trim().toLowerCase();
  if (["compact", "normal", "comfortable"].includes(density)) {
    normalized.density = density;
  }
  const tableTheme = String(rawStyle.tableTheme || "").trim().toLowerCase();
  if (["zebra", "solid"].includes(tableTheme)) {
    normalized.tableTheme = tableTheme;
  }
  const titleAlign = String(rawStyle.titleAlign || "").trim().toLowerCase();
  if (["center", "left"].includes(titleAlign)) {
    normalized.titleAlign = titleAlign;
  }
  const parsedScale = Number(rawStyle.fontScale);
  if (Number.isFinite(parsedScale)) {
    normalized.fontScale = Math.max(90, Math.min(120, Math.round(parsedScale)));
  }
  const titleText = String(rawStyle.titleText || "").trim();
  if (titleText) {
    normalized.titleText = titleText;
  }
  const noteText = String(rawStyle.noteText || "").trim();
  if (noteText) {
    normalized.noteText = noteText;
  }
  normalized.emptyText = normalizeText(rawStyle.emptyText, reportStyleDefaults.emptyText, 80);
  normalized.formLabel = normalizeText(rawStyle.formLabel, reportStyleDefaults.formLabel, 40);
  normalized.dateLabel = normalizeText(rawStyle.dateLabel, reportStyleDefaults.dateLabel, 40);
  normalized.toLabel = normalizeText(rawStyle.toLabel, reportStyleDefaults.toLabel, 40);
  normalized.postalLabel = normalizeText(rawStyle.postalLabel, reportStyleDefaults.postalLabel, 50);
  const rawShowSignatures = rawStyle.showSignatures;
  normalized.showSignatures =
    rawShowSignatures === true ||
    rawShowSignatures === "true" ||
    rawShowSignatures === 1 ||
    rawShowSignatures === "1";
  normalized.signatureTitle = normalizeText(
    rawStyle.signatureTitle,
    reportStyleDefaults.signatureTitle,
    40
  );
  normalized.signLabelFormCreator = normalizeText(
    rawStyle.signLabelFormCreator,
    reportStyleDefaults.signLabelFormCreator,
    40
  );
  normalized.signLabelProductionManager = normalizeText(
    rawStyle.signLabelProductionManager,
    reportStyleDefaults.signLabelProductionManager,
    40
  );
  normalized.signLabelManager = normalizeText(
    rawStyle.signLabelManager,
    reportStyleDefaults.signLabelManager,
    40
  );
  normalized.headIndex = normalizeText(rawStyle.headIndex, reportStyleDefaults.headIndex, 24);
  normalized.headModel = normalizeText(rawStyle.headModel, reportStyleDefaults.headModel, 40);
  normalized.headItem = normalizeText(rawStyle.headItem, reportStyleDefaults.headItem, 40);
  normalized.headQty = normalizeText(rawStyle.headQty, reportStyleDefaults.headQty, 24);
  normalized.headUnit = normalizeText(rawStyle.headUnit, reportStyleDefaults.headUnit, 24);
  normalized.headPlan = normalizeText(rawStyle.headPlan, reportStyleDefaults.headPlan, 40);
  normalized.showRowNumber = rawStyle.showRowNumber !== false;
  normalized.showLogo = rawStyle.showLogo !== false;
  const rawColorMode = String(rawStyle.colorMode || "").trim().toLowerCase();
  if (rawColorMode === "auto" || rawColorMode === "manual") {
    normalized.colorMode = rawColorMode;
  }
  const logoAlign = String(rawStyle.logoAlign || "").trim().toLowerCase();
  if (["left", "center", "right"].includes(logoAlign)) {
    normalized.logoAlign = logoAlign;
  }
  const parsedLogoScale = Number(rawStyle.logoScale);
  if (Number.isFinite(parsedLogoScale)) {
    normalized.logoScale = Math.max(60, Math.min(180, Math.round(parsedLogoScale)));
  }
  normalized.logoDataUrl = normalizeDataUrl(rawStyle.logoDataUrl);
  normalized.paperColor = normalizeHex(rawStyle.paperColor, reportStyleDefaults.paperColor);
  normalized.textColor = normalizeHex(rawStyle.textColor, reportStyleDefaults.textColor);
  normalized.tableHeaderBg = normalizeHex(
    rawStyle.tableHeaderBg,
    reportStyleDefaults.tableHeaderBg
  );
  normalized.tableHeaderText = normalizeHex(
    rawStyle.tableHeaderText,
    reportStyleDefaults.tableHeaderText
  );
  normalized.tableBorderOuter = normalizeHex(
    rawStyle.tableBorderOuter,
    reportStyleDefaults.tableBorderOuter
  );
  normalized.tableBorderInner = normalizeHex(
    rawStyle.tableBorderInner,
    reportStyleDefaults.tableBorderInner
  );
  normalized.tableRowOdd = normalizeHex(rawStyle.tableRowOdd, reportStyleDefaults.tableRowOdd);
  normalized.tableRowEven = normalizeHex(rawStyle.tableRowEven, reportStyleDefaults.tableRowEven);
  if (rawColorMode !== "auto" && rawColorMode !== "manual") {
    const matchesLight = colorsMatchPalette(normalized, reportStyleColorPalette.light);
    const matchesDark = colorsMatchPalette(normalized, reportStyleColorPalette.dark);
    normalized.colorMode = matchesLight || matchesDark ? "auto" : "manual";
  }
  return normalized;
};

const syncReportStyleControls = () => {
  const style = state.reportStyle || reportStyleDefaults;
  if (reportStyleDensityInput) reportStyleDensityInput.value = style.density;
  if (reportStyleTableThemeInput) reportStyleTableThemeInput.value = style.tableTheme;
  if (reportStyleTitleAlignInput) reportStyleTitleAlignInput.value = style.titleAlign;
  if (reportStyleFontScaleInput) reportStyleFontScaleInput.value = String(style.fontScale);
  if (reportStyleFontScaleValue) reportStyleFontScaleValue.textContent = `${style.fontScale}%`;
  if (reportStyleTitleTextInput) reportStyleTitleTextInput.value = style.titleText;
  if (reportStyleNoteTextInput) reportStyleNoteTextInput.value = style.noteText;
  if (reportStyleEmptyTextInput) reportStyleEmptyTextInput.value = style.emptyText;
  if (reportStyleFormLabelInput) reportStyleFormLabelInput.value = style.formLabel;
  if (reportStyleDateLabelInput) reportStyleDateLabelInput.value = style.dateLabel;
  if (reportStyleToLabelInput) reportStyleToLabelInput.value = style.toLabel;
  if (reportStylePostalLabelInput) reportStylePostalLabelInput.value = style.postalLabel;
  if (reportStyleShowSignaturesInput) {
    reportStyleShowSignaturesInput.checked = Boolean(style.showSignatures);
  }
  if (reportStyleSignatureTitleInput) reportStyleSignatureTitleInput.value = style.signatureTitle;
  if (reportStyleSignLabelFormCreatorInput) {
    reportStyleSignLabelFormCreatorInput.value = style.signLabelFormCreator;
  }
  if (reportStyleSignLabelProductionManagerInput) {
    reportStyleSignLabelProductionManagerInput.value = style.signLabelProductionManager;
  }
  if (reportStyleSignLabelManagerInput) {
    reportStyleSignLabelManagerInput.value = style.signLabelManager;
  }
  if (reportStyleHeadIndexInput) reportStyleHeadIndexInput.value = style.headIndex;
  if (reportStyleHeadModelInput) reportStyleHeadModelInput.value = style.headModel;
  if (reportStyleHeadItemInput) reportStyleHeadItemInput.value = style.headItem;
  if (reportStyleHeadQtyInput) reportStyleHeadQtyInput.value = style.headQty;
  if (reportStyleHeadUnitInput) reportStyleHeadUnitInput.value = style.headUnit;
  if (reportStyleHeadPlanInput) reportStyleHeadPlanInput.value = style.headPlan;
  if (reportStyleShowRowNumberInput) reportStyleShowRowNumberInput.checked = Boolean(style.showRowNumber);
  if (reportStyleShowLogoInput) reportStyleShowLogoInput.checked = Boolean(style.showLogo);
  if (reportStyleLogoAlignInput) reportStyleLogoAlignInput.value = style.logoAlign;
  if (reportStyleLogoScaleInput) reportStyleLogoScaleInput.value = String(style.logoScale);
  if (reportStyleLogoScaleValue) reportStyleLogoScaleValue.textContent = `${style.logoScale}%`;
  if (reportStylePaperColorInput) reportStylePaperColorInput.value = style.paperColor;
  if (reportStyleTextColorInput) reportStyleTextColorInput.value = style.textColor;
  if (reportStyleHeaderBgColorInput) reportStyleHeaderBgColorInput.value = style.tableHeaderBg;
  if (reportStyleHeaderTextColorInput) {
    reportStyleHeaderTextColorInput.value = style.tableHeaderText;
  }
  if (reportStyleBorderOuterColorInput) {
    reportStyleBorderOuterColorInput.value = style.tableBorderOuter;
  }
  if (reportStyleBorderInnerColorInput) {
    reportStyleBorderInnerColorInput.value = style.tableBorderInner;
  }
  if (reportStyleRowOddColorInput) reportStyleRowOddColorInput.value = style.tableRowOdd;
  if (reportStyleRowEvenColorInput) reportStyleRowEvenColorInput.value = style.tableRowEven;
};

const applyReportStyle = (style = {}, options = {}) => {
  const { syncControls = true, markDirtyNow = false } = options;
  const normalized = resolveReportStyleThemeColors(normalizeReportStyle(style), currentTheme);
  const effectiveEvenRowColor =
    normalized.tableTheme === "solid" ? normalized.tableRowOdd : normalized.tableRowEven;
  const logoSrc = normalized.logoDataUrl || "/static/img/po.jpg";
  state.reportStyle = normalized;
  if (poPreviewRoot) {
    poPreviewRoot.dataset.density = normalized.density;
    poPreviewRoot.dataset.tableTheme = normalized.tableTheme;
    poPreviewRoot.dataset.titleAlign = normalized.titleAlign;
    poPreviewRoot.dataset.logoAlign = normalized.logoAlign;
    poPreviewRoot.style.setProperty("--preview-font-scale", (normalized.fontScale / 100).toFixed(2));
    poPreviewRoot.style.setProperty("--preview-paper-color", normalized.paperColor);
    poPreviewRoot.style.setProperty("--preview-text-color", normalized.textColor);
    poPreviewRoot.style.setProperty("--preview-header-bg", normalized.tableHeaderBg);
    poPreviewRoot.style.setProperty("--preview-header-text", normalized.tableHeaderText);
    poPreviewRoot.style.setProperty("--preview-border-outer", normalized.tableBorderOuter);
    poPreviewRoot.style.setProperty("--preview-border-inner", normalized.tableBorderInner);
    poPreviewRoot.style.setProperty("--preview-row-odd-bg", normalized.tableRowOdd);
    poPreviewRoot.style.setProperty("--preview-row-even-bg", effectiveEvenRowColor);
    poPreviewRoot.classList.toggle("hide-row-number", !normalized.showRowNumber);
    poPreviewRoot.classList.toggle("hide-signatures", !normalized.showSignatures);
  }
  if (reportLogoPreview) {
    reportLogoPreview.style.width = `${Math.round(160 * (normalized.logoScale / 100))}px`;
    reportLogoPreview.style.display = normalized.showLogo ? "" : "none";
    reportLogoPreview.src = logoSrc;
  }
  if (previewBrand) {
    previewBrand.style.display = normalized.showLogo ? "flex" : "none";
    previewBrand.dataset.logoAlign = normalized.logoAlign;
  }
  setText("reportTitle", normalized.titleText);
  setText("reportNote", normalized.noteText);
  setText("reportFormLabel", normalized.formLabel);
  setText("reportDateLabel", normalized.dateLabel);
  setText("reportToLabel", normalized.toLabel);
  setText("reportPostalLabel", normalized.postalLabel);
  setText("reportSignatureTitle", normalized.signatureTitle);
  setText("reportSignLabelFormCreator", normalized.signLabelFormCreator);
  setText("reportSignLabelProductionManager", normalized.signLabelProductionManager);
  setText("reportSignLabelManager", normalized.signLabelManager);
  setText("reportHeadIndex", normalized.headIndex);
  setText("reportHeadModel", normalized.headModel);
  setText("reportHeadItem", normalized.headItem);
  setText("reportHeadQty", normalized.headQty);
  setText("reportHeadUnit", normalized.headUnit);
  setText("reportHeadPlan", normalized.headPlan);
  if (previewTableHeadIndex) {
    previewTableHeadIndex.style.display = normalized.showRowNumber ? "" : "none";
  }
  updateItemsPreview();
  if (syncControls) {
    syncReportStyleControls();
  }
  if (markDirtyNow) {
    markDirty();
  }
};

const getReportStyleFromControls = () =>
  normalizeReportStyle({
    density: reportStyleDensityInput?.value,
    tableTheme: reportStyleTableThemeInput?.value,
    titleAlign: reportStyleTitleAlignInput?.value,
    fontScale: reportStyleFontScaleInput?.value,
    titleText: reportStyleTitleTextInput?.value,
    noteText: reportStyleNoteTextInput?.value,
    emptyText: reportStyleEmptyTextInput?.value,
    formLabel: reportStyleFormLabelInput?.value,
    dateLabel: reportStyleDateLabelInput?.value,
    toLabel: reportStyleToLabelInput?.value,
    postalLabel: reportStylePostalLabelInput?.value,
    showSignatures: reportStyleShowSignaturesInput?.checked,
    signatureTitle: reportStyleSignatureTitleInput?.value,
    signLabelFormCreator: reportStyleSignLabelFormCreatorInput?.value,
    signLabelProductionManager: reportStyleSignLabelProductionManagerInput?.value,
    signLabelManager: reportStyleSignLabelManagerInput?.value,
    headIndex: reportStyleHeadIndexInput?.value,
    headModel: reportStyleHeadModelInput?.value,
    headItem: reportStyleHeadItemInput?.value,
    headQty: reportStyleHeadQtyInput?.value,
    headUnit: reportStyleHeadUnitInput?.value,
    headPlan: reportStyleHeadPlanInput?.value,
    showRowNumber: reportStyleShowRowNumberInput?.checked,
    showLogo: reportStyleShowLogoInput?.checked,
    logoAlign: reportStyleLogoAlignInput?.value,
    logoScale: reportStyleLogoScaleInput?.value,
    logoDataUrl: state.reportStyle?.logoDataUrl || "",
    colorMode: state.reportStyle?.colorMode || "auto",
    paperColor: reportStylePaperColorInput?.value,
    textColor: reportStyleTextColorInput?.value,
    tableHeaderBg: reportStyleHeaderBgColorInput?.value,
    tableHeaderText: reportStyleHeaderTextColorInput?.value,
    tableBorderOuter: reportStyleBorderOuterColorInput?.value,
    tableBorderInner: reportStyleBorderInnerColorInput?.value,
    tableRowOdd: reportStyleRowOddColorInput?.value,
    tableRowEven: reportStyleRowEvenColorInput?.value,
  });

const reportStyleEquals = (left, right) =>
  left.density === right.density &&
  left.tableTheme === right.tableTheme &&
  left.titleAlign === right.titleAlign &&
  Number(left.fontScale) === Number(right.fontScale) &&
  String(left.titleText || "") === String(right.titleText || "") &&
  String(left.noteText || "") === String(right.noteText || "") &&
  String(left.emptyText || "") === String(right.emptyText || "") &&
  String(left.formLabel || "") === String(right.formLabel || "") &&
  String(left.dateLabel || "") === String(right.dateLabel || "") &&
  String(left.toLabel || "") === String(right.toLabel || "") &&
  String(left.postalLabel || "") === String(right.postalLabel || "") &&
  Boolean(left.showSignatures) === Boolean(right.showSignatures) &&
  String(left.signatureTitle || "") === String(right.signatureTitle || "") &&
  String(left.signLabelFormCreator || "") === String(right.signLabelFormCreator || "") &&
  String(left.signLabelProductionManager || "") ===
    String(right.signLabelProductionManager || "") &&
  String(left.signLabelManager || "") === String(right.signLabelManager || "") &&
  String(left.headIndex || "") === String(right.headIndex || "") &&
  String(left.headModel || "") === String(right.headModel || "") &&
  String(left.headItem || "") === String(right.headItem || "") &&
  String(left.headQty || "") === String(right.headQty || "") &&
  String(left.headUnit || "") === String(right.headUnit || "") &&
  String(left.headPlan || "") === String(right.headPlan || "") &&
  Boolean(left.showRowNumber) === Boolean(right.showRowNumber) &&
  Boolean(left.showLogo) === Boolean(right.showLogo) &&
  left.logoAlign === right.logoAlign &&
  Number(left.logoScale) === Number(right.logoScale) &&
  String(left.logoDataUrl || "") === String(right.logoDataUrl || "") &&
  String(left.colorMode || "") === String(right.colorMode || "") &&
  String(left.paperColor || "") === String(right.paperColor || "") &&
  String(left.textColor || "") === String(right.textColor || "") &&
  String(left.tableHeaderBg || "") === String(right.tableHeaderBg || "") &&
  String(left.tableHeaderText || "") === String(right.tableHeaderText || "") &&
  String(left.tableBorderOuter || "") === String(right.tableBorderOuter || "") &&
  String(left.tableBorderInner || "") === String(right.tableBorderInner || "") &&
  String(left.tableRowOdd || "") === String(right.tableRowOdd || "") &&
  String(left.tableRowEven || "") === String(right.tableRowEven || "");

const updateDate = () => {
  setText("dateDisplay", formatDate(dateInput.value));
};

const updatePreviewFromInputs = () => {
  fieldIds.forEach((id) => {
    if (id === "date") return;
    const input = document.getElementById(id);
    if (input) {
      setText(id, input.value.trim());
    }
  });
  updateDate();
  updateItemsPreview();
};

const syncDefaultsFromPreview = () => {
  fieldIds.forEach((id) => {
    if (id === "date") return;
    const input = document.getElementById(id);
    if (!input || input.value.trim()) return;
    const preview = document.querySelector(`[data-bind="${id}"]`);
    if (preview && preview.textContent.trim()) {
      input.value = preview.textContent.trim();
    }
  });
};

const updateRowNumbers = () => {
  [...itemsBody.querySelectorAll("tr")].forEach((row, index) => {
    const numberCell = row.querySelector(".row-number");
    if (numberCell) {
      numberCell.textContent = String(index + 1);
    }
  });
};

const addRow = (data = {}, options = {}) => {
  const row = document.createElement("tr");
  row.innerHTML = `
    <td class="row-number"></td>
    <td><input type="text" data-field="model" value="${data.model || ""}" /></td>
    <td><input type="text" data-field="item" value="${data.item || ""}" /></td>
    <td><input type="number" min="0" step="1" data-field="qty" value="${data.qty || ""}" /></td>
    <td><input type="text" data-field="unit" value="${data.unit || ""}" /></td>
    <td><input type="text" data-field="plan" value="${data.plan || ""}" /></td>
    <td><button type="button" class="remove-row" title="Remove">×</button></td>
  `;
  itemsBody.appendChild(row);
  updateRowNumbers();
  updateItemsPreview();
  if (options.focus) {
    const firstInput = row.querySelector('input[data-field="model"]');
    if (firstInput) {
      firstInput.focus();
    }
  }
};

const getItems = () => {
  const rows = [...itemsBody.querySelectorAll("tr")];
  return rows
    .map((row) => {
      const getValue = (field) =>
        row.querySelector(`[data-field="${field}"]`)?.value.trim() || "";
      return {
        model: getValue("model"),
        item: getValue("item"),
        qty: getValue("qty"),
        unit: getValue("unit"),
        plan: getValue("plan"),
      };
    })
    .filter((row) => row.model || row.item || row.qty || row.unit || row.plan);
};

const syncItemsActionButtons = (items = null) => {
  if (!clearRowsButton) return;
  const currentItems = items || getItems();
  const hasItemData = currentItems.length > 0;
  clearRowsButton.disabled = !hasItemData;
  clearRowsButton.setAttribute(
    "title",
    hasItemData ? "Clear all items" : "Enter item data to enable Clear Items"
  );
};

const setItems = (items) => {
  itemsBody.innerHTML = "";
  if (!items || items.length === 0) {
    addRow();
    return;
  }
  items.forEach((item) => addRow(item));
};

const updateItemsPreview = () => {
  const items = getItems();
  syncItemsActionButtons(items);
  const showRowNumber = state.reportStyle?.showRowNumber !== false;
  const emptyText = state.reportStyle?.emptyText || "No items yet";
  previewItems.innerHTML = "";

  if (items.length === 0) {
    const emptyRow = document.createElement("tr");
    emptyRow.innerHTML = `<td colspan="${showRowNumber ? 6 : 5}" class="empty-row">${emptyText}</td>`;
    previewItems.appendChild(emptyRow);
    return;
  }

  items.forEach((item, index) => {
    const row = document.createElement("tr");
    if (showRowNumber) {
      row.innerHTML = `
        <td>${index + 1}</td>
        <td>${item.model}</td>
        <td>${item.item}</td>
        <td>${item.qty}</td>
        <td>${item.unit}</td>
        <td>${item.plan}</td>
      `;
    } else {
      row.innerHTML = `
        <td>${item.model}</td>
        <td>${item.item}</td>
        <td>${item.qty}</td>
        <td>${item.unit}</td>
        <td>${item.plan}</td>
      `;
    }
    previewItems.appendChild(row);
  });
};

const clearRows = () => {
  itemsBody.innerHTML = "";
  addRow();
};

const captureState = () => {
  const snapshot = {};
  fieldIds.forEach((id) => {
    const input = document.getElementById(id);
    if (input) {
      snapshot[id] = input.value;
    }
  });
  return snapshot;
};

const applyState = (snapshot) => {
  fieldIds.forEach((id) => {
    const input = document.getElementById(id);
    if (input && Object.prototype.hasOwnProperty.call(snapshot, id)) {
      input.value = snapshot[id];
    }
  });
};

const clearSignature = (key) => {
  state.signatures[key] = "";
  const canvas = document.getElementById(`sig-${key}`);
  if (canvas) {
    const ctx = canvas.getContext("2d");
    const rect = canvas.getBoundingClientRect();
    ctx.clearRect(0, 0, rect.width, rect.height);
  }
  markDirty();
};

const applySignatures = (signatures = {}) => {
  signatureKeys.forEach((key) => {
    state.signatures[key] = signatures[key] || "";
    const canvas = document.getElementById(`sig-${key}`);
    if (canvas) {
      const ctx = canvas.getContext("2d");
      const rect = canvas.getBoundingClientRect();
      ctx.clearRect(0, 0, rect.width, rect.height);
      if (state.signatures[key]) {
        const img = new Image();
        img.onload = () => {
          ctx.drawImage(img, 0, 0, rect.width, rect.height);
        };
        img.src = state.signatures[key];
      }
    }
  });
};

const getDefaultStatus = () => {
  if (state.isDirty) {
    return { text: "Unsaved changes", variant: "warn" };
  }
  if (state.currentId) {
    return { text: `Loaded #${state.currentId}`, variant: "good" };
  }
  return { text: "New draft", variant: "warn" };
};

const setSaveStatus = (text, variant, options = {}) => {
  if (authStatusTimer) {
    clearTimeout(authStatusTimer);
    authStatusTimer = null;
  }
  saveStatus.textContent = text;
  saveStatus.classList.remove("warn", "good");
  if (variant) saveStatus.classList.add(variant);
  saveStatus.classList.remove("is-hidden");
  if (editorSaveStatus) {
    editorSaveStatus.textContent = text;
    editorSaveStatus.classList.remove("warn", "good");
    if (variant) editorSaveStatus.classList.add(variant);
    editorSaveStatus.classList.remove("is-hidden");
  }

  if (options.resetAfterMs && Number(options.resetAfterMs) > 0) {
    authStatusTimer = setTimeout(() => {
      authStatusTimer = null;
      const fallback = getDefaultStatus();
      setSaveStatus(fallback.text, fallback.variant);
    }, Number(options.resetAfterMs));
  }
};

const clearAuthLockCountdown = () => {
  if (authLockCountdownTimer) {
    clearInterval(authLockCountdownTimer);
    authLockCountdownTimer = null;
  }
  authLockCountdownEndAt = 0;
};

const clearAuthPendingState = () => {
  document.documentElement.classList.remove("auth-pending");
  document.body.classList.remove("auth-pending");
};

const getRetryAfterSeconds = (input) => {
  if (typeof input === "number" && Number.isFinite(input)) {
    return Math.max(0, Math.floor(input));
  }
  const message = String(input || "");
  const match = message.match(/try again in\s+(\d+)s/i);
  if (!match) return 0;
  const seconds = Number.parseInt(match[1], 10);
  return Number.isFinite(seconds) ? Math.max(0, seconds) : 0;
};

const setAuthStatus = (text, variant, options = {}) => {
  if (!options.keepCountdown) {
    clearAuthLockCountdown();
  }
  if (!authStatus) return;
  authStatus.textContent = text;
  authStatus.classList.remove("good", "warn");
  if (variant) {
    authStatus.classList.add(variant);
  }
};

const startAuthLockCountdown = (seconds) => {
  const retryAfter = getRetryAfterSeconds(seconds);
  if (!retryAfter) return false;
  clearAuthLockCountdown();
  if (authRegisterButton) {
    authRegisterButton.disabled = true;
  }
  authLockCountdownEndAt = Date.now() + retryAfter * 1000;

  const tick = () => {
    const left = Math.max(0, Math.ceil((authLockCountdownEndAt - Date.now()) / 1000));
    setAuthStatus(
      `Too many incorrect setup code attempts. Try again in ${left}s.`,
      "warn",
      { keepCountdown: true }
    );
    if (left <= 0) {
      clearAuthLockCountdown();
      if (authRegisterButton) {
        authRegisterButton.disabled = false;
      }
      setAuthStatus("Setup code lock expired. You can try again.", "warn");
    }
  };

  tick();
  authLockCountdownTimer = setInterval(tick, 1000);
  return true;
};

const setAuthUiLock = (locked) => {
  document.documentElement.classList.toggle("auth-locked", locked);
  document.body.classList.toggle("auth-locked", locked);
  authLockTargets.forEach((node) => {
    node.inert = locked;
    if (locked) {
      node.setAttribute("inert", "");
      node.setAttribute("aria-hidden", "true");
    } else {
      node.removeAttribute("inert");
      node.removeAttribute("aria-hidden");
    }
  });
};

const getCapabilityBoolean = (caps, keys) => {
  if (!caps || typeof caps !== "object") return null;
  for (const key of keys) {
    if (typeof caps[key] === "boolean") return caps[key];
  }
  return null;
};

const renderAuthMethods = (methods) => {
  if (!authMethodsPanel || !authMethodList) return;
  const shouldShowPanel =
    Array.isArray(methods) && methods.length && authLoginMode !== "code";
  authMethodsPanel.style.display = shouldShowPanel ? "grid" : "none";
  authMethodList.innerHTML = "";
  (methods || []).forEach((method) => {
    const row = document.createElement("div");
    row.className = `auth-method ${method.enabled ? "is-enabled" : "is-disabled"}`;
    if (method.reason) {
      row.title = method.reason;
    }

    const dot = document.createElement("span");
    dot.className = "auth-method-dot";
    dot.setAttribute("aria-hidden", "true");

    const name = document.createElement("span");
    name.className = "auth-method-name";
    name.textContent = method.label;

    const stateText = document.createElement("span");
    stateText.className = "auth-method-state";
    stateText.textContent = method.enabled ? "Available" : "Unavailable";

    row.append(dot, name, stateText);
    authMethodList.appendChild(row);
  });
};

const getUnsupportedAuthMethods = (reason) =>
  authMethodDefinitions.map((method) => ({
    ...method,
    enabled: false,
    reason,
  }));

const refreshAuthMethods = async (hasPasskey) => {
  if (!authMethodsPanel || !authMethodList) return;
  const token = ++authMethodsToken;

  if (!window.PublicKeyCredential || !navigator.credentials || !window.isSecureContext) {
    renderAuthMethods(
      getUnsupportedAuthMethods("Passkeys require HTTPS (or localhost) and a supported browser.")
    );
    return;
  }

  const methods = authMethodDefinitions.map((method) => ({
    ...method,
    enabled: true,
    reason: "",
  }));

  let caps = {};
  if (typeof PublicKeyCredential.getClientCapabilities === "function") {
    try {
      const clientCaps = await PublicKeyCredential.getClientCapabilities();
      if (clientCaps && typeof clientCaps === "object") {
        caps = clientCaps;
      }
    } catch (_error) {
      // Keep fallback behavior when browser does not expose capabilities.
    }
  }

  let platformAvailable = null;
  if (typeof PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable === "function") {
    try {
      platformAvailable = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
    } catch (_error) {
      platformAvailable = null;
    }
  }

  let conditionalAvailable = null;
  if (typeof PublicKeyCredential.isConditionalMediationAvailable === "function") {
    try {
      conditionalAvailable = await PublicKeyCredential.isConditionalMediationAvailable();
    } catch (_error) {
      conditionalAvailable = null;
    }
  }

  if (token !== authMethodsToken) return;

  const platformCap = getCapabilityBoolean(caps, [
    "passkeyPlatformAuthenticator",
    "userVerifyingPlatformAuthenticator",
    "uvpa",
  ]);
  const hybridCap = getCapabilityBoolean(caps, [
    "hybridTransport",
    "hybrid",
    "passkeyCrossDevice",
    "conditionalGet",
  ]);
  const securityCap = getCapabilityBoolean(caps, [
    "securityKey",
    "securityKeys",
    "crossPlatformAuthenticator",
    "usb",
    "ble",
    "nfc",
  ]);

  methods[0].enabled = platformAvailable === true || platformCap === true;
  if (!methods[0].enabled) {
    methods[0].reason = authMethodDefinitions[0].disabledReason;
  }

  if (!hasPasskey) {
    methods[1].enabled = false;
    methods[1].reason = "Available after first passkey setup.";
    methods[2].enabled = false;
    methods[2].reason = "Available after first passkey setup.";
    renderAuthMethods(methods);
    if (authRegisterButton) {
      authRegisterButton.disabled = !methods[0].enabled;
    }
    if (!methods[0].enabled && authLoginMode !== "code") {
      setAuthStatus("This device cannot create a passkey here.", "warn");
    }
    return;
  }

  const phoneSupported =
    hybridCap === true ||
    conditionalAvailable === true ||
    (hybridCap === null && conditionalAvailable === null);
  methods[1].enabled = phoneSupported;
  if (!methods[1].enabled) {
    methods[1].reason = authMethodDefinitions[1].disabledReason;
  }

  const securitySupported = securityCap === true || securityCap === null;
  methods[2].enabled = securitySupported;
  if (!methods[2].enabled) {
    methods[2].reason = authMethodDefinitions[2].disabledReason;
  }

  renderAuthMethods(methods);
  const hasEnabledMethod = methods.some((method) => method.enabled);
  if (authLoginButton) {
    authLoginButton.disabled = !hasEnabledMethod;
  }
  if (!hasEnabledMethod && authLoginMode !== "code") {
    setAuthStatus("No passkey sign-in method is available on this device.", "warn");
  }
};

const syncAuthActionsLayout = () => {
  if (!authActions) return;
  const visibleButtons = [authRegisterButton, authLoginButton, authCodeLoginButton].filter(
    (button) => button && button.style.display !== "none"
  );
  authActions.classList.toggle("single", visibleButtons.length <= 1);
};

const resolveAuthMode = (mode) => {
  if (AUTH_CODE_ONLY) {
    return "code";
  }
  if (mode === "passkey" && !state.passkeySupported && state.codeLoginEnabled) {
    return "code";
  }
  if (mode === "code" && state.codeLoginEnabled) {
    return "code";
  }
  return "passkey";
};

const setAuthMode = (mode, options = {}) => {
  const nextMode = resolveAuthMode(mode);
  const isCodeMode = nextMode === "code";
  authLoginMode = nextMode;

  const showPasskeyUi = !AUTH_CODE_ONLY;
  const showRegister = showPasskeyUi && !isCodeMode && !state.hasPasskey;
  const showPasskeyLogin = showPasskeyUi && !isCodeMode && state.hasPasskey;
  const showCodeLogin = isCodeMode && state.codeLoginEnabled;

  if (authModeSwitch) {
    authModeSwitch.hidden = AUTH_CODE_ONLY || !state.codeLoginEnabled;
  }
  if (authModePasskeyButton) {
    authModePasskeyButton.hidden = AUTH_CODE_ONLY;
    authModePasskeyButton.disabled = AUTH_CODE_ONLY || !state.passkeySupported;
    const active = !isCodeMode;
    authModePasskeyButton.classList.toggle("is-active", active);
    authModePasskeyButton.setAttribute("aria-pressed", active ? "true" : "false");
  }
  if (authModeCodeButton) {
    authModeCodeButton.hidden = !state.codeLoginEnabled;
    authModeCodeButton.disabled = !state.codeLoginEnabled;
    const active = isCodeMode;
    authModeCodeButton.classList.toggle("is-active", active);
    authModeCodeButton.setAttribute("aria-pressed", active ? "true" : "false");
  }

  if (authMethodsPanel) {
    authMethodsPanel.style.display = isCodeMode || AUTH_CODE_ONLY ? "none" : "grid";
  }
  if (authSetupField) {
    authSetupField.style.display = showRegister ? "grid" : "none";
  }
  if (authRegisterButton) {
    authRegisterButton.style.display = showRegister ? "inline-flex" : "none";
  }
  if (authLoginButton) {
    authLoginButton.style.display = showPasskeyLogin ? "inline-flex" : "none";
  }
  if (authCodePanel) {
    authCodePanel.style.display = showCodeLogin ? "grid" : "none";
  }
  if (authCodeLoginButton) {
    authCodeLoginButton.style.display = showCodeLogin ? "inline-flex" : "none";
  }

  syncAuthActionsLayout();

  if (options.focus) {
    const focusTarget = isCodeMode
      ? authCodeInput || authCodeLoginButton
      : showPasskeyLogin
        ? authLoginButton
        : authRegisterButton;
    if (focusTarget) {
      requestAnimationFrame(() => focusTarget.focus());
    }
  }

  return nextMode;
};

const closeAllTransientOverlays = () => {
  closePdfPreview();
  closeTrashModal();
  closeDbToolsModal();
  closeReportStyleModal();
  closeLoginApprovalModal("later");
  closeEditorModal();
};

const showAuthModal = (status = {}, message = "") => {
  if (!authModal) return;
  stopLoginApprovalPolling();
  stopDataSyncPolling();
  clearAuthPendingState();
  closeAllTransientOverlays();
  state.isAuthenticated = false;
  state.authUser = "";
  setLoginApprovalCapability(false);
  const hasPasskey = AUTH_CODE_ONLY ? false : Boolean(status.has_passkey);
  state.hasPasskey = hasPasskey;
  state.codeLoginEnabled = parseCodeLoginEnabled(status);
  setAuthUiLock(true);
  authModal.classList.add("show");
  authModal.setAttribute("aria-hidden", "false");
  if (authTitle) {
    authTitle.textContent = AUTH_CODE_ONLY
      ? "Access Code Login"
      : hasPasskey
        ? "Sign In Required"
        : "Create First Passkey";
  }
  if (authSubtitle) {
    authSubtitle.textContent = AUTH_CODE_ONLY
      ? "Enter your access code to unlock PO Management."
      : hasPasskey
        ? "Use your device passkey to unlock PO Management."
        : "No passkey found. Create one for this app now.";
  }
  if (authRegisterButton) {
    authRegisterButton.textContent = "Register Passkey";
  }
  if (authLoginButton) {
    authLoginButton.textContent = "Sign In with Passkey";
  }
  if (hasPasskey && authSetupCodeInput) {
    authSetupCodeInput.value = "";
  }
  if (authCodeInput) {
    authCodeInput.value = "";
  }
  const passkeySupported = AUTH_CODE_ONLY
    ? false
    : Boolean(window.PublicKeyCredential && navigator.credentials);
  state.passkeySupported = passkeySupported;
  if (passkeySupported) {
    void refreshAuthMethods(hasPasskey);
  } else if (!AUTH_CODE_ONLY) {
    renderAuthMethods(
      getUnsupportedAuthMethods("Passkeys require HTTPS (or localhost) and a supported browser.")
    );
    if (authRegisterButton) authRegisterButton.disabled = true;
    if (authLoginButton) authLoginButton.disabled = true;
  }

  const preferredMode = AUTH_CODE_ONLY
    ? "code"
    : state.codeLoginEnabled && !passkeySupported
      ? "code"
      : "passkey";
  const activeMode = setAuthMode(preferredMode, { focus: false });

  if (AUTH_CODE_ONLY && !state.codeLoginEnabled) {
    setAuthStatus("Access code login is disabled. Set ACCESS_LOGIN_CODE in .env.", "warn");
    return;
  }

  if (!passkeySupported && !state.codeLoginEnabled) {
    setAuthStatus(
      "Passkeys are not supported in this browser/device. Use a modern browser.",
      "warn"
    );
    return;
  }
  if (passkeySupported) {
    if (authRegisterButton) authRegisterButton.disabled = false;
    if (authLoginButton) authLoginButton.disabled = false;
  }
  if (authCodeLoginButton) {
    authCodeLoginButton.disabled = false;
  }

  const statusMessage = message || (
    activeMode === "code"
      ? "Enter access code to continue"
      : hasPasskey
        ? "Authenticate to continue"
        : "Create your passkey to continue"
  );
  setAuthStatus(statusMessage);
  const lockSeconds = getRetryAfterSeconds(statusMessage);
  if (lockSeconds > 0) {
    startAuthLockCountdown(lockSeconds);
  }
  setAuthMode(activeMode, { focus: true });
};

const hideAuthModal = () => {
  if (!authModal) return;
  clearAuthLockCountdown();
  setAuthUiLock(false);
  authModal.classList.remove("show");
  authModal.setAttribute("aria-hidden", "true");
};

const isUnauthorizedError = (error) => error?.message === "Unauthorized";

const toBase64Url = (arrayBuffer) => {
  const bytes = new Uint8Array(arrayBuffer);
  let str = "";
  bytes.forEach((byte) => {
    str += String.fromCharCode(byte);
  });
  return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
};

const fromBase64Url = (value) => {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
  const str = atob(padded);
  const bytes = new Uint8Array(str.length);
  for (let i = 0; i < str.length; i += 1) {
    bytes[i] = str.charCodeAt(i);
  }
  return bytes.buffer;
};

const preparePublicKeyOptions = (options) => {
  const publicKey = { ...options };
  if (publicKey.challenge) {
    publicKey.challenge = fromBase64Url(publicKey.challenge);
  }
  if (publicKey.user?.id) {
    publicKey.user = {
      ...publicKey.user,
      id: fromBase64Url(publicKey.user.id),
    };
  }
  if (Array.isArray(publicKey.excludeCredentials)) {
    publicKey.excludeCredentials = publicKey.excludeCredentials.map((cred) => ({
      ...cred,
      id: fromBase64Url(cred.id),
    }));
  }
  if (Array.isArray(publicKey.allowCredentials)) {
    publicKey.allowCredentials = publicKey.allowCredentials.map((cred) => ({
      ...cred,
      id: fromBase64Url(cred.id),
    }));
  }
  return publicKey;
};

const serializeCredential = (credential) => {
  const response = {
    clientDataJSON: toBase64Url(credential.response.clientDataJSON),
  };
  if (credential.response.attestationObject) {
    response.attestationObject = toBase64Url(credential.response.attestationObject);
    if (typeof credential.response.getTransports === "function") {
      response.transports = credential.response.getTransports();
    }
  }
  if (credential.response.authenticatorData) {
    response.authenticatorData = toBase64Url(credential.response.authenticatorData);
  }
  if (credential.response.signature) {
    response.signature = toBase64Url(credential.response.signature);
  }
  if (credential.response.userHandle) {
    response.userHandle = toBase64Url(credential.response.userHandle);
  }
  return {
    id: credential.id,
    rawId: toBase64Url(credential.rawId),
    type: credential.type,
    response,
    clientExtensionResults:
      typeof credential.getClientExtensionResults === "function"
        ? credential.getClientExtensionResults()
        : {},
    authenticatorAttachment: credential.authenticatorAttachment || null,
  };
};

const getErrorMessage = async (response, fallback) => {
  try {
    const data = await response.json();
    return data?.error || fallback;
  } catch (error) {
    return fallback;
  }
};

const getErrorPayload = async (response, fallback) => {
  try {
    const data = await response.json();
    return {
      error: data?.error || fallback,
      retryAfter: getRetryAfterSeconds(data?.retry_after || data?.error),
      remainingAttempts: Number.parseInt(data?.remaining_attempts, 10),
      locked: Boolean(data?.locked),
    };
  } catch (error) {
    return {
      error: fallback,
      retryAfter: 0,
      remainingAttempts: null,
      locked: false,
    };
  }
};

const passkeyErrorMessage = (error, mode) => {
  const name = error?.name || "";
  const message = error?.message || "";
  if (name === "NotAllowedError") {
    return mode === "register"
      ? "Registration was canceled or timed out. Use Windows Hello PIN and try again."
      : "Sign-in was canceled or timed out. Use Windows Hello PIN and try again.";
  }
  if (name === "InvalidStateError") {
    return "This passkey already exists on this device.";
  }
  if (name === "SecurityError") {
    return "Invalid domain for passkey. Open the app on http://localhost:5000.";
  }
  if (message) return message;
  return mode === "register" ? "Passkey registration failed" : "Passkey sign-in failed";
};

const fetchAuthStatus = async () => {
  const response = await fetch("/api/auth/status");
  if (!response.ok) {
    throw new Error("Auth status failed");
  }
  return response.json();
};

const handleUnauthorized = async () => {
  stopLoginApprovalPolling();
  stopDataSyncPolling();
  state.isAuthenticated = false;
  state.authUser = "";
  setLoginApprovalCapability(false);
  try {
    const status = await fetchAuthStatus();
    showAuthModal(status, "Session expired. Sign in again.");
  } catch (error) {
    showAuthModal(
      { has_passkey: state.hasPasskey, code_login: { enabled: state.codeLoginEnabled } },
      "Authentication required"
    );
  }
};

const apiFetch = async (url, options = {}) => {
  const response = await fetch(url, options);
  if (response.status === 401) {
    await handleUnauthorized();
    throw new Error("Unauthorized");
  }
  return response;
};

const parseLoginApprovalTimestamp = (value) => {
  const time = new Date(value).getTime();
  return Number.isFinite(time) ? time : 0;
};

const normalizeLoginApprovalRequest = (requestRow = {}) => {
  const requestId = String(requestRow?.id || "").trim();
  if (!requestId) return null;
  return {
    id: requestId,
    user: String(requestRow?.user || "admin"),
    ip: String(requestRow?.ip || "unknown"),
    user_agent: String(requestRow?.user_agent || "Unknown device"),
    created_at: String(requestRow?.created_at || ""),
    expires_at: String(requestRow?.expires_at || ""),
    expires_in: Math.max(0, Number(requestRow?.expires_in || 0)),
  };
};

const getCachedLoginApprovalRequests = () =>
  [...loginApprovalPendingCache.values()].sort(
    (a, b) =>
      parseLoginApprovalTimestamp(b?.created_at) - parseLoginApprovalTimestamp(a?.created_at)
  );

const parseCanApproveLoginRequests = (payload = {}) => {
  if (typeof payload?.can_approve_requests === "boolean") {
    return payload.can_approve_requests;
  }
  if (typeof payload?.login_approval?.can_approve_requests === "boolean") {
    return payload.login_approval.can_approve_requests;
  }
  return false;
};

const parseCodeLoginEnabled = (payload = {}) =>
  Boolean(payload?.code_login?.enabled);

const setLoginApprovalCapability = (canApprove) => {
  state.canApproveLoginRequests = Boolean(canApprove);
  if (!state.canApproveLoginRequests) {
    if (loginApprovalModal?.classList.contains("show")) {
      closeLoginApprovalModal("later");
    }
    loginApprovalPendingCache.clear();
    loginApprovalPromptSnoozeUntil.clear();
  }
  setLoginApprovalMenuState();
};

const setLoginApprovalMenuState = () => {
  const canApprove = Boolean(state.canApproveLoginRequests);
  const count = loginApprovalPendingCache.size;
  const showApprovalControls = canApprove && count > 0;
  const text = canApprove
    ? count > 0
      ? `${count} pending sign-in request(s)`
      : "No pending sign-in requests"
    : "This passkey/device cannot approve sign-in requests";

  if (settingsLoginRequestsDot) {
    settingsLoginRequestsDot.hidden = !canApprove || count === 0;
  }
  if (settingsLoginRequestsButton) {
    settingsLoginRequestsButton.hidden = !showApprovalControls;
    settingsLoginRequestsButton.disabled = !showApprovalControls;
    settingsLoginRequestsButton.setAttribute("aria-label", text);
    settingsLoginRequestsButton.setAttribute("title", text);
  }
  if (settingsLoginRequestsBadge) {
    settingsLoginRequestsBadge.hidden = !canApprove || count === 0;
    settingsLoginRequestsBadge.textContent = count > 99 ? "99+" : String(count);
  }
  if (mobileLoginRequestsDot) {
    mobileLoginRequestsDot.hidden = !canApprove || count === 0;
  }
  if (mobileLoginRequestsButton) {
    mobileLoginRequestsButton.hidden = !showApprovalControls;
    mobileLoginRequestsButton.disabled = !showApprovalControls;
    mobileLoginRequestsButton.setAttribute("aria-label", text);
    mobileLoginRequestsButton.setAttribute("title", text);
    mobileLoginRequestsButton.classList.toggle("has-pending", showApprovalControls);
  }
};

const removeLoginApprovalRequestFromCache = (requestId) => {
  const id = String(requestId || "").trim();
  if (!id) return;
  loginApprovalPendingCache.delete(id);
  loginApprovalPromptSnoozeUntil.delete(id);
  setLoginApprovalMenuState();
};

const syncLoginApprovalRequestCache = (requests = []) => {
  const rows = [];
  (requests || []).forEach((requestRow) => {
    const normalized = normalizeLoginApprovalRequest(requestRow);
    if (normalized) rows.push(normalized);
  });

  loginApprovalPendingCache.clear();
  rows
    .sort(
      (a, b) =>
        parseLoginApprovalTimestamp(b?.created_at) - parseLoginApprovalTimestamp(a?.created_at)
    )
    .forEach((row) => {
      loginApprovalPendingCache.set(row.id, row);
    });

  for (const requestId of [...loginApprovalPromptSnoozeUntil.keys()]) {
    if (!loginApprovalPendingCache.has(requestId)) {
      loginApprovalPromptSnoozeUntil.delete(requestId);
    }
  }

  if (
    loginApprovalActiveRequestId &&
    !loginApprovalPendingCache.has(loginApprovalActiveRequestId) &&
    loginApprovalModal?.classList.contains("show")
  ) {
    closeLoginApprovalModal("later");
  }

  setLoginApprovalMenuState();
};

const fetchPendingLoginApprovalRequests = async () => {
  const response = await apiFetch("/api/auth/login/requests");
  if (!response.ok) {
    if (response.status === 403) {
      setLoginApprovalCapability(false);
      stopLoginApprovalPolling();
      return [];
    }
    return getCachedLoginApprovalRequests();
  }
  setLoginApprovalCapability(true);
  const payload = await response.json();
  const requests = Array.isArray(payload?.requests) ? payload.requests : [];
  syncLoginApprovalRequestCache(requests);
  return getCachedLoginApprovalRequests();
};

const setLoginApprovalValue = (node, value, fallback = "-") => {
  if (!node) return;
  const text = String(value || "").trim();
  node.textContent = text || fallback;
};

const formatLoginApprovalExpires = (seconds) => {
  const total = Math.max(0, Number(seconds) || 0);
  if (total <= 0) return "Expired";
  const mins = Math.floor(total / 60);
  const secs = total % 60;
  if (mins <= 0) return `${secs}s`;
  return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
};

const clearLoginApprovalCountdown = () => {
  if (loginApprovalCountdownTimer) {
    clearInterval(loginApprovalCountdownTimer);
    loginApprovalCountdownTimer = null;
  }
};

const closeLoginApprovalModal = (decision = null) => {
  clearLoginApprovalCountdown();
  loginApprovalActiveRequestId = "";
  if (loginApprovalModal) {
    loginApprovalModal.classList.remove("show");
    loginApprovalModal.setAttribute("aria-hidden", "true");
  }
  document.documentElement.classList.remove("login-approval-open");
  document.body.classList.remove("login-approval-open");
  if (loginApprovalDecisionResolver) {
    const resolve = loginApprovalDecisionResolver;
    loginApprovalDecisionResolver = null;
    resolve(decision || "later");
  }
};

const promptLoginApprovalDecision = (requestRow = {}) => {
  if (
    !loginApprovalModal ||
    !loginApprovalApproveButton ||
    !loginApprovalRejectButton ||
    !loginApprovalCloseButton
  ) {
    return Promise.resolve("later");
  }

  closeLoginApprovalModal("later");
  const normalized = normalizeLoginApprovalRequest(requestRow);
  if (!normalized) {
    return Promise.resolve("later");
  }
  loginApprovalActiveRequestId = normalized.id;

  const user = normalized.user;
  const ip = normalized.ip;
  const device = normalized.user_agent;
  const createdAtRaw = normalized.created_at;
  const createdAtText = createdAtRaw ? formatUpdated(createdAtRaw) : "Unknown";
  let expiresIn = Math.max(0, Number(normalized.expires_in || 0));

  setLoginApprovalValue(loginApprovalUserValue, user, "admin");
  setLoginApprovalValue(loginApprovalIpValue, ip, "Unknown");
  setLoginApprovalValue(loginApprovalCreatedValue, createdAtText, "Unknown");
  setLoginApprovalValue(loginApprovalDeviceValue, device, "Unknown device");
  setLoginApprovalValue(loginApprovalExpiresValue, formatLoginApprovalExpires(expiresIn), "Expired");

  const syncStatusText = () => {
    if (!loginApprovalStatus) return;
    loginApprovalStatus.textContent =
      expiresIn > 0
        ? "Review request details and choose an action."
        : "Request expired. Close this card and wait for a new request.";
  };
  syncStatusText();

  clearLoginApprovalCountdown();
  loginApprovalCountdownTimer = setInterval(() => {
    expiresIn = Math.max(0, expiresIn - 1);
    setLoginApprovalValue(
      loginApprovalExpiresValue,
      formatLoginApprovalExpires(expiresIn),
      "Expired"
    );
    syncStatusText();
    if (expiresIn <= 0) {
      clearLoginApprovalCountdown();
    }
  }, 1000);

  loginApprovalModal.classList.add("show");
  loginApprovalModal.setAttribute("aria-hidden", "false");
  document.documentElement.classList.add("login-approval-open");
  document.body.classList.add("login-approval-open");

  return new Promise((resolve) => {
    loginApprovalDecisionResolver = resolve;
    requestAnimationFrame(() => loginApprovalApproveButton.focus());
  });
};

const submitLoginApprovalDecision = async (requestId, endpoint) => {
  const decisionResponse = await apiFetch(
    `/api/auth/login/requests/${encodeURIComponent(requestId)}/${endpoint}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body:
        endpoint === "approve"
          ? JSON.stringify({})
          : JSON.stringify({ reason: "Rejected by administrator." }),
    }
  );
  if (!decisionResponse.ok) {
    if (decisionResponse.status === 404 || decisionResponse.status === 409) {
      removeLoginApprovalRequestFromCache(requestId);
    }
    const message = await getErrorMessage(decisionResponse, "Could not process login request");
    setSaveStatus(message, "warn", { resetAfterMs: 2400 });
    return false;
  }
  removeLoginApprovalRequestFromCache(requestId);
  setSaveStatus(
    endpoint === "approve" ? "Login request approved" : "Login request rejected",
    endpoint === "approve" ? "good" : "warn",
    { resetAfterMs: 2200 }
  );
  return true;
};

const processLoginApprovalRequest = async (requestRow, options = {}) => {
  const normalized = normalizeLoginApprovalRequest(requestRow);
  if (!normalized) return "skip";
  const decision = await promptLoginApprovalDecision(normalized);
  if (decision !== "approve" && decision !== "reject") {
    if (options.snoozeOnLater !== false) {
      loginApprovalPromptSnoozeUntil.set(
        normalized.id,
        Date.now() + LOGIN_APPROVAL_LATER_SNOOZE_MS
      );
    }
    return "later";
  }
  const ok = await submitLoginApprovalDecision(normalized.id, decision);
  return ok ? decision : "error";
};

const openStoredLoginApprovalRequest = async () => {
  if (!state.isAuthenticated || !state.canApproveLoginRequests || loginApprovalPromptBusy) return;
  closeMobileMenu();
  loginApprovalPromptBusy = true;
  try {
    const requests = await fetchPendingLoginApprovalRequests();
    const requestRow = requests[0];
    if (!requestRow) {
      setSaveStatus("No pending sign-in requests", "warn", { resetAfterMs: 1800 });
      return;
    }
    await processLoginApprovalRequest(requestRow, { snoozeOnLater: true });
  } catch (error) {
    if (!isUnauthorizedError(error)) {
      setSaveStatus("Could not open sign-in requests", "warn", { resetAfterMs: 2200 });
    }
  } finally {
    loginApprovalPromptBusy = false;
  }
};

const stopLoginApprovalPolling = () => {
  if (loginApprovalPollTimer) {
    clearInterval(loginApprovalPollTimer);
    loginApprovalPollTimer = null;
  }
  closeLoginApprovalModal("later");
  loginApprovalPromptBusy = false;
  loginApprovalPromptSnoozeUntil.clear();
  loginApprovalPendingCache.clear();
  setLoginApprovalMenuState();
};

const handlePendingLoginApprovals = async () => {
  if (
    !state.isAuthenticated ||
    !state.canApproveLoginRequests ||
    loginApprovalPromptBusy ||
    loginApprovalModal?.classList.contains("show")
  ) {
    return;
  }
  loginApprovalPromptBusy = true;
  try {
    const requests = await fetchPendingLoginApprovalRequests();
    for (const requestRow of requests) {
      const requestId = String(requestRow?.id || "").trim();
      if (!requestId) continue;
      const now = Date.now();
      const snoozeUntil = Number(loginApprovalPromptSnoozeUntil.get(requestId) || 0);
      if (snoozeUntil > now) continue;
      await processLoginApprovalRequest(requestRow, { snoozeOnLater: true });
      break;
    }
  } catch (error) {
    if (!isUnauthorizedError(error)) {
      // Ignore transient polling errors to avoid UI noise.
    }
  } finally {
    loginApprovalPromptBusy = false;
  }
};

const startLoginApprovalPolling = () => {
  stopLoginApprovalPolling();
  if (!state.isAuthenticated || !state.canApproveLoginRequests) return;
  void handlePendingLoginApprovals();
  loginApprovalPollTimer = setInterval(() => {
    void handlePendingLoginApprovals();
  }, 4000);
};

const waitForLoginApproval = async (timeoutSeconds = 120) => {
  const timeout = Math.max(10, Number(timeoutSeconds) || 120);
  const deadline = Date.now() + timeout * 1000;
  let displayRemaining = timeout;
  const renderApprovalCountdown = () => {
    const remaining = Math.max(0, Math.min(displayRemaining, Math.ceil((deadline - Date.now()) / 1000)));
    if (remaining > 0) {
      setAuthStatus(`Waiting for admin approval... ${remaining}s`, "warn");
    } else {
      setAuthStatus("Waiting for admin approval...", "warn");
    }
  };
  renderApprovalCountdown();
  const approvalCountdownTimer = setInterval(() => {
    displayRemaining = Math.max(0, displayRemaining - 1);
    renderApprovalCountdown();
  }, 1000);

  try {
  while (Date.now() < deadline) {
    const cycleStartedAt = Date.now();
    const response = await fetch("/api/auth/login/pending", { cache: "no-store" });
    if (!response.ok) {
      const message = await getErrorMessage(response, "Approval status check failed");
      throw new Error(message);
    }
    const payload = await response.json();
    const status = String(payload?.status || "");
    if (status === "approved" && payload?.authenticated) {
      return payload;
    }
    if (status === "rejected") {
      throw new Error(payload?.error || "Login request was rejected");
    }
    if (status === "none") {
      throw new Error("No pending login request was found");
    }
    const remaining = Number(payload?.expires_in || 0);
    if (Number.isFinite(remaining) && remaining > 0) {
      // Keep UI countdown smooth; only resync when drift is noticeable.
      if (Math.abs(remaining - displayRemaining) >= 3) {
        displayRemaining = remaining;
      }
    }
    renderApprovalCountdown();
    const elapsed = Date.now() - cycleStartedAt;
    const waitMs = Math.max(180, 1000 - elapsed);
    // eslint-disable-next-line no-await-in-loop
    await new Promise((resolve) => setTimeout(resolve, waitMs));
  }
  } finally {
    clearInterval(approvalCountdownTimer);
  }
  throw new Error("Login approval timed out");
};

const completeAuth = async (userName, options = {}) => {
  clearAuthPendingState();
  state.isAuthenticated = true;
  state.authUser = userName || "admin";
  if (Object.prototype.hasOwnProperty.call(options, "canApproveRequests")) {
    setLoginApprovalCapability(Boolean(options.canApproveRequests));
  }
  hideAuthModal();
  const defaultStatus = getDefaultStatus();
  setSaveStatus(defaultStatus.text, defaultStatus.variant);
  await refreshLists();
  startDataSyncPolling();
  startLoginApprovalPolling();
};

const logoutAuth = async () => {
  try {
    const response = await fetch("/api/auth/logout", { method: "POST" });
    if (!response.ok) {
      throw new Error("Logout failed");
    }
    stopLoginApprovalPolling();
    stopDataSyncPolling();
    state.isAuthenticated = false;
    state.authUser = "";
    setLoginApprovalCapability(false);
    state.savedList = [];
    state.trashList = [];
    renderSavedList();
    renderTrashList();
    closeAllTransientOverlays();
    setSaveStatus("Signed out", "warn");
    const status = await fetchAuthStatus();
    showAuthModal(status, "Signed out. Sign in again.");
  } catch (error) {
    setSaveStatus("Logout failed", "warn");
  }
};

const registerPasskey = async () => {
  const setupCode = authSetupCodeInput?.value.trim() || "";
  if (!state.hasPasskey && !setupCode) {
    setAuthStatus("First Admin Setup Code is required", "warn");
    return;
  }
  if (!window.PublicKeyCredential || !navigator.credentials) {
    setAuthStatus("Passkeys are not supported in this browser/device.", "warn");
    return;
  }
  if (authRegisterButton) authRegisterButton.disabled = true;
  setAuthStatus("Waiting for security key...", "warn");
  try {
    const optionsResponse = await fetch("/api/auth/register/options", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ setup_code: setupCode }),
    });
    if (!optionsResponse.ok) {
      const payload = await getErrorPayload(optionsResponse, "Failed to start registration");
      if (payload.retryAfter > 0) {
        startAuthLockCountdown(payload.retryAfter);
        return;
      }
      throw new Error(payload.error);
    }
    const options = await optionsResponse.json();
    const credential = await navigator.credentials.create({
      publicKey: preparePublicKeyOptions(options),
    });
    if (!credential) {
      throw new Error("Passkey registration was cancelled");
    }
    const verifyResponse = await fetch("/api/auth/register/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(serializeCredential(credential)),
    });
    if (!verifyResponse.ok) {
      const msg = await getErrorMessage(verifyResponse, "Passkey verification failed");
      throw new Error(msg);
    }
    const result = await verifyResponse.json();
    setAuthStatus("Passkey created", "good");
    await completeAuth(result.user || "admin", {
      canApproveRequests: parseCanApproveLoginRequests(result),
    });
  } catch (error) {
    const retryAfter = getRetryAfterSeconds(error?.message);
    if (retryAfter > 0) {
      startAuthLockCountdown(retryAfter);
      return;
    }
    setAuthStatus(passkeyErrorMessage(error, "register"), "warn");
  } finally {
    if (authRegisterButton && !authLockCountdownTimer) authRegisterButton.disabled = false;
  }
};

const loginWithAccessCode = async () => {
  if (!state.codeLoginEnabled) {
    setAuthStatus("Access-code login is disabled on this server.", "warn");
    return;
  }
  const accessCode = authCodeInput?.value.trim() || "";
  if (!accessCode) {
    setAuthStatus("Access code is required", "warn");
    return;
  }
  if (authCodeLoginButton) authCodeLoginButton.disabled = true;
  setAuthStatus("Verifying access code...", "warn");
  try {
    const response = await fetch("/api/auth/login/code", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ access_code: accessCode }),
    });
    if (!response.ok) {
      const payload = await getErrorPayload(response, "Access-code sign-in failed");
      if (payload.retryAfter > 0) {
        setAuthStatus(payload.error, "warn");
      } else {
        setAuthStatus(payload.error, "warn");
      }
      return;
    }
    const result = await response.json();
    if (authCodeInput) authCodeInput.value = "";
    setAuthStatus("Sign-in successful", "good");
    await completeAuth(result.user || "admin", {
      canApproveRequests: parseCanApproveLoginRequests(result),
    });
  } catch (error) {
    setAuthStatus("Access-code sign-in failed", "warn");
  } finally {
    if (authCodeLoginButton) authCodeLoginButton.disabled = false;
  }
};

const loginPasskey = async () => {
  if (!window.PublicKeyCredential || !navigator.credentials) {
    setAuthStatus("Passkeys are not supported in this browser/device.", "warn");
    return;
  }
  if (authLoginButton) authLoginButton.disabled = true;
  setAuthStatus("Waiting for passkey authentication...", "warn");
  try {
    const optionsResponse = await fetch("/api/auth/login/options", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    if (!optionsResponse.ok) {
      const msg = await getErrorMessage(optionsResponse, "Failed to start sign-in");
      throw new Error(msg);
    }
    const options = await optionsResponse.json();
    const publicKey = preparePublicKeyOptions(options);
    if (!publicKey.userVerification) {
      publicKey.userVerification = "required";
    }
    let credential = null;
    try {
      // Prefer on-device PIN/biometric first while still allowing other authenticators.
      credential = await navigator.credentials.get({
        publicKey: {
          ...publicKey,
          hints: ["client-device", "security-key", "hybrid"],
        },
      });
    } catch (hintError) {
      const hintName = hintError?.name || "";
      const hintMessage = String(hintError?.message || "");
      const canFallback =
        hintName === "TypeError" ||
        hintName === "NotSupportedError" ||
        /hints?/i.test(hintMessage);
      if (!canFallback) {
        throw hintError;
      }
      credential = await navigator.credentials.get({ publicKey });
    }
    if (!credential) {
      throw new Error("Passkey sign-in was cancelled");
    }
    const verifyResponse = await fetch("/api/auth/login/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(serializeCredential(credential)),
    });
    if (!verifyResponse.ok) {
      const msg = await getErrorMessage(verifyResponse, "Passkey verification failed");
      throw new Error(msg);
    }
    const result = await verifyResponse.json();
    if (result?.pending_approval) {
      setAuthStatus("Login request sent. Waiting for admin approval...", "warn");
      const approved = await waitForLoginApproval(result?.expires_in || 120);
      setAuthStatus("Sign-in approved", "good");
      await completeAuth(approved?.user || result?.user || "admin", {
        canApproveRequests: parseCanApproveLoginRequests(approved),
      });
      return;
    }
    setAuthStatus("Sign-in successful", "good");
    await completeAuth(result.user || "admin", {
      canApproveRequests: parseCanApproveLoginRequests(result),
    });
  } catch (error) {
    setAuthStatus(passkeyErrorMessage(error, "login"), "warn");
  } finally {
    if (authLoginButton) authLoginButton.disabled = false;
  }
};

const initAuthGate = async () => {
  try {
    const status = await fetchAuthStatus();
    state.hasPasskey = Boolean(status.has_passkey);
    state.codeLoginEnabled = parseCodeLoginEnabled(status);
    state.isAuthenticated = Boolean(status.authenticated);
    state.authUser = status.user || "";
    setLoginApprovalCapability(parseCanApproveLoginRequests(status));
    if (state.isAuthenticated) {
      hideAuthModal();
      const defaultStatus = getDefaultStatus();
      setSaveStatus(defaultStatus.text, defaultStatus.variant);
      await refreshLists();
      startDataSyncPolling();
      startLoginApprovalPolling();
      return;
    }
    showAuthModal(status);
  } catch (error) {
    stopDataSyncPolling();
    state.isAuthenticated = false;
    state.authUser = "";
    setLoginApprovalCapability(false);
    showAuthModal(
      { has_passkey: false, code_login: { enabled: state.codeLoginEnabled } },
      "Authentication check failed"
    );
  } finally {
    clearAuthPendingState();
  }
};

const updateExportState = () => {
  if (!exportButton) return;
  const hasItems = getItems().length > 0;
  exportButton.disabled = !hasItems;
  exportButton.title = hasItems
    ? "Preview and export PDF"
    : "Add at least one item to enable export";
};

const scheduleAutoSave = () => {
  if (!autosaveEnabled || !state.currentId) {
    return;
  }
  if (autosaveTimer) {
    clearTimeout(autosaveTimer);
  }
  autosaveTimer = setTimeout(() => {
    const formNo = document.getElementById("formNo")?.value.trim();
    if (!formNo) {
      setSaveStatus("Add Form No to autosave", "warn");
      return;
    }
    if (state.currentId && state.loadedFormNo && formNo !== state.loadedFormNo) {
      setSaveStatus("Form No changed - click Save", "warn");
      return;
    }
    if (!state.currentId && !hasChangesBeyondFormNo()) {
      setSaveStatus("Draft not saved yet - add details or click Save", "warn");
      return;
    }
    if (state.isDirty) {
      savePO({ autosave: true });
    }
  }, autosaveDelayMs);
};

const markDirty = () => {
  if (!state.isDirty) {
    state.isDirty = true;
    setSaveStatus("Unsaved changes", "warn");
  }
  scheduleAutoSave();
};

const markClean = (text) => {
  state.isDirty = false;
  setSaveStatus(text, "good");
};

const setTouched = (input) => {
  if (!input) return;
  input.dataset.touched = "true";
};

const setValidityClass = (input, options) => {
  if (!input) return;
  const { valid, show, message } = options;
  input.classList.remove("is-valid", "is-invalid");
  input.title = "";
  const label = input.closest("label");
  if (label) {
    label.classList.remove("has-error");
    label.removeAttribute("data-error");
  }
  if (!show) return;
  input.classList.add(valid ? "is-valid" : "is-invalid");
  if (!valid && message) {
    input.title = message;
    if (label) {
      label.classList.add("has-error");
      label.setAttribute("data-error", message);
    }
  }
};

const isFormNoUnique = (value) => {
  const formNo = value.trim().toLowerCase();
  if (!formNo) return true;
  const existing = state.savedList.find(
    (row) => (row.form_no || "").trim().toLowerCase() === formNo
  );
  if (!existing) return true;
  if (state.currentId && existing.id === state.currentId) return true;
  if (state.loadedFormNo && state.loadedFormNo.trim().toLowerCase() === formNo) {
    return true;
  }
  return false;
};

const validateField = (input, options = {}) => {
  if (!input) return true;
  const { force = false } = options;
  const isRequired = requiredFieldIds.includes(input.id);
  if (!isRequired) return true;
  const value = input.value.trim();
  const touched = input.dataset.touched === "true";
  const show = force || touched;
  if (!show && !value) {
    setValidityClass(input, { valid: true, show: false });
    return true;
  }
  let valid = value.length > 0;
  let message = valid ? "" : "Required field";
  if (input.id === "formNo" && value) {
    if (!isFormNoUnique(value)) {
      valid = false;
      message = "Form No already exists";
    }
  }
  setValidityClass(input, {
    valid,
    show,
    message,
  });
  return valid;
};

const validateItems = (options = {}) => {
  const { force = false } = options;
  const requiredItemFields = new Set(["item", "qty", "unit"]);
  const rows = [...itemsBody.querySelectorAll("tr")];
  const counts = {};
  rows.forEach((row) => {
    const itemValue =
      row.querySelector('[data-field="item"]')?.value.trim() || "";
    if (!itemValue) return;
    const key = itemValue.toLowerCase();
    counts[key] = (counts[key] || 0) + 1;
  });

  let allValid = true;
  let firstMessage = "";
  const anyRowHasValue = rows.some((row) => {
    const values = [
      row.querySelector('[data-field="model"]')?.value.trim() || "",
      row.querySelector('[data-field="item"]')?.value.trim() || "",
      row.querySelector('[data-field="qty"]')?.value.trim() || "",
      row.querySelector('[data-field="unit"]')?.value.trim() || "",
      row.querySelector('[data-field="plan"]')?.value.trim() || "",
    ];
    return values.some((val) => val);
  });

  rows.forEach((row, index) => {
    const inputs = [...row.querySelectorAll("input")];
    const values = {
      model: row.querySelector('[data-field="model"]')?.value.trim() || "",
      item: row.querySelector('[data-field="item"]')?.value.trim() || "",
      qty: row.querySelector('[data-field="qty"]')?.value.trim() || "",
      unit: row.querySelector('[data-field="unit"]')?.value.trim() || "",
      plan: row.querySelector('[data-field="plan"]')?.value.trim() || "",
    };
    const rowHasValue = Object.values(values).some((val) => val);
    if (!rowHasValue) {
      if (force || anyRowHasValue) {
        inputs.forEach((input) =>
          setValidityClass(input, {
            valid: false,
            show: true,
            message: "Blank row not allowed",
          })
        );
        if (!firstMessage) {
          firstMessage = `Row ${index + 1} is empty`;
        }
        allValid = false;
      } else {
        inputs.forEach((input) => setValidityClass(input, { valid: true, show: false }));
      }
      return;
    }

    Object.entries(values).forEach(([field, value]) => {
      const input = row.querySelector(`[data-field="${field}"]`);
      const touched = input?.dataset.touched === "true";
      const show = force || touched;
      const isRequiredField = requiredItemFields.has(field);
      let valid = !isRequiredField || value.length > 0;
      let message = isRequiredField && !valid ? "Required field" : "";
      if (field === "item" && value) {
        const key = value.toLowerCase();
        if (counts[key] > 1) {
          valid = false;
          message = "Item must be unique";
        }
      }
      if (!valid && !firstMessage) {
        const label = field === "item" ? "Item" : field.toUpperCase();
        firstMessage =
          message === "Item must be unique"
            ? `Row ${index + 1}: Item must be unique`
            : `Row ${index + 1}: ${label} is required`;
      }
      if (!valid) {
        allValid = false;
      }
      if (!show && !value) {
        setValidityClass(input, { valid: true, show: false });
      } else {
        setValidityClass(input, {
          valid,
          show: (isRequiredField && show) || valid === false,
          message,
        });
      }
    });
  });
  return { valid: allValid, message: firstMessage };
};

const validateAll = (options = {}) => {
  const { force = false } = options;
  let firstMessage = "";
  const fieldsValid = requiredFieldIds
    .map((id) => {
      const input = document.getElementById(id);
      const valid = validateField(input, { force });
      if (!valid && !firstMessage) {
        if (id === "formNo") {
          const value = input?.value.trim() || "";
          if (value && !isFormNoUnique(value)) {
            firstMessage = "Form No already exists";
          } else {
            firstMessage = `${fieldLabels[id] || "Field"} is required`;
          }
        } else {
          firstMessage = `${fieldLabels[id] || "Field"} is required`;
        }
      }
      return valid;
    })
    .every(Boolean);
  const itemCheck = validateItems({ force });
  if (!itemCheck.valid && !firstMessage) {
    firstMessage = itemCheck.message || "Item fields are required";
  }
  return { valid: fieldsValid && itemCheck.valid, message: firstMessage };
};

const openEditorModal = () => {
  document.body.classList.add("modal-open");
  state.modalOpen = true;
};

const closeEditorModal = () => {
  document.body.classList.remove("modal-open");
  state.modalOpen = false;
};

const openPdfPreview = (blob, fileName) => {
  if (!pdfModal || !pdfFrame) return;
  if (previewUrl) {
    URL.revokeObjectURL(previewUrl);
  }
  previewUrl = URL.createObjectURL(blob);
  previewFileName = fileName;
  pdfFrame.src = previewUrl;
  pdfModal.classList.add("show");
  document.body.classList.add("pdf-open");
};

const closePdfPreview = () => {
  if (!pdfModal || !pdfFrame) return;
  pdfModal.classList.remove("show");
  document.body.classList.remove("pdf-open");
  pdfFrame.src = "about:blank";
  if (previewUrl) {
    URL.revokeObjectURL(previewUrl);
    previewUrl = null;
  }
  previewFileName = null;
};

const openTrashModal = async () => {
  if (!trashModal) return;
  await loadTrashList();
  trashModal.classList.add("show");
  trashModal.setAttribute("aria-hidden", "false");
  document.body.classList.add("trash-open");
};

const closeTrashModal = () => {
  if (!trashModal) return;
  trashModal.classList.remove("show");
  trashModal.setAttribute("aria-hidden", "true");
  document.body.classList.remove("trash-open");
};

const setDbToolsStatus = (text, variant = "warn") => {
  if (!dbToolsStatus) return;
  dbToolsStatus.textContent = text;
  dbToolsStatus.classList.remove("warn", "good");
  if (variant) {
    dbToolsStatus.classList.add(variant);
  }
};

const setDbAutoSummary = (data = {}) => {
  if (!dbAutoSummary) return;
  const enabled = Boolean(data.enabled);
  const interval = Number(data.interval_hours) || 24;
  const retention = Number(data.retention_days) || 30;
  const last = data.last_backup_at ? formatUpdated(data.last_backup_at) : "none yet";
  dbAutoSummary.textContent = enabled
    ? `Auto backup is ON (every ${interval}h, keep ${retention} days). Last backup: ${last}.`
    : "Auto backup is OFF.";
};

const setDbUpdatesSummary = (text, variant = "warn") => {
  if (!dbUpdatesSummary) return;
  dbUpdatesSummary.textContent = text;
  dbUpdatesSummary.classList.remove("good", "warn");
  if (variant) {
    dbUpdatesSummary.classList.add(variant);
  }
};

const renderBackups = () => {
  if (!dbBackupsBody || !dbBackupSelect) return;
  const rows = state.backups || [];
  const isBusy = Boolean(state.dbToolsBusy);
  dbBackupsBody.innerHTML = "";
  dbBackupSelect.innerHTML = "";

  if (rows.length === 0) {
    dbBackupSelect.innerHTML = `<option value="">No backups found</option>`;
    const emptyRow = document.createElement("tr");
    emptyRow.innerHTML = `<td colspan="4" class="empty-row">No backups available</td>`;
    dbBackupsBody.appendChild(emptyRow);
    dbBackupSelect.disabled = true;
    if (dbRestoreSelectedButton) dbRestoreSelectedButton.disabled = true;
    return;
  }

  rows.forEach((row) => {
    const option = document.createElement("option");
    option.value = row.name;
    option.textContent = row.name;
    dbBackupSelect.appendChild(option);

    const tr = document.createElement("tr");
    const fileCell = document.createElement("td");
    fileCell.dataset.label = "Backup File";
    fileCell.textContent = row.name || "";

    const updatedCell = document.createElement("td");
    updatedCell.dataset.label = "Updated";
    updatedCell.textContent = formatUpdated(row.updated_at) || "";

    const sizeCell = document.createElement("td");
    sizeCell.dataset.label = "Size";
    sizeCell.textContent = formatFileSize(row.size);

    const actionsCell = document.createElement("td");
    actionsCell.dataset.label = "Actions";
    actionsCell.className = "db-backup-actions";
    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.className = "link-button danger has-icon db-backup-delete";
    deleteButton.dataset.action = "delete-backup";
    deleteButton.dataset.file = row.name || "";
    deleteButton.title = "Delete backup";
    deleteButton.setAttribute("aria-label", `Delete backup ${row.name || ""}`);
    deleteButton.disabled = isBusy;
    deleteButton.innerHTML = `
      <span class="btn-icon" aria-hidden="true">
        <svg viewBox="0 0 24 24" role="img" focusable="false">
          <path d="M3 6h18"></path>
          <path d="M8 6V4h8v2"></path>
          <path d="M6 6l1 14h10l1-14"></path>
        </svg>
      </span>
    `;
    actionsCell.appendChild(deleteButton);

    tr.appendChild(fileCell);
    tr.appendChild(updatedCell);
    tr.appendChild(sizeCell);
    tr.appendChild(actionsCell);
    dbBackupsBody.appendChild(tr);
  });

  dbBackupSelect.disabled = isBusy;
  if (dbRestoreSelectedButton) dbRestoreSelectedButton.disabled = isBusy;
  if (dbBackupSelect.options.length > 0) {
    dbBackupSelect.selectedIndex = 0;
  }
  syncActiveBackupRow();
};

const syncActiveBackupRow = () => {
  if (!dbBackupsBody || !dbBackupSelect) return;
  const selected = dbBackupSelect.value;
  [...dbBackupsBody.querySelectorAll("tr")].forEach((tr) => {
    const fileCell = tr.querySelector("td");
    const fileName = fileCell?.textContent?.trim() || "";
    tr.classList.toggle("active-backup-row", Boolean(selected) && fileName === selected);
  });
};

const loadBackups = async (options = {}) => {
  const { silent = false } = options;
  try {
    const response = await apiFetch("/api/admin/backups");
    if (!response.ok) throw new Error("Backup list failed");
    const payload = await response.json();
    state.backups = Array.isArray(payload.backups) ? payload.backups : [];
    setDbAutoSummary(payload.auto_backup || {});
    renderBackups();
    if (!silent) {
      setDbToolsStatus(
        state.backups.length
          ? `${state.backups.length} backup(s) loaded`
          : "No backups found",
        state.backups.length ? "good" : "warn"
      );
    }
  } catch (error) {
    if (isUnauthorizedError(error)) return;
    state.backups = [];
    renderBackups();
    setDbToolsStatus("Failed to load backups", "warn");
  }
};

const setDbButtonsBusy = (busy) => {
  const disabled = Boolean(busy);
  state.dbToolsBusy = disabled;
  const hasBackups = (state.backups || []).length > 0;
  if (dbRefreshBackupsButton) dbRefreshBackupsButton.disabled = disabled;
  if (dbRestoreSelectedButton) dbRestoreSelectedButton.disabled = disabled || !hasBackups;
  if (dbCheckUpdatesButton) dbCheckUpdatesButton.disabled = disabled;
  if (dbApplyUpdatesButton) dbApplyUpdatesButton.disabled = disabled || !state.updatesAvailable;
  if (dbBackupSelect) dbBackupSelect.disabled = disabled || !hasBackups;
  if (dbBackupsBody) {
    [...dbBackupsBody.querySelectorAll('button[data-action="delete-backup"]')].forEach((button) => {
      button.disabled = disabled || !hasBackups;
    });
  }
};

const restoreBackup = async () => {
  const fileName = dbBackupSelect?.value?.trim() || "";
  if (!fileName) {
    setDbToolsStatus("Select a backup file first", "warn");
    return;
  }
  const proceed = confirm(
    `Restore database from "${fileName}"?\n\nCurrent data will be replaced.`
  );
  if (!proceed) return;

  setDbButtonsBusy(true);
  setDbToolsStatus(`Restoring ${fileName}...`, "warn");
  try {
    const response = await apiFetch("/api/admin/backups/restore", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ filename: fileName }),
    });
    if (!response.ok) {
      const msg = await getErrorMessage(response, "Restore failed");
      throw new Error(msg);
    }
    await response.json();
    await refreshLists();
    startNewForm({ keepValues: false });
    setDbToolsStatus(`Restore completed: ${fileName}`, "good");
    setSaveStatus("Database restored successfully", "good");
  } catch (error) {
    if (isUnauthorizedError(error)) return;
    setDbToolsStatus(error.message || "Restore failed", "warn");
    setSaveStatus("Restore failed", "warn");
  } finally {
    setDbButtonsBusy(false);
  }
};

const deleteBackup = async (fileName) => {
  const safeFileName = (fileName || "").trim();
  if (!safeFileName) {
    setDbToolsStatus("Backup file is required", "warn");
    return;
  }
  const proceed = confirm(`Delete backup file "${safeFileName}" permanently?`);
  if (!proceed) return;

  setDbButtonsBusy(true);
  setDbToolsStatus(`Deleting ${safeFileName}...`, "warn");
  try {
    const response = await apiFetch(`/api/admin/backups/${encodeURIComponent(safeFileName)}`, {
      method: "DELETE",
    });
    if (!response.ok) {
      const msg = await getErrorMessage(response, "Delete failed");
      throw new Error(msg);
    }
    await loadBackups({ silent: true });
    setDbToolsStatus(`Backup deleted: ${safeFileName}`, "good");
  } catch (error) {
    if (isUnauthorizedError(error)) return;
    setDbToolsStatus(error.message || "Delete failed", "warn");
  } finally {
    setDbButtonsBusy(false);
  }
};

const checkUpdates = async () => {
  setDbButtonsBusy(true);
  setDbUpdatesSummary("Checking updates...", "warn");
  try {
    const response = await apiFetch("/api/admin/updates/check");
    if (!response.ok) {
      const msg = await getErrorMessage(response, "Update check failed");
      throw new Error(msg);
    }
    const payload = await response.json();
    if (!payload.outdated_count) {
      state.updatesAvailable = false;
      setDbUpdatesSummary("No updates available.", "good");
      return;
    }
    const names = (payload.outdated || [])
      .slice(0, 3)
      .map((row) => `${row.name} ${row.version}->${row.latest_version}`)
      .join(", ");
    const more = payload.outdated_count > 3 ? ` (+${payload.outdated_count - 3} more)` : "";
    state.updatesAvailable = true;
    setDbUpdatesSummary(
      `${payload.outdated_count} update(s) available. ${names}${more}`,
      "warn"
    );
  } catch (error) {
    if (isUnauthorizedError(error)) return;
    state.updatesAvailable = false;
    setDbUpdatesSummary(error.message || "Could not check updates", "warn");
  } finally {
    setDbButtonsBusy(false);
  }
};

const applyUpdates = async () => {
  const proceed = confirm("Apply available updates now?\n\nThe app may need restart after update.");
  if (!proceed) return;

  setDbButtonsBusy(true);
  setDbUpdatesSummary("Installing updates...", "warn");
  try {
    const response = await apiFetch("/api/admin/updates/apply", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        upgrade_pip: true,
        upgrade_requirements: true,
      }),
    });
    if (!response.ok) {
      const msg = await getErrorMessage(response, "Package update failed");
      throw new Error(msg);
    }
    const payload = await response.json();
    const remainingCount = Number(payload?.remaining_count) || 0;
    state.updatesAvailable = remainingCount > 0;
    if (remainingCount > 0) {
      setDbUpdatesSummary(`${remainingCount} update(s) still pending. Run check again.`, "warn");
    } else {
      setDbUpdatesSummary("Updates installed. Refreshing page in 10 seconds...", "good");
      schedulePageReload(10000);
    }
  } catch (error) {
    if (isUnauthorizedError(error)) return;
    const message = error?.message || "Package update failed";
    if (message === "Failed to fetch") {
      state.updatesAvailable = false;
      setDbUpdatesSummary(
        "Server restarted. Refreshing page in 12 seconds...",
        "warn"
      );
      schedulePageReload(12000);
    } else {
      setDbUpdatesSummary(message || "Update failed", "warn");
    }
  } finally {
    setDbButtonsBusy(false);
  }
};

const openDbToolsModal = async () => {
  if (!dbToolsModal) return;
  dbToolsModal.classList.add("show");
  dbToolsModal.setAttribute("aria-hidden", "false");
  document.documentElement.classList.add("db-tools-open");
  document.body.classList.add("db-tools-open");
  state.updatesAvailable = false;
  setDbUpdatesSummary("Check updates to enable install.", "warn");
  setDbButtonsBusy(false);
  await loadBackups();
};

const closeDbToolsModal = () => {
  if (!dbToolsModal) return;
  dbToolsModal.classList.remove("show");
  dbToolsModal.setAttribute("aria-hidden", "true");
  document.documentElement.classList.remove("db-tools-open");
  document.body.classList.remove("db-tools-open");
};

const openReportStyleModal = () => {
  if (!reportStyleModal) return;
  syncReportStyleControls();
  if (reportStyleLogoFileInput) {
    reportStyleLogoFileInput.value = "";
  }
  reportStyleModal.classList.add("show");
  reportStyleModal.setAttribute("aria-hidden", "false");
  document.documentElement.classList.add("report-style-open");
  document.body.classList.add("report-style-open");
};

const closeReportStyleModal = () => {
  if (!reportStyleModal) return;
  reportStyleModal.classList.remove("show");
  reportStyleModal.setAttribute("aria-hidden", "true");
  document.documentElement.classList.remove("report-style-open");
  document.body.classList.remove("report-style-open");
};

const getFormFields = () => {
  const fields = {};
  fieldIds.forEach((id) => {
    const input = document.getElementById(id);
    fields[id] = input ? input.value.trim() : "";
  });
  return fields;
};

const hasChangesBeyondFormNo = () => {
  const fields = getFormFields();
  const baseline = state.initialState || {};
  const hasFieldChanges = Object.entries(fields).some(([key, value]) => {
    if (key === "formNo") return false;
    const baseValue = baseline[key] ?? "";
    return value !== baseValue;
  });
  const hasItems = getItems().length > 0;
  const hasSignatures = signatureKeys.some((key) => state.signatures[key]);
  return hasFieldChanges || hasItems || hasSignatures;
};

const buildPayload = () => ({
  id: state.currentId,
  fields: getFormFields(),
  items: getItems(),
  signatures: state.signatures,
  reportStyle: state.reportStyle,
});

const applyPayload = (payload) => {
  const fields = payload.fields || {};
  const items = payload.items || [];
  const signatures = payload.signatures || {};
  const reportStyle = payload.reportStyle || reportStyleDefaults;
  state.currentId = payload.id || null;
  state.currentUpdatedAt = String(payload.updated_at || "");
  if (!state.currentUpdatedAt && state.currentId) {
    const currentRow = state.savedList.find((row) => Number(row.id) === Number(state.currentId));
    state.currentUpdatedAt = String(currentRow?.updated_at || "");
  }
  state.loadedFormNo = fields.formNo || "";
  applyState({
    ...state.initialState,
    ...fields,
  });
  if (!fields.date) {
    setDefaultDate();
  }
  setItems(items);
  applySignatures(signatures);
  applyReportStyle(reportStyle, { syncControls: true, markDirtyNow: false });
  updatePreviewFromInputs();
  updateExportState();
  if (state.currentId) {
    markClean(`Loaded #${state.currentId}`);
  } else {
    setSaveStatus("New draft", "warn");
  }
};

const setDefaultDate = () => {
  const today = new Date();
  const iso = today.toISOString().split("T")[0];
  dateInput.value = iso;
  updateDate();
};

const startNewForm = (options = {}) => {
  const { keepValues = false } = options;
  state.currentId = null;
  state.currentUpdatedAt = "";
  state.loadedFormNo = "";

  if (!keepValues) {
    applyState(state.initialState);
    clearRows();
    applySignatures(state.initialSignatures);
  }

  const formNoInput = document.getElementById("formNo");
  if (formNoInput) {
    formNoInput.value = "";
  }

  updatePreviewFromInputs();
  updateExportState();
  state.isDirty = keepValues;
  setSaveStatus(
    keepValues ? "New form - enter Form No" : "New draft",
    "warn"
  );

  if (formNoInput) {
    formNoInput.focus();
  }
};

const savePO = async (options = {}) => {
  const check = validateAll({ force: !options.autosave });
  if (!check.valid) {
    const baseMessage = check.message || "Fix highlighted fields";
    setSaveStatus(
      options.autosave
        ? `Auto-save paused: ${baseMessage}`
        : baseMessage,
      "warn"
    );
    return;
  }
  const payload = buildPayload();
  const wasNewRecord = !payload.id;
  const formNo = payload.fields.formNo?.trim() || "";
  if (state.currentId && state.loadedFormNo && formNo && formNo !== state.loadedFormNo) {
    payload.id = null;
    state.currentId = null;
    setSaveStatus("Form No changed — saving as new", "warn");
  }
  try {
    if (options.autosave) {
      setSaveStatus("Saving...", "warn");
    }
    const response = await apiFetch("/api/po", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    if (response.status === 409) {
      const err = await response.json();
      setSaveStatus(`Form No exists (#${err.existing_id})`, "warn");
      return;
    }
    if (!response.ok) throw new Error("Save failed");
    const result = await response.json();
    state.currentId = result.id;
    state.currentUpdatedAt = String(result.updated_at || result.saved_at || "");
    state.loadedFormNo = formNo;
    markClean(
      options.autosave
        ? `Auto-saved #${state.currentId}`
        : wasNewRecord
          ? `Record added successfully (#${state.currentId})`
          : `Record updated successfully (#${state.currentId})`
    );
    await refreshLists();
  } catch (error) {
    if (isUnauthorizedError(error)) return;
    setSaveStatus("Save failed", "warn");
  }
};

const parseSyncTimestamp = (value) => {
  const time = new Date(value || "").getTime();
  return Number.isFinite(time) ? time : 0;
};

const normalizeSyncSnapshot = (payload = {}) => ({
  saved_count: Math.max(0, Number(payload.saved_count) || 0),
  trash_count: Math.max(0, Number(payload.trash_count) || 0),
  latest_saved_at: String(payload.latest_saved_at || ""),
  latest_trash_at: String(payload.latest_trash_at || ""),
});

const buildSyncSnapshotFromLists = () => {
  let latestSavedAt = "";
  let latestSavedTs = 0;
  (state.savedList || []).forEach((row) => {
    const candidate = String(row?.updated_at || "");
    const candidateTs = parseSyncTimestamp(candidate);
    if (candidateTs > latestSavedTs) {
      latestSavedTs = candidateTs;
      latestSavedAt = candidate;
    }
  });

  let latestTrashAt = "";
  let latestTrashTs = 0;
  (state.trashList || []).forEach((row) => {
    const candidate = String(row?.deleted_at || "");
    const candidateTs = parseSyncTimestamp(candidate);
    if (candidateTs > latestTrashTs) {
      latestTrashTs = candidateTs;
      latestTrashAt = candidate;
    }
  });

  return normalizeSyncSnapshot({
    saved_count: (state.savedList || []).length,
    trash_count: (state.trashList || []).length,
    latest_saved_at: latestSavedAt,
    latest_trash_at: latestTrashAt,
  });
};

const syncSnapshotsEqual = (left, right) => {
  if (!left || !right) return false;
  return (
    Number(left.saved_count || 0) === Number(right.saved_count || 0) &&
    Number(left.trash_count || 0) === Number(right.trash_count || 0) &&
    parseSyncTimestamp(left.latest_saved_at) === parseSyncTimestamp(right.latest_saved_at) &&
    parseSyncTimestamp(left.latest_trash_at) === parseSyncTimestamp(right.latest_trash_at)
  );
};

const fetchRemoteSyncSnapshot = async () => {
  const response = await apiFetch("/api/sync/status", { cache: "no-store" });
  if (!response.ok) throw new Error("Sync status failed");
  return normalizeSyncSnapshot(await response.json());
};

const getSavedPoRowById = (id) => {
  const targetId = Number(id);
  if (!Number.isFinite(targetId)) return null;
  return state.savedList.find((row) => Number(row.id) === targetId) || null;
};

const getCurrentSavedPoUpdatedAt = () => {
  if (!state.currentId) return "";
  return String(getSavedPoRowById(state.currentId)?.updated_at || "");
};

const loadSavedList = async () => {
  try {
    const response = await apiFetch("/api/po");
    if (!response.ok) throw new Error("List failed");
    state.savedList = await response.json();
    if (state.currentId && !state.currentUpdatedAt) {
      state.currentUpdatedAt = getCurrentSavedPoUpdatedAt();
    }
    renderSavedList();
    validateField(document.getElementById("formNo"));
    updateExportState();
  } catch (error) {
    if (isUnauthorizedError(error)) return;
    state.savedList = [];
    renderSavedList();
  }
};

const loadTrashList = async () => {
  if (!trashBody) return;
  try {
    const response = await apiFetch("/api/po/trash");
    if (!response.ok) throw new Error("Trash list failed");
    state.trashList = await response.json();
    renderTrashList();
  } catch (error) {
    if (isUnauthorizedError(error)) return;
    state.trashList = [];
    renderTrashList();
  }
};

const refreshLists = async (options = {}) => {
  const { updateSyncSnapshot = true } = options;
  await Promise.all([loadSavedList(), loadTrashList()]);
  if (updateSyncSnapshot) {
    dataSyncSnapshot = buildSyncSnapshotFromLists();
  }
};

const stopDataSyncPolling = () => {
  if (dataSyncPollTimer) {
    clearInterval(dataSyncPollTimer);
    dataSyncPollTimer = null;
  }
  dataSyncBusy = false;
  dataSyncSnapshot = null;
};

const runDataSyncPollingTick = async () => {
  if (!state.isAuthenticated || dataSyncBusy) return;
  dataSyncBusy = true;
  try {
    const remoteSnapshot = await fetchRemoteSyncSnapshot();
    if (!dataSyncSnapshot) {
      dataSyncSnapshot = buildSyncSnapshotFromLists();
    }
    if (syncSnapshotsEqual(remoteSnapshot, dataSyncSnapshot)) {
      return;
    }

    const currentId = Number(state.currentId) || 0;
    const previousUpdatedAt = currentId
      ? String(getCurrentSavedPoUpdatedAt() || state.currentUpdatedAt || "")
      : "";
    await refreshLists({ updateSyncSnapshot: true });

    if (currentId) {
      const currentRow = getSavedPoRowById(currentId);
      if (!currentRow) {
        if (!state.isDirty) {
          startNewForm({ keepValues: false });
        }
        setSaveStatus("Current PO was deleted in another session", "warn", {
          resetAfterMs: 2600,
        });
      } else {
        const latestUpdatedAt = String(currentRow.updated_at || "");
        if (
          latestUpdatedAt &&
          previousUpdatedAt &&
          latestUpdatedAt !== previousUpdatedAt
        ) {
          if (!state.isDirty) {
            await loadPO(currentId, { silentStatus: true });
            setSaveStatus("Current PO synced from another session", "good", {
              resetAfterMs: 2200,
            });
          } else {
            setSaveStatus(
              "Current PO changed in another session. Save or reopen to sync.",
              "warn",
              { resetAfterMs: 3200 }
            );
          }
        }
        state.currentUpdatedAt = latestUpdatedAt || state.currentUpdatedAt;
      }
    }
    dataSyncSnapshot = buildSyncSnapshotFromLists();
  } catch (error) {
    if (!isUnauthorizedError(error)) {
      // Ignore transient sync errors; the next tick will retry.
    }
  } finally {
    dataSyncBusy = false;
  }
};

const startDataSyncPolling = () => {
  stopDataSyncPolling();
  if (!state.isAuthenticated) return;
  dataSyncSnapshot = buildSyncSnapshotFromLists();
  void runDataSyncPollingTick();
  dataSyncPollTimer = setInterval(() => {
    void runDataSyncPollingTick();
  }, DATA_SYNC_POLL_INTERVAL_MS);
};

const renderSavedList = () => {
  const query = searchInput.value.trim().toLowerCase();
  const rows = state.savedList.filter((row) => {
    const haystack = [
      row.form_no,
      row.to_name,
      row.company_name,
      row.po_date,
    ]
      .join(" ")
      .toLowerCase();
    return haystack.includes(query);
  });

  savedBody.innerHTML = "";
  if (savedTableWrap) {
    savedTableWrap.classList.toggle("saved-scroll", rows.length > 4);
  }
  if (rows.length === 0) {
    const emptyRow = document.createElement("tr");
    emptyRow.innerHTML = `<td colspan="8" class="empty-row">No saved POs yet</td>`;
    savedBody.appendChild(emptyRow);
    return;
  }

  rows.forEach((row) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td data-label="ID"><span class="badge">#${row.id}</span></td>
      <td data-label="Form No">
        <button class="link-button has-icon" data-action="open" data-id="${row.id}">
          <span class="btn-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" role="img" focusable="false">
              <path d="M4 7h6l2 2h8v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z"></path>
            </svg>
          </span>
          <span class="btn-label">${row.form_no || ""}</span>
        </button>
      </td>
      <td data-label="To">${row.to_name || ""}</td>
      <td data-label="Date">${formatShortDate(row.po_date) || ""}</td>
      <td data-label="Company">${row.company_name || ""}</td>
      <td data-label="Items">${row.items_count ?? 0}</td>
      <td data-label="Updated">${formatUpdated(row.updated_at) || ""}</td>
      <td data-label="Actions">
        <div class="saved-actions-buttons">
          <button class="link-button has-icon" data-action="open" data-id="${row.id}">
            <span class="btn-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" role="img" focusable="false">
                <path d="M4 7h6l2 2h8v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z"></path>
              </svg>
            </span>
            <span class="btn-label">Open</span>
          </button>
          <button class="link-button has-icon" data-action="export" data-id="${row.id}" data-formno="${row.form_no || ""}">
            <span class="btn-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" role="img" focusable="false">
                <path d="M12 3v10"></path>
                <path d="M8 9l4 4 4-4"></path>
                <path d="M4 16v3h16v-3"></path>
              </svg>
            </span>
            <span class="btn-label">Export</span>
          </button>
          <button class="link-button danger has-icon" data-action="delete" data-id="${row.id}">
            <span class="btn-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" role="img" focusable="false">
                <path d="M3 6h18"></path>
                <path d="M8 6V4h8v2"></path>
                <path d="M6 6l1 14h10l1-14"></path>
              </svg>
            </span>
            <span class="btn-label">Delete</span>
          </button>
        </div>
      </td>
    `;
    savedBody.appendChild(tr);
  });
};

const renderTrashList = () => {
  if (!trashBody) return;
  const rows = state.trashList || [];
  trashBody.innerHTML = "";
  if (trashTableWrap) {
    trashTableWrap.classList.toggle("saved-scroll", rows.length > 6);
  }
  if (rows.length === 0) {
    const emptyRow = document.createElement("tr");
    emptyRow.innerHTML = `<td colspan="8" class="empty-row">Trash is empty</td>`;
    trashBody.appendChild(emptyRow);
    return;
  }

  rows.forEach((row) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td data-label="Trash ID"><span class="badge">#${row.id}</span></td>
      <td data-label="Form No">${row.form_no || ""}</td>
      <td data-label="To">${row.to_name || ""}</td>
      <td data-label="Date">${formatShortDate(row.po_date) || ""}</td>
      <td data-label="Company">${row.company_name || ""}</td>
      <td data-label="Items">${row.items_count ?? 0}</td>
      <td data-label="Deleted">${formatUpdated(row.deleted_at) || ""}</td>
      <td data-label="Actions">
        <div class="saved-actions-buttons">
          <button class="link-button has-icon" data-action="restore" data-id="${row.id}">
            <span class="btn-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" role="img" focusable="false">
                <path d="M4 12a8 8 0 1 0 3-6.2"></path>
                <path d="M4 4v5h5"></path>
              </svg>
            </span>
            <span class="btn-label">Restore</span>
          </button>
          <button class="link-button danger has-icon" data-action="purge" data-id="${row.id}">
            <span class="btn-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" role="img" focusable="false">
                <path d="M3 6h18"></path>
                <path d="M8 6V4h8v2"></path>
                <path d="M6 6l1 14h10l1-14"></path>
                <path d="M9 10l6 6"></path>
                <path d="M15 10l-6 6"></path>
              </svg>
            </span>
            <span class="btn-label">Delete Permanently</span>
          </button>
        </div>
      </td>
    `;
    trashBody.appendChild(tr);
  });
};

const loadPO = async (id, options = {}) => {
  const { silentStatus = false } = options;
  try {
    const response = await apiFetch(`/api/po/${id}`);
    if (!response.ok) throw new Error("Load failed");
    const payload = await response.json();
    applyPayload(payload);
  } catch (error) {
    if (isUnauthorizedError(error)) return;
    if (!silentStatus) {
      setSaveStatus("Load failed", "warn");
    }
  }
};

const openPO = async (id) => {
  if (state.currentId === id) {
    openEditorModal();
    return;
  }
  if (state.isDirty) {
    const proceed = confirm("You have unsaved changes. Open anyway?");
    if (!proceed) return;
  }
  await loadPO(id);
  openEditorModal();
};

const deletePO = async (id) => {
  try {
    const response = await apiFetch(`/api/po/${id}`, { method: "DELETE" });
    if (!response.ok) throw new Error("Delete failed");
    const result = await response.json();
    await refreshLists();
    if (state.currentId === id) {
      startNewForm({ keepValues: false });
      setSaveStatus(`Moved to trash (#${result.trashed_id})`, "warn");
      return;
    }
    setSaveStatus(`Moved to trash (#${result.trashed_id})`, "good");
  } catch (error) {
    if (isUnauthorizedError(error)) return;
    setSaveStatus("Delete failed", "warn");
  }
};

const restorePO = async (trashId) => {
  try {
    const response = await apiFetch(`/api/po/trash/${trashId}/restore`, {
      method: "POST",
    });
    if (response.status === 409) {
      const err = await response.json();
      setSaveStatus(`Restore blocked: Form No exists (#${err.existing_id})`, "warn");
      return;
    }
    if (!response.ok) throw new Error("Restore failed");
    const result = await response.json();
    await refreshLists();
    setSaveStatus(`Restored as #${result.id}`, "good");
  } catch (error) {
    if (isUnauthorizedError(error)) return;
    setSaveStatus("Restore failed", "warn");
  }
};

const purgePO = async (trashId) => {
  try {
    const response = await apiFetch(`/api/po/trash/${trashId}`, { method: "DELETE" });
    if (!response.ok) throw new Error("Purge failed");
    await refreshLists();
    setSaveStatus("Deleted permanently", "warn");
  } catch (error) {
    if (isUnauthorizedError(error)) return;
    setSaveStatus("Permanent delete failed", "warn");
  }
};

itemsBody.addEventListener("input", (event) => {
  if (event.target?.tagName === "INPUT") {
    setTouched(event.target);
  }
  updateItemsPreview();
  validateItems();
  updateExportState();
  markDirty();
});

itemsBody.addEventListener("click", (event) => {
  const button = event.target.closest(".remove-row");
  if (!button) return;
  const row = button.closest("tr");
  const rowValues = [...row.querySelectorAll("input")].map((input) =>
    input.value.trim()
  );
  const isEmptyRow = rowValues.every((value) => !value);
  if (!isEmptyRow) {
    const proceed = confirm("Delete this row?");
    if (!proceed) return;
  }
  row.remove();
  if (!itemsBody.querySelector("tr")) {
    addRow();
  } else {
    updateRowNumbers();
    updateItemsPreview();
  }
  validateItems();
  updateExportState();
  markDirty();
});

addRowButton.addEventListener("click", () => {
  addRow({}, { focus: true });
  validateItems();
  updateExportState();
  markDirty();
});

clearRowsButton.addEventListener("click", () => {
  if (clearRowsButton.disabled) return;
  const proceed = confirm("Clear all items?");
  if (!proceed) return;
  clearRows();
  validateItems({ force: false });
  updateExportState();
  markDirty();
});

const exportPDF = async () => {
  const payload = buildPayload();
  if (!payload.items || payload.items.length === 0) {
    setSaveStatus("Purchasing Order is empty. Add at least one item.", "warn");
    updateExportState();
    return;
  }
  const check = validateAll({ force: true });
  if (!check.valid) {
    setSaveStatus(check.message || "Fix highlighted fields", "warn");
    return;
  }
  try {
    const response = await apiFetch("/api/po/export", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      throw new Error("Export failed");
    }
    const blob = await response.blob();
    const formNo = payload.fields.formNo?.trim();
    const fileName = formNo
      ? `PO_${formNo}.pdf`
      : `PO_${new Date().toISOString().slice(0, 10)}.pdf`;
    openPdfPreview(blob, fileName);
    setSaveStatus("Preview ready", "good");
  } catch (error) {
    if (isUnauthorizedError(error)) return;
    setSaveStatus("Export failed", "warn");
  }
};

exportButton.addEventListener("click", exportPDF);

const exportPOById = async (id, formNo) => {
  try {
    const response = await apiFetch(`/api/po/${id}/export`);
    if (!response.ok) throw new Error("Export failed");
    const blob = await response.blob();
    const safeFormNo = formNo?.trim();
    const fileName = safeFormNo ? `PO_${safeFormNo}.pdf` : `PO_${id}.pdf`;
    openPdfPreview(blob, fileName);
    setSaveStatus("Preview ready", "good");
  } catch (error) {
    if (isUnauthorizedError(error)) return;
    setSaveStatus("Export failed", "warn");
  }
};

resetButton.addEventListener("click", () => {
  if (state.isDirty) {
    const proceed = confirm("Start a new form? Unsaved changes will be lost.");
    if (!proceed) return;
  }
  startNewForm({ keepValues: false });
});

if (saveAsNewButton) {
  saveAsNewButton.addEventListener("click", () => {
    startNewForm({ keepValues: true });
  });
}

saveButton.addEventListener("click", savePO);

form.addEventListener("input", (event) => {
  const input = event.target;
  if (!["INPUT", "SELECT"].includes(input.tagName)) return;
  setTouched(input);
  validateField(input);
  updateExportState();
  if (input.id === "date") {
    updateDate();
  } else if (input.id) {
    setText(input.id, input.value.trim());
  }
  if (input.id === "formNo" && state.currentId && input.value.trim() !== state.loadedFormNo) {
    setSaveStatus("Form No changed — will create new", "warn");
  }
  markDirty();
});

form.addEventListener("change", (event) => {
  const input = event.target;
  if (input.tagName !== "SELECT") return;
  setTouched(input);
  validateField(input);
  updateExportState();
  if (input.id) {
    setText(input.id, input.value.trim());
  }
  markDirty();
});

const setupSignaturePad = (key) => {
  const canvas = document.getElementById(`sig-${key}`);
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  let drawing = false;

  const resizeCanvas = () => {
    const rect = canvas.getBoundingClientRect();
    const ratio = window.devicePixelRatio || 1;
    canvas.width = rect.width * ratio;
    canvas.height = rect.height * ratio;
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#2b2b2b";
    ctx.clearRect(0, 0, rect.width, rect.height);
    if (state.signatures[key]) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, rect.width, rect.height);
      };
      img.src = state.signatures[key];
    }
  };

  const getPoint = (event) => {
    const rect = canvas.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
  };

  const startDrawing = (event) => {
    event.preventDefault();
    drawing = true;
    const point = getPoint(event);
    ctx.beginPath();
    ctx.moveTo(point.x, point.y);
  };

  const draw = (event) => {
    if (!drawing) return;
    const point = getPoint(event);
    ctx.lineTo(point.x, point.y);
    ctx.stroke();
  };

  const endDrawing = () => {
    if (!drawing) return;
    drawing = false;
    ctx.closePath();
    const rect = canvas.getBoundingClientRect();
    const temp = document.createElement("canvas");
    temp.width = rect.width;
    temp.height = rect.height;
    const tctx = temp.getContext("2d");
    tctx.drawImage(canvas, 0, 0, rect.width, rect.height);
    state.signatures[key] = temp.toDataURL("image/png");
    markDirty();
  };

  canvas.addEventListener("pointerdown", startDrawing);
  canvas.addEventListener("pointermove", draw);
  canvas.addEventListener("pointerup", endDrawing);
  canvas.addEventListener("pointerleave", endDrawing);
  window.addEventListener("resize", resizeCanvas);

  resizeCanvas();
};

savedBody.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-action]");
  if (!button) return;
  const id = Number(button.dataset.id);
  const action = button.dataset.action;
  if (action === "open") {
    openPO(id);
  }
  if (action === "export") {
    exportPOById(id, button.dataset.formno);
  }
  if (action === "delete") {
    const proceed = confirm(`Move PO #${id} to trash?`);
    if (!proceed) return;
    deletePO(id);
  }
});

if (trashBody) {
  trashBody.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-action]");
    if (!button) return;
    const id = Number(button.dataset.id);
    const action = button.dataset.action;
    if (action === "restore") {
      const proceed = confirm(`Restore trash record #${id}?`);
      if (!proceed) return;
      restorePO(id);
    }
    if (action === "purge") {
      const proceed = confirm(`Delete trash record #${id} permanently?`);
      if (!proceed) return;
      purgePO(id);
    }
  });
}

searchInput.addEventListener("input", renderSavedList);

syncDefaultsFromPreview();
setDefaultDate();
addRow();
const storedReportStyleRaw = localStorage.getItem("po-report-style-default");
let storedReportStyle = null;
if (storedReportStyleRaw) {
  try {
    storedReportStyle = normalizeReportStyle(JSON.parse(storedReportStyleRaw));
  } catch (error) {
    storedReportStyle = null;
  }
}
applyReportStyle(storedReportStyle || reportStyleDefaults, {
  syncControls: true,
  markDirtyNow: false,
});
updatePreviewFromInputs();
updateExportState();
state.initialState = captureState();
signatureKeys.forEach((key) => {
  state.signatures[key] = "";
});
state.initialSignatures = { ...state.signatures };
signatureKeys.forEach((key) => setupSignaturePad(key));
signatureClearButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const proceed = confirm("Clear this signature?");
    if (!proceed) return;
    clearSignature(button.dataset.sig);
  });
});
if (editorCloseButton) {
  editorCloseButton.addEventListener("click", closeEditorModal);
}
editorBackdrop.addEventListener("click", closeEditorModal);
if (pdfCloseButton) {
  pdfCloseButton.addEventListener("click", closePdfPreview);
}
if (pdfModal) {
  pdfModal.addEventListener("click", (event) => {
    if (event.target === pdfModal) {
      closePdfPreview();
    }
  });
}
if (openTrashButton) {
  openTrashButton.addEventListener("click", openTrashModal);
}
if (trashCloseButton) {
  trashCloseButton.addEventListener("click", closeTrashModal);
}
if (trashModal) {
  trashModal.addEventListener("click", (event) => {
    if (event.target === trashModal) {
      closeTrashModal();
    }
  });
}
if (openDbToolsButton) {
  openDbToolsButton.addEventListener("click", openDbToolsModal);
}
if (dbToolsCloseButton) {
  dbToolsCloseButton.addEventListener("click", closeDbToolsModal);
}
if (dbToolsModal) {
  dbToolsModal.addEventListener("click", (event) => {
    if (event.target === dbToolsModal) {
      closeDbToolsModal();
    }
  });
}
if (loginApprovalApproveButton) {
  loginApprovalApproveButton.addEventListener("click", () => {
    closeLoginApprovalModal("approve");
  });
}
if (loginApprovalRejectButton) {
  loginApprovalRejectButton.addEventListener("click", () => {
    closeLoginApprovalModal("reject");
  });
}
if (loginApprovalCloseButton) {
  loginApprovalCloseButton.addEventListener("click", () => {
    closeLoginApprovalModal("later");
  });
}
if (loginApprovalModal) {
  loginApprovalModal.addEventListener("click", (event) => {
    if (event.target === loginApprovalModal) {
      closeLoginApprovalModal("later");
    }
  });
}
if (dbRefreshBackupsButton) {
  dbRefreshBackupsButton.addEventListener("click", () => {
    loadBackups();
  });
}
if (dbRestoreSelectedButton) {
  dbRestoreSelectedButton.addEventListener("click", restoreBackup);
}
if (dbBackupSelect) {
  dbBackupSelect.addEventListener("change", syncActiveBackupRow);
}
if (dbBackupsBody) {
  dbBackupsBody.addEventListener("click", (event) => {
    const button = event.target.closest('button[data-action="delete-backup"]');
    if (!button) return;
    const fileName = button.dataset.file || "";
    deleteBackup(fileName);
  });
}
if (dbCheckUpdatesButton) {
  dbCheckUpdatesButton.addEventListener("click", checkUpdates);
}
if (dbApplyUpdatesButton) {
  dbApplyUpdatesButton.addEventListener("click", applyUpdates);
}
if (reportStyleOpenButton) {
  reportStyleOpenButton.addEventListener("click", openReportStyleModal);
}
if (reportStyleCloseButton) {
  reportStyleCloseButton.addEventListener("click", closeReportStyleModal);
}
if (reportStyleSaveButton) {
  reportStyleSaveButton.addEventListener("click", () => {
    const nextStyle = getReportStyleFromControls();
    const changed = !reportStyleEquals(nextStyle, state.reportStyle);
    applyReportStyle(nextStyle, { syncControls: true, markDirtyNow: changed });
    closeReportStyleModal();
    setSaveStatus("Report style saved", "good", { resetAfterMs: 2200 });
  });
}
if (reportStyleSaveDefaultButton) {
  reportStyleSaveDefaultButton.addEventListener("click", () => {
    const nextStyle = getReportStyleFromControls();
    const changed = !reportStyleEquals(nextStyle, state.reportStyle);
    applyReportStyle(nextStyle, { syncControls: true, markDirtyNow: changed });
    try {
      localStorage.setItem("po-report-style-default", JSON.stringify(state.reportStyle));
      setSaveStatus("Default report style saved", "good", { resetAfterMs: 2400 });
    } catch (error) {
      setSaveStatus("Could not save default style (storage full)", "warn", {
        resetAfterMs: 2800,
      });
    }
  });
}
if (reportStyleResetButton) {
  reportStyleResetButton.addEventListener("click", () => {
    const changed = !reportStyleEquals(state.reportStyle, reportStyleDefaults);
    applyReportStyle(reportStyleDefaults, { syncControls: true, markDirtyNow: changed });
    if (reportStyleLogoFileInput) {
      reportStyleLogoFileInput.value = "";
    }
    if (changed) {
      setSaveStatus("Report style reset", "good", { resetAfterMs: 2200 });
    }
  });
}
[
  reportStyleDensityInput,
  reportStyleTableThemeInput,
  reportStyleTitleAlignInput,
  reportStyleFontScaleInput,
  reportStyleTitleTextInput,
  reportStyleNoteTextInput,
  reportStyleEmptyTextInput,
  reportStyleFormLabelInput,
  reportStyleDateLabelInput,
  reportStyleToLabelInput,
  reportStylePostalLabelInput,
  reportStyleShowSignaturesInput,
  reportStyleSignatureTitleInput,
  reportStyleSignLabelFormCreatorInput,
  reportStyleSignLabelProductionManagerInput,
  reportStyleSignLabelManagerInput,
  reportStyleHeadIndexInput,
  reportStyleHeadModelInput,
  reportStyleHeadItemInput,
  reportStyleHeadQtyInput,
  reportStyleHeadUnitInput,
  reportStyleHeadPlanInput,
  reportStyleShowRowNumberInput,
  reportStyleShowLogoInput,
  reportStyleLogoAlignInput,
  reportStyleLogoScaleInput,
  reportStylePaperColorInput,
  reportStyleTextColorInput,
  reportStyleHeaderBgColorInput,
  reportStyleHeaderTextColorInput,
  reportStyleBorderOuterColorInput,
  reportStyleBorderInnerColorInput,
  reportStyleRowOddColorInput,
  reportStyleRowEvenColorInput,
].forEach((input) => {
  if (!input) return;
  const isColorControl = [
    reportStylePaperColorInput,
    reportStyleTextColorInput,
    reportStyleHeaderBgColorInput,
    reportStyleHeaderTextColorInput,
    reportStyleBorderOuterColorInput,
    reportStyleBorderInnerColorInput,
    reportStyleRowOddColorInput,
    reportStyleRowEvenColorInput,
  ].includes(input);
  const applyFromControl = () => {
    const nextStyle = getReportStyleFromControls();
    if (isColorControl) {
      nextStyle.colorMode = "manual";
    }
    const changed = !reportStyleEquals(nextStyle, state.reportStyle);
    applyReportStyle(nextStyle, { syncControls: true, markDirtyNow: changed });
  };
  input.addEventListener("input", applyFromControl);
  input.addEventListener("change", applyFromControl);
});
if (reportStyleLogoFileInput) {
  reportStyleLogoFileInput.addEventListener("change", () => {
    const file = reportStyleLogoFileInput.files?.[0];
    if (!file) return;
    if (!file.type?.startsWith("image/")) {
      setSaveStatus("Logo must be an image file", "warn", { resetAfterMs: 2200 });
      reportStyleLogoFileInput.value = "";
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const nextStyle = {
        ...state.reportStyle,
        logoDataUrl: String(reader.result || ""),
        showLogo: true,
      };
      const changed = !reportStyleEquals(normalizeReportStyle(nextStyle), state.reportStyle);
      applyReportStyle(nextStyle, { syncControls: true, markDirtyNow: changed });
      setSaveStatus("Custom logo applied", "good", { resetAfterMs: 1600 });
    };
    reader.onerror = () => {
      setSaveStatus("Could not read logo file", "warn", { resetAfterMs: 2200 });
    };
    reader.readAsDataURL(file);
  });
}
if (reportStyleLogoClearButton) {
  reportStyleLogoClearButton.addEventListener("click", () => {
    if (reportStyleLogoFileInput) {
      reportStyleLogoFileInput.value = "";
    }
    const nextStyle = { ...state.reportStyle, logoDataUrl: "" };
    const changed = !reportStyleEquals(normalizeReportStyle(nextStyle), state.reportStyle);
    applyReportStyle(nextStyle, { syncControls: true, markDirtyNow: changed });
    setSaveStatus("Default logo restored", "good", { resetAfterMs: 1600 });
  });
}
if (reportStyleModal) {
  reportStyleModal.addEventListener("click", (event) => {
    if (event.target === reportStyleModal) {
      closeReportStyleModal();
    }
  });
}
if (pdfDownloadButton) {
  pdfDownloadButton.addEventListener("click", () => {
    if (!previewUrl) return;
    const link = document.createElement("a");
    link.href = previewUrl;
    link.download = previewFileName || "PO.pdf";
    document.body.appendChild(link);
    link.click();
    link.remove();
    setSaveStatus("PDF downloaded", "good");
  });
}
themeToggleButtons.forEach((button) => {
  button.addEventListener("click", toggleTheme);
});
if (logoutButton) {
  logoutButton.addEventListener("click", logoutAuth);
}
if (settingsToggleButton) {
  settingsToggleButton.addEventListener("click", (event) => {
    event.stopPropagation();
    toggleHeaderSettingsMenu();
  });
}
if (settingsMenu) {
  settingsMenu.addEventListener("click", (event) => {
    event.stopPropagation();
  });
}
if (settingsThemeToggleButton) {
  settingsThemeToggleButton.addEventListener("click", () => {
    closeHeaderSettingsMenu();
  });
}
if (settingsLoginRequestsButton) {
  settingsLoginRequestsButton.addEventListener("click", async () => {
    await openStoredLoginApprovalRequest();
  });
}
if (mobileLoginRequestsButton) {
  mobileLoginRequestsButton.addEventListener("click", async () => {
    await openStoredLoginApprovalRequest();
  });
}
if (settingsDbToolsButton) {
  settingsDbToolsButton.addEventListener("click", () => {
    closeHeaderSettingsMenu();
    openDbToolsModal();
  });
}
if (settingsLogoutButton) {
  settingsLogoutButton.addEventListener("click", async () => {
    closeHeaderSettingsMenu();
    await logoutAuth();
  });
}
document.addEventListener("click", (event) => {
  if (!headerSettings) return;
  if (headerSettings.contains(event.target)) return;
  closeHeaderSettingsMenu();
});
if (authRegisterButton) {
  authRegisterButton.addEventListener("click", registerPasskey);
}
if (authLoginButton) {
  authLoginButton.addEventListener("click", loginPasskey);
}
if (authCodeLoginButton) {
  authCodeLoginButton.addEventListener("click", loginWithAccessCode);
}
if (authCodeInput) {
  authCodeInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      void loginWithAccessCode();
    }
  });
}
if (authModePasskeyButton) {
  authModePasskeyButton.addEventListener("click", () => {
    const selected = setAuthMode("passkey", { focus: true });
    if (selected === "passkey") {
      setAuthStatus(
        state.hasPasskey ? "Authenticate to continue" : "Create your passkey to continue"
      );
    }
  });
}
if (authModeCodeButton) {
  authModeCodeButton.addEventListener("click", () => {
    const selected = setAuthMode("code", { focus: true });
    if (selected === "code") {
      setAuthStatus("Enter access code to continue");
    }
  });
}
if (mobileMenuToggle && appHeader) {
  mobileMenuToggle.setAttribute("aria-label", "Open menu");
  mobileMenuToggle.setAttribute("title", "Open menu");
  mobileMenuToggle.addEventListener("click", () => {
    closeHeaderSettingsMenu();
    const open = appHeader.classList.toggle("menu-open");
    mobileMenuToggle.setAttribute("aria-expanded", open ? "true" : "false");
    mobileMenuToggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    mobileMenuToggle.setAttribute("title", open ? "Close menu" : "Open menu");
  });
}
if (headerActions) {
  headerActions.addEventListener("click", (event) => {
    const button = event.target.closest("button");
    if (!button) return;
    if (
      settingsToggleButton &&
      settingsToggleButton.contains(button)
    ) {
      return;
    }
    closeHeaderSettingsMenu();
    if (window.innerWidth <= 900) {
      closeMobileMenu();
    }
  });
}

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    if (loginApprovalModal?.classList.contains("show")) {
      closeLoginApprovalModal("later");
      return;
    }
    if (pdfModal?.classList.contains("show")) {
      closePdfPreview();
    }
    if (trashModal?.classList.contains("show")) {
      closeTrashModal();
    }
    if (dbToolsModal?.classList.contains("show")) {
      closeDbToolsModal();
    }
    if (reportStyleModal?.classList.contains("show")) {
      closeReportStyleModal();
    }
    closeHeaderSettingsMenu();
  }
});
syncViewportVars();
window.addEventListener("resize", syncViewportVars);
window.addEventListener("resize", syncMobileMenuByViewport);
window.addEventListener("orientationchange", syncViewportVars);
initTheme();
syncMobileMenuByViewport();
initAuthGate();


