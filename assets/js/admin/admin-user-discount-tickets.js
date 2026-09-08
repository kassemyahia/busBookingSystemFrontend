(async () => {
  if (!(await staffLayout.init())) return;
  let discounts = [];
  async function lookup(id) {
    admin.setLoading(true);
    try {
      const data = await admin.request(
        `/api/admin/user-discount-ticket/user/${id}`,
      );
      const columns = [
        { label: "Ticket ID", keys: ["ticketId", "TicketId"] },
        { label: "Discount", keys: ["discountName", "DiscountName"] },
        {
          label: "Percentage",
          keys: ["percentage", "Percentage"],
          format: (v) => `${v}%`,
        },
        {
          label: "Starts",
          keys: ["startDate", "StartDate"],
          format: admin.fmt,
        },
        { label: "Ends", keys: ["endDate", "EndDate"], format: admin.fmt },
      ];
      admin.searchableTable("tableRoot", data, columns, null, { fields: columns.map((c) => c.keys), placeholder: "Search this user's discount tickets…" });
    } catch (e) {
      admin.alert(e.message);
    } finally {
      admin.setLoading(false);
    }
  }
  document.getElementById("lookupForm").onsubmit = (e) => {
    e.preventDefault();
    lookup(new FormData(e.target).get("userId"));
  };
  document.getElementById("assignButton").onclick = () => {
    const enteredUserId = document.querySelector('#lookupForm [name="userId"]').value;
    admin.openModal(
      "Assign discount ticket",
      admin.input("UserId", "User ID", "number", enteredUserId, 'required min="1"') +
        admin.select(
          "UserDiscountId",
          "Discount",
          discounts.map((d) => ({
            value: admin.pick(
              d,
              "userDiscountId",
              "UserDiscountId",
              "id",
              "Id",
            ),
            label: `${admin.pick(d, "name", "Name")} (${admin.pick(d, "discountPercentage", "DiscountPercentage", "percentage", "Percentage")}%`,
          })),
        ) +
        admin.input("StartDate", "Start date", "date") +
        admin.input("EndDate", "End date", "date"),
      async (f) => {
        if (f.get("EndDate") < f.get("StartDate"))
          throw new Error("End date must not be before start date.");
        const body = {
          UserId: Number(f.get("UserId")),
          UserDiscountId: Number(f.get("UserDiscountId")),
          StartDate: f.get("StartDate"),
          EndDate: f.get("EndDate"),
        };
        const result = await admin.request("/api/admin/user-discount-ticket/add", {
          method: "POST",
          body: JSON.stringify(body),
        });
        if (typeof result === "string" && /not found/i.test(result))
          throw new Error(result);
        lookup(body.UserId);
      },
    );
  };
  try {
    discounts = api.asArray(
      await admin.request("/api/admin/userdiscounts/active-user-discounts"),
    );
  } catch (e) {
    admin.alert(e.message);
  }
})();
