(async () => {
  if (!(await staffLayout.init())) return;
  const base = "/api/employee/route-price";
  let cities = [],
    types = [];
  const cols = [
    { label: "ID", keys: ["routePriceId", "RoutePriceId", "id", "Id"] },
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
  const suggestedCols = [
    { label: "ID", keys: ["routePriceId", "RoutePriceId"] },
    {
      label: "Route",
      keys: ["startCityName", "StartCityName"],
      format: (v, o) =>
        `${v} → ${admin.pick(o, "endCityName", "EndCityName")}`,
    },
    { label: "Bus type", keys: ["busTypeName", "BusTypeName"] },
    { label: "Trips", keys: ["usageCount", "UsageCount"] },
    { label: "Current price", keys: ["currentPrice", "CurrentPrice"] },
    { label: "Suggested price", keys: ["suggestedPrice", "SuggestedPrice"] },
    { label: "Suggestion", keys: ["suggestion", "Suggestion"] },
  ];

  async function load() {
    admin.setLoading(true);
    try {
      const busTypeId = new FormData(document.getElementById("filters")).get(
        "busTypeId",
      );
      const [a, d, s, m, l, suggestedDeletion, suggestedUpdates] =
        await admin.safeAll([
          admin.request(
            busTypeId
              ? `${base}/all-route-prices-by-bus-type/${busTypeId}`
              : `${base}/all-available-route-prices`,
          ),
          admin.request(`${base}/all-deleted-route-prices`),
          admin.request(`${base}/route-price-statuses`),
          admin.request(`${base}/most-used-route-prices`),
          admin.request(`${base}/least-used-route-prices`),
          admin.request(`${base}/suggest-route-price-for-deletion`),
          admin.request(`${base}/update-price-for-route-price-suggest`),
        ]);
      admin.table("tableRoot", api.asArray(a), cols, (o) => {
        const id = admin.esc(admin.pick(o, "routePriceId", "RoutePriceId"));
        const price = admin.esc(admin.pick(o, "price", "Price"));
        return `<button data-edit="${id}" data-price="${price}" class="mr-3 text-teal-700">Edit price</button><button data-del="${id}" class="text-red-700">Deactivate</button>`;
      });
      admin.table("deletedRoot", api.asArray(d), cols, (o) => {
        const id = admin.esc(admin.pick(o, "routePriceId", "RoutePriceId"));
        return `<button data-restore="${id}" class="text-emerald-700">Restore</button>`;
      });
      admin.table(
        "suggestedDeletionRoot",
        api.asArray(suggestedDeletion),
        cols,
        (o) =>
          `<button data-suggested-del="${admin.esc(admin.pick(o, "routePriceId", "RoutePriceId", "id", "Id"))}" class="text-red-700">Deactivate</button>`,
      );
      admin.table(
        "suggestedUpdatesRoot",
        api.asArray(suggestedUpdates),
        suggestedCols,
        (o) =>
          `<button data-apply="${admin.esc(admin.pick(o, "routePriceId", "RoutePriceId", "id", "Id"))}" data-suggested-price="${admin.esc(admin.pick(o, "suggestedPriceForRoutePrice", "SuggestedPriceForRoutePrice", "suggestedPrice", "SuggestedPrice", "newPrice", "NewPrice"))}" class="text-teal-700">Apply</button>`,
      );
      document
        .querySelectorAll("[data-edit]")
        .forEach(
          (b) => (b.onclick = () => edit(b.dataset.edit, b.dataset.price)),
        );
      document.querySelectorAll("[data-del]").forEach(
        (b) =>
          (b.onclick = () =>
            deactivate(b.dataset.del, "Deactivate this route price?")),
      );
      document.querySelectorAll("[data-suggested-del]").forEach(
        (b) =>
          (b.onclick = () =>
            deactivate(
              b.dataset.suggestedDel,
              "Deactivate this route price?",
            )),
      );
      document.querySelectorAll("[data-restore]").forEach(
        (b) =>
          (b.onclick = async () => {
            admin.setLoading(true);
            try {
              await admin.request(
                `${base}/restore-route-price/${b.dataset.restore}`,
                { method: "PUT" },
              );
              await load();
            } catch (e) {
              admin.alert(e.message);
            } finally {
              admin.setLoading(false);
            }
          }),
      );
      document
        .querySelectorAll("[data-apply]")
        .forEach(
          (b) =>
            (b.onclick = () =>
              edit(b.dataset.apply, b.dataset.suggestedPrice)),
        );
      document.getElementById("statsRoot").innerHTML =
        `<div class="rounded-2xl border bg-white p-5"><h2 class="font-bold">Route summary</h2><p class="mt-2 text-sm text-slate-600">Active: ${admin.esc(admin.pick(s, "activeRoutePrices", "ActiveRoutePrices") || 0)} · Deleted: ${admin.esc(admin.pick(s, "deletedRoutePrices", "DeletedRoutePrices") || 0)} · Most-used results: ${api.asArray(m).length} · Least-used results: ${api.asArray(l).length}</p></div>`;
    } catch (e) {
      admin.alert(e.message);
    } finally {
      admin.setLoading(false);
    }
  }

  function deactivate(id, message) {
    admin.confirmAction(message, async () => {
      admin.setLoading(true);
      try {
        await admin.request(`${base}/delete-route-price/${id}`, {
          method: "DELETE",
        });
        await load();
      } finally {
        admin.setLoading(false);
      }
    });
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

  document.getElementById("filters").innerHTML =
    admin.select("busTypeId", "Filter by bus type", [], "", true) +
    '<button class="rounded-xl bg-slate-950 px-4 py-2 text-white">Filter</button>';
  document.getElementById("filters").onsubmit = (e) => {
    e.preventDefault();
    load();
  };
  document.getElementById("addButton").onclick = () => {
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
        '<div class="flex items-end gap-3">' +
        '<div class="flex-1">' +
        admin.input(
          "Price",
          "Price",
          "number",
          "",
          'required min="1" step="0.01"',
        ) +
        "</div>" +
        '<button id="suggestPriceButton" type="button" class="rounded-xl border px-4 py-3 font-semibold text-teal-700">Suggest price</button>' +
        "</div>" +
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
        ) +
        admin.input(
          "Capacity",
          "Capacity",
          "number",
          "",
          'required min="1" step="1"',
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
        delete o.Capacity;
        await admin.request(`${base}/add-route-price`, {
          method: "POST",
          body: JSON.stringify(o),
        });
        load();
      },
    );
    document.getElementById("suggestPriceButton").onclick = async (e) => {
      const button = e.currentTarget;
      button.disabled = true;
      try {
        const form = document.getElementById("modalForm"),
          q = new URLSearchParams({
            distanceKm: form.elements.DistanceKm.value,
            capacity: form.elements.Capacity.value,
          }),
          result = await admin.request(
            `${base}/suggest-price-for-route-price?${q}`,
          );
        form.elements.Price.value = admin.pick(
          result,
          "suggestedPriceForRoutePrice",
          "SuggestedPriceForRoutePrice",
        );
      } catch (error) {
        admin.alert(
          admin.pick(error.data, "error", "Error") || error.message,
        );
      } finally {
        button.disabled = false;
      }
    };
  };

  [cities, types] = await admin.safeAll([
    admin.request("/api/employee/city/all-cities"),
    admin.request("/api/employee/TypeBus/all-bus-types"),
  ]);
  cities = api.asArray(cities);
  types = api.asArray(types);
  document.querySelector('[name="busTypeId"]').innerHTML =
    '<option value="">All bus types</option>' +
    types
      .map(
        (t) =>
          `<option value="${admin.esc(admin.pick(t, "busTypeId", "BusTypeId"))}">${admin.esc(admin.pick(t, "name", "Name"))}</option>`,
      )
      .join("");
  load();
})();
