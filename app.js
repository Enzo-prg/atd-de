const LOGIN_USER = "reviewer";
const LOGIN_PASS = "EeDemo2024";

document.querySelector("#loginBtn").addEventListener("click", () => {
  const user = document.querySelector("#loginUser").value.trim();
  const pass = document.querySelector("#loginPass").value;
  const error = document.querySelector("#loginError");
  if (user === LOGIN_USER && pass === LOGIN_PASS) {
    document.querySelector("#loginOverlay").remove();
    document.querySelector("#appShell").removeAttribute("hidden");
  } else {
    error.hidden = false;
  }
});

document.querySelector("#loginPass").addEventListener("keydown", (e) => {
  if (e.key === "Enter") document.querySelector("#loginBtn").click();
});

const fields = {
  token: document.querySelector("#token"),
  graphVersion: document.querySelector("#graphVersion"),
  phoneNumberId: document.querySelector("#phoneNumberId"),
  recipientPhone: document.querySelector("#recipientPhone"),
  templateName: document.querySelector("#templateName"),
  languageCode: document.querySelector("#languageCode")
};

const endpointPreview = document.querySelector("#endpointPreview");
const headersPreview = document.querySelector("#headersPreview");
const bodyPreview = document.querySelector("#bodyPreview");
const responsePreview = document.querySelector("#responsePreview");
const statusPill = document.querySelector("#statusPill");
const chatWindow = document.querySelector("#chatWindow");
const simulateButton = document.querySelector("#simulateButton");
const clearButton = document.querySelector("#clearButton");
const copyButton = document.querySelector("#copyButton");

function getState() {
  const graphVersion = fields.graphVersion.value.trim() || "v23.0";
  const phoneNumberId = fields.phoneNumberId.value.trim() || "{phone_number_id}";
  const recipientPhone = fields.recipientPhone.value.trim() || "{recipient_phone}";
  const templateName = fields.templateName.value.trim() || "hello_world";
  const languageCode = fields.languageCode.value.trim() || "en_US";
  const token = fields.token.value.trim() || "{temporary_token}";

  const endpoint = `https://graph.facebook.com/${graphVersion}/${phoneNumberId}/messages`;
  const headers = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json"
  };
  const body = {
    messaging_product: "whatsapp",
    to: recipientPhone,
    type: "template",
    template: {
      name: templateName,
      language: {
        code: languageCode
      }
    }
  };

  return { endpoint, headers, body, recipientPhone, templateName };
}

function renderPayload() {
  const { endpoint, headers, body } = getState();
  endpointPreview.textContent = `POST ${endpoint}`;
  headersPreview.textContent = JSON.stringify(headers, null, 2);
  bodyPreview.textContent = JSON.stringify(body, null, 2);
}

function addBubble(text, type = "bot") {
  const bubble = document.createElement("div");
  bubble.className = `bubble ${type}`;
  bubble.innerHTML = text;
  chatWindow.appendChild(bubble);
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

function buildDemoResponse() {
  const { recipientPhone } = getState();
  const rand = () => Math.random().toString(36).slice(2);
  const raw = btoa(`${recipientPhone}${rand()}${rand()}`).replace(/=/g, "");
  return {
    messaging_product: "whatsapp",
    contacts: [
      {
        input: recipientPhone,
        wa_id: recipientPhone
      }
    ],
    messages: [
      {
        id: `wamid.HBgL${raw}FQIAERgSM${rand().toUpperCase()}AA==`
      }
    ]
  };
}

async function simulateSend() {
  const { templateName, recipientPhone, endpoint, headers, body } = getState();
  simulateButton.disabled = true;
  statusPill.textContent = "Calling API...";
  addBubble(`Sending template <strong>${templateName}</strong> to ${recipientPhone}`, "bot");

  try {
    const result = await fetch(endpoint, {
      method: "POST",
      headers,
      body: JSON.stringify(body)
    });
    const data = await result.json();
    responsePreview.textContent = JSON.stringify(data, null, 2);
    statusPill.textContent = result.ok ? "Message sent" : "API error";
    addBubble(
      result.ok
        ? `WhatsApp Cloud API accepted the request. Message ID: <strong>${data.messages?.[0]?.id ?? ""}</strong>`
        : "API returned an error — check credentials and phone number.",
      "system"
    );
  } catch (err) {
    responsePreview.textContent = JSON.stringify({ error: err.message }, null, 2);
    statusPill.textContent = "Request failed";
    addBubble("Request failed. Check credentials and try again.", "system");
  }

  simulateButton.disabled = false;
}

function clearStatus() {
  responsePreview.textContent = "Awaiting API response...";
  statusPill.textContent = "";
}

async function copyPayload() {
  const { endpoint, headers, body } = getState();
  const text = JSON.stringify({ endpoint, method: "POST", headers, body }, null, 2);
  await navigator.clipboard.writeText(text);
  copyButton.textContent = "Copied";
  setTimeout(() => {
    copyButton.textContent = "Copy";
  }, 1200);
}

Object.values(fields).forEach((field) => {
  field.addEventListener("input", renderPayload);
  field.addEventListener("change", renderPayload);
});

simulateButton.addEventListener("click", simulateSend);
clearButton.addEventListener("click", clearStatus);
copyButton.addEventListener("click", copyPayload);

renderPayload();
