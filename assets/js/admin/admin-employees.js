(async () => {
  if (!(await staffLayout.init())) return;
  let statuses = [];
  let allEmployees = [];
  let employeeDirectoryComplete = false;
  const createdNationalNumbers = new Set();
  const employeeFields = [["id", "Id"], ["firstName", "FirstName"], ["lastName", "LastName"], ["phone", "Phone"], ["role", "Role"], ["status", "Status"], ["salary", "Salary"]];
  function phoneTaken(phone, currentId = "") {
    return allEmployees.some((employee) =>
      validation.normalizePhone(admin.pick(employee, "phone", "Phone")) === phone &&
      String(admin.pick(employee, "id", "Id")) !== String(currentId),
    );
  }
  function validateEmployeeForm(form, currentId = "", adding = false) {
    const checks = [
      [form.FirstName, validation.validName(form.FirstName.value), "Enter a valid first name."],
      [form.LastName, validation.validName(form.LastName.value), "Enter a valid last name."],
      [form.Phone, validation.validPhone(form.Phone.value), validation.PHONE_MESSAGE],
      [form.Salary, validation.validPositive(form.Salary.value), "Salary must be greater than zero."],
    ];
    if (validation.validPhone(form.Phone.value) && phoneTaken(validation.normalizePhone(form.Phone.value), currentId))
      checks[2][2] = "This phone number is already used by another employee.";
    if (validation.validPhone(form.Phone.value) && phoneTaken(validation.normalizePhone(form.Phone.value), currentId)) checks[2][1] = false;
    if (adding) {
      checks.push([form.Password, validation.validPassword(form.Password.value), validation.PASSWORD_MESSAGE]);
      const national = validation.normalizeNationalNumber(form.NationalNumber.value);
      checks.push([form.NationalNumber, validation.validNationalNumber(national) && !createdNationalNumbers.has(national), createdNationalNumbers.has(national) ? "This national number was already used during this session." : validation.NATIONAL_MESSAGE]);
    }
    checks.forEach(([input, valid, message]) => validation.setFieldState(input, valid ? "" : message));
    if (checks[2][1] && employeeDirectoryComplete) validation.setFieldState(form.Phone, "Available", "success");
    return checks.every(([, valid]) => valid);
  }
  function bindEmployeeValidation(currentId = "", adding = false) {
    const form = document.getElementById("modalForm");
    validation.bindDigits(form.Phone, 10);
    if (adding) validation.bindDigits(form.NationalNumber, 11);
    [form.FirstName, form.LastName, form.Phone, form.Salary, ...(adding ? [form.Password, form.NationalNumber] : [])]
      .forEach((input) => input.addEventListener("blur", () => validateEmployeeForm(form, currentId, adding)));
  }
  async function load() {
    admin.setLoading(true);
    try {
      const [office, drivers, s] = await admin.safeAll([
        admin.request("/api/admin/trips/get-all-employees"),
        admin.request("/api/admin/trips/drivers"),
        admin.request("/api/all-op-on-employee-table/status-list"),
      ]);
      employeeDirectoryComplete = Array.isArray(office) && Array.isArray(drivers);
      statuses = api.asArray(s);
      const all = [
        ...api.asArray(office),
        ...api.asArray(drivers).map((x) => ({ ...x, Role: "Driver" })),
      ];
      allEmployees = all.slice();
      const bindActions = () => {
        document.querySelectorAll("[data-edit]").forEach((b) => (b.onclick = () => edit(allEmployees.find((x) => String(admin.pick(x, "id", "Id")) === b.dataset.edit))));
        document.querySelectorAll("[data-status]").forEach((b) => (b.onclick = () => changeStatus(b.dataset.status)));
      };
      admin.searchableTable(
        "tableRoot",
        all,
        [
          { label: "ID", keys: ["id", "Id"] },
          {
            label: "Name",
            keys: ["firstName", "FirstName"],
            format: (v, o) => `${v} ${admin.pick(o, "lastName", "LastName")}`,
          },
          { label: "Phone", keys: ["phone", "Phone"] },
          { label: "Role", keys: ["role", "Role"] },
          { label: "Status", keys: ["status", "Status"] },
          { label: "Salary", keys: ["salary", "Salary"] },
        ],
        (o) =>
          `<button data-edit="${admin.pick(o, "id", "Id")}" class="mr-3 text-teal-700">Edit</button><button data-status="${admin.pick(o, "id", "Id")}" class="text-amber-700">Change status</button>`,
        { fields: employeeFields, placeholder: "Search employees by ID, name, phone, role or status…", onRender: bindActions },
      );
    } catch (e) {
      admin.alert(e.message);
    } finally {
      admin.setLoading(false);
    }
  }
  function add() {
    admin.openModal(
      "Add employee",
      admin.input("FirstName", "First name") +
        admin.input("LastName", "Last name") +
        admin.input(
          "Phone",
          "Phone",
          "tel",
          "",
          'required pattern="09[0-9]{8}"',
        ) +
        admin.input("Password", "Password", "password") +
        admin.input(
          "NationalNumber",
          "National number",
          "text",
          "",
          'required pattern="[0-9]{11}"',
        ) +
        admin.input(
          "Salary",
          "Salary",
          "number",
          "",
          'required min="0.01" step="0.01"',
        ) +
        admin.select("Role", "Role", [
          { value: 2, label: "Office Employee" },
          { value: 1, label: "Driver" },
        ]) +
        admin.input(
          "LicenseNumber",
          "License number (driver only)",
          "text",
          "",
          "",
        ),
      async (f) => {
        const form = document.getElementById("modalForm");
        if (!validateEmployeeForm(form, "", true)) throw new Error("Please correct the highlighted fields.");
        const body = Object.fromEntries(f);
        body.Phone = validation.normalizePhone(body.Phone);
        body.NationalNumber = validation.normalizeNationalNumber(body.NationalNumber);
        body.Salary = Number(body.Salary);
        body.Role = Number(body.Role);
        await admin.request("/api/all-op-on-employee-table/add", {
          method: "POST",
          body: JSON.stringify(body),
        });
        createdNationalNumbers.add(body.NationalNumber);
        await load();
      },
    );
    bindEmployeeValidation("", true);
  }
  function edit(o) {
    const id = admin.pick(o, "id", "Id");
    admin.openModal(
      "Edit employee",
      admin.input(
        "FirstName",
        "First name",
        "text",
        admin.pick(o, "firstName", "FirstName"),
      ) +
        admin.input(
          "LastName",
          "Last name",
          "text",
          admin.pick(o, "lastName", "LastName"),
        ) +
        admin.input(
          "Phone",
          "Phone",
          "tel",
          admin.pick(o, "phone", "Phone"),
          'required pattern="09[0-9]{8}"',
        ) +
        admin.input(
          "Salary",
          "Salary",
          "number",
          admin.pick(o, "salary", "Salary"),
          'required min="0.01" step="0.01"',
        ),
      async (f) => {
        const form = document.getElementById("modalForm");
        if (!validateEmployeeForm(form, id, false)) throw new Error("Please correct the highlighted fields.");
        const body = Object.fromEntries(f);
        body.Phone = validation.normalizePhone(body.Phone);
        body.Salary = Number(body.Salary);
        await admin.request(`/api/all-op-on-employee-table/update/${id}`, {
          method: "PATCH",
          body: JSON.stringify(body),
        });
        await load();
      },
    );
    bindEmployeeValidation(id, false);
  }
  function changeStatus(id) {
    admin.openModal(
      "Change employee status",
      admin.select(
        "status",
        "Status",
        statuses.map((s) => ({
          value: admin.pick(s, "name", "Name"),
          label: admin.pick(s, "name", "Name"),
        })),
      ),
      async (f) => {
        const status = f.get("status");
        if (!confirm(`Change employee status to ${status}?`)) return;
        await admin.request(
          `/api/all-op-on-employee-table/delete/${id}?status=${encodeURIComponent(status)}`,
          { method: "DELETE" },
        );
        await load();
      },
    );
  }
  document.getElementById("addButton").onclick = add;
  load();
})();
