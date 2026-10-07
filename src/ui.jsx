import React, { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { X, ArrowLeft } from "lucide-react";
import { useRoomLink } from "./store";
export function Button({
  children,
  primary = false,
  danger = false,
  className = "",
  ...props
}) {
  return (
    <button
      className={`button ${primary ? "primary" : ""} ${danger ? "danger" : ""} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
export function Go({ to, children, primary = false, ...props }) {
  const link = useRoomLink();
  return (
    <Link
      className={`button ${primary ? "primary" : ""}`}
      to={link(to)}
      {...props}
    >
      {children}
    </Link>
  );
}
export function Card({ title, children, className = "", ...props }) {
  return (
    <section className={`card ${className}`} {...props}>
      {title && <h2>{title}</h2>}
      {children}
    </section>
  );
}
export function Field({ label, children, ...props }) {
  return (
    <label className="field" {...props}>
      <span>{label}</span>
      {children}
    </label>
  );
}
export function Heading({ title, context, children }) {
  return (
    <header className="page-heading">
      <div>
        <h1>{title}</h1>
        <p>{context}</p>
      </div>
      {children}
    </header>
  );
}
export function Modal({ title, children, onClose }) {
  const ref = useRef();
  useEffect(() => {
    ref.current.showModal();
    return () => ref.current?.close();
  }, []);
  return (
    <dialog
      ref={ref}
      onCancel={onClose}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
    >
      <header className="dialog-header">
        <h2>{title}</h2>
        <button
          className="icon-button"
          aria-label="Close dialog"
          onClick={onClose}
        >
          <X size={20} />
        </button>
      </header>
      {children}
    </dialog>
  );
}
export function Empty({ children = "Nothing here yet." }) {
  return <p className="empty">{children}</p>;
}
export function Badge({ children, tone = "" }) {
  return <span className={`badge ${tone}`}>{children}</span>;
}
export function Back({ to = "/workspace", children = "Back to workspace" }) {
  return (
    <Go to={to}>
      <ArrowLeft size={16} />
      {children}
    </Go>
  );
}
export const statusLabels = {
  todo: "To Do",
  progress: "In Progress",
  review: "Review",
  done: "Done",
};
