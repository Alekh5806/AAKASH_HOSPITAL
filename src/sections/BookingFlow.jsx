import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowLeft, ArrowRight, Check, MessageCircle, Phone } from "lucide-react";
import { useForm, useWatch } from "react-hook-form";
import { useSearchParams } from "react-router-dom";
import BookingSlip from "../components/BookingSlip";
import {
  appointmentPage,
  appointmentSchema,
  buildAppointmentMessage,
  describeDate,
  describeDaypart,
  describeService,
  getOpenDays,
  isStepComplete,
  parseMobile,
  STEP_FIELDS,
  STEP_IDS,
} from "../lib/appointmentData";
import {
  BRANCH_CHANGE_EVENT,
  buildWhatsApp,
  cleanTel,
  getPrimaryPhone,
  getStoredBranch,
  storeBranch,
} from "../lib/contact";
import { branches } from "../lib/coreData";
import { getBranchHours, getHoursRows } from "../lib/hours";
import { fillTemplate, servicePage, services } from "../lib/servicesData";
import { SendStep, WhatStep, WhenStep, WhereStep, WhoStep } from "./BookingSteps";

const { steps, nav, after, stepOfLabel } = appointmentPage;
const EASE = [0.22, 1, 0.36, 1];
const LAST = STEP_IDS.length - 1;
const SEND_INDEX = STEP_IDS.indexOf("send");
const TYPED_FIELDS = new Set(["name", "phone", "message"]);
const REQUIRED_STEPS = new Set(["who", "where", "what"]);
/* The slip line the reader is writing on at each step; the pen on the slip
   sits beside it. */
const ACTIVE_LINE = { who: "name", where: "branch", what: "service", when: "date", send: "message" };
/* The next dot takes its pulse as the rail's fill reaches it. */
const RAIL_HIT_MS = 320;
/* The slip sits beside the card wherever there is room for both. Below this
   the card takes the width and the slip becomes the last step's review. */
const STACKED_QUERY = "(max-width: 1023px)";

function subscribeToStacked(callback) {
  const query = window.matchMedia(STACKED_QUERY);
  query.addEventListener("change", callback);
  return () => query.removeEventListener("change", callback);
}

const serviceGroups = servicePage.categories
  .map((category) => ({
    id: category.id,
    label: category.label,
    options: services.items
      .filter((service) => service.category === category.id)
      .map((service) => ({ id: service.id, title: service.title })),
  }))
  .filter((group) => group.options.length);

function findBranch(slug) {
  return branches.items.find((branch) => branch.slug === slug);
}

/* The booking flow: five questions in one card, and the slip that writes
 * itself beside it.
 *
 * The reader answers one step at a time - who, where, what, when, a note -
 * and every answer lands on the appointment slip as a line of the message
 * that will be sent. The slip *is* the WhatsApp message, so there is never a
 * gap between what the reader sees and what goes: press Send and WhatsApp
 * opens with that text, addressed to that hospital's line. Nothing is sent
 * from here; the reader presses send in WhatsApp, and the hospital replies.
 *
 * The rail across the top is the map of the five steps and, once a step is
 * answered, its summary. A step already visited can be reopened from it; a
 * step ahead cannot be skipped to. Continue validates only the fields of the
 * step it leaves, so an error is always shown beside the thing it is about.
 *
 * The hospital is the header's hospital. It opens on the one stored for this
 * reader (or the one in the query, which the header has already adopted),
 * writes back through `storeBranch()` when changed here, and follows the
 * header if it moves - the number the slip is addressed to is always the one
 * at the top of the screen. */
