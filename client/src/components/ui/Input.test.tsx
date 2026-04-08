import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import Input from "@/components/ui/Input";

describe("Input", () => {
  it("renders label", () => {
    render(<Input label="Email" />);
    expect(screen.getByText("Email")).toBeInTheDocument();
  });

  it("renders input element", () => {
    render(<Input label="Email" placeholder="Enter email" />);
    expect(screen.getByPlaceholderText("Enter email")).toBeInTheDocument();
  });

  it("shows error message from FieldError", () => {
    render(
      <Input
        label="Email"
        error={{ type: "required", message: "Email is required" }}
      />,
    );
    expect(screen.getByText("Email is required")).toBeInTheDocument();
  });

  it("shows error message from string", () => {
    render(<Input label="Email" error="Invalid email" />);
    expect(screen.getByText("Invalid email")).toBeInTheDocument();
  });

  it("applies error styling when error is present", () => {
    render(<Input label="Email" error="Bad" />);
    const input = screen.getByRole("textbox");
    expect(input.className).toContain("border-danger-500");
  });

  it("renders icon when provided", () => {
    render(<Input label="Email" icon={<span data-testid="icon">@</span>} />);
    expect(screen.getByTestId("icon")).toBeInTheDocument();
  });

  it("adds left padding when icon is present", () => {
    render(<Input label="Email" icon={<span>@</span>} />);
    const input = screen.getByRole("textbox");
    expect(input.className).toContain("pl-10");
  });

  it("does not show error when no error provided", () => {
    const { container } = render(<Input label="Email" />);
    expect(container.querySelector(".text-danger-600")).toBeNull();
  });
});
