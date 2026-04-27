import './CdSpinner.css';

interface CdSpinnerProps {
  isRecording?: boolean;
  className?: string;
}

export function CdSpinner({ isRecording = false, className = '' }: CdSpinnerProps) {
  return (
    <svg 
      className={`cd-spinner ${isRecording ? 'spinning' : ''} ${className}`}
      viewBox="0 0 200 200" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <clipPath id="discBoundary">
          <circle cx="100" cy="100" r="90" />
        </clipPath>
      </defs>
      
      <circle cx="100" cy="100" r="90" fill="#A9D0F5" stroke="#5B84B1" strokeWidth="6"/>
      
      <g clipPath="url(#discBoundary)">
        <path d="M70 -10 L110 -10 L90 210 L50 210 Z" fill="white" fillOpacity="0.5" />
        <path d="M125 -10 L155 -10 L135 210 L105 210 Z" fill="white" fillOpacity="0.3" />
      </g>
      
      <circle cx="100" cy="100" r="22" fill="#FFFFFF" stroke="#5B84B1" strokeWidth="6"/>
    </svg>
  );
}
