import { useState } from "react";

type FaqItemProps = {
  question: string;
  answer: string;
};

export default function FaqItem({ question, answer }: FaqItemProps) {
  const [open, setOpen] = useState(false);

  return (
    <article className="faq-card">
      <button
        type="button"
        className="faq-summary"
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
      >
        <span>{question}</span>
        <span className="faq-chevron">{open ? "−" : "+"}</span>
      </button>
      {open ? <p className="faq-answer">{answer}</p> : null}
    </article>
  );
}
