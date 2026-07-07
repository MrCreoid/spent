import type { SVGProps } from "react";
import type { Category } from "@/lib/types";

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

function Icon({
  size = 24,
  children,
  ...props
}: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  );
}

/* ---------- Tab bar ---------- */

export const ListIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M4 6h1.5M9 6h11M4 12h1.5M9 12h11M4 18h1.5M9 18h11" />
  </Icon>
);

export const ChartIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M4 19V10M10 19V5M16 19v-6M21 19H3" />
  </Icon>
);

export const DebtsIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M17 3.5 21 7.5l-4 4" />
    <path d="M21 7.5H8" />
    <path d="M7 20.5 3 16.5l4-4" />
    <path d="M3 16.5h13" />
  </Icon>
);

export const SettingsIcon = (p: IconProps) => (
  <Icon {...p}>
    <circle cx={12} cy={12} r={3} />
    <path d="M12 2.5v3M12 18.5v3M21.5 12h-3M5.5 12h-3M18.7 5.3l-2.1 2.1M7.4 16.6l-2.1 2.1M18.7 18.7l-2.1-2.1M7.4 7.4 5.3 5.3" />
  </Icon>
);

/* ---------- Actions ---------- */

export const PlusIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M12 5v14M5 12h14" />
  </Icon>
);

export const CheckIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M4 12.5 9.5 18 20 6.5" />
  </Icon>
);

export const XIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M6 6l12 12M18 6 6 18" />
  </Icon>
);

export const TrashIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M4 7h16M10 11v6M14 11v6M6 7l1 12.5A1.5 1.5 0 0 0 8.5 21h7a1.5 1.5 0 0 0 1.5-1.5L18 7M9 7V5a1.5 1.5 0 0 1 1.5-1.5h3A1.5 1.5 0 0 1 15 5v2" />
  </Icon>
);

export const PencilIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M17.2 3.8a2.3 2.3 0 0 1 3.2 3.2L8 19.4 3.5 20.5 4.6 16 17.2 3.8Z" />
  </Icon>
);

export const ChevronLeftIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="m14.5 5.5-6.5 6.5 6.5 6.5" />
  </Icon>
);

export const ChevronRightIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="m9.5 5.5 6.5 6.5-6.5 6.5" />
  </Icon>
);

export const SearchIcon = (p: IconProps) => (
  <Icon {...p}>
    <circle cx={11} cy={11} r={7} />
    <path d="m20.5 20.5-4.5-4.5" />
  </Icon>
);

export const DownloadIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M12 3.5V15M7.5 10.5 12 15l4.5-4.5M4.5 19.5h15" />
  </Icon>
);

export const UploadIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M12 15V3.5M7.5 8 12 3.5 16.5 8M4.5 19.5h15" />
  </Icon>
);

export const BackspaceIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M9 5h10.5A1.5 1.5 0 0 1 21 6.5v11a1.5 1.5 0 0 1-1.5 1.5H9L2.5 12 9 5Z" />
    <path d="m11.5 9.5 5 5M16.5 9.5l-5 5" />
  </Icon>
);

export const CalendarIcon = (p: IconProps) => (
  <Icon {...p}>
    <rect x={3.5} y={5} width={17} height={15.5} rx={2.5} />
    <path d="M3.5 9.5h17M8 3v3.5M16 3v3.5" />
  </Icon>
);

export const NoteIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M5 4.5h14v12l-4 4H5v-16Z" />
    <path d="M15 20.5v-4h4" />
  </Icon>
);

export const CloudIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M7 18.5a4.5 4.5 0 0 1-.4-9A5.5 5.5 0 0 1 17.3 10 4 4 0 0 1 17 18.5H7Z" />
  </Icon>
);

export const CloudOffIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M7 18.5a4.5 4.5 0 0 1-.4-9A5.5 5.5 0 0 1 17.3 10a4 4 0 0 1 2.9 2.1M4 4l16 16" />
  </Icon>
);

export const LogoutIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M14 4.5H6.5A1.5 1.5 0 0 0 5 6v12a1.5 1.5 0 0 0 1.5 1.5H14M10 12h10.5M17 8.5l3.5 3.5-3.5 3.5" />
  </Icon>
);

export const MailIcon = (p: IconProps) => (
  <Icon {...p}>
    <rect x={3} y={5.5} width={18} height={13} rx={2.5} />
    <path d="m4 7.5 8 6 8-6" />
  </Icon>
);

export const AlertIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M12 3.5 22 20H2L12 3.5Z" />
    <path d="M12 10v4.5M12 17.5v.2" />
  </Icon>
);

export const ArrowUpRightIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M7 17 17 7M9 7h8v8" />
  </Icon>
);

export const ArrowDownLeftIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M17 7 7 17M15 17H7V9" />
  </Icon>
);

export const UserPlusIcon = (p: IconProps) => (
  <Icon {...p}>
    <circle cx={10} cy={8} r={3.5} />
    <path d="M4 20a6 6 0 0 1 12 0M18 8v6M15 11h6" />
  </Icon>
);

export const BoltIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M13 2.5 4.5 13.5H11l-1 8L18.5 10.5H12l1-8Z" />
  </Icon>
);

