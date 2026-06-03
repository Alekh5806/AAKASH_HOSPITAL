export function revealVariants(reducedMotion = false, distance = 24) {
  if (reducedMotion) {
    return {
      hidden: { opacity: 1 },
      visible: { opacity: 1 },
    };
  }

  return {
    hidden: { opacity: 0.96, y: Math.min(distance, 10) },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1] },
    },
  };
}

export function staggerContainer(reducedMotion = false) {
  return {
    hidden: {},
    visible: {
      transition: reducedMotion ? {} : { staggerChildren: 0.08, delayChildren: 0.05 },
    },
  };
}
