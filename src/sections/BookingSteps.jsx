import { useState } from "react";
import { motion } from "framer-motion";
import { CalendarDays, HelpCircle } from "lucide-react";
import ChoiceGroup from "../components/ChoiceGroup";
import { appointmentPage, todayIso, UNSURE_SERVICE } from "../lib/appointmentData";
import { describeDays, getBranchHours } from "../lib/hours";
import { fillTemplate } from "../lib/servicesData";

const { steps, fields } = appointmentPage;
const EASE = [0.22, 1, 0.36, 1];

/* Each panel's rows arrive a beat behind the panel itself, so a step reads as
   assembling rather than as the card being replaced. The variants are named
   to match the panel's, which is what lets framer stagger them. */
const rowVariants = {
  enter: { opacity: 0, y: 12 },
  center: { opacity: 1, y: 0, transition: { duration: 0.42, ease: EASE } },
  exit: { opacity: 0 },
};

/* A wrapper around a chip group staggers the chips inside it. */
const groupVariants = {
  enter: { opacity: 0, y: 12 },
  center: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.42, ease: EASE, staggerChildren: 0.035, delayChildren: 0.04 },
  },
  exit: { opacity: 0 },
};

const stillRows = {
  enter: { opacity: 1 },
  center: { opacity: 1, transition: { duration: 0 } },
  exit: { opacity: 0 },
};

function useRows(still) {
  return still ? stillRows : rowVariants;
}

function useGroup(still) {
  return still ? stillRows : groupVariants;
}

function StepHead({ step, still }) {
  const rows = useRows(still);
  return (
    <motion.header className="ap-step__head" variants={rows}>
      <h2 className="ap-step__title">{step.title}</h2>
      <p className="ap-step__lede">{step.lede}</p>
    </motion.header>
  );
}

function FieldError({ id, message }) {
  if (!message) return null;
  return (
    <span className="ap-field__error" id={id} role="alert">
      {message}
    </span>
  );
}

/* ---------- 1. who ---------- */

export function WhoStep({ register, errors, phoneValue, still }) {
  const rows = useRows(still);
  const international = phoneValue.trim().startsWith("+");
  return (
    <>
      <StepHead step={steps.who} still={still} />
      <motion.div className="ap-field" variants={rows}>
        <label className="ap-field__label" htmlFor="ap-name">
          {fields.name.label}
        </label>
        <input
          id="ap-name"
          className="ap-input"
          type="text"
          autoComplete="name"
          autoCapitalize="words"
          placeholder={fields.name.placeholder}
          aria-invalid={errors.name ? "true" : undefined}
          aria-describedby={errors.name ? "ap-name-error" : undefined}
          {...register("name")}
        />
        <FieldError id="ap-name-error" message={errors.name?.message} />
      </motion.div>
      <motion.div className="ap-field" variants={rows}>
        <label className="ap-field__label" htmlFor="ap-phone">
          {fields.phone.label}
        </label>
        <div className="ap-input-wrap" data-intl={international ? "true" : undefined}>
          <span className="ap-input__prefix" aria-hidden="true">
            {fields.phone.prefix}
          </span>
          <input
            id="ap-phone"
            className="ap-input"
            type="tel"
            inputMode="tel"
            autoComplete="tel-national"
            placeholder={fields.phone.placeholder}
            aria-invalid={errors.phone ? "true" : undefined}
            aria-describedby={errors.phone ? "ap-phone-error" : "ap-phone-hint"}
            {...register("phone")}
          />
        </div>
        <FieldError id="ap-phone-error" message={errors.phone?.message} />
        {!errors.phone ? (
          <span className="ap-field__hint" id="ap-phone-hint">
            {fields.phone.hint}
          </span>
        ) : null}
      </motion.div>
    </>
  );
}

/* ---------- 2. where ---------- */

export function WhereStep({ items, value, onChange, still }) {
  const group = useGroup(still);
  return (
    <>
      <StepHead step={steps.where} still={still} />
      <motion.div variants={group}>
        <ChoiceGroup
          id="ap-branch"
          shape="row"
          groups={[
            {
              options: items.map((branch) => ({
                id: branch.slug,
                name: branch.name,
                locality: branch.locality,
                headOffice: branch.isHeadquarters,
              })),
            },
          ]}
          value={value}
          onChange={onChange}
          renderOption={(option) => (
            <>
              <span className="ap-chip__title">
                {option.name}
                {option.headOffice ? <em>{fields.branch.headOfficeTag}</em> : null}
              </span>
              <span className="ap-chip__sub">{option.locality}</span>
            </>
          )}
        />
      </motion.div>
    </>
  );
}

/* ---------- 3. what ---------- */

export function WhatStep({ groups, value, onChange, error, still }) {
  const group = useGroup(still);
  const withUnsure = [
    ...groups,
    {
      id: "unsure",
      options: [{ id: UNSURE_SERVICE, title: fields.service.unsureLabel, unsure: true }],
    },
  ];
  return (
    <>
      <StepHead step={steps.what} still={still} />
      <motion.div variants={group}>
        <ChoiceGroup
          id="ap-service"
          shape="row"
          groups={withUnsure}
          value={value}
          onChange={onChange}
          describedBy={error ? "ap-service-error" : undefined}
          renderOption={(option) => (
            <>
              <span className="ap-chip__title">
                {option.unsure ? <HelpCircle size={16} aria-hidden="true" /> : null}
                {option.title}
              </span>
              {option.unsure ? (
                <span className="ap-chip__sub">{fields.service.unsureHint}</span>
              ) : null}
            </>
          )}
        />
        <FieldError id="ap-service-error" message={error} />
      </motion.div>
    </>
  );
}

