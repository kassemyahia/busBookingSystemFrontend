(async () => {
  if (!(await staffLayout.init())) return;
  const base = "/api/employee/route-price";
  let cities = [],
    types = [];
  const cols = [
    { label: "ID", keys: ["routePriceId", "RoutePriceId"] },
    {
      label: "Route",
      keys: ["startCity", "StartCity", "startCityName", "StartCityName"],
      format: (v, o) =>
        `${v} → ${admin.pick(o, "endCity", "EndCity", "endCityName", "EndCityName")}`,
    },
    { label: "Bus type", keys: ["busTypeName", "BusTypeName"] },
    { label: "Price", keys: ["price", "Price"] },
    {
      label: "Duration",
      keys: ["durationHours", "DurationHours"],
      format: (v) => `${v} h`,
    },
    {
      label: "Distance",
      keys: ["distanceKm", "DistanceKm"],
      format: (v) => `${v} km`,
    },
  ];
  async function load() {
    admin.setLoading(true);
    try {
      const [a, d, s, m, l] = await Promise.all([
        admin.request(`${base}/all-available-route-prices`),
        admin.request(`${base}/all-deleted-route-prices`),
        admin.request(`${base}/route-price-statuses`),
        admin.request(`${base}/most-used-route-prices`),
        admin.request(`${base}/least-used-route-prices`),
      ]);
      admin.table(
        "tableRoot",
        a,
        cols,
        (o) =>
          `<button data-edit="${admin.pick(o, "routePriceId", "RoutePriceId")}" data-price="${admin.pick(o, "price", "Price")}" class="mr-3 text-teal-700">Edit price</button><button data-del="${admin.pick(o, "routePriceId", "RoutePriceId")}" class="text-red-700">Deactivate</button>`,
      );
      admin.table(
        "deletedRoot",
        d,
        cols,
        (o) =>
          `<button data-restore="${admin.pick(o, "routePriceId", "RoutePriceId")}" class="text-emerald-700">Restore</button>`,
      );
      document
        .querySelectorAll("[data-edit]")
        .forEach(
          (b) => (b.onclick = () => edit(b.dataset.edit, b.dataset.price)),
        );
      document.querySelectorAll("[data-del]").forEach(
        (b) =>
          (b.onclick = () =>
            admin.confirmAction("Deactivate this route price?", async () => {
              await admin.request(
                `${base}/delete-route-price/${b.dataset.del}`,
                { method: "DELETE" },
              );
              load();
            })),
      );
      document.querySelectorAll("[data-restore]").forEach(
        (b) =>
          (b.onclick = async () => {
            await admin.request(
              `${base}/restore-route-price/${b.dataset.restore}`,
              { method: "PUT" },
            );
            load();
          }),
      );
      document.getElementById("statsRoot").innerHTML =
        `<div class="rounded-2xl border bg-white p-5"><h2 class="font-bold">Route summary</h2><p class="mt-2 text-sm text-slate-600">Active: ${admin.pick(s, "activeRoutePrices", "ActiveRoutePrices") || 0} · Deleted: ${admin.pick(s, "deletedRoutePrices", "DeletedRoutePrices") || 0} · Most-used results: ${api.asArray(m).length} · Least-used results: ${api.asArray(l).length}</p></div>`;
    } catch (e) {
      admin.alert(e.message);
    } finally {
      admin.setLoading(false);
    }
  }
  function edit(id, price) {
    admin.openModal(
      "Edit route price",
      admin.input(
        "Price",
        "Price",
        "number",
        price,
        'required min="1" step="0.01"',
      ),
      async (f) => {
        await admin.request(`${base}/update-route-price/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json-patch+json" },
          body: JSON.stringify([
            { op: "replace", path: "/price", value: Number(f.get("Price")) },
          ]),
        });
        load();
      },
    );
  }
  document.getElementById("addButton").onclick = () =>
    admin.openModal(
      "Add route price",
      admin.select(
        "BusTypeId",
        "Bus type",
        types.map((t) => ({
          value: admin.pick(t, "busTypeId", "BusTypeId"),
          label: admin.pick(t, "name", "Name"),
        })),
      ) +
        admin.select(
          "StartCityId",
          "Start city",
          cities.map((c) => ({
            value: admin.pick(c, "id", "Id"),
            label: admin.pick(c, "name", "Name"),
          })),
        ) +
        admin.select(
          "EndCityId",
          "End city",
          cities.map((c) => ({
            value: admin.pick(c, "id", "Id"),
            label: admin.pick(c, "name", "Name"),
          })),
        ) +
        admin.input(
          "Price",
          "Price",
          "number",
          "",
          'required min="1" step="0.01"',
        ) +
        admin.input(
          "DurationHours",
          "Duration hours",
          "number",
          "",
          'required min="1" max="24"',
        ) +
        admin.input(
          "DistanceKm",
          "Distance (km)",
          "number",
          "",
          'required min="1" step="0.01"',
        ),
      async (f) => {
        if (f.get("StartCityId") === f.get("EndCityId"))
          throw new Error("Start and end cities must differ.");
        const o = Object.fromEntries(f);
        ["BusTypeId", "StartCityId", "EndCityId", "DurationHours"].forEach(
          (k) => (o[k] = Number(o[k])),
        );
        o.Price = Number(o.Price);
        o.DistanceKm = Number(o.DistanceKm);
        await admin.request(`${base}/add-route-price`, {
          method: "POST",
          body: JSON.stringify(o),
        });
        load();
      },
    );
  [cities, types] = await Promise.all([
    admin.request("/api/employee/city/all-cities"),
    admin.request("/api/employee/TypeBus/all-bus-types"),
  ]);
  cities = api.asArray(cities);
  types = api.asArray(types);
  load();
})();
