/**
 * Brisoft Desk - Lógica de Contato e Modal de Leads
 * Suporta o formulário na página dedicada (contato.html) e o modal interativo (index.html)
 */

(function () {
  "use strict";

  const WHATSAPP_NUMBER = "5583981131352";

  // Máscara e formatação de telefone/WhatsApp: (XX) XXXXX-XXXX ou (XX) XXXX-XXXX
  function formatPhone(value) {
    if (!value) return "";
    let digits = value.replace(/\D/g, "");
    if (digits.length > 11) digits = digits.slice(0, 11);

    if (digits.length <= 2) {
      return digits.length ? `(${digits}` : "";
    }
    if (digits.length <= 6) {
      return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    }
    if (digits.length <= 10) {
      return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
    }
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
  }

  function applyPhoneMask(input) {
    if (!input) return;
    input.addEventListener("input", function (e) {
      const cursor = input.selectionStart;
      const prevLength = input.value.length;
      input.value = formatPhone(input.value);
      // ajuste simples de posição do cursor
      const newLength = input.value.length;
      if (cursor && cursor === prevLength && newLength > prevLength) {
        input.setSelectionRange(newLength, newLength);
      }
    });
  }

  // Validação simples de formulário
  function validateField(input) {
    const group = input.closest(".form-group");
    if (!group) return true;

    let isValid = true;
    const value = input.value.trim();

    if (input.required) {
      if (!value) {
        isValid = false;
      } else if (input.type === "email") {
        isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
      } else if (input.name === "phone") {
        const digits = value.replace(/\D/g, "");
        isValid = digits.length >= 10 && digits.length <= 11;
      }
    }

    if (isValid) {
      group.classList.remove("has-error");
    } else {
      group.classList.add("has-error");
    }

    return isValid;
  }

  // Monta a mensagem para o WhatsApp com formatação
  function buildWhatsAppMessage(data) {
    const lines = [
      `👋 *Olá, equipe Brisoft Desk!*`,
      `Gostaria de saber mais sobre a plataforma e solicitar uma demonstração:`,
      ``,
      `*DADOS DE CONTATO:*`,
      `👤 *Nome:* ${data.name || "Não informado"}`,
      `🏢 *Empresa:* ${data.company || "Não informado"}`,
      data.segment ? `🏷️ *Segmento:* ${data.segment}` : null,
      `📱 *WhatsApp:* ${data.phone || "Não informado"}`,
      `✉️ *E-mail:* ${data.email || "Não informado"}`,
      ``,
      `*DETALHES DA OPERAÇÃO:*`,
      data.agents ? `👥 *Atendentes:* ${data.agents}` : null,
      data.whatsapp_qty ? `🔢 *Números de WhatsApp:* ${data.whatsapp_qty}` : null,
      data.challenge ? `🎯 *Principal objetivo:* ${data.challenge}` : null,
      data.message ? `💬 *Mensagem/Observação:* ${data.message}` : null,
      ``,
      `_Enviado pelo formulário oficial de contato Brisoft Desk_`
    ].filter(Boolean);

    return lines.join("\n");
  }

  // Manipulador de envio de cada formulário
  function setupContactForm(formElement) {
    if (!formElement) return;

    const phoneInput = formElement.querySelector('input[name="phone"]');
    applyPhoneMask(phoneInput);

    // Validação inline ao sair do campo
    formElement.querySelectorAll("input, select, textarea").forEach((field) => {
      field.addEventListener("blur", () => {
        if (field.value) validateField(field);
      });
      field.addEventListener("input", () => {
        const group = field.closest(".form-group");
        if (group && group.classList.contains("has-error")) {
          validateField(field);
        }
      });
    });

    formElement.addEventListener("submit", function (e) {
      e.preventDefault();

      let hasErrors = false;
      const requiredFields = formElement.querySelectorAll("[required]");
      requiredFields.forEach((field) => {
        if (!validateField(field)) {
          hasErrors = true;
        }
      });

      // Validação do checkbox de consentimento se existir
      const consentBox = formElement.querySelector('input[name="consent"]');
      if (consentBox && !consentBox.checked) {
        hasErrors = true;
        const consentGroup = consentBox.closest(".form-group") || consentBox.parentElement;
        consentGroup.classList.add("has-error");
      }

      if (hasErrors) {
        const firstError = formElement.querySelector(".has-error input, .has-error select");
        firstError?.focus();
        return;
      }

      const submitBtn = formElement.querySelector(".btn-submit-lead");
      if (submitBtn) {
        submitBtn.classList.add("loading");
        submitBtn.disabled = true;
      }

      const formData = new FormData(formElement);
      const data = {
        name: formData.get("name") || "",
        phone: formData.get("phone") || "",
        email: formData.get("email") || "",
        company: formData.get("company") || "",
        segment: formData.get("segment") || "",
        agents: formData.get("agents") || "",
        whatsapp_qty: formData.get("whatsapp_qty") || "",
        challenge: formData.get("challenge") || "",
        message: formData.get("message") || ""
      };

      const messageText = buildWhatsAppMessage(data);
      const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(messageText)}`;

      // Simula feedback imediato de envio e mostra tela de sucesso
      setTimeout(() => {
        if (submitBtn) {
          submitBtn.classList.remove("loading");
          submitBtn.disabled = false;
        }

        const container = formElement.closest(".contact-form-container, .contact-modal-body");
        const successCard = container?.querySelector(".form-success-card");

        if (successCard) {
          // Preenche os dados no resumo de sucesso
          const summaryEl = successCard.querySelector(".success-data-summary");
          if (summaryEl) {
            summaryEl.innerHTML = `
              <div><strong>Nome:</strong> ${escapeHtml(data.name)} (${escapeHtml(data.company)})</div>
              <div><strong>WhatsApp:</strong> ${escapeHtml(data.phone)} | <strong>E-mail:</strong> ${escapeHtml(data.email)}</div>
              ${data.agents ? `<div><strong>Operação:</strong> ${escapeHtml(data.agents)} atendente(s)</div>` : ""}
            `;
          }

          // Atualiza o link do botão de abrir o WhatsApp
          const waLink = successCard.querySelector(".btn-open-wa");
          if (waLink) {
            waLink.href = whatsappUrl;
          }

          formElement.style.display = "none";
          successCard.style.display = "block";
        }

        // Tenta abrir o WhatsApp automaticamente em nova aba
        try {
          const win = window.open(whatsappUrl, "_blank");
          if (!win || win.closed || typeof win.closed === "undefined") {
            // Se o navegador bloquear popup, o botão na tela de sucesso está pronto para o clique
          }
        } catch (err) {
          console.warn("Popup bloqueado:", err);
        }
      }, 600);
    });

    // Botão de reiniciar formulário na tela de sucesso
    const container = formElement.closest(".contact-form-container, .contact-modal-body");
    const resetBtn = container?.querySelector(".btn-reset-form");
    resetBtn?.addEventListener("click", () => {
      const successCard = container?.querySelector(".form-success-card");
      if (successCard) {
        successCard.style.display = "none";
        formElement.style.display = "flex";
        formElement.reset();
        formElement.querySelectorAll(".has-error").forEach((el) => el.classList.remove("has-error"));
        const firstInput = formElement.querySelector("input");
        firstInput?.focus();
      }
    });
  }

  function escapeHtml(str) {
    if (!str) return "";
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  // --------------------------------------------------------------------------
  // Controle do Modal de Contato
  // --------------------------------------------------------------------------
  const modalBackdrop = document.getElementById("contact-modal");
  let lastActiveElement = null;

  function openContactModal() {
    if (!modalBackdrop) {
      // Se não houver modal na página, redireciona suavemente para contato.html
      window.location.href = "contato.html";
      return;
    }

    lastActiveElement = document.activeElement;
    modalBackdrop.classList.add("is-open");
    modalBackdrop.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";

    // Foco no primeiro campo após a animação
    setTimeout(() => {
      const firstInput = modalBackdrop.querySelector('input[name="name"]');
      firstInput?.focus();
    }, 200);
  }

  function closeContactModal() {
    if (!modalBackdrop) return;
    modalBackdrop.classList.remove("is-open");
    modalBackdrop.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";

    if (lastActiveElement && typeof lastActiveElement.focus === "function") {
      lastActiveElement.focus();
    }
  }

  // Inicialização geral ao carregar a página
  document.addEventListener("DOMContentLoaded", () => {
    // Inicializa formulários presentes no DOM
    document.querySelectorAll(".contact-form").forEach(setupContactForm);

    // Conecta botões e links que abrem o modal
    document.querySelectorAll("[data-open-contact-modal]").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        // Se o usuário clicar com Ctrl / Cmd ou botão do meio, deixa abrir em nova aba
        if (e.metaKey || e.ctrlKey || e.button === 1) return;
        e.preventDefault();
        openContactModal();
      });
    });

    // Conecta botões que fecham o modal
    document.querySelectorAll("[data-close-contact-modal]").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        closeContactModal();
      });
    });

    // Fechar ao clicar fora do diálogo (no backdrop)
    modalBackdrop?.addEventListener("click", (e) => {
      if (e.target === modalBackdrop) {
        closeContactModal();
      }
    });

    // Fechar com tecla Escape
    window.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && modalBackdrop?.classList.contains("is-open")) {
        closeContactModal();
      }
    });

    // Se a URL contiver o hash #contato-modal ou ?contato=abrir, abre direto
    if (window.location.hash === "#contato-modal" || window.location.search.includes("contato=1")) {
      setTimeout(openContactModal, 300);
    }
  });

  // Exporta para escopo global caso precise chamar manualmente
  window.BrisoftContact = {
    openModal: openContactModal,
    closeModal: closeContactModal
  };
})();
