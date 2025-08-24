export function Label({ children }: { children: React.ReactNode }) {
  return <label className="block text-sm font-medium">{children}</label>;
}
export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={"mt-1 w-full rounded border px-3 py-2 " + (props.className || "")} />;
}
export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={"mt-1 w-full rounded border px-3 py-2 " + (props.className || "")} />;
}
export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={"mt-1 w-full rounded border px-3 py-2 " + (props.className || "")} />;
}
