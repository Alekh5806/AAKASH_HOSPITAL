import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Clock3, Mail, MapPin, MessageCircle, Navigation, Phone, Send } from "lucide-react";
import { useForm, useWatch } from "react-hook-form";
import { BranchJsonLd, BreadcrumbJsonLd } from "../components/JsonLd";
import LazyMapFrame from "../components/LazyMapFrame";
import SEO from "../components/SEO";
import SmartImage from "../components/SmartImage";
import { branches, site } from "../lib/coreData";
import { services } from "../lib/servicesData";
import { appointmentSchema } from "../lib/schemas";
import { buildWhatsAppLink, submitAppointment } from "../lib/submitAppointment";

const defaultBranch = branches.items[0];

function cleanTel(number) {
  return number.startsWith("+") ? number.replace(/[^\d+]/g, "") : number.replace(/\D/g, "");
}

function getPrimaryPhone(branch) {
  return (
    branch.phoneGroups.find((group) => group.label.toLowerCase().includes("opd"))?.numbers[0] ??
    branch.phoneGroups[0]?.numbers[0] ??
    ""
  );
}

function buildMapLink(branch) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    `Aakash Eye Hospital ${branch.name} ${branch.address}`,
  )}`;
}

function ScheduleMapIcon() {
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true" focusable="false">
      <rect x="9" y="10" width="30" height="29" rx="7" fill="#ffffff" />
      <path
        d="M16 8v6M32 8v6M15 15h18"
        fill="none"
        stroke="var(--color-brand-blue)"
        strokeLinecap="round"
        strokeWidth="3.2"
      />
      <path
        d="M16 23h8M16 30h5"
        fill="none"
        stroke="var(--color-accent-magenta)"
        strokeLinecap="round"
        strokeWidth="3"
      />
      <circle cx="31" cy="30" r="8" fill="var(--color-brand-blue)" />
      <path
        d="M31 25.5v5l3.4 2"
        fill="none"
        stroke="#ffffff"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2.6"
      />
    </svg>
  );
}

function DirectionsMapIcon() {
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true" focusable="false">
      <path
        d="M9 14.8 19 11l10 3.8 10-3.8v24.2L29 39l-10-3.8L9 39V14.8Z"
        fill="#ffffff"
        stroke="rgba(7, 59, 120, 0.18)"
        strokeLinejoin="round"
        strokeWidth="2"
      />
      <path d="M19 11v24.2M29 14.8V39" stroke="rgba(7, 59, 120, 0.13)" strokeWidth="2" />
      <path
        d="M31 11.5c-5 0-9 3.8-9 8.8 0 6.3 9 15.7 9 15.7s9-9.4 9-15.7c0-5-4-8.8-9-8.8Z"
        fill="var(--color-accent-magenta)"
      />
      <circle cx="31" cy="20.2" r="3.5" fill="#ffffff" />
      <path
        d="M13.5 28.5c5.8-3.8 11.2 3.9 17-1.2"
        fill="none"
        stroke="var(--color-teal)"
        strokeLinecap="round"
        strokeWidth="3"
      />
    </svg>
  );
}

function MobileDeskIcon() {
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true" focusable="false">
      <rect x="14" y="6.5" width="20" height="35" rx="6" fill="#ffffff" />
      <path
        d="M20.5 11h7M21.5 36.5h5"
        fill="none"
        stroke="var(--color-brand-blue)"
        strokeLinecap="round"
        strokeWidth="2.8"
      />
      <rect x="17.5" y="15.5" width="13" height="17" rx="3" fill="rgba(10, 143, 149, 0.11)" />
      <circle cx="33" cy="31" r="9" fill="var(--color-brand-blue)" />
      <path
        d="M29.8 27.1c1.3 4.1 3.1 5.9 7.1 7.1l1.6-2.1c.3-.4.2-1-.3-1.2l-2.5-1.2c-.4-.2-.9-.1-1.2.3l-.7.9a9.6 9.6 0 0 1-2.7-2.7l.9-.7c.4-.3.5-.8.3-1.2l-1.2-2.5c-.2-.5-.8-.6-1.2-.3l-2.1 1.6Z"
        fill="#ffffff"
      />
    </svg>
  );
}

export default function ContactPage() {
  const [status, setStatus] = useState({ type: "idle", message: "" });
  const {
    register,
    handleSubmit,
    reset,
    control,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(appointmentSchema),
    defaultValues: {
      name: "",
      phone: "",
      email: "",
      branch: defaultBranch.slug,
      service: "",
      preferredDate: "",
      message: "",
      botcheck: "",
    },
  });
  const values = useWatch({ control });
  const selectedBranch =
    branches.items.find((branch) => branch.slug === values.branch) ?? defaultBranch;
  const selectedPhone = getPrimaryPhone(selectedBranch);
  const whatsappLink = buildWhatsAppLink(values, selectedBranch);

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
        service: "",
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
      <SEO meta={site.pageSeo.contact} />
      <BranchJsonLd />
      <BreadcrumbJsonLd
        items={[
          { name: "Home", href: "/" },
          { name: "Contact", href: "/contact" },
        ]}
      />

      <section className="contact-hero" aria-labelledby="contact-hero-title">
        <div className="container contact-hero__inner">
          <div className="contact-hero__copy">
            <span className="eyebrow">Contact Aakash Eye Hospital</span>
            <h1 id="contact-hero-title">Reach the right eye care team quickly</h1>
            <p>
              Call, message, book a visit, or find directions for our Visnagar, Ahmedabad, and
              Bharuch branches from one calm, patient-first contact desk.
            </p>
            <div className="contact-hero__actions">
              <a
                className="button-link button-link--primary"
                href={`tel:${cleanTel(selectedPhone)}`}
              >
                <Phone size={18} aria-hidden="true" />
                <span>Call {selectedBranch.name}</span>
              </a>
              <a
                className="button-link button-link--secondary"
                href={whatsappLink}
                target="_blank"
                rel="noreferrer"
              >
                <MessageCircle size={18} aria-hidden="true" />
                <span>WhatsApp Booking</span>
              </a>
            </div>
          </div>

          <aside className="contact-hero__panel" aria-label="Selected branch quick details">
            <span className="contact-hero__icon">
              <MapPin size={22} aria-hidden="true" />
            </span>
            <small>Selected branch</small>
            <h2>{selectedBranch.name}</h2>
            <p>{selectedBranch.address}</p>
            <div className="contact-hero__panel-actions">
              <a href={buildMapLink(selectedBranch)} target="_blank" rel="noreferrer">
                <Navigation size={16} aria-hidden="true" />
                Directions
              </a>
              <a href={`mailto:${selectedBranch.email}`}>
                <Mail size={16} aria-hidden="true" />
                Email
              </a>
            </div>
          </aside>
        </div>
      </section>

      <section className="section contact-command">
        <div className="container">
          <div className="contact-command__head">
            <div className="section-heading">
              <span className="eyebrow">Direct access</span>
              <h2>Choose your branch and connect with the right desk</h2>
              <p>
                Select the nearest branch to update the call line, email, address, booking form, and
                map details across the page.
              </p>
            </div>
            <div
              className="segmented-control contact-command__tabs"
              role="tablist"
              aria-label="Select branch"
            >
              {branches.items.map((branch) => (
                <button
                  key={branch.slug}
                  type="button"
                  aria-selected={selectedBranch.slug === branch.slug}
                  onClick={() =>
                    setValue("branch", branch.slug, { shouldDirty: true, shouldTouch: true })
                  }
                >
                  {branch.name}
                </button>
              ))}
            </div>
          </div>

          <div className="contact-command__grid">
            <article className="contact-command__card card-hover">
              <span className="contact-command__icon">
                <Phone size={22} aria-hidden="true" />
              </span>
              <small>Call branch</small>
              <h3>{selectedPhone}</h3>
              <p>
                Speak to the OPD or front desk team at {selectedBranch.name} for immediate guidance.
              </p>
              <a href={`tel:${cleanTel(selectedPhone)}`}>Call now</a>
            </article>

            <article className="contact-command__card card-hover">
              <span className="contact-command__icon">
                <Mail size={22} aria-hidden="true" />
              </span>
              <small>Email</small>
              <h3>{selectedBranch.email}</h3>
              <p>
                Use email when you want written follow-up, document sharing, or non-urgent
                coordination.
              </p>
              <a href={`mailto:${selectedBranch.email}`}>Send email</a>
            </article>

            <article className="contact-command__card card-hover">
              <span className="contact-command__icon">
                <MapPin size={22} aria-hidden="true" />
              </span>
              <small>Visit branch</small>
              <h3>{selectedBranch.name}</h3>
              <p>{selectedBranch.address}</p>
              <a href={buildMapLink(selectedBranch)} target="_blank" rel="noreferrer">
                Open directions
              </a>
            </article>
          </div>
        </div>
      </section>

      <section className="section contact-booking">
        <div className="container">
          <div className="contact-booking__panel">
            <div className="contact-booking__media">
              <SmartImage
                src="/assets/media/stock/vision-consult-pexels-ai25studio-6749756.jpg"
                alt="Professional eye care consultation environment"
                className="contact-booking__image"
                loading="eager"
              />
              <div className="contact-booking__media-badge">
                <Phone size={18} aria-hidden="true" />
                <div>
                  <strong>{selectedPhone}</strong>
                  <span>{selectedBranch.name} front desk</span>
                </div>
              </div>
              <div className="contact-booking__media-copy">
                <span className="eyebrow">Appointment desk</span>
                <strong>Clear support before your visit</strong>
                <p>
                  Choose the branch and department. The care team will confirm the next step with
                  you.
                </p>
              </div>
            </div>

            <div className="contact-booking__content">
              <div className="contact-booking__content-head">
                <span className="eyebrow">Book an appointment</span>
                <h2>Request your visit with the right branch already selected</h2>
                <p>
                  Keep the essentials simple: patient details, preferred branch, care department,
                  and a short note for the appointment team.
                </p>
              </div>
              <div className="contact-booking__branch-meta">
                <div>
                  <strong>{selectedBranch.name}</strong>
                  <span>{selectedBranch.hoursLabel}</span>
                </div>
                <a href={whatsappLink} target="_blank" rel="noreferrer">
                  <MessageCircle size={16} aria-hidden="true" />
                  WhatsApp instead
                </a>
              </div>

              <div className="contact-booking__care-path" aria-label="Booking support details">
                <div>
                  <Clock3 size={17} aria-hidden="true" />
                  <span>Branch schedule confirmed by team</span>
                </div>
                <div>
                  <MapPin size={17} aria-hidden="true" />
                  <span>Directions available after branch selection</span>
                </div>
              </div>

              <form
                className="appointment-form contact-booking__form"
                onSubmit={handleSubmit(onSubmit)}
                noValidate
              >
                <div className="contact-booking__form-head">
                  <div>
                    <strong>Appointment request</strong>
                    <span>
                      Share your details and our branch team will contact you to confirm the visit.
                    </span>
                  </div>
                  <em>{selectedBranch.name}</em>
                </div>
                <input
                  type="text"
                  tabIndex="-1"
                  autoComplete="off"
                  className="honeypot"
                  {...register("botcheck")}
                />
                <div className="field-grid">
                  <label>
                    <span>Patient Name</span>
                    <input
                      type="text"
                      autoComplete="name"
                      placeholder="Enter full name"
                      {...register("name")}
                    />
                    {errors.name ? <small>{errors.name.message}</small> : null}
                  </label>
                  <label>
                    <span>Mobile Number</span>
                    <input
                      type="tel"
                      autoComplete="tel"
                      placeholder="Enter phone number"
                      {...register("phone")}
                    />
                    {errors.phone ? <small>{errors.phone.message}</small> : null}
                  </label>
                  <label>
                    <span>Email Address</span>
                    <input
                      type="email"
                      autoComplete="email"
                      placeholder="Optional"
                      {...register("email")}
                    />
                    {errors.email ? <small>{errors.email.message}</small> : null}
                  </label>
                  <label>
                    <span>Preferred Branch</span>
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
                    <span>Department</span>
                    <select {...register("service")}>
                      <option value="" disabled>
                        Select department
                      </option>
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
                    <input type="date" autoComplete="off" {...register("preferredDate")} />
                    {errors.preferredDate ? <small>{errors.preferredDate.message}</small> : null}
                  </label>
                </div>
                <label className="contact-booking__message-field">
                  <span>Message</span>
                  <textarea
                    rows="5"
                    placeholder="Tell us briefly about your concern or preferred time."
                    {...register("message")}
                  />
                  {errors.message ? <small>{errors.message.message}</small> : null}
                </label>
                <div className="appointment-form__actions contact-booking__actions">
                  <button
                    className="button-link button-link--primary"
                    type="submit"
                    disabled={isSubmitting}
                  >
                    <span>{isSubmitting ? "Sending" : "Send Appointment Request"}</span>
                    <Send size={18} aria-hidden="true" />
                  </button>
                  <a
                    className="button-link button-link--secondary"
                    href={whatsappLink}
                    target="_blank"
                    rel="noreferrer"
                  >
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
            </div>
          </div>
        </div>
      </section>

      <section className="section contact-map">
        <div className="container">
          <div className="contact-map__head">
            <div className="section-heading">
              <span className="eyebrow">Find the branch</span>
              <h2>Map, directions, and branch numbers</h2>
              <p>
                Check the selected branch location, call the relevant desk, or open directions
                before your visit.
              </p>
            </div>
          </div>

          <div className="contact-map__layout">
            <div className="contact-map__frame">
              <div className="contact-map__frame-top">
                <a href={buildMapLink(selectedBranch)} target="_blank" rel="noreferrer">
                  <Navigation size={15} aria-hidden="true" />
                  Full map
                </a>
              </div>
              <LazyMapFrame
                title={`${selectedBranch.name} branch map`}
                src={selectedBranch.mapEmbed}
              />
            </div>

            <aside className="contact-map__aside" aria-label="Selected branch details">
              <div className="contact-map__aside-head">
                <span className="eyebrow">Current branch</span>
                <h3>{selectedBranch.name}</h3>
                <p>{selectedBranch.address}</p>
              </div>

              <div className="contact-map__meta">
                <div className="contact-map__meta-card">
                  <span className="contact-map__meta-icon contact-map__meta-icon--schedule">
                    <ScheduleMapIcon />
                  </span>
                  <div>
                    <strong>Branch schedule</strong>
                    <span>{selectedBranch.hoursLabel}</span>
                  </div>
                </div>
                <a
                  className="contact-map__meta-card contact-map__meta-card--link"
                  href={buildMapLink(selectedBranch)}
                  target="_blank"
                  rel="noreferrer"
                >
                  <span className="contact-map__meta-icon contact-map__meta-icon--maps">
                    <DirectionsMapIcon />
                  </span>
                  <div>
                    <strong>Google Maps</strong>
                    <span>Open directions to {selectedBranch.name}</span>
                  </div>
                </a>
              </div>

              <div className="contact-map__directory">
                <div className="contact-map__directory-head">
                  <span className="contact-map__directory-icon">
                    <MobileDeskIcon />
                  </span>
                  <div>
                    <strong>Branch numbers</strong>
                    <span>Call the relevant hospital desk directly.</span>
                  </div>
                </div>

                <div className="contact-map__phones">
                  {selectedBranch.phoneGroups.map((group) => (
                    <div className="contact-map__phone-group" key={group.label}>
                      <div className="contact-map__phone-head">
                        <strong>{group.label}</strong>
                      </div>
                      <div className="contact-map__phone-list">
                        {group.numbers.map((number) => (
                          <a href={`tel:${cleanTel(number)}`} key={number}>
                            <Phone size={14} aria-hidden="true" />
                            <em>{number}</em>
                          </a>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="contact-map__actions">
                <a href={`tel:${cleanTel(selectedPhone)}`}>
                  <Phone size={16} aria-hidden="true" />
                  Call branch
                </a>
                <a href={whatsappLink} target="_blank" rel="noreferrer">
                  <MessageCircle size={16} aria-hidden="true" />
                  WhatsApp
                </a>
              </div>
            </aside>
          </div>
        </div>
      </section>
    </>
  );
}
