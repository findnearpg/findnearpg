import { ChevronDown } from 'lucide-react';

export default function FAQItem({ question, answer, icon: Icon, isOpen, onToggle }) {
  return (
    <div className="group border-b border-[#e7f4f3] last:border-b-0">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-[#f8fffe] sm:gap-4 sm:px-6 sm:py-5"
      >
        {Icon && <Icon className="mt-0.5 h-4 w-4 shrink-0 text-[#0f8f8b] sm:mt-1 sm:h-6 sm:w-6" />}
        <div className="flex-1 min-w-0">
          <h3 className="pr-3 text-[13px] font-semibold leading-snug text-[#073735] sm:pr-4 sm:text-base">
            {question}
          </h3>
        </div>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-[#0f8f8b] transition-transform duration-300 sm:h-6 sm:w-6 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {isOpen && (
        <div className="overflow-hidden">
          <div className="animate-in slide-in-from-top px-4 pb-3 pl-7 text-xs leading-relaxed text-[#073735]/70 duration-300 sm:px-6 sm:pb-5 sm:pl-12 sm:text-base">
            {answer}
          </div>
        </div>
      )}
    </div>
  );
}
