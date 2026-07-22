import { Check } from 'lucide-react';

interface Step {
  label: string;
  description?: string;
}

interface StepIndicatorProps {
  steps: Step[];
  currentStep: number;
}

export default function StepIndicator({ steps, currentStep }: StepIndicatorProps) {
  return (
    <div className="w-full py-6">
      <div className="flex items-center justify-between relative">
        {steps.map((step, index) => {
          const isCompleted = index < currentStep;
          const isCurrent = index === currentStep;
          const isLast = index === steps.length - 1;

          return (
            <div key={index} className="flex items-center flex-1 relative">
              <div className="flex flex-col items-center z-10">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
                    isCompleted
                      ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/30'
                      : isCurrent
                      ? 'bg-accent-500 text-white shadow-lg shadow-accent-500/30 scale-110'
                      : 'bg-surface-200 text-surface-400'
                  }`}
                >
                  {isCompleted ? (
                    <Check size={18} strokeWidth={3} />
                  ) : (
                    index + 1
                  )}
                </div>
                <span
                  className={`text-xs mt-2 font-semibold text-center transition-all duration-300 ${
                    isCurrent
                      ? 'text-primary-500'
                      : isCompleted
                      ? 'text-surface-600'
                      : 'text-surface-400'
                  }`}
                >
                  {step.label}
                </span>
              </div>
              {!isLast && (
                <div className="flex-1 h-0.5 mx-2 mb-6 relative">
                  <div className="absolute inset-0 bg-surface-200 rounded-full" />
                  <div
                    className="absolute inset-y-0 right-0 bg-primary-500 rounded-full transition-all duration-500"
                    style={{ width: isCompleted ? '100%' : isCurrent ? '0%' : '0%' }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
