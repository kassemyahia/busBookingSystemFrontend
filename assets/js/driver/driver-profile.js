(async () => {
  if (!(await driverLayout.init())) return;
  const loading = document.getElementById("profileLoading");
  try {
    const driver = await auth.driverMe();
    auth.updateStoredUser(driver);
    loading.classList.add("hidden");
    const fields = [
      ["Name", admin.pick(driver, "fullName", "FullName") || `${admin.pick(driver, "firstName", "FirstName")} ${admin.pick(driver, "lastName", "LastName")}`.trim()],
      ["Phone", admin.pick(driver, "phone", "Phone")], ["Driver ID", admin.pick(driver, "id", "Id")],
      ["License number", admin.pick(driver, "licenseNumber", "LicenseNumber")], ["Status", admin.pick(driver, "status", "Status")],
      ["Hire date", admin.fmt(admin.pick(driver, "hireDate", "HireDate"))],
    ].filter(([, value]) => value !== "" && value !== null && value !== undefined && value !== "—");
    document.getElementById("driverProfile").innerHTML = `<section class="max-w-3xl rounded-2xl border bg-white p-6 shadow-sm"><div class="grid gap-5 sm:grid-cols-2">${fields.map(([label, value]) => `<div><p class="text-xs font-semibold uppercase tracking-wide text-slate-500">${admin.esc(label)}</p><p class="mt-1 font-semibold">${admin.esc(value)}</p></div>`).join("")}</div></section>`;
  } catch (error) {
    loading.classList.add("hidden");
    if (error.status === 401) { auth.clearSession(); location.replace("../auth/driver-login.html"); return; }
    if (error.status === 403) { location.replace("./driver-dashboard.html"); return; }
    admin.alert(error.message);
  }
})();
