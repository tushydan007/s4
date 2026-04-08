import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import Spinner, { FullPageSpinner } from "@/components/ui/Spinner";

describe("Spinner", () => {
  it("renders with default medium size", () => {
    const { container } = render(<Spinner />);
    const spinner = container.querySelector(".h-8.w-8");
    expect(spinner).toBeTruthy();
  });

  it("renders with small size", () => {
    const { container } = render(<Spinner size="sm" />);
    const spinner = container.querySelector(".h-4.w-4");
    expect(spinner).toBeTruthy();
  });

  it("renders with large size", () => {
    const { container } = render(<Spinner size="lg" />);
    const spinner = container.querySelector(".h-12.w-12");
    expect(spinner).toBeTruthy();
  });

  it("applies custom className", () => {
    const { container } = render(<Spinner className="my-custom" />);
    expect(container.firstElementChild?.className).toContain("my-custom");
  });
});

describe("FullPageSpinner", () => {
  it("renders loading text", () => {
    render(<FullPageSpinner />);
    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });

  it("renders with fixed positioning", () => {
    const { container } = render(<FullPageSpinner />);
    const wrapper = container.firstElementChild;
    expect(wrapper?.className).toContain("fixed");
    expect(wrapper?.className).toContain("inset-0");
  });
});
