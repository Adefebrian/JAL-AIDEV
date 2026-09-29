// Text templates imported with `with { type: "text" }` (Bun import attributes).
declare module "*.txt" {
  const content: string;
  export default content;
}
