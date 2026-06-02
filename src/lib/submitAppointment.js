const WEB3FORMS_ENDPOINT = "https://api.web3forms.com/submit";

export async function submitAppointment(values, branch) {
  const accessKey = import.meta.env.VITE_WEB3FORMS_ACCESS_KEY;

  if (!accessKey) {
    throw new Error("Missing VITE_WEB3FORMS_ACCESS_KEY in the environment.");
  }

  const formData = new FormData();
  formData.append("access_key", accessKey);
  formData.append("subject", `Appointment request - ${branch.name}`);
  formData.append("from_name", "Aakash Eye Hospital Website");
  formData.append("name", values.name);
  formData.append("phone", values.phone);
  formData.append("email", values.email || "Not provided");
  formData.append("branch", branch.name);
  formData.append("service", values.service);
  formData.append("preferredDate", values.preferredDate);
  formData.append("message", values.message || "No additional message");
  formData.append("botcheck", values.botcheck || "");

  const response = await fetch(WEB3FORMS_ENDPOINT, {
    method: "POST",
    body: formData,
  });
  const result = await response.json();

  if (!response.ok || !result.success) {
    throw new Error(result.message || "Could not submit appointment request.");
  }

  return result;
}

export function buildWhatsAppLink(values, branch) {
  const lines = [
    "Hello Aakash Eye Hospital, I would like to book an appointment.",
    `Name: ${values.name || "-"}`,
    `Phone: ${values.phone || "-"}`,
    `Email: ${values.email || "-"}`,
    `Branch: ${branch.name}`,
    `Service: ${values.service || "-"}`,
    `Preferred date: ${values.preferredDate || "-"}`,
    `Message: ${values.message || "-"}`,
  ];

  return `https://wa.me/${branch.whatsappNumber}?text=${encodeURIComponent(lines.join("\n"))}`;
}
