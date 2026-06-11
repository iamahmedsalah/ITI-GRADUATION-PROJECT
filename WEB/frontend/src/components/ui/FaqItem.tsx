import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { cardVariants, faqAnswerVariants } from "../../libs/motionVariants";

type FaqItemProps = {
  question: string;
  answer: string;
};

export default function FaqItem({ question, answer }: FaqItemProps) {
  const [open, setOpen] = useState(false);

  return (
    <motion.article
      className="faq-card"
      layout
      variants={cardVariants}
      initial="hidden"
      animate="show"
    >
      <motion.button
        type="button"
        className="faq-summary"
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
        whileTap={{ scale: 0.98 }}
        whileHover={{ scale: 1.01 }}
        transition={{ duration: 0.18, ease: "easeOut" }}
      >
        <span>{question}</span>
        <span className="faq-chevron">{open ? "−" : "+"}</span>
      </motion.button>

      <AnimatePresence initial={false}>
        {open ? (
          <motion.div
            key="answer"
            className="faq-answer-wrapper"
            variants={faqAnswerVariants}
            initial="collapsed"
            animate="expanded"
            exit="collapsed"
            style={{ overflow: "hidden" }}
          >
            <p className="faq-answer">{answer}</p>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </motion.article>
  );
}
