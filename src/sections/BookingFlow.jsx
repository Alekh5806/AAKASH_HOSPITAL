import {
  startTransition,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
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
  getPrimaryBranch,
  getPrimaryPhone,
  getStoredBranch,
  storeBranch,
} from "../lib/contact";
import { branches } from "../lib/coreData";
import { getBranchHours, getHoursRows } from "../lib/hours";
import { useHydrated } from "../lib/hydration";
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
/* Header.jsx does not hide the header in the first 160px of the page. */
const HEADER_HIDES_AFTER = 160;
/* How far a revealed card sits from the header, or from the top of the
   screen once the header has slid away. */
const REVEAL_GAP = 20;

/* The card arrives after the head, the rail draws itself across it, and the
   first step's rows assemble a beat behind - in that order, from the page's
   own start (`lead`). */
const CARD = {
  hidden: { opacity: 0, y: 22 },
  shown: (lead) => ({ opacity: 1, y: 0, transition: { duration: 0.7, ease: EASE, delay: lead } }),
};
const TRACK = {
  hidden: { scaleX: 0 },
  shown: (lead) => ({ scaleX: 1, transition: { duration: 0.7, ease: EASE, delay: lead } }),
};
const DOT = {
  hidden: { opacity: 0, scale: 0.5, y: 6 },
  shown: (lead) => ({
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { type: "spring", stiffness: 420, damping: 24, delay: lead },
  }),
};
const LATE = {
  hidden: { opacity: 0, y: 10 },
  shown: (lead) => ({ opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE, delay: lead } }),
};

/* After a step change, the least scroll that puts the whole new step on
   screen - never so far that the card's top goes under the header - and a
   step taller than the screen opens on its top. The header slides away on a
   scroll down past 160px, so a target past that is measured against the top
   of the screen instead. The panel is measured as it mounts, while the frame
   is still at the old step's height, so the foot's buttons are placed from
   the frame's top plus the new panel's height - the buttons, not the card's
   padding under them, which is not worth moving the page for. */
function revealCard(card, frame, panelHeight, behavior) {
  const header = document.querySelector(".hd");
  const headerHeight = header ? header.getBoundingClientRect().height : 0;
  const cardBox = card.getBoundingClientRect();
  const frameBox = frame.getBoundingClientRect();
  const foot = card.querySelector(".ap-foot");
  const under = (foot ? foot.getBoundingClientRect() : cardBox).bottom - frameBox.bottom;
  const top = cardBox.top + window.scrollY;
  const bottom = frameBox.top + window.scrollY + panelHeight + under;
  const aim = (inset) => {
    const view = window.scrollY;
    if (bottom - top > window.innerHeight - inset - REVEAL_GAP) return top - inset;
    if (top - view < inset) return top - inset;
    if (bottom - view > window.innerHeight - REVEAL_GAP) {
      return bottom - window.innerHeight + REVEAL_GAP;
    }
    return view;
  };
  let target = aim(headerHeight + REVEAL_GAP);
  if (target > window.scrollY && target > HEADER_HIDES_AFTER) target = aim(REVEAL_GAP);
  target = Math.max(0, Math.round(target));
  if (Math.abs(target - window.scrollY) < 12) return;
  window.scrollTo({ top: target, behavior });
}

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
 * A new step takes the focus on its heading, which carries "Step 2 of 5" for
 * a screen reader, and the page moves only as far as it needs to show it.
 *
 * The hospital is the header's hospital. It opens on the one stored for this
 * reader (or the one in the query, which the header has already adopted),
 * writes back through `storeBranch()` when changed here, and follows the
 * header if it moves - the number the slip is addressed to is always the one
 * at the top of the screen. */
