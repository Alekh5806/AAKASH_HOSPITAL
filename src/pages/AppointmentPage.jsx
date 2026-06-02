import { useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { CalendarDays, MessageCircle, Send } from "lucide-react";
import { useForm, useWatch } from "react-hook-form";
import PageHeader from "../components/PageHeader";
import SEO from "../components/SEO";
import { branches, services, site } from "../lib/data";
import { appointmentSchema } from "../lib/schemas";
import { buildWhatsAppLink, submitAppointment } from "../lib/submitAppointment";

const defaultBranch = branches.items[0];

export default function AppointmentPage() {
  const [status, setStatus] = useState({ type: "idle", message: "" });
  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(appointmentSchema),
    defaultValues: {
      name: "",
      phone: "",
      email: "",
      branch: defaultBranch.slug,
      service: services.items[0]?.title ?? "",
      preferredDate: "",
      message: "",
      botcheck: "",
    },
  });
  const values = useWatch({ control });
  const selectedBranch =
    branches.items.find((branch) => branch.slug === values.branch) ?? defaultBranch;
  const whatsappLink = useMemo(
    () => buildWhatsAppLink(values, selectedBranch),
    [selectedBranch, values],
  );

  async function onSubmit(formValues) {
    setStatus({ type: "idle", message: "" });

    if (formValues.botcheck) {
      setStatus({ type: "error", message: "Submission could not be completed." });
      return;
    }

    try {
      await submitAppointment(formValues, selectedBranch);
      setStatus({
        type: "success",
        message: "Appointment request sent. Our team will contact you shortly.",
      });
      reset({
        name: "",
        phone: "",
        email: "",
        branch: selectedBranch.slug,
        service: services.items[0]?.title ?? "",
        preferredDate: "",
        message: "",
        botcheck: "",
      });
    } catch (error) {
      setStatus({
        type: "error",
        message: error.message || "Could not submit your request. Please try WhatsApp or call.",
      });
    }
  }

  return (
    <>
      <SEO meta={site.pageSeo.appointment} />
      <PageHeader
        eyebrow="Appointment"
        title="Book your eye care visit"
        description="Send a request to the team or start a WhatsApp booking with your selected branch."
      />
      <section className="section appointment-section">
        <div className="container appointment-section__grid">
          <form className="appointment-form" onSubmit={handleSubmit(onSubmit)} noValidate>
            <input type="text" tabIndex="-1" autoComplete="off" className="honeypot" {...register("botcheck")} />
            <div className="field-grid">
              <label>
                <span>Name</span>
                <input type="text" autoComplete="name" {...register("name")} />
                {errors.name ? <small>{errors.name.message}</small> : null}
              </label>
              <label>
                <span>Phone</span>
                <input type="tel" autoComplete="tel" {...register("phone")} />
                {errors.phone ? <small>{errors.phone.message}</small> : null}
              </label>
              <label>
                <span>Email</span>
                <input type="email" autoComplete="email" {...register("email")} />
                {errors.email ? <small>{errors.email.message}</small> : null}
              </label>
              <label>
                <span>Branch</span>
                <select {...register("branch")}>
                  {branches.items.map((branch) => (
                    <option value={branch.slug} key={branch.slug}>
                      {branch.name}
                    </option>
                  ))}
                </select>
                {errors.branch ? <small>{errors.branch.message}</small> : null}
              </label>
              <label>
                <span>Service / Department</span>
                <select {...register("service")}>
                  {services.items.map((service) => (
                    <option value={service.title} key={service.id}>
                      {service.title}
                    </option>
                  ))}
                </select>
                {errors.service ? <small>{errors.service.message}</small> : null}
              </label>
              <label>
                <span>Preferred Date</span>
                <input type="date" {...register("preferredDate")} />
                {errors.preferredDate ? <small>{errors.preferredDate.message}</small> : null}
              </label>
            </div>
            <label>
              <span>Message</span>
              <textarea rows="5" {...register("message")} />
              {errors.message ? <small>{errors.message.message}</small> : null}
            </label>
            <div className="appointment-form__actions">
              <button className="button-link button-link--primary" type="submit" disabled={isSubmitting}>
                <span>{isSubmitting ? "Sending" : "Submit Request"}</span>
                <Send size={18} aria-hidden="true" />
              </button>
              <a className="button-link button-link--secondary" href={whatsappLink} target="_blank" rel="noreferrer">
                <span>Book on WhatsApp</span>
                <MessageCircle size={18} aria-hidden="true" />
              </a>
            </div>
            {status.type !== "idle" ? (
              <p className={`form-status form-status--${status.type}`} role="status">
                {status.message}
              </p>
            ) : null}
          </form>

          <aside className="appointment-aside" aria-label="Selected branch details">
            <CalendarDays size={28} aria-hidden="true" />
            <h2>{selectedBranch.name}</h2>
            <p>{selectedBranch.address}</p>
            <div>
              {selectedBranch.phoneGroups.map((group) => (
                <div key={group.label}>
                  <strong>{group.label}</strong>
                  {group.numbers.map((number) => (
                    <span key={number}>{number}</span>
                  ))}
                </div>
              ))}
            </div>
          </aside>
        </div>
      </section>
    </>
  );
}
