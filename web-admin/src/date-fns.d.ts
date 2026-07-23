declare module 'date-fns' {
  export function format(date: Date | number | string, format: string, options?: { locale?: any }): string;
  export function formatDistanceToNow(date: Date | number | string, options?: { addSuffix?: boolean; locale?: any }): string;
}

declare module 'date-fns/locale' {
  export const ar: any;
  export const enUS: any;
}