/* ---------- 4. when ---------- */

const ANY = "any";
const PICK = "pick";

/* Why a day is missing from the rail is the chosen hospital's own fact - its
   closed days and what it does on them - so the note under the rail is built
   from its `hours` block, and a hospital open every day gets no note. */
function closedDaysNote(branch) {
  const hours = getBranchHours(branch);
  if (!hours.closedDays.length || !hours.closedNote) return "";
  const note = hours.closedNote.charAt(0).toLowerCase() + hours.closedNote.slice(1);
  return fillTemplate(fields.date.closedNote, {
    closed: describeDays(hours.closedDays),
    branch: branch.name,
    closedNote: note,
  });
}

export function WhenStep({ branch, days, date, onDate, daypart, onDaypart, error, still }) {
  const group = useGroup(still);
  const closedNote = closedDaysNote(branch);
  const listed = days.some((day) => day.iso === date);
  const [picking, setPicking] = useState(Boolean(date) && !listed);
  const custom = picking || (Boolean(date) && !listed);
  const chosen = custom ? PICK : date || ANY;

  const chooseDay = (id) => {
    if (id === ANY) {
      setPicking(false);
      onDate("");
      return;
    }
    if (id === PICK) {
      setPicking(true);
      if (listed) onDate("");
      return;
    }
    setPicking(false);
    onDate(id);
  };

  const dayOptions = [
    { id: ANY, any: true, label: fields.date.anyLabel },
    ...days.map((day) => ({ id: day.iso, ...day })),
    { id: PICK, pick: true, label: fields.date.pickLabel },
  ];

  const daypartOptions = [
    { id: ANY, label: fields.daypart.anyLabel },
    ...fields.daypart.options,
  ];

  return (
    <>
      <StepHead step={steps.when} still={still} />
      <motion.div className="ap-when" variants={group}>
        <ChoiceGroup
          id="ap-date"
          label={fields.date.label}
          shape="tile"
          groups={[{ options: dayOptions }]}
          value={chosen}
          onChange={chooseDay}
          describedBy={error ? "ap-date-error" : closedNote ? "ap-date-note" : undefined}
          renderOption={(option) =>
            option.any || option.pick ? (
              <span className="ap-tile ap-tile--word">
                {option.pick ? <CalendarDays size={18} aria-hidden="true" /> : null}
                <span>{option.label}</span>
              </span>
            ) : (
              <span className="ap-tile">
                <span className="ap-tile__weekday">{option.relative || option.weekday}</span>
                <span className="ap-tile__day">{option.day}</span>
                <span className="ap-tile__month">
                  {option.relative ? `${option.weekday} ${option.month}` : option.month}
                </span>
              </span>
            )
          }
        />
        {custom ? (
          <motion.div
            className="ap-field ap-field--date"
            initial={still ? false : { opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: still ? 0 : 0.3, ease: EASE }}
          >
            <label className="ap-field__label" htmlFor="ap-date-input">
              {fields.date.pickLabel}
            </label>
            <input
              id="ap-date-input"
              className="ap-input"
              type="date"
              min={todayIso()}
              value={date}
              onChange={(event) => onDate(event.target.value)}
              aria-invalid={error ? "true" : undefined}
              aria-describedby={error ? "ap-date-error" : undefined}
            />
          </motion.div>
        ) : null}
        <FieldError id="ap-date-error" message={error} />
        {closedNote ? (
          <p className="ap-field__hint" id="ap-date-note">
            {closedNote}
          </p>
        ) : null}
      </motion.div>

      <motion.div variants={group}>
        <ChoiceGroup
          id="ap-daypart"
          label={fields.daypart.label}
          shape="segment"
          groups={[{ options: daypartOptions }]}
          value={daypart || ANY}
          onChange={(id) => onDaypart(id === ANY ? "" : id)}
          renderOption={(option) => (
            <>
              <span className="ap-chip__title">{option.label}</span>
              {option.range ? <span className="ap-chip__sub">{option.range}</span> : null}
            </>
          )}
        />
      </motion.div>
    </>
  );
}

/* ---------- 5. send ---------- */

export function SendStep({ register, errors, messageValue, still, children }) {
  const rows = useRows(still);
  const max = fields.message.maxLength;
  return (
    <>
      <StepHead step={steps.send} still={still} />
      <motion.div className="ap-field" variants={rows}>
        <label className="ap-field__label" htmlFor="ap-message">
          {fields.message.label}
          <span className="ap-field__count" aria-hidden="true">
            {messageValue.length}/{max}
          </span>
        </label>
        <textarea
          id="ap-message"
          className="ap-input ap-input--area"
          rows={3}
          maxLength={max + 20}
          placeholder={fields.message.placeholder}
          aria-invalid={errors.message ? "true" : undefined}
          aria-describedby={errors.message ? "ap-message-error" : undefined}
          {...register("message")}
        />
        <FieldError id="ap-message-error" message={errors.message?.message} />
      </motion.div>
      {children ? <motion.div variants={rows}>{children}</motion.div> : null}
    </>
  );
}
