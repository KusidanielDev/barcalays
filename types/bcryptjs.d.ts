// types/bcryptjs.d.ts
declare module "bcryptjs" {
  export function compare(data: string, encrypted: string): Promise<boolean>;
  export function hash(data: string, salt: number | string): Promise<string>;

  const _default: {
    compare: typeof compare;
    hash: typeof hash;
  };
  export default _default;
}