export const HandshakeIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="m11 17.5 2 1.8a1.7 1.7 0 0 0 2.3 0 1.6 1.6 0 0 0 0-2.3" />
    <path d="m13.2 14.9 2.2 2.1a1.7 1.7 0 0 0 2.3 0 1.6 1.6 0 0 0 0-2.3L13.9 11a2.2 2.2 0 0 0-3 0l-1.1 1a1.6 1.6 0 0 1-2.3 0 1.6 1.6 0 0 1 0-2.3l3.4-3.3a4.2 4.2 0 0 1 5.4-.3l2.3 1.7M2.5 8.5l4-4M17.5 4.5l4 4" />
  </Icon>
);

export const GoogleIcon = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
    <path
      fill="#4285F4"
      d="M23.5 12.3c0-.8-.1-1.6-.2-2.4H12v4.5h6.5a5.5 5.5 0 0 1-2.4 3.6v3h3.9c2.2-2.1 3.5-5.1 3.5-8.7Z"
    />
    <path
      fill="#34A853"
      d="M12 24c3.2 0 6-1.1 8-2.9l-3.9-3c-1.1.7-2.5 1.2-4.1 1.2-3.1 0-5.8-2.1-6.7-5H1.2v3.1A12 12 0 0 0 12 24Z"
    />
    <path
      fill="#FBBC05"
      d="M5.3 14.3a7.3 7.3 0 0 1 0-4.6V6.6H1.2a12 12 0 0 0 0 10.8l4.1-3.1Z"
    />
    <path
      fill="#EA4335"
      d="M12 4.7c1.8 0 3.3.6 4.6 1.8L20 3A12 12 0 0 0 1.2 6.6l4.1 3.1c1-2.9 3.6-5 6.7-5Z"
    />
  </svg>
);

/* ---------- Categories ---------- */

const FoodIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M5 3.5v6a2 2 0 0 0 2 2v9M9 3.5v6a2 2 0 0 1-2 2M7 3.5v4" />
    <path d="M17.5 3.5c-1.9 0-3.5 2.5-3.5 6 0 2 .8 3 2 3v8M17.5 3.5c.8 0 1.5.7 1.5 1.5v15.5" />
  </Icon>
);

const TransportIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M5 16.5V6a2.5 2.5 0 0 1 2.5-2.5h9A2.5 2.5 0 0 1 19 6v10.5" />
    <path d="M5 16.5h14v1a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-1ZM5 11.5h14M8 19.5v1.5M16 19.5v1.5" />
    <path d="M8 14.4h.2M15.8 14.4h.2" />
  </Icon>
);

const CollegeIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="m12 4 10 5-10 5L2 9l10-5Z" />
    <path d="M6.5 11.5v5c0 1.4 2.5 2.5 5.5 2.5s5.5-1.1 5.5-2.5v-5M22 9v5" />
  </Icon>
);

const TechIcon = (p: IconProps) => (
  <Icon {...p}>
    <rect x={6} y={6} width={12} height={12} rx={2} />
    <path d="M9 2.5V6M15 2.5V6M9 18v3.5M15 18v3.5M2.5 9H6M2.5 15H6M18 9h3.5M18 15h3.5" />
  </Icon>
);

const ShoppingIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M5 8h14l-1 12a1.5 1.5 0 0 1-1.5 1.4h-9A1.5 1.5 0 0 1 6 20L5 8Z" />
    <path d="M8.5 10.5V7a3.5 3.5 0 0 1 7 0v3.5" />
  </Icon>
);

const EntertainmentIcon = (p: IconProps) => (
  <Icon {...p}>
    <rect x={3} y={4.5} width={18} height={15} rx={2.5} />
    <path d="M3 9h18M7.5 4.5 10 9M12.5 4.5 15 9M17.5 4.5 20 9" />
  </Icon>
);

const HealthIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M12 20.5S3.5 15.5 3.5 9.3a4.6 4.6 0 0 1 8.5-2.5 4.6 4.6 0 0 1 8.5 2.5c0 6.2-8.5 11.2-8.5 11.2Z" />
  </Icon>
);

const GiftsIcon = (p: IconProps) => (
  <Icon {...p}>
    <rect x={4} y={8} width={16} height={4} rx={1} />
    <path d="M5.5 12v7A1.5 1.5 0 0 0 7 20.5h10a1.5 1.5 0 0 0 1.5-1.5v-7M12 8v12.5" />
    <path d="M12 8s-1-4.5-3.8-4.5A1.9 1.9 0 0 0 6.5 5.4C6.5 7.4 12 8 12 8ZM12 8s1-4.5 3.8-4.5a1.9 1.9 0 0 1 1.7 1.9C17.5 7.4 12 8 12 8Z" />
  </Icon>
);

const MiscIcon = (p: IconProps) => (
  <Icon {...p}>
    <circle cx={12} cy={12} r={8.5} />
    <path d="M8 12h.2M12 12h.2M16 12h.2" strokeWidth={2.2} />
  </Icon>
);

export const CATEGORY_ICONS: Record<Category, (p: IconProps) => React.JSX.Element> = {
  food: FoodIcon,
  transport: TransportIcon,
  college: CollegeIcon,
  tech: TechIcon,
  shopping: ShoppingIcon,
  entertainment: EntertainmentIcon,
  health: HealthIcon,
  gifts: GiftsIcon,
  misc: MiscIcon,
};
