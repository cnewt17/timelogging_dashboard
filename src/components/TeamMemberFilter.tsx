interface TeamMember {
  accountId: string;
  displayName: string;
}

interface TeamMemberFilterProps {
  members: TeamMember[];
  selectedAccountId: string | null;
  onChange: (accountId: string | null) => void;
}

export function TeamMemberFilter({
  members,
  selectedAccountId,
  onChange,
}: TeamMemberFilterProps) {
  // Sort members alphabetically by display name
  const sortedMembers = [...members].sort((a, b) =>
    a.displayName.localeCompare(b.displayName),
  );

  const hasSelection = selectedAccountId !== null;

  return (
    <div className="flex items-center gap-2">
      <select
        value={selectedAccountId ?? ""}
        onChange={(e) => onChange(e.target.value || null)}
        className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
      >
        <option value="">All Team Members</option>
        {sortedMembers.map((member) => (
          <option key={member.accountId} value={member.accountId}>
            {member.displayName}
          </option>
        ))}
      </select>

      {hasSelection && (
        <button
          type="button"
          onClick={() => onChange(null)}
          className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-label="Clear team member filter"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      )}
    </div>
  );
}
