(async () => {
  if (!(await staffLayout.init())) return;
  const loading = document.getElementById("profileLoading");
  const root = document.getElementById("employeeProfile");
  try {
    const employee = await auth.employeeMe();
    auth.updateStoredUser(employee);
    loading.classList.add("hidden");
    const fields = [
      ["Name", admin.pick(employee, "fullName", "FullName") || `${admin.pick(employee, "firstName", "FirstName")} ${admin.pick(employee, "lastName", "LastName")}`.trim()],
      ["Phone", admin.pick(employee, "phone", "Phone")],
      ["Role", admin.pick(employee, "role", "Role")],
      ["Status", admin.pick(employee, "status", "Status")],
      ["Employee ID", admin.pick(employee, "id", "Id")],
      ["Hire date", admin.fmt(admin.pick(employee, "hireDate", "HireDate"))],
      ["License number", admin.pick(employee, "licenseNumber", "LicenseNumber")],
    ].filter(([, value]) => value !== "" && value !== null && value !== undefined && value !== "—");
    root.innerHTML = `<section class="max-w-3xl rounded-2xl border bg-white p-6 shadow-sm"><div class="grid gap-5 sm:grid-cols-2">${fields.map(([label, value]) => `<div><p class="text-xs font-semibold uppercase tracking-wide text-slate-500">${admin.esc(label)}</p><p class="mt-1 font-semibold">${admin.esc(value)}</p></div>`).join("")}</div></section>`;
  } catch (error) {
    loading.classList.add("hidden");
    if (error.status === 401) {
      const role = auth.getRole();
      auth.clearSession();
      location.replace(auth.loginUrl("Employee", role));
      return;
    }
    if (error.status === 403) {
      location.replace("./admin-dashboard.html");
      return;
    }
    admin.alert(error.message);
  }
})();
