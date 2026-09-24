const menuToggle = document.querySelector(".menu-toggle");
const nav = document.querySelector(".main-nav");

menuToggle?.addEventListener("click", () => {
  const isOpen = nav.classList.toggle("open");
  menuToggle.setAttribute("aria-expanded", String(isOpen));
});

document.querySelectorAll(".main-nav a").forEach((link) => {
  link.addEventListener("click", () => {
    nav.classList.remove("open");
    menuToggle?.setAttribute("aria-expanded", "false");
  });
});

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        observer.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.12 },
);

document
  .querySelectorAll(".reveal")
  .forEach((element) => observer.observe(element));

const billingButtons = document.querySelectorAll("[data-billing]");
const priceBlocks = document.querySelectorAll(".price[data-monthly]");

function updateBilling(period) {
  const annual = period === "annual";
  billingButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.billing === period);
  });
  priceBlocks.forEach((price) => {
    const amount = price.querySelector("strong");
    const label = price.querySelector(".price-period");
    const billingNote = price.parentElement.querySelector(".price-billing");
    if (!amount || !label || !billingNote) return;
    const hasTrial = Boolean(price.parentElement.querySelector(".trial-badge"));
    amount.textContent = annual
      ? price.dataset.total
      : hasTrial
        ? price.dataset.trial
        : price.dataset.monthly;
    label.textContent = annual ? "/ano" : hasTrial ? "no teste" : "/mês";
    billingNote.textContent = annual
      ? `${hasTrial ? "Após 7 dias grátis · " : ""}Pagamento anual antecipado · equivale a R$ ${price.dataset.annual}/mês`
      : hasTrial
        ? "Depois dos 7 dias: R$ 49,90/mês"
        : "Cancele quando quiser";
  });
}

billingButtons.forEach((button) => {
  button.addEventListener("click", () => updateBilling(button.dataset.billing));
});

const customPlan = document.querySelector(".custom-plan");
const customSelectors = customPlan?.querySelectorAll("[data-custom]") || [];
const customFeatures =
  customPlan?.querySelectorAll("[data-custom-feature]") || [];
const customPrice = customPlan?.querySelector("[data-custom-price]");
const customEmail = customPlan?.querySelector("[data-custom-email]");

function updateCustomPlan() {
  if (!customPlan || !customPrice) return;
  const whatsapp = Number(
    customPlan.querySelector('[data-custom="whatsapp"]')?.value || 1,
  );
  const departments = Number(
    customPlan.querySelector('[data-custom="departments"]')?.value || 1,
  );
  const agents = Number(
    customPlan.querySelector('[data-custom="agents"]')?.value || 3,
  );
  const selectedFeatures = [...customFeatures].filter(
    (feature) => feature.checked,
  );
  const featureTotal = selectedFeatures.reduce(
    (total, feature) => total + Number(feature.dataset.featurePrice || 0),
    0,
  );
  const calculated =
    29.9 + whatsapp * 8 + departments * 6 + agents * 3 + featureTotal;
  const packagePrice =
    whatsapp <= 15 &&
    departments <= 10 &&
    agents <= 25 &&
    selectedFeatures.length >= 6
      ? 149.9
      : whatsapp <= 8 &&
          departments <= 5 &&
          agents <= 10 &&
          selectedFeatures.length >= 5
        ? 99.9
        : whatsapp <= 3 &&
            departments <= 3 &&
            agents <= 3 &&
            selectedFeatures.length >= 3
          ? 49.9
          : calculated;
  const monthly = Math.min(calculated, packagePrice);
  customPrice.textContent = monthly.toFixed(2).replace(".", ",");
  if (customEmail) {
    const features =
      selectedFeatures
        .map((feature) => feature.dataset.customFeature)
        .join(", ") || "Sem funcionalidades adicionais";
    const subject = `Plano Personalizado Brisoft Desk - ${whatsapp} WhatsApp(s), ${departments} departamento(s), ${agents} atendente(s) - ${features}`;
    customEmail.href = `mailto:brisoftdesk@gmail.com?subject=${encodeURIComponent(subject)}`;
  }
}

customSelectors.forEach((select) =>
  select.addEventListener("change", updateCustomPlan),
);
customFeatures.forEach((feature) =>
  feature.addEventListener("change", updateCustomPlan),
);
updateCustomPlan();

// FAQ Accordion
const faqItems = document.querySelectorAll(".faq-item");
faqItems.forEach((item) => {
  const questionBtn = item.querySelector(".faq-question");
  questionBtn?.addEventListener("click", () => {
    const isOpen = item.classList.contains("open");
    faqItems.forEach((other) => {
      other.classList.remove("open");
      other
        .querySelector(".faq-question")
        ?.setAttribute("aria-expanded", "false");
    });
    if (!isOpen) {
      item.classList.add("open");
      questionBtn.setAttribute("aria-expanded", "true");
    }
  });
});

// A11y: close mobile nav on Escape
window.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && nav?.classList.contains("open")) {
    nav.classList.remove("open");
    menuToggle?.setAttribute("aria-expanded", "false");
    menuToggle?.focus();
  }
});
