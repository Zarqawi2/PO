const form = document.getElementById("demo-form");
const itemsBody = document.getElementById("items-body");
const previewItems = document.getElementById("preview-items");
const addRowButton = document.getElementById("add-row");
const fillSampleButton = document.getElementById("fill-sample");
const resetButton = document.getElementById("reset-form");

const fields = [
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

const previewBind = {
  to: "pv-to",
  formNo: "pv-formNo",
  date: "pv-date",
  companyName: "pv-companyName",
  companyLine1: "pv-companyLine1",
  companyLine2: "pv-companyLine2",
  companyLine3: "pv-companyLine3",
  postalCode: "pv-postalCode",
  formCreator: "pv-formCreator",
  productionManager: "pv-productionManager",
  manager: "pv-manager",
};

const state = {
  items: [],
};

const samplePayload = {
  to: "Client Alpha",
  formNo: "PO-2026-001",
  date: new Date().toISOString().slice(0, 10),
  companyName: "Example Trading Co.",
  companyLine1: "123 Demo Street",
  companyLine2: "Business District",
  companyLine3: "Metro City",
  postalCode: "10001",
  formCreator: "User One",
  productionManager: "User Two",
  manager: "User Three",
  items: [
    { model: "MD-001", item: "Demo Item A", qty: "12", unit: "pcs", plan: "PLAN-A1" },
    { model: "MD-002", item: "Demo Item B", qty: "20", unit: "pcs", plan: "PLAN-B2" },
  ],
};

const formatDate = (raw) => {
  if (!raw) return "-";
  const date = new Date(`${raw}T00:00:00`);
  if (Number.isNaN(date.getTime())) return raw;
  return date.toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
};

const valueOrDash = (value) => {
  const txt = String(value ?? "").trim();
  return txt || "-";
};

const updatePreview = () => {
  fields.forEach((id) => {
    const input = document.getElementById(id);
    const target = document.getElementById(previewBind[id]);
    if (!input || !target) return;
    if (id === "date") {
      target.textContent = formatDate(input.value);
    } else {
      target.textContent = valueOrDash(input.value);
    }
  });

  previewItems.innerHTML = "";
  if (state.items.length === 0) {
    const tr = document.createElement("tr");
    tr.innerHTML = '<td colspan="6">No items yet</td>';
    previewItems.appendChild(tr);
    return;
  }

  state.items.forEach((row, index) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${index + 1}</td>
      <td>${valueOrDash(row.model)}</td>
      <td>${valueOrDash(row.item)}</td>
      <td>${valueOrDash(row.qty)}</td>
      <td>${valueOrDash(row.unit)}</td>
      <td>${valueOrDash(row.plan)}</td>
    `;
    previewItems.appendChild(tr);
  });
};

const onItemInput = (event) => {
  const input = event.target;
  if (!(input instanceof HTMLInputElement)) return;
  const rowIndex = Number(input.dataset.index);
  const key = String(input.dataset.key || "");
  if (!Number.isFinite(rowIndex) || !state.items[rowIndex] || !key) return;
  state.items[rowIndex][key] = input.value;
  updatePreview();
};

const removeRow = (index) => {
  state.items.splice(index, 1);
  renderItems();
};

const renderItems = () => {
  itemsBody.innerHTML = "";
  state.items.forEach((row, index) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${index + 1}</td>
      <td><input data-index="${index}" data-key="model" value="${row.model || ""}" /></td>
      <td><input data-index="${index}" data-key="item" value="${row.item || ""}" /></td>
      <td><input data-index="${index}" data-key="qty" value="${row.qty || ""}" /></td>
      <td><input data-index="${index}" data-key="unit" value="${row.unit || ""}" /></td>
      <td><input data-index="${index}" data-key="plan" value="${row.plan || ""}" /></td>
      <td><button type="button" class="row-remove" data-remove="${index}">x</button></td>
    `;
    itemsBody.appendChild(tr);
  });

  if (state.items.length === 0) {
    addRow();
    return;
  }

  itemsBody.querySelectorAll("input").forEach((input) => {
    input.addEventListener("input", onItemInput);
  });

  itemsBody.querySelectorAll("button[data-remove]").forEach((button) => {
    button.addEventListener("click", () => {
      removeRow(Number(button.dataset.remove));
    });
  });

  updatePreview();
};

const addRow = (row = {}) => {
  state.items.push({
    model: row.model || "",
    item: row.item || "",
    qty: row.qty || "",
    unit: row.unit || "",
    plan: row.plan || "",
  });
  renderItems();
};

const fillSample = () => {
  fields.forEach((id) => {
    const input = document.getElementById(id);
    if (!input) return;
    input.value = samplePayload[id] || "";
  });
  state.items = samplePayload.items.map((item) => ({ ...item }));
  renderItems();
};

const resetDemo = () => {
  form.reset();
  state.items = [];
  addRow();
  updatePreview();
};

fields.forEach((id) => {
  const input = document.getElementById(id);
  if (!input) return;
  input.addEventListener("input", updatePreview);
  input.addEventListener("change", updatePreview);
});

addRowButton.addEventListener("click", () => addRow());
fillSampleButton.addEventListener("click", fillSample);
resetButton.addEventListener("click", resetDemo);

// Initialize a sensible default date and first preview.
const dateInput = document.getElementById("date");
if (dateInput && !dateInput.value) {
  dateInput.value = new Date().toISOString().slice(0, 10);
}
renderItems();
