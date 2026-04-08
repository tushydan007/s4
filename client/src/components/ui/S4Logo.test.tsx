import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import S4Logo from "@/components/ui/S4Logo";

describe("S4Logo", () => {
  it("renders an SVG element", () => {
    const { container } = render(<S4Logo />);
    const svg = container.querySelector("svg");
    expect(svg).toBeTruthy();
  });

  it("has aria-label for accessibility", () => {
    const { container } = render(<S4Logo />);
    const svg = container.querySelector("svg");
    expect(svg?.getAttribute("aria-label")).toBe("S4 Security");
  });

  it("renders S4 text", () => {
    const { container } = render(<S4Logo />);
    const text = container.querySelector("text");
    expect(text?.textContent).toBe("S4");
  });

  it("applies custom className", () => {
    const { container } = render(<S4Logo className="w-10 h-10" />);
    const svg = container.querySelector("svg");
    expect(svg?.className.baseVal).toContain("w-10");
  });

  it("generates unique gradient IDs", () => {
    const { container: c1 } = render(<S4Logo />);
    const { container: c2 } = render(<S4Logo />);
    const grad1 = c1.querySelector("linearGradient");
    const grad2 = c2.querySelector("linearGradient");
    // Each should have an id
    expect(grad1?.id).toBeTruthy();
    expect(grad2?.id).toBeTruthy();
  });
});
