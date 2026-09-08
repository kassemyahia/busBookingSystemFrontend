(async () => {
  if (!(await staffLayout.init())) return;
  let types = [],
    statuses = [];
  async function load() {
    admin.setLoading(true);
    try {
      [types, statuses] = await admin.safeAll([
        admin.request("/api/employee/TypeBus/all-bus-types"),
        admin.request("/api/employee/buses/bus-statuses"),
      ]);
      const f = new FormData(document.getElementById("filters")),
        q = new URLSearchParams();
      if (f.get("status")) q.set("status", f.get("status"));
      if (f.get("busTypeId")) q.set("busTypeId", f.get("busTypeId"));
      const buses = await admin.request(
        `/api/employee/buses/${q.size ? `search-buses?${q}` : "all-buses"}`,
      );
      const bindMain = () => document.querySelectorAll("[data-edit]").forEach((b) => (b.onclick = () => change(b.dataset.edit)));
      admin.searchableTable(
        "tableRoot",
        buses,
        [
          { label: "ID", keys: ["busId", "BusId"] },
          { label: "Bus number", keys: ["busNumber", "BusNumber"] },
          { label: "Type", keys: ["type", "Type"] },
          { label: "Capacity", keys: ["capacity", "Capacity"] },
          { label: "Status", keys: ["status", "Status"] },
        ],
        (o) =>
          `<button data-edit="${admin.pick(o, "busId", "BusId")}" class="text-teal-700">Change status</button>`,
        { fields: [["busId", "BusId"], ["busNumber", "BusNumber"], ["type", "Type"], ["capacity", "Capacity"], ["status", "Status"]], placeholder: "Search buses by number, type, ID or status…", onRender: bindMain },
      );
      const now = new Date();
      const [most, least, road, monthly, deletionSuggestions] =
        await admin.safeAll([
          admin.request("/api/employee/buses/buses/most-used-in-trips"),
          admin.request("/api/employee/buses/buses/least-used-in-trips"),
          admin.request("/api/employee/buses/buses/on-roads"),
          admin.request(
            `/api/employee/buses/buses/most-active-month?month=${now.getMonth() + 1}&year=${now.getFullYear()}`,
          ),
          admin.request("/api/employee/buses/buses/suggest-deletion"),
        ]);
      document.getElementById("statsRoot").innerHTML =
        `<div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">${[
          ["Most used", api.asArray(most).length],
          ["Least used", api.asArray(least).length],
          ["On road", api.asArray(road).length],
          ["Active this month", api.asArray(monthly).length],
        ]
          .map(
            (x) =>
              `<div class="rounded-2xl border bg-white p-5"><p class="text-sm text-slate-500">${x[0]}</p><p class="text-2xl font-bold">${x[1]}</p></div>`,
          )
          .join("")}</div><section class="mt-6"><h2 class="mb-3 text-xl font-bold">Most active this month</h2><div id="monthlyActivityRoot"></div></section>`;
      const insightColumns = [
        { label: "Bus ID", keys: ["busId", "BusId"] },
        { label: "Bus number", keys: ["busNumber", "BusNumber"] },
        { label: "Capacity", keys: ["capacity", "Capacity"] },
        {
          label: "Trips",
          keys: ["usageCount", "UsageCount", "tripCount", "TripCount"],
        },
        { label: "Status", keys: ["status", "Status"] },
      ];
      admin.searchableTable("monthlyActivityRoot", api.asArray(monthly), insightColumns, null, { fields: insightColumns.map((c) => c.keys), placeholder: "Search monthly bus activity…" });
      admin.searchableTable(
        "suggestedDeletionRoot",
        api.asArray(deletionSuggestions),
        [
          ...insightColumns,
          { label: "Suggestion", keys: ["suggestion", "Suggestion"] },
        ],
        (bus) => {
          const id = admin.pick(bus, "busId", "BusId", "id", "Id");
          return id === ""
            ? ""
            : `<button data-suggested-bus="${admin.esc(id)}" class="text-teal-700">Change status</button>`;
        },
        { fields: insightColumns.map((c) => c.keys), placeholder: "Search deletion suggestions…", onRender: () => document.querySelectorAll("[data-suggested-bus]").forEach((button) => { button.onclick = () => change(button.dataset.suggestedBus); }) },
      );
    } catch (e) {
      admin.alert(e.message);
    } finally {
      admin.setLoading(false);
    }
  }
  document.getElementById("filters").innerHTML =
    admin.select(
      "status",
      "Status",
      [
        { value: "Active", label: "Active" },
        { value: "UnderMaintenance", label: "Under maintenance" },
        { value: "OutOfService", label: "Out of service" },
      ],
      "",
      true,
    ) +
    admin.select("busTypeId", "Bus type", [], "", true) +
    '<button class="rounded-xl bg-slate-950 px-4 py-2 text-white">Filter</button>';
  document.getElementById("filters").onsubmit = (e) => {
    e.preventDefault();
    load();
  };
  function change(id) {
    admin.openModal(
      "Change bus status",
      admin.select(
        "Status",
        "Status",
        api.asArray(statuses).map((s) => ({
          value: admin.pick(s, "id", "Id"),
          label: admin.pick(s, "name", "Name"),
        })),
      ),
      async (f) => {
        await admin.request(`/api/employee/buses/update-bus/${id}`, {
          method: "PUT",
          body: JSON.stringify({ Status: Number(f.get("Status")) }),
        });
        load();
      },
    );
  }
  document.getElementById("addButton").onclick = () =>
    admin.openModal(
      "Add bus",
      admin.input(
        "BusNumber",
        "Bus number",
        "text",
        "",
        'required pattern="[A-Za-z]{3}[0-9]{3}" placeholder="ABC123"',
      ) +
        admin.select(
          "BusTypeId",
          "Bus type",
          api.asArray(types).map((t) => ({
            value: admin.pick(t, "busTypeId", "BusTypeId"),
            label: `${admin.pick(t, "name", "Name")} (${admin.pick(t, "capacity", "Capacity")})`,
          })),
        ) +
        admin.select("Status", "Status", [
          { value: 1, label: "Active" },
          { value: 2, label: "Under maintenance" },
          { value: 3, label: "Out of service" },
        ]),
      async (f) => {
        await admin.request("/api/employee/buses/add-bus", {
          method: "POST",
          body: JSON.stringify({
            BusNumber: f.get("BusNumber"),
            BusTypeId: Number(f.get("BusTypeId")),
            Status: Number(f.get("Status")),
          }),
        });
        load();
      },
    );
  await load();
  document.querySelector('[name="busTypeId"]').innerHTML =
    '<option value="">All bus types</option>' +
    api
      .asArray(types)
      .map(
        (t) =>
          `<option value="${admin.pick(t, "busTypeId", "BusTypeId")}">${admin.pick(t, "name", "Name")}</option>`,
      )
      .join("");
})();
