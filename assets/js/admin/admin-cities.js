(async () => {
  if (!(await staffLayout.init())) return;
  async function load() {
    admin.setLoading(true);
    try {
      const now = new Date();
      const [cities, most, least, mostRoutes, leastRoutes, monthly] =
        await Promise.all([
          admin.request("/api/employee/city/all-cities"),
          admin.request("/api/employee/city/cities/most-used-trips"),
          admin.request("/api/employee/city/cities/least-used-trips"),
          admin.request("/api/employee/city/cities/most-used-routes"),
          admin.request("/api/employee/city/cities/least-used-routes"),
          admin.request(
            `/api/employee/city/cities/most-travel-month?month=${now.getMonth() + 1}&year=${now.getFullYear()}`,
          ),
        ]);
      admin.table(
        "tableRoot",
        cities,
        [
          { label: "ID", keys: ["id", "Id"] },
          { label: "City", keys: ["name", "Name"] },
        ],
        (o) =>
          `<button data-edit="${admin.pick(o, "id", "Id")}" data-name="${admin.esc(admin.pick(o, "name", "Name"))}" class="text-teal-700">Edit</button>`,
      );
      document.querySelectorAll("[data-edit]").forEach(
        (b) =>
          (b.onclick = () =>
            cityModal("Edit city", b.dataset.name, async (f) =>
              admin.request(
                `/api/employee/city/update-city/${b.dataset.edit}`,
                {
                  method: "PUT",
                  body: JSON.stringify({ CityName: f.get("CityName") }),
                },
              ),
            )),
      );
      document.getElementById("statsRoot").innerHTML =
        `<div class="grid gap-6 lg:grid-cols-2"><div><h2 class="mb-3 text-xl font-bold">Most used by trips</h2><div id="most"></div></div><div><h2 class="mb-3 text-xl font-bold">Least used by trips</h2><div id="least"></div></div><div><h2 class="mb-3 text-xl font-bold">Most used by routes</h2><div id="mostRoutes"></div></div><div><h2 class="mb-3 text-xl font-bold">Least used by routes</h2><div id="leastRoutes"></div></div></div><section class="mt-8"><h2 class="mb-3 text-xl font-bold">Most travelled this month</h2><div id="monthlyCities"></div></section>`;
      const cols = [
        { label: "City", keys: ["cityName", "CityName", "name", "Name"] },
        {
          label: "Trips",
          keys: ["usageCount", "UsageCount", "tripsCount", "TripsCount"],
        },
      ];
      const routeCols = [
        {
          label: "Route",
          keys: ["startCityName", "StartCityName", "startCity", "StartCity"],
          format: (v, o) =>
            `${v} → ${admin.pick(o, "endCityName", "EndCityName", "endCity", "EndCity")}`,
        },
        {
          label: "Uses",
          keys: [
            "usageCount",
            "UsageCount",
            "routeCount",
            "RouteCount",
            "tripsCount",
            "TripsCount",
          ],
        },
      ];
      admin.table("most", most, cols);
      admin.table("least", least, cols);
      admin.table("mostRoutes", api.asArray(mostRoutes), routeCols);
      admin.table("leastRoutes", api.asArray(leastRoutes), routeCols);
      admin.table("monthlyCities", api.asArray(monthly), cols);
    } catch (e) {
      admin.alert(e.message);
    } finally {
      admin.setLoading(false);
    }
  }
  function cityModal(title, value = "", action) {
    admin.openModal(
      title,
      admin.input(
        "CityName",
        "City name",
        "text",
        value,
        'required maxlength="50"',
      ),
      async (f) => {
        await action(f);
        load();
      },
    );
  }
  document.getElementById("addButton").onclick = () =>
    cityModal("Add city", "", (f) =>
      admin.request("/api/employee/city/add-city", {
        method: "POST",
        body: JSON.stringify({ CityName: f.get("CityName") }),
      }),
    );
  load();
})();
