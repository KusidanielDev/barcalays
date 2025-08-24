// FILE: src/components/ConfirmDeleteForm.tsx
"use client";

import { useRef } from "react";

type Props = {
  accountId: string;
  /** Server Action coming from the server component */
  action: (formData: FormData) => Promise<void>;
};

export default function ConfirmDeleteForm({ accountId, action }: Props) {
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form ref={formRef} action={action} className="flex items-center gap-2">
      <input type="hidden" name="accountId" value={accountId} />
      <button
        type="submit"
        className="btn-secondary"
        onClick={(e) => {
          // Client-side confirm is allowed here
          if (!confirm("Hard delete account?")) {
            e.preventDefault();
          }
        }}
      >
        Hard delete
      </button>
    </form>
  );
}
