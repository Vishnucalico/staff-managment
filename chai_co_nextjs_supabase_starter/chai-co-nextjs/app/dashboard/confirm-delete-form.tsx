"use client";

type Props = {
  action: (formData: FormData) => void | Promise<void>;
  id: string;
  label: string;
  confirmMessage: string;
};

export function ConfirmDeleteForm({ action, id, label, confirmMessage }: Props) {
  return (
    <form action={action} onSubmit={(event) => {
      if (!window.confirm(confirmMessage)) event.preventDefault();
    }}>
      <input type="hidden" name="id" value={id} />
      <button className="btn danger" type="submit">{label}</button>
    </form>
  );
}
