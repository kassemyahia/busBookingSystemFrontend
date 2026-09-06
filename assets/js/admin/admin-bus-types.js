(async () => {
  if (!(await staffLayout.init())) return;
  const base = "/api/employee/TypeBus";
  async function load() {
    admin.setLoading(true);
    try {
      const [a, d] = await Promise.all([
          admin.request(`${base}/all-bus-types`),
          admin.request(`${base}/all-deleted-bus-types`),
        ]),
        cols = [
          { label: "ID", keys: ["busTypeId", "BusTypeId"] },
          { label: "Name", keys: ["name", "Name", "type", "Type"] },
          { label: "Capacity", keys: ["capacity", "Capacity"] },
        ];
      admin.table(
        "tableRoot",
        a,
        cols,
        (o) =>
          `<button data-del="${admin.pick(o, "busTypeId", "BusTypeId", "id", "Id")}" class="text-red-700">Deactivate</button>`,
      );
      admin.table(
        "deletedRoot",
        d,
        cols,
        (o) =>
          `<button data-restore="${admin.pick(o, "busTypeId", "BusTypeId", "id", "Id")}" class="text-emerald-700">Restore</button>`,
      );
      document.querySelectorAll("[data-del]").forEach(
        (b) =>
          (b.onclick = () =>
            admin.confirmAction("Deactivate this bus type?", async () => {
              await admin.request(`${base}/delete-bus-type/${b.dataset.del}`, {
                method: "DELETE",
              });
              load();
            })),
      );
      document.querySelectorAll("[data-restore]").forEach(
        (b) =>
          (b.onclick = async () => {
            await admin.request(
              `${base}/restore-bus-type/${b.dataset.restore}`,
              { method: "PUT" },
            );
            load();
          }),
      );
    } catch (e) {
      admin.alert(e.message);
    } finally {
      admin.setLoading(false);
    }
  }
  document.getElementById("addButton").onclick = () =>
    admin.openModal(
      "Add bus type",
      admin.input("Name", "Name", "text", "", 'required maxlength="20"') +
        admin.input("Capacity", "Capacity", "number", "", 'required min="1"'),
      async (f) => {
        await admin.request(`${base}/add-bus-type`, {
          method: "POST",
          body: JSON.stringify({
            Name: f.get("Name"),
            Capacity: Number(f.get("Capacity")),
          }),
        });
        load();
      },
    );
  load();
})();