export default function BookingFlow() {
  const shouldReduceMotion = useReducedMotion();
  const [searchParams] = useSearchParams();
  const stacked = useSyncExternalStore(
    subscribeToStacked,
    () => window.matchMedia(STACKED_QUERY).matches,
    () => false,
  );
  const requestedBranch = searchParams.get("branch");
  const requestedService = searchParams.get("service");
  const initialBranch = findBranch(requestedBranch) ?? getStoredBranch(branches.items);
  const initialService = services.items.some((service) => service.id === requestedService)
    ? requestedService
    : "";

  const {
    register,
    control,
    trigger,
    setValue,
    setFocus,
    getFieldState,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(appointmentSchema),
    mode: "onSubmit",
    reValidateMode: "onChange",
    defaultValues: {
      name: searchParams.get("name") ?? "",
      phone: "",
      branch: initialBranch.slug,
      service: initialService,
      preferredDate: "",
      daypart: "",
      message: "",
    },
  });
  const values = useWatch({ control });

  /* A typed field is validated when the reader leaves its step, not on every
     keystroke - but once it has shown an error, it re-checks as they type so
     the error clears the moment the value is right. */
  const field = (name) =>
    register(name, {
      onChange: () => {
        if (getFieldState(name).error) trigger(name);
      },
    });

  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [furthest, setFurthest] = useState(0);
  const [sent, setSent] = useState(false);
  const [serviceError, setServiceError] = useState("");
  const cardRef = useRef(null);
  const frameRef = useRef(null);
  const observerRef = useRef(null);
  const dotRefs = useRef({});
  const hitTimer = useRef(0);

  const branch = findBranch(values.branch) ?? initialBranch;
  /* The day rail is the chosen hospital's: its own closed days are skipped and
     today drops out at its own closing time, so the rail is rebuilt when the
     hospital changes. */
  const days = useMemo(() => getOpenDays(branch), [branch]);
  const service = services.items.find((item) => item.id === values.service);
  const stepId = STEP_IDS[step];
  const ready = appointmentSchema.safeParse(values).success;
  const complete = STEP_IDS.map((id) => isStepComplete(id, values));

  /* Follow the header while the reader is still on the page. */
  useEffect(() => {
    const follow = (event) => {
      if (findBranch(event.detail)) setValue("branch", event.detail);
    };
    window.addEventListener(BRANCH_CHANGE_EVENT, follow);
    return () => window.removeEventListener(BRANCH_CHANGE_EVENT, follow);
  }, [setValue]);

  const chooseBranch = (slug) => {
    setValue("branch", slug, { shouldValidate: true });
    storeBranch(slug);
  };

  const chooseService = (id) => {
    setValue("service", id, { shouldValidate: true });
    setServiceError("");
  };

  /* Moving between steps. A step further down the page than the top of the
     card scrolls the card back under the header, so the reader never lands
     halfway down a new step. */
  const go = useCallback(
    (next) => {
      setDirection(next >= step ? 1 : -1);
      setStep(next);
      setFurthest((current) => Math.max(current, next));
      /* Moving forward, the fill runs along the track and the dot it reaches
         takes a one-shot ring - progress is seen to arrive, not to switch. */
      window.clearTimeout(hitTimer.current);
      if (next > step && !shouldReduceMotion) {
        hitTimer.current = window.setTimeout(() => {
          const dot = dotRefs.current[next];
          if (!dot) return;
          dot.classList.remove("is-hit");
          void dot.offsetWidth;
          dot.classList.add("is-hit");
        }, RAIL_HIT_MS);
      }
      const card = cardRef.current;
      if (!card) return;
      const top = card.getBoundingClientRect().top;
      if (top < 0) {
        card.scrollIntoView({ block: "start", behavior: shouldReduceMotion ? "auto" : "smooth" });
      }
    },
    [step, shouldReduceMotion],
  );

  /* Continue validates only the step it leaves, and a failed one lands focus
     on the first typed field that is wrong - a chip group carries its error
     under the chips instead. */
  const validateStep = async (index) => {
    const id = STEP_IDS[index];
    const ok = await trigger(STEP_FIELDS[id]);
    if (ok) return true;
    if (id === "what") setServiceError(appointmentPage.fields.service.error);
    const first = STEP_FIELDS[id].find(
      (field) => TYPED_FIELDS.has(field) && getFieldState(field).error,
    );
    if (first) setFocus(first);
    return false;
  };

  const next = async () => {
    if (step >= LAST) return;
    if (await validateStep(step)) go(step + 1);
  };

  /* Send is a plain link to WhatsApp so the browser opens it in the tap that
     asked for it - a popup opened after an awaited validation is what popup
     blockers exist to stop. The values were validated as each step was left,
     so the link is only ever pressed on a complete request; if it somehow is
     not, the reader is taken to the first step still missing something. */
  const onSend = (event) => {
    if (!ready) {
      event.preventDefault();
      const missing = complete.findIndex((done) => !done);
      go(missing === -1 ? 0 : missing);
      validateStep(missing === -1 ? 0 : missing);
      return;
    }
    setSent(true);
  };

  const startAgain = () => {
    reset({
      name: "",
      phone: "",
      branch: branch.slug,
      service: "",
      preferredDate: "",
      daypart: "",
      message: "",
    });
    setSent(false);
    setFurthest(0);
    setDirection(-1);
    setStep(0);
  };

  /* The card grows and shrinks to the step rather than snapping to it, so
     the foot never jumps out from under a thumb. The height is written
     straight to the DOM from a callback ref, not an effect keyed on the step:
     AnimatePresence holds the outgoing panel until its exit finishes, so an
     effect would measure the panel that is leaving and then read zero when it
     detached. */
  const measurePanel = useCallback((node) => {
    observerRef.current?.disconnect();
    observerRef.current = null;
    if (!node) return;
    const apply = () => {
      if (frameRef.current) frameRef.current.style.height = `${node.offsetHeight}px`;
    };
    apply();
    if (typeof ResizeObserver === "undefined") return;
    observerRef.current = new ResizeObserver(apply);
    observerRef.current.observe(node);
  }, []);

  useEffect(
    () => () => {
      observerRef.current?.disconnect();
      window.clearTimeout(hitTimer.current);
    },
    [],
  );

  const panelVariants = {
    enter: (dir) => (shouldReduceMotion ? { opacity: 0 } : { opacity: 0, x: dir * 28 }),
    center: {
      opacity: 1,
      x: 0,
      transition: shouldReduceMotion
        ? { duration: 0 }
        : { duration: 0.32, ease: EASE, staggerChildren: 0.06, delayChildren: 0.04 },
    },
    exit: (dir) => (shouldReduceMotion ? { opacity: 0 } : { opacity: 0, x: dir * -28 }),
  };

  /* What the slip shows, described in the same words the message uses. The
     two optional lines stay blank until the reader has passed the step that
     asks for them, then read "Any day" / "Any time" - which is what is sent. */
  const passedWhen = furthest >= SEND_INDEX;
  const phone = parseMobile(values.phone ?? "");
  const rows = {
    name: (values.name ?? "").trim(),
    phone: phone.valid ? phone.display : (values.phone ?? "").trim(),
    branch: branch.name,
    service: describeService(values.service, service),
    date: values.preferredDate || passedWhen ? describeDate(values.preferredDate) : "",
    daypart: values.daypart || passedWhen ? describeDaypart(values.daypart) : "",
    message: (values.message ?? "").trim(),
  };

  const waHref = ready
    ? buildWhatsApp(
        branch,
        buildAppointmentMessage(
          { ...values, name: values.name ?? "", message: values.message ?? "" },
          branch,
          service,
        ),
      )
    : "#";
  const whoLine = rows.name ? "phone" : "name";
  const activeLine = sent ? null : stepId === "who" ? whoLine : ACTIVE_LINE[stepId];
  const slipProps = { branch, rows, ready, sent, activeLine };
  const opdPhone = getPrimaryPhone(branch);
  const still = Boolean(shouldReduceMotion);

  return (
    <>
      <div className="ap-grid">
        <motion.form
          className="ap-card"
          ref={cardRef}
          noValidate
          onSubmit={(event) => {
            event.preventDefault();
            next();
          }}
          initial={shouldReduceMotion ? false : { opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={
            shouldReduceMotion ? { duration: 0 } : { duration: 0.7, ease: EASE, delay: 0.2 }
          }
        >
          <ol className="ap-rail" aria-label={appointmentPage.label}>
            <motion.span
              className="ap-rail__track"
              aria-hidden="true"
              initial={shouldReduceMotion ? false : { scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={
                shouldReduceMotion ? { duration: 0 } : { duration: 0.7, ease: EASE, delay: 0.45 }
              }
            >
              <motion.span
                className="ap-rail__fill"
                initial={false}
                animate={{ scaleX: sent ? 1 : step / LAST }}
                transition={
                  shouldReduceMotion ? { duration: 0 } : { duration: 0.5, ease: EASE }
                }
              />
            </motion.span>
            {STEP_IDS.map((id, index) => {
              /* A required step reads as answered as soon as it is - a
                 hospital or treatment the reader arrived with is an answer.
                 An optional one only reads as answered once it has been
                 passed, because "nothing chosen" is not an answer until the
                 reader has seen the question. */
              const done =
                sent ||
                (index !== step && complete[index] && (REQUIRED_STEPS.has(id) || index < furthest));
              const reachable = !sent && index <= furthest;
              return (
                <motion.li
                  className="ap-rail__step"
                  key={id}
                  data-on={index === step && !sent ? "true" : undefined}
                  data-done={done ? "true" : undefined}
                  initial={shouldReduceMotion ? false : { opacity: 0, scale: 0.5, y: 6 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={
                    shouldReduceMotion
                      ? { duration: 0 }
                      : { type: "spring", stiffness: 420, damping: 24, delay: 0.42 + index * 0.08 }
                  }
                >
                  <button
                    type="button"
                    className="ap-rail__button"
                    onClick={() => reachable && index !== step && go(index)}
                    disabled={!reachable}
                    aria-current={index === step && !sent ? "step" : undefined}
                  >
                    <span
                      className="ap-rail__dot"
                      aria-hidden="true"
                      ref={(node) => {
                        dotRefs.current[index] = node;
                      }}
                    >
                      <span className="ap-rail__num">{index + 1}</span>
                      <Check className="ap-rail__check" size={14} strokeWidth={3} />
                    </span>
                    <span className="ap-rail__label">{steps[id].label}</span>
                  </button>
                </motion.li>
              );
            })}
          </ol>
          <p className="sr-only" aria-live="polite">
            {sent
              ? after.title
              : `${fillTemplate(stepOfLabel, { step: step + 1, total: STEP_IDS.length })}: ${steps[stepId].title}`}
          </p>

          <div className="ap-card__frame" ref={frameRef}>
            <AnimatePresence mode="wait" custom={direction} initial={false}>
              <motion.div
                className="ap-step"
                key={sent ? "done" : stepId}
                ref={measurePanel}
                custom={direction}
                variants={panelVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: shouldReduceMotion ? 0 : 0.32, ease: EASE }}
              >
                {sent ? (
                  <DonePanel
                    branch={branch}
                    waHref={waHref}
                    onEdit={() => {
                      setSent(false);
                      setDirection(-1);
                    }}
                    onAgain={startAgain}
                    still={still}
                    slip={stacked ? <BookingSlip {...slipProps} compact /> : null}
                  />
                ) : null}
                {!sent && stepId === "who" ? (
                  <WhoStep
                    register={field}
                    errors={errors}
                    phoneValue={values.phone ?? ""}
                    still={still}
                  />
                ) : null}
                {!sent && stepId === "where" ? (
                  <WhereStep
                    items={branches.items}
                    value={values.branch}
                    onChange={chooseBranch}
                    still={still}
                  />
                ) : null}
                {!sent && stepId === "what" ? (
                  <WhatStep
                    groups={serviceGroups}
                    value={values.service}
                    onChange={chooseService}
                    error={serviceError}
                    still={still}
                  />
                ) : null}
                {!sent && stepId === "when" ? (
                  <WhenStep
                    branch={branch}
                    days={days}
                    date={values.preferredDate ?? ""}
                    onDate={(iso) => setValue("preferredDate", iso, { shouldValidate: true })}
                    daypart={values.daypart ?? ""}
                    onDaypart={(id) => setValue("daypart", id)}
                    error={errors.preferredDate?.message}
                    still={still}
                  />
                ) : null}
                {!sent && stepId === "send" ? (
                  <SendStep
                    register={field}
                    errors={errors}
                    messageValue={values.message ?? ""}
                    still={still}
                  >
                    {stacked ? <BookingSlip {...slipProps} compact /> : null}
                  </SendStep>
                ) : null}
              </motion.div>
            </AnimatePresence>
          </div>

          {!sent ? (
            <div className="ap-foot" data-first={step === 0 ? "true" : undefined}>
              {step > 0 ? (
                <motion.button
                  type="button"
                  className="e-btn e-btn--outline ap-foot__back"
                  aria-label={nav.backLabel}
                  onClick={() => go(step - 1)}
                  whileTap={shouldReduceMotion ? undefined : { scale: 0.97 }}
                >
                  <ArrowLeft size={18} aria-hidden="true" />
                  <span>{nav.backLabel}</span>
                </motion.button>
              ) : null}
              {step < LAST ? (
                <motion.button
                  type="submit"
                  className="e-btn ap-foot__next"
                  whileTap={shouldReduceMotion ? undefined : { scale: 0.97 }}
                >
                  <span>{nav.continueLabel}</span>
                  <ArrowRight size={18} aria-hidden="true" />
                </motion.button>
              ) : (
                <motion.a
                  className="e-btn ap-foot__next ap-foot__send"
                  href={waHref}
                  target="_blank"
                  rel="noreferrer"
                  aria-disabled={ready ? undefined : "true"}
                  onClick={onSend}
                  whileTap={shouldReduceMotion ? undefined : { scale: 0.97 }}
                >
                  <MessageCircle size={18} aria-hidden="true" />
                  <span>{nav.sendLabel}</span>
                </motion.a>
              )}
            </div>
          ) : null}
        </motion.form>

        {!stacked ? (
          <motion.div
            className="ap-aside"
            initial={shouldReduceMotion ? false : { opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={
              shouldReduceMotion ? { duration: 0 } : { duration: 0.7, ease: EASE, delay: 0.32 }
            }
          >
            <BookingSlip {...slipProps} />
          </motion.div>
        ) : null}
      </div>

      <motion.p
        className="ap-call"
        initial={shouldReduceMotion ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.5, delay: 0.5 }}
      >
        <a className="e-link" href={`tel:${cleanTel(opdPhone)}`}>
          <Phone size={15} aria-hidden="true" />
          {fillTemplate(nav.callLabel, { branch: branch.name })}
        </a>
      </motion.p>
    </>
  );
}

/* Where the reader lands after pressing Send: WhatsApp has the message, and
   this says what happens next - press send there, and the desk replies in
   OPD hours. The slip stays in view on a phone so the reader can check what
   went. Nothing here is a form; it is the receipt. */
function DonePanel({ branch, waHref, onEdit, onAgain, still, slip }) {
  return (
    <div className="ap-done">
      <motion.span
        className="ap-done__mark"
        aria-hidden="true"
        initial={still ? false : { scale: 0.4, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={still ? { duration: 0 } : { type: "spring", stiffness: 380, damping: 22 }}
      >
        <Check size={26} strokeWidth={3} />
      </motion.span>
      <h2 className="ap-step__title">{after.title}</h2>
      <p className="ap-step__lede">{fillTemplate(after.lede, { branch: branch.name })}</p>
      <dl className="ap-done__hours">
        <dt className="e-label">{after.hoursLabel}</dt>
        {getHoursRows(getBranchHours(branch)).map((row) => (
          <dd key={row.label}>
            <span>{row.label}</span>
            <strong>{row.value}</strong>
          </dd>
        ))}
      </dl>
      {slip}
      <div className="ap-done__actions">
        <a className="e-btn" href={waHref} target="_blank" rel="noreferrer">
          <MessageCircle size={18} aria-hidden="true" />
          <span>{nav.reopenLabel}</span>
        </a>
        <button type="button" className="e-btn e-btn--outline" onClick={onEdit}>
          {nav.editLabel}
        </button>
      </div>
      <button type="button" className="e-link ap-done__again" onClick={onAgain}>
        {after.againLabel}
        <ArrowRight size={16} aria-hidden="true" />
      </button>
    </div>
  );
}
