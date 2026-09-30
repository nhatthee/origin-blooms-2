export function Arrow({ diagonal = false }: { diagonal?: boolean }) {
  if (diagonal) {
    return (
      <svg
        className="arrow-icon"
        width="24"
        height="24"
        viewBox="0 0 32 32"
        fill="none"
        aria-hidden="true"
      >
        <path
          d="M7 25L25 7M15 7H25V17"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  return <span aria-hidden="true">→</span>;
}
