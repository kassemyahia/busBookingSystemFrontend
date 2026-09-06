(async () => {
  if (!(await staffLayout.init())) return;
  const base = "/api/employee/trips";
  let options = {},
    routes = [],
    discounts = [];
  async function load() {
    admin.setLoading(true);
    try {
      const f = new FormData(document.getElementById("filters")),
        q = new URLSearchParams();
      for (const [k, v] of f) if (v) q.set(k, v);
      const data = await admin.request(
        q.size ? `${base}/search?${q}` : `${base}/all-trips`,
      );
      admin.table(
        "tableRoot",
        data,
        [
          { label: "ID", keys: ["tripId", "TripId"] },
          { label: "Departure", keys: ["departureTime", "DepartureTime"] },
          {
            label: "Route",
            keys: ["startCity", "StartCity"],
            format: (v, o) => `${v} → ${admin.pick(o, "endCity", "EndCity")}`,
          },
          { label: "Bus type", keys: ["busType", "BusType"] },
          { label: "Price", keys: ["basePrice", "BasePrice"] },
          { label: "Discount", keys: ["discountName", "DiscountName"] },
          {
            label: "State",
            keys: ["isDeleted", "IsDeleted"],
            format: (v) => (v ? "Inactive" : "Active"),
          },
        ],
        (o) =>
          `<button data-view="${admin.pick(o, "tripId", "TripId")}" class="mr-3 text-teal-700">Details</button><button data-edit="${admin.pick(o, "tripId", "TripId")}" class="mr-3 text-indigo-700">Edit</button><button data-del="${admin.pick(o, "tripId", "TripId")}" class="text-red-700">Deactivate</button>`,
      );
      document
        .querySelectorAll("[data-view]")
        .forEach((b) => (b.onclick = () => details(b.dataset.view)));
      document
        .querySelectorAll("[data-edit]")
        .forEach((b) => (b.onclick = () => edit(b.dataset.edit)));
      document.querySelectorAll("[data-del]").forEach(
        (b) =>
          (b.onclick = () =>
            admin.confirmAction("Deactivate this trip?", async () => {
              await admin.request(`${base}/delete/${b.dataset.del}`, {
                method: "PUT",
              });
              load();
            })),
      );
    } catch (e) {
      admin.alert(e.message);
    } finally {
      admin.setLoading(false);
    }
  }
  async function details(id) {
    try {
      const [d, seats, summary, passengers] = await Promise.all([
        admin.request(`${base}/details/${id}`),
        admin.request(`${base}/${id}/seats-with-users`),
        admin.request(`${base}/${id}/seat-summary`),
        admin.request(`/api/admin/trips/trip/${id}/confirmed-passengers`),
      ]);
      document.getElementById("detailsRoot").innerHTML =
        `<section class="rounded-2xl border bg-white p-5"><div class="flex justify-between"><h2 class="text-xl font-bold">Trip #${id}</h2><button onclick="document.getElementById('detailsRoot').innerHTML=''">✕</button></div><p class="mt-3 text-sm text-slate-600">${admin.esc(admin.pick(d, "startCity", "StartCity"))} → ${admin.esc(admin.pick(d, "endCity", "EndCity"))} · ${admin.esc(admin.pick(d, "departureTime", "DepartureTime"))} · Driver: ${admin.esc(admin.pick(d, "driverName", "DriverName"))}</p><p class="mt-2 text-sm">Seats: ${admin.pick(summary, "availableSeats", "AvailableSeats") || 0} available, ${admin.pick(summary, "reservedSeats", "ReservedSeats") || 0} reserved, ${admin.pick(summary, "confirmedSeats", "ConfirmedSeats") || 0} confirmed.</p><div class="mt-5 grid gap-6 lg:grid-cols-2"><div><h3 class="mb-2 font-bold">Seats and users</h3><div id="seatTable"></div></div><div><h3 class="mb-2 font-bold">Confirmed passengers</h3><div id="passTable"></div></div></div></section>`;
      admin.table("seatTable", seats, [
        { label: "Seat", keys: ["seatNumber", "SeatNumber"] },
        { label: "Status", keys: ["seatStatus", "SeatStatus"] },
        { label: "User", keys: ["fullName", "FullName"] },
      ]);
      admin.table("passTable", passengers, [
        { label: "Seat", keys: ["seatNumber", "SeatNumber"] },
        { label: "Passenger", keys: ["fullName", "FullName"] },
        {
          label: "National number",
          keys: ["nationalNumber", "NationalNumber"],
        },
      ]);
    } catch (e) {
      admin.alert(e.message);
    }
  }
  async function availability(form) {
    const departure = form.querySelector('[name="DepartureTime"]').value,
      routeId = form.querySelector('[name="RoutePriceId"]').value,
      route = routes.find(
        (r) =>
          String(admin.pick(r, "routePriceId", "RoutePriceId")) === routeId,
      ),
      typeName = admin.pick(route, "busType", "BusType"),
      type = api
        .asArray(admin.pick(options, "busTypes", "BusTypes"))
        .find(
          (t) => admin.pick(t, "name", "Name", "type", "Type") === typeName,
        ),
      typeId = admin.pick(type, "busTypeId", "BusTypeId", "id", "Id");
    if (!departure || !typeId) return;
    const [drivers, buses] = await Promise.all([
      admin.request(
        `${base}/drivers/available?departureTime=${encodeURIComponent(departure)}`,
      ),
      admin.request(
        `${base}/buses/available?departureTime=${encodeURIComponent(departure)}&busTypeId=${typeId}`,
      ),
    ]);
    fill(form.EmployeeId, drivers, "driverId", "fullName");
    fill(
      form.BusId,
      buses,
      "busId",
      "busType",
      (x) =>
        `${admin.pick(x, "busType", "BusType")} · ${admin.pick(x, "capacity", "Capacity")} seats · bus #${admin.pick(x, "busId", "BusId")}`,
    );
  }
  function fill(el, data, id, name, formatter) {
    el.innerHTML =
      '<option value="">Select…</option>' +
      api
        .asArray(data)
        .map(
          (x) =>
            `<option value="${admin.pick(x, id, id[0].toUpperCase() + id.slice(1))}">${admin.esc(formatter ? formatter(x) : admin.pick(x, name, name[0].toUpperCase() + name.slice(1)))}</option>`,
        )
        .join("");
  }
  function create() {
    const body =
      admin.select(
        "RoutePriceId",
        "Route",
        routes.map((r) => ({
          value: admin.pick(r, "routePriceId", "RoutePriceId"),
          label: `${admin.pick(r, "startCity", "StartCity")} → ${admin.pick(r, "endCity", "EndCity")} · ${admin.pick(r, "busType", "BusType")}`,
        })),
      ) +
      admin.input("DepartureTime", "Departure time", "datetime-local") +
      admin.select("EmployeeId", "Available driver", []) +
      admin.select("BusId", "Available bus", []) +
      admin.select(
        "TripDiscountId",
        "Discount",
        discounts.map((d) => ({
          value: admin.pick(d, "discountId", "DiscountId"),
          label: `${admin.pick(d, "name", "Name")} (${admin.pick(d, "percentage", "Percentage")}%)`,
        })),
        "",
        true,
      );
    admin.openModal("Create trip", body, async (f) => {
      const o = {
        RoutePriceId: Number(f.get("RoutePriceId")),
        DepartureTime: f.get("DepartureTime"),
        BusId: Number(f.get("BusId")),
        EmployeeId: Number(f.get("EmployeeId")),
        TripDiscountId: f.get("TripDiscountId")
          ? Number(f.get("TripDiscountId"))
          : null,
      };
      await admin.request(`${base}/create`, {
        method: "POST",
        body: JSON.stringify(o),
      });
      load();
    });
    const form = document.getElementById("modalForm");
    form.RoutePriceId.onchange = form.DepartureTime.onchange = () =>
      availability(form);
  }
  async function edit(id) {
    try {
      const data = await admin.request(`${base}/edit-data/${id}`),
        t = admin.pick(data, "trip", "Trip"),
        drivers = api.asArray(
          admin.pick(data, "availableDrivers", "AvailableDrivers"),
        ),
        buses = api.asArray(
          admin.pick(data, "availableBuses", "AvailableBuses"),
        ),
        ds = api.asArray(
          admin.pick(data, "availableDiscounts", "AvailableDiscounts"),
        );
      admin.openModal(
        "Edit trip",
        admin.input(
          "DepartureTime",
          "Departure time",
          "datetime-local",
          String(admin.pick(t, "departureTime", "DepartureTime")).slice(0, 16),
          "",
        ) +
          admin.select(
            "EmployeeId",
            "Driver",
            drivers.map((x) => ({
              value: admin.pick(x, "employeeId", "EmployeeId"),
              label: admin.pick(x, "fullName", "FullName"),
            })),
            admin.pick(t, "employeeId", "EmployeeId"),
            true,
          ) +
          admin.select(
            "BusId",
            "Bus",
            buses.map((x) => ({
              value: admin.pick(x, "busId", "BusId"),
              label: admin.pick(x, "busNumber", "BusNumber"),
            })),
            admin.pick(t, "busId", "BusId"),
            true,
          ) +
          admin.select(
            "TripDiscountId",
            "Discount",
            ds.map((x) => ({
              value: admin.pick(x, "tripDiscountId", "TripDiscountId"),
              label: admin.pick(x, "name", "Name"),
            })),
            admin.pick(t, "tripDiscountId", "TripDiscountId"),
            true,
          ),
        async (f) => {
          const o = { TripId: Number(id) };
          for (const k of [
            "DepartureTime",
            "EmployeeId",
            "BusId",
            "TripDiscountId",
          ]) {
            const v = f.get(k);
            if (v) o[k] = k === "DepartureTime" ? v : Number(v);
          }
          await admin.request(`${base}/update`, {
            method: "PATCH",
            body: JSON.stringify(o),
          });
          load();
        },
      );
    } catch (e) {
      admin.alert(e.message);
    }
  }
  options = await admin.request(`${base}/search-options`);
  [routes, discounts] = await Promise.all([
    admin.request(`${base}/route-prices`),
    admin.request(`${base}/discounts`),
  ]);
  routes = api.asArray(routes);
  discounts = api.asArray(discounts);
  const cities = api.asArray(admin.pick(options, "cities", "Cities"));
  document.getElementById("filters").innerHTML =
    admin.select(
      "startCity",
      "Start city",
      cities.map((c) => ({
        value: admin.pick(c, "name", "Name"),
        label: admin.pick(c, "name", "Name"),
      })),
      "",
      true,
    ) +
    admin.select(
      "endCity",
      "End city",
      cities.map((c) => ({
        value: admin.pick(c, "name", "Name"),
        label: admin.pick(c, "name", "Name"),
      })),
      "",
      true,
    ) +
    admin.input("date", "Date", "date", "", "") +
    admin.select(
      "status",
      "Status",
      api
        .asArray(admin.pick(options, "statuses", "Statuses"))
        .map((x) => ({ value: x, label: x })),
      "",
      true,
    ) +
    admin.select(
      "hasDiscount",
      "Discount",
      [
        { value: "true", label: "With discount" },
        { value: "false", label: "Without discount" },
      ],
      "",
      true,
    ) +
    '<button class="rounded-xl bg-slate-950 px-4 py-2 text-white">Search</button>';
  document.getElementById("filters").onsubmit = (e) => {
    e.preventDefault();
    load();
  };
  document.getElementById("addButton").onclick = create;
  load();
})();