export default function BookingFlow({ start = true, delay = 0 }) {
  const shouldReduceMotion = useReducedMotion();
  const [searchParams] = useSearchParams();
  const stacked = useSyncExternalStore(
    subscribeToStacked,
    () => window.matchMedia(STACKED_QUERY).matches,
    () => false,
  );
  const requestedBranch = searchParams.get("branch");
  const requestedService = searchParams.get("service");
  /* The hospital the form opens on: the one the link names, or the reader's
     own. The form only holds a hospital once one is named or chosen; until
     then it shows this one, so the prerendered form can open on the head
     office and move to the reader's hospital as React adopts the page, in
     place - the form reads its first values once, and building it again
     would paint the step a second time. */
  const hydrated = useHydrated();
  const openingBranch =
    findBranch(requestedBranch) ??
    (hydrated ? getStoredBranch(branches.items) : getPrimaryBranch(branches.items));
  const initialService = services.items.some((service) => service.id === requestedService)
    ? requestedService
    : "";

  const {
    register,
    control,
    trigger,
    setValue,
    getValues,
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
      branch: findBranch(requestedBranch)?.slug ?? "",
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
  /* The first step arrives with the card; every later one slides in the
     direction the reader is moving. */
  const [moved, setMoved] = useState(false);
  const [serviceError, setServiceError] = useState("");
  const cardRef = useRef(null);
  const frameRef = useRef(null);
  const observerRef = useRef(null);
  const revealRef = useRef(false);
  const dotRefs = useRef({});
  const hitTimer = useRef(0);

  const branch = findBranch(values.branch) ?? openingBranch;
  /* What the reader has answered, with the hospital they are shown. */
  const answers = useMemo(() => ({ ...values, branch: branch.slug }), [values, branch.slug]);
  /* The day rail is the chosen hospital's: its own closed days are skipped and
     today drops out at its own closing time, so the rail is rebuilt when the
     hospital changes. */
  const days = useMemo(() => getOpenDays(branch), [branch]);
  const service = services.items.find((item) => item.id === values.service);
  const stepId = STEP_IDS[step];
  const ready = appointmentSchema.safeParse(answers).success;
  const complete = STEP_IDS.map((id) => isStepComplete(id, answers));

  /* Follow the header while the reader is still on the page. */
  useEffect(() => {
    const follow = (event) => {
      if (findBranch(event.detail)) setValue("branch", event.detail);
    };
    window.addEventListener(BRANCH_CHANGE_EVENT, follow);
    return () => window.removeEventListener(BRANCH_CHANGE_EVENT, follow);
  }, [setValue]);

  /* The header and the footer follow as a transition, so the chip the reader
     tapped moves first and the rest of the page catches up a frame later
     rather than holding the tap - the contact page's switchboard device. */
  const chooseBranch = (slug) => {
    setValue("branch", slug, { shouldValidate: true });
    startTransition(() => storeBranch(slug));
  };

  const chooseService = (id) => {
    setValue("service", id, { shouldValidate: true });
    setServiceError("");
  };

  /* Moving between steps. The new panel reveals itself and takes the focus
     as it mounts (`measurePanel`), so the reader never lands halfway down a
     new step and a keyboard never drops to the top of the page. */
  const go = useCallback(
    (next) => {
      if (next === step) return;
      setDirection(next > step ? 1 : -1);
      setStep(next);
      setFurthest((current) => Math.max(current, next));
      setMoved(true);
      revealRef.current = true;
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
    },
    [step, shouldReduceMotion],
  );

  /* Continue validates only the step it leaves, and a failed one lands focus
     on the first typed field that is wrong - a chip group carries its error
     under the chips instead. */
  const validateStep = async (index) => {
    const id = STEP_IDS[index];
    if (!getValues("branch")) setValue("branch", branch.slug);
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
    revealRef.current = true;
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
    revealRef.current = true;
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
     detached. A panel the reader moved to - not the one the page opened
     on - also takes the focus on its heading and is brought on screen. */
  const measurePanel = useCallback(
    (node) => {
      observerRef.current?.disconnect();
      observerRef.current = null;
      if (!node) return;
      const apply = () => {
        if (frameRef.current) frameRef.current.style.height = `${node.offsetHeight}px`;
      };
      if (revealRef.current && cardRef.current && frameRef.current) {
        revealRef.current = false;
        node.querySelector(".ap-step__title")?.focus({ preventScroll: true });
        revealCard(
          cardRef.current,
          frameRef.current,
          node.offsetHeight,
          shouldReduceMotion ? "auto" : "smooth",
        );
      }
      apply();
      if (typeof ResizeObserver === "undefined") return;
      observerRef.current = new ResizeObserver(apply);
      observerRef.current.observe(node);
    },
    [shouldReduceMotion],
  );

  useEffect(
    () => () => {
      observerRef.current?.disconnect();
      window.clearTimeout(hitTimer.current);
    },
    [],
  );

  /* `custom` is the direction of travel (0 for the step the page opens on,
     which rises with the card rather than sliding) and a lead that holds
     that first step's rows until the card has arrived. */
  const panelVariants = {
    enter: ({ dir }) => (shouldReduceMotion ? { opacity: 0 } : { opacity: 0, x: dir * 28 }),
    center: ({ lead }) => ({
      opacity: 1,
      x: 0,
      transition: shouldReduceMotion
        ? { duration: 0 }
        : {
            duration: 0.32,
            ease: EASE,
            delay: lead,
            staggerChildren: 0.06,
            delayChildren: lead + 0.04,
          },
    }),
    exit: ({ dir }) => (shouldReduceMotion ? { opacity: 0 } : { opacity: 0, x: dir * -28 }),
  };
  const panelCustom = moved ? { dir: direction, lead: 0 } : { dir: 0, lead: delay + 0.5 };
  const stage = start ? "shown" : "hidden";

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
          { ...answers, name: values.name ?? "", message: values.message ?? "" },
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
  const stepOf = fillTemplate(stepOfLabel, { step: step + 1, total: STEP_IDS.length });

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
          initial={still ? false : "hidden"}
          animate={stage}
          variants={CARD}
          custom={delay + 0.25}
        >
          <ol className="ap-rail" aria-label={appointmentPage.label}>
            <motion.span
              className="ap-rail__track"
              aria-hidden="true"
              variants={TRACK}
              custom={delay + 0.5}
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
                  variants={DOT}
                  custom={delay + 0.47 + index * 0.08}
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

          <div className="ap-card__frame" ref={frameRef}>
            <AnimatePresence mode="wait" custom={panelCustom} initial={!still}>
              <motion.div
                className="ap-step"
                key={sent ? "done" : stepId}
                ref={measurePanel}
                custom={panelCustom}
                variants={panelVariants}
                initial="enter"
                animate={start ? "center" : "enter"}
                exit="exit"
                transition={{ duration: shouldReduceMotion ? 0 : 0.32, ease: EASE }}
              >
                {sent ? (
                  <DonePanel
                    branch={branch}
                    waHref={waHref}
                    onEdit={() => {
                      revealRef.current = true;
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
                    phoneValid={phone.valid}
                    stepOf={stepOf}
                    still={still}
                  />
                ) : null}
                {!sent && stepId === "where" ? (
                  <WhereStep
                    items={branches.items}
                    value={branch.slug}
                    onChange={chooseBranch}
                    stepOf={stepOf}
                    still={still}
                  />
                ) : null}
                {!sent && stepId === "what" ? (
                  <WhatStep
                    groups={serviceGroups}
                    value={values.service}
                    onChange={chooseService}
                    error={serviceError}
                    stepOf={stepOf}
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
                    stepOf={stepOf}
                    still={still}
                  />
                ) : null}
                {!sent && stepId === "send" ? (
                  <SendStep
                    register={field}
                    errors={errors}
                    messageValue={values.message ?? ""}
                    stepOf={stepOf}
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
                  data-ready={complete[step] ? "true" : undefined}
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
            initial={still ? false : "hidden"}
            animate={stage}
            variants={CARD}
            custom={delay + 0.4}
          >
            <BookingSlip {...slipProps} printed={start} lead={delay + 0.6} />
          </motion.div>
        ) : null}
      </div>

      <motion.p
        className="ap-call"
        initial={still ? false : "hidden"}
        animate={stage}
        variants={LATE}
        custom={delay + 1.1}
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
      <h2 className="ap-step__title" tabIndex={-1}>
        {after.title}
      </h2>
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
