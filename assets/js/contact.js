/**
 * Brisoft Desk - Lógica do Formulário da Página Dedicada (contato.html)
 * Responsável por:
 * - Máscara automática de telefone/WhatsApp: (XX) XXXXX-XXXX
 * - Validação inline amigável de campos
 * - Montagem da mensagem estruturada para a equipe comercial
 * - Redirecionamento direto para o WhatsApp oficial (5583981131352)
 * - Exibição de tela de sucesso rica com resumo dos dados enviados
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
    input.addEventListener("input", function () {
      const cursor = input.selectionStart;
      const prevLength = input.value.length;
      input.value = formatPhone(input.value);
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
      `Gostaria de solicitar uma demonstração e atendimento para minha empresa:`,
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

  function escapeHtml(str) {
    if (!str) return "";
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  // Configuração do formulário de contato
  function setupContactForm(formElement) {
    if (!formElement) return;

    const phoneInput = formElement.querySelector('input[name="phone"]');
    applyPhoneMask(phoneInput);

    // Validação inline ao sair do campo ou digitar
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

      // Validação do checkbox de consentimento
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

      setTimeout(() => {
        if (submitBtn) {
          submitBtn.classList.remove("loading");
          submitBtn.disabled = false;
        }

        const container = formElement.closest(".contact-form-container");
        const successCard = container?.querySelector(".form-success-card");

        if (successCard) {
          // Resumo dos dados enviados
          const summaryEl = successCard.querySelector(".success-data-summary");
          if (summaryEl) {
            summaryEl.innerHTML = `
              <div><strong>Nome:</strong> ${escapeHtml(data.name)} (${escapeHtml(data.company)})</div>
              <div><strong>WhatsApp:</strong> ${escapeHtml(data.phone)} | <strong>E-mail:</strong> ${escapeHtml(data.email)}</div>
              ${data.agents ? `<div><strong>Operação:</strong> ${escapeHtml(data.agents)} | ${escapeHtml(data.whatsapp_qty || "")}</div>` : ""}
            `;
          }

          // Link direto para o WhatsApp
          const waLink = successCard.querySelector(".btn-open-wa");
          if (waLink) {
            waLink.href = whatsappUrl;
          }

          formElement.style.display = "none";
          successCard.style.display = "block";
          successCard.scrollIntoView({ behavior: "smooth", block: "center" });
        }

        // Abre o WhatsApp oficial em nova aba
        try {
          window.open(whatsappUrl, "_blank");
        } catch (err) {
          console.warn("Navegador bloqueou abertura automática:", err);
        }
      }, 500);
    });

    // Botão para resetar formulário
    const container = formElement.closest(".contact-form-container");
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

  // Inicialização ao carregar a página
  document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll(".contact-form").forEach(setupContactForm);
  });
})();
