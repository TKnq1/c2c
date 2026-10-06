import { startTransition, type FormEvent } from "react";

// React 19 empties every uncontrolled field of a <form action={…}> once the action returns, even when it
// returned an error. For a sign-up that meant typing the email and ticking the boxes again after any
// mistake. Submitting by hand (browser validation still runs first) leaves the fields as they were. The
// transition keeps useActionState's pending flag accurate.
export function keepFieldsOnSubmit(dispatch: (formData: FormData) => void) {
  return (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(() => dispatch(formData));
  };
}
