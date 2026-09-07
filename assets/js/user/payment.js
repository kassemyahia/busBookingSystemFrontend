(async () => {
  const ready = await window.ui.initProtectedLayout();

  if (!ready) {
    return;
  }

  const bookingId = window.ui.getQuery("bookingId");

  if (!bookingId) {
    window.location.replace("./tickets.html");

    return;
  }

  const summary = document.getElementById("paymentSummary");

  const form = document.getElementById("paymentForm");

  const button = document.getElementById("payButton");

  const paymentMethods = document.getElementById("paymentMethods");

  const paymentCopy = {
    1: {
      title: "Card payment",
      description: "Complete your reservation securely using a payment card.",
    },
    2: {
      title: "Cash at office",
      description: "Reserve online and complete payment at the booking office.",
    },
  };

  async function loadPaymentMethods() {
    try {
      const options = window.api.asArray(
        await window.api.request("/api/PaymentMethod/options", {
          method: "GET",
        }),
      );

      if (!options.length) return;

      paymentMethods.innerHTML = options
        .map((option, index) => {
          const rawKey = window.ui.pick(option, "key", "Key");
          const numericKey = Number(rawKey);
          const key = Number.isFinite(numericKey)
            ? numericKey
            : { FakeCard: 1, CashAtOffice: 2 }[rawKey];
          const apiLabel = window.ui.pick(option, "label", "Label");
          const copy = paymentCopy[key] || {
            title: apiLabel,
            description: "Use this method to complete your booking.",
          };

          if (!key) return "";

          return `<label class="flex cursor-pointer items-start gap-4 rounded-2xl border border-slate-200 p-5 transition has-[:checked]:border-teal-600 has-[:checked]:bg-teal-50">
            <input type="radio" name="paymentMethod" value="${key}" ${index === 0 ? "checked" : ""} class="mt-1" />
            <div><p class="font-semibold">${window.ui.escapeHtml(copy.title)}</p><p class="mt-1 text-sm leading-6 text-slate-500">${window.ui.escapeHtml(copy.description)}</p></div>
          </label>`;
        })
        .join("");
    } catch {
      // Keep the server-compatible fallback options already rendered in HTML.
    }
  }

  function findValue(ticket, name) {
    return window.ui.pick(
      ticket,
      name.charAt(0).toLowerCase() + name.slice(1),
      name,
    );
  }

  function renderSummary(ticket) {
    if (!ticket) {
      const cached = sessionStorage.getItem(`booking_${bookingId}`);

      if (!cached) {
        summary.innerHTML = `
                    <h2 class="font-bold">
                        Booking #${window.ui.escapeHtml(bookingId)}
                    </h2>

                    <p class="mt-2 text-sm text-slate-500">
                        Your temporary reservation is ready for payment.
                    </p>
                `;

        return;
      }

      try {
        const data = JSON.parse(cached);

        const trip = data.trip || {};

        summary.innerHTML = `
                    <p class="text-xs font-semibold uppercase tracking-wider text-slate-400">
                        Booking #${window.ui.escapeHtml(bookingId)}
                    </p>

                    <h2 class="mt-2 text-xl font-bold">
                        ${window.ui.escapeHtml(window.ui.pick(trip, "startCity", "StartCity"))}
                        →
                        ${window.ui.escapeHtml(window.ui.pick(trip, "endCity", "EndCity"))}
                    </h2>

                    <div class="mt-5 space-y-3 text-sm">

                        <div class="flex justify-between">
                            <span class="text-slate-400">
                                Seat
                            </span>

                            <span class="font-semibold">
                                ${window.ui.escapeHtml(data.seat)}
                            </span>
                        </div>

                        <div class="flex justify-between">
                            <span class="text-slate-400">
                                Price
                            </span>

                            <span class="font-semibold">
                                ${window.ui.escapeHtml(window.ui.pick(trip, "basePrice", "BasePrice"))}
                            </span>
                        </div>

                        <div class="flex justify-between">
                            <span class="text-slate-400">
                                Expires
                            </span>

                            <span class="font-semibold">
                                ${window.ui.escapeHtml(window.ui.formatDate(data.expiration))}
                            </span>
                        </div>

                    </div>
                `;
      } catch {
        summary.textContent = `Booking #${bookingId}`;
      }

      return;
    }

    summary.innerHTML = `
            <p class="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Booking #${window.ui.escapeHtml(bookingId)}
            </p>

            <h2 class="mt-2 text-xl font-bold">
                ${window.ui.escapeHtml(findValue(ticket, "StartCity"))}
                →
                ${window.ui.escapeHtml(findValue(ticket, "EndCity"))}
            </h2>

            <p class="mt-2 text-sm text-slate-500">
                ${window.ui.escapeHtml(findValue(ticket, "TripDate"))}
            </p>

            <div class="mt-6 space-y-3 border-t border-slate-100 pt-5 text-sm">

                <div class="flex justify-between">
                    <span class="text-slate-400">
                        Seat
                    </span>

                    <span class="font-semibold">
                        ${window.ui.escapeHtml(findValue(ticket, "SeatNumber"))}
                    </span>
                </div>

                <div class="flex justify-between">
                    <span class="text-slate-400">
                        Bus
                    </span>

                    <span class="font-semibold">
                        ${window.ui.escapeHtml(findValue(ticket, "BusNumber"))}
                    </span>
                </div>

                <div class="flex justify-between">
                    <span class="text-slate-400">
                        Total
                    </span>

                    <span class="font-bold text-slate-950">
                        ${window.ui.escapeHtml(findValue(ticket, "FinalPrice"))}
                    </span>
                </div>

            </div>
        `;
  }

  async function loadBooking() {
    try {
      const tickets = await window.api.request("/api/UserTickets/my-tickets", {
        method: "GET",
        auth: true,
      });

      if (Array.isArray(tickets)) {
        const ticket = tickets.find(
          (item) =>
            Number(window.ui.pick(item, "bookingId", "BookingId")) ===
            Number(bookingId),
        );

        renderSummary(ticket);
      } else {
        renderSummary(null);
      }
    } catch {
      renderSummary(null);
    }
  }

  form.addEventListener(
    "submit",

    async (event) => {
      event.preventDefault();

      const selected = document.querySelector(
        'input[name="paymentMethod"]:checked',
      );

      if (!selected) {
        window.ui.showAlert(
          "paymentAlert",
          "error",
          "Choose a payment method.",
        );

        return;
      }

      button.disabled = true;

      button.textContent = "Processing...";

      try {
        const response = await window.api.request("/api/Payment/payment", {
          method: "POST",
          auth: true,

          body: JSON.stringify({
            BookingId: Number(bookingId),

            PaymentMethod: Number(selected.value),
          }),
        });

        const message =
          window.ui.pick(response, "message", "Message") ||
          "Payment processed successfully.";

        window.ui.showAlert("paymentAlert", "success", message);

        sessionStorage.removeItem(`booking_${bookingId}`);

        setTimeout(() => {
          window.location.href = "./tickets.html";
        }, 700);
      } catch (error) {
        window.ui.showAlert("paymentAlert", "error", error.message);

        button.disabled = false;

        button.textContent = "Complete payment";
      }
    },
  );

  Promise.all([loadBooking(), loadPaymentMethods()]);
})();
