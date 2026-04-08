import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import Button from "@/components/ui/Button";

describe("Button", () => {
  it("renders children text", () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText("Click me")).toBeInTheDocument();
  });

  it("renders with primary variant by default", () => {
    render(<Button>Test</Button>);
    const btn = screen.getByText("Test").closest("button");
    expect(btn?.className).toContain("bg-navy-800");
  });

  it("renders secondary variant", () => {
    render(<Button variant="secondary">Test</Button>);
    const btn = screen.getByText("Test").closest("button");
    expect(btn?.className).toContain("bg-navy-100");
  });

  it("renders danger variant", () => {
    render(<Button variant="danger">Delete</Button>);
    const btn = screen.getByText("Delete").closest("button");
    expect(btn?.className).toContain("bg-danger-600");
  });

  it("renders ghost variant", () => {
    render(<Button variant="ghost">Ghost</Button>);
    const btn = screen.getByText("Ghost").closest("button");
    expect(btn?.className).toContain("bg-transparent");
  });

  it("renders outline variant", () => {
    render(<Button variant="outline">Outline</Button>);
    const btn = screen.getByText("Outline").closest("button");
    expect(btn?.className).toContain("border-navy-300");
  });

  it("applies size sm", () => {
    render(<Button size="sm">Small</Button>);
    const btn = screen.getByText("Small").closest("button");
    expect(btn?.className).toContain("px-3");
  });

  it("applies size lg", () => {
    render(<Button size="lg">Large</Button>);
    const btn = screen.getByText("Large").closest("button");
    expect(btn?.className).toContain("px-6");
  });

  it("shows spinner when isLoading", () => {
    render(<Button isLoading>Loading</Button>);
    const btn = screen.getByRole("button");
    expect(btn).toBeDisabled();
    expect(btn.querySelector("svg.animate-spin")).toBeTruthy();
  });

  it("is disabled when disabled prop is set", () => {
    render(<Button disabled>Disabled</Button>);
    expect(screen.getByRole("button")).toBeDisabled();
  });

  it("renders with icon", () => {
    render(<Button icon={<span data-testid="icon">★</span>}>With Icon</Button>);
    expect(screen.getByTestId("icon")).toBeInTheDocument();
  });

  it("applies custom className", () => {
    render(<Button className="custom-class">Custom</Button>);
    const btn = screen.getByText("Custom").closest("button");
    expect(btn?.className).toContain("custom-class");
  });
});
