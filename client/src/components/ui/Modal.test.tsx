import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import Modal from "@/components/ui/Modal";

describe("Modal", () => {
  it("renders children when open", () => {
    render(
      <Modal isOpen onClose={vi.fn()} title="Test Modal">
        <p>Modal content</p>
      </Modal>,
    );
    expect(screen.getByText("Modal content")).toBeInTheDocument();
  });

  it("renders title", () => {
    render(
      <Modal isOpen onClose={vi.fn()} title="My Title">
        Content
      </Modal>,
    );
    expect(screen.getByText("My Title")).toBeInTheDocument();
  });

  it("does not render when closed", () => {
    render(
      <Modal isOpen={false} onClose={vi.fn()} title="Hidden">
        Hidden content
      </Modal>,
    );
    expect(screen.queryByText("Hidden content")).not.toBeInTheDocument();
  });

  it("calls onClose when backdrop is clicked", () => {
    const onClose = vi.fn();
    render(
      <Modal isOpen onClose={onClose} title="Test">
        Content
      </Modal>,
    );
    const backdrop = document.querySelector(".bg-navy-950\\/60");
    if (backdrop) fireEvent.click(backdrop);
    expect(onClose).toHaveBeenCalled();
  });

  it("calls onClose when Escape is pressed", () => {
    const onClose = vi.fn();
    render(
      <Modal isOpen onClose={onClose} title="Test">
        Content
      </Modal>,
    );
    fireEvent.keyDown(window, { key: "Escape" });
    expect(onClose).toHaveBeenCalled();
  });

  it("sets body overflow hidden when open", () => {
    render(
      <Modal isOpen onClose={vi.fn()} title="Test">
        Content
      </Modal>,
    );
    expect(document.body.style.overflow).toBe("hidden");
  });

  it("restores body overflow when closed", () => {
    const { rerender } = render(
      <Modal isOpen onClose={vi.fn()} title="Test">
        Content
      </Modal>,
    );
    rerender(
      <Modal isOpen={false} onClose={vi.fn()} title="Test">
        Content
      </Modal>,
    );
    expect(document.body.style.overflow).toBe("");
  });

  it("applies correct size class for sm", () => {
    const { container } = render(
      <Modal isOpen onClose={vi.fn()} title="Test" size="sm">
        Content
      </Modal>,
    );
    expect(container.innerHTML).toContain("max-w-sm");
  });

  it("applies correct size class for lg", () => {
    const { container } = render(
      <Modal isOpen onClose={vi.fn()} title="Test" size="lg">
        Content
      </Modal>,
    );
    expect(container.innerHTML).toContain("max-w-2xl");
  });

  it("applies correct size class for xl", () => {
    const { container } = render(
      <Modal isOpen onClose={vi.fn()} title="Test" size="xl">
        Content
      </Modal>,
    );
    expect(container.innerHTML).toContain("max-w-4xl");
  });
});
