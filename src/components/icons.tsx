import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

function BaseIcon(props: IconProps) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props} />;
}

export function IconCap(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M3 9.5 12 5l9 4.5-9 4.5L3 9.5Z" />
      <path d="M7 12.5V16c0 1 2.2 2.5 5 2.5s5-1.5 5-2.5v-3.5" />
      <path d="M21 10v5" />
    </BaseIcon>
  );
}

export function IconSearch(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <circle cx="11" cy="11" r="6.5" />
      <path d="m16 16 4 4" />
    </BaseIcon>
  );
}

export function IconHeadphones(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M4 13a8 8 0 1 1 16 0" />
      <rect x="3" y="12" width="4" height="7" rx="2" />
      <rect x="17" y="12" width="4" height="7" rx="2" />
    </BaseIcon>
  );
}

export function IconHeart(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M12 20s-7-4.2-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 10c0 5.8-7 10-7 10Z" />
    </BaseIcon>
  );
}

export function IconPlaylist(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <rect x="3" y="4" width="18" height="16" rx="3" />
      <path d="M7 8h8M7 12h6" />
      <circle cx="17" cy="12" r="2.2" />
    </BaseIcon>
  );
}

export function IconUser(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 20a7 7 0 0 1 14 0" />
    </BaseIcon>
  );
}

export function IconVolume(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M4 10h4l5-4v12l-5-4H4z" />
      <path d="M16 9a4 4 0 0 1 0 6" />
    </BaseIcon>
  );
}

export function IconPrev(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M7 6v12" />
      <path d="m18 18-8-6 8-6z" />
    </BaseIcon>
  );
}

export function IconNext(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M17 6v12" />
      <path d="m6 18 8-6-8-6z" />
    </BaseIcon>
  );
}

export function IconPlay(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="m8 6 10 6-10 6z" />
    </BaseIcon>
  );
}

export function IconPause(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M8 6v12M16 6v12" />
    </BaseIcon>
  );
}
