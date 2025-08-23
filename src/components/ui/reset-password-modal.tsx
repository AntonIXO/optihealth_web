"use client"

import React, { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { createPortal } from "react-dom";

type Props = {
  triggerLabel?: string;
  onResetPassword?: (email: string) => Promise<void> | void;
  onClose?: () => void;
};

export default function ResetPasswordModal({
  triggerLabel = "Reset Password",
  onResetPassword,
  onClose,
}: Props) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [mounted, setMounted] = useState(false);

  const modalRef = useRef<HTMLDivElement | null>(null);
  const emailFieldRef = useRef<HTMLInputElement | null>(null);
  const closeBtnRef = useRef<HTMLButtonElement | null>(null);

  const handleOpen = () => {
    setOpen(true);
    setSent(false);
  };

  const handleClose = useCallback(() => {
    setOpen(false);
    setSent(false);
    setEmail("");
    onClose?.();
  }, [onClose]);

  useEffect(() => {
    setMounted(true);
    if (!open) return;
    const toFocus = emailFieldRef.current ?? closeBtnRef.current;
    toFocus?.focus({ preventScroll: true });

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        handleClose();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, handleClose]);

  const onOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) handleClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading || !email) return;
    setLoading(true);
    try {
      await onResetPassword?.(email);
      setSent(true);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={handleOpen}
        className="text-sm text-white/80 underline-offset-4 hover:underline
        light:text-blue-800 light:hover:text-blue-950"
      >
        {triggerLabel}
      </button>

      {mounted
        ? createPortal(
            <AnimatePresence>
              {open && (
                <motion.div
                  className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onMouseDown={onOverlayClick}
                  aria-modal="true"
                  role="dialog"
                  aria-labelledby="reset-modal-title"
                >
                  <div
                    className="absolute inset-0 bg-black/60 backdrop-blur-sm
                  light:bg-gray-300/60"
                  />

                  {/* Modal panel */}
                  <motion.div
                    ref={modalRef}
                    className="relative z-10 w-full max-w-md"
                    initial={{ opacity: 0, y: 20, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 20, scale: 0.98 }}
                    transition={{ type: "spring", stiffness: 260, damping: 24 }}
                  >
                    <div
                      className="overflow-hidden rounded-2xl border border-white/20 bg-white/10 shadow-2xl backdrop-blur-xl dark:border-white/10 dark:bg-neutral-900/40
                    light:border-blue-200/50 light:bg-white/80 light:shadow-lg"
                    >
                      <div
                        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent dark:via-white/10
                      light:via-blue-300/40"
                      />

                      {/* Header */}
                      <div className="flex items-center justify-between px-5 pb-2 pt-4 sm:px-6">
                        <h2
                          id="reset-modal-title"
                          className="text-lg font-semibold text-white/90
                        light:text-blue-900"
                        >
                          Reset Password
                        </h2>

                        <button
                          ref={closeBtnRef}
                          type="button"
                          onClick={handleClose}
                          aria-label="Close"
                          className="rounded-full border border-white/20 bg-white/10 p-2 text-white/80 transition hover:bg-white/20 hover:text-white focus:outline-none focus:ring-2 focus:ring-white/40 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10
                        light:border-blue-200/50 light:bg-blue-100/50 light:text-blue-700 light:hover:bg-blue-200/70 light:focus:ring-blue-400"
                        >
                          <svg
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            aria-hidden="true"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <path d="M18 6L6 18" />
                            <path d="M6 6l12 12" />
                          </svg>
                        </button>
                      </div>

                      {/* Body */}
                      <div className="px-5 pb-5 sm:px-6 sm:pb-6">
                        {!sent ? (
                          <>
                            <p
                              className="mb-4 text-sm text-white/70
                            light:text-blue-700"
                            >
                              Enter your email address and we'll send you a link to reset your password.
                            </p>

                            <form onSubmit={handleSubmit} className="space-y-4">
                              <Field
                                ref={emailFieldRef}
                                label="Email"
                                type="email"
                                placeholder="you@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                autoComplete="email"
                                required
                              />

                              <button
                                type="submit"
                                disabled={loading || !email}
                                className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/80 px-4 py-2.5 font-semibold text-black shadow-sm transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/10 dark:bg-white dark:hover:bg-white/90
                                light:border-blue-400/50 light:bg-blue-600 light:text-white light:hover:bg-blue-700"
                              >
                                {loading && (
                                  <svg
                                    className="h-4 w-4 animate-spin"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    aria-hidden="true"
                                  >
                                    <circle
                                      className="opacity-25"
                                      cx="12"
                                      cy="12"
                                      r="10"
                                      stroke="currentColor"
                                      strokeWidth="4"
                                    />
                                    <path
                                      className="opacity-75"
                                      fill="currentColor"
                                      d="M4 12a8 8 0 0 1 8-8v4a4 4 0 0 0-4 4H4z"
                                    />
                                  </svg>
                                )}
                                Send Reset Link
                              </button>
                            </form>
                          </>
                        ) : (
                          <div className="text-center">
                            <div
                              className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-500/20
                            light:bg-green-100"
                            >
                              <svg
                                className="h-6 w-6 text-green-400 light:text-green-600"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth="2"
                                aria-hidden="true"
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                            <h3
                              className="mb-2 text-lg font-semibold text-white/90
                            light:text-blue-900"
                            >
                              Check your email
                            </h3>
                            <p
                              className="mb-4 text-sm text-white/70
                            light:text-blue-700"
                            >
                              We've sent a password reset link to <strong>{email}</strong>
                            </p>
                            <button
                              type="button"
                              onClick={handleClose}
                              className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium text-white shadow-sm backdrop-blur-md transition hover:bg-white/15 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10
                              light:border-blue-300/50 light:bg-blue-100/30 light:text-blue-900 light:hover:bg-blue-100/50"
                            >
                              Done
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>,
            document.body,
          )
        : null}
    </div>
  );
}

type FieldProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  trailing?: React.ReactNode;
};

const Field = React.forwardRef<HTMLInputElement, FieldProps>(function Field(
  { label, trailing, className = "", ...rest },
  ref,
) {
  const id = React.useId();
  return (
    <label htmlFor={id} className="block">
      <span
        className="mb-1 block text-sm font-medium text-white/90
      light:text-blue-900"
      >
        {label}
      </span>
      <div
        className="flex items-stretch rounded-xl border border-white/20 bg-white/10 backdrop-blur-md focus-within:border-white/40 dark:border-white/10 dark:bg-white/5
      light:border-blue-200/50 light:bg-blue-50/50 light:focus-within:border-blue-400/70"
      >
        <input
          ref={ref}
          id={id}
          className={`w-full rounded-xl bg-transparent px-3 py-2.5 text-white placeholder-white/50 outline-none [color-scheme:dark]
          light:text-blue-950 light:placeholder-blue-400/70 light:[color-scheme:light] ${className}`}
          {...rest}
        />
        {trailing ? <div className="flex items-center pr-2">{trailing}</div> : null}
      </div>
    </label>
  );
});
