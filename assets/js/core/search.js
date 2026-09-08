(() => {
  const normalizeSearchText = (value) =>
    String(value ?? "")
      .normalize("NFKD")
      .toLocaleLowerCase()
      .replace(/\s+/g, " ")
      .trim();

  function valueAt(row, field) {
    if (typeof field === "function") return field(row);
    if (Array.isArray(field)) {
      return field
        .map((key) => row?.[key])
        .find((value) => value !== undefined && value !== null);
    }
    return row?.[field];
  }

  function filterRows(rows, query, fields = []) {
    const source = Array.isArray(rows) ? rows : [];
    const needle = normalizeSearchText(query);
    if (!needle) return source.slice();
    return source.filter((row) => {
      const values = fields.length ? fields.map((field) => valueAt(row, field)) : Object.values(row || {});
      return values.some((value) => normalizeSearchText(value).includes(needle));
    });
  }

  function debounce(fn, delay = 200) {
    let timer;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => fn(...args), delay);
    };
  }

  function createSearch({
    mount,
    id,
    placeholder = "Search records…",
    onChange,
    label = "Search",
  }) {
    const target = typeof mount === "string" ? document.getElementById(mount) : mount;
    if (!target) return null;
    const root = document.createElement("div");
    root.className = "mb-4 flex flex-col gap-2 sm:flex-row sm:items-center";
    root.innerHTML = `<label class="relative block min-w-0 flex-1"><span class="sr-only">${label}</span><span aria-hidden="true" class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">⌕</span><input id="${id}" type="search" autocomplete="off" placeholder="${placeholder}" class="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-10 outline-none focus:border-teal-600"><button type="button" data-search-clear aria-label="Clear search" class="absolute right-2 top-1/2 hidden -translate-y-1/2 rounded-lg px-2 py-1 text-slate-500 hover:bg-slate-100">✕</button></label><span data-search-count aria-live="polite" class="text-sm text-slate-500"></span>`;
    target.appendChild(root);
    const input = root.querySelector("input");
    const clear = root.querySelector("[data-search-clear]");
    const count = root.querySelector("[data-search-count]");
    const emit = debounce(() => onChange(input.value), 200);
    input.addEventListener("input", () => {
      clear.classList.toggle("hidden", !input.value);
      emit();
    });
    clear.addEventListener("click", () => {
      input.value = "";
      clear.classList.add("hidden");
      onChange("");
      input.focus();
    });
    return {
      input,
      setCount(shown, total) {
        count.textContent = `${shown} of ${total}`;
      },
      refresh() {
        onChange(input.value);
      },
      query() {
        return input.value;
      },
    };
  }

  window.searchUtils = { normalizeSearchText, filterRows, debounce, createSearch };
})();
