import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import Select from "@/components/ui/Select";

describe("Select", () => {
  it("renders label", () => {
    render(
      <Select label="Category">
        <option value="a">Option A</option>
      </Select>,
    );
    expect(screen.getByText("Category")).toBeInTheDocument();
  });

  it("renders select element with options", () => {
    render(
      <Select label="Type">
        <option value="1">One</option>
        <option value="2">Two</option>
      </Select>,
    );
    const select = screen.getByRole("combobox");
    expect(select).toBeInTheDocument();
    expect(screen.getByText("One")).toBeInTheDocument();
    expect(screen.getByText("Two")).toBeInTheDocument();
  });

  it("shows error message from FieldError", () => {
    render(
      <Select
        label="Type"
        error={{ type: "required", message: "Required field" }}
      >
        <option>A</option>
      </Select>,
    );
    expect(screen.getByText("Required field")).toBeInTheDocument();
  });

  it("shows error message from string", () => {
    render(
      <Select label="Type" error="Must select one">
        <option>A</option>
      </Select>,
    );
    expect(screen.getByText("Must select one")).toBeInTheDocument();
  });

  it("applies error styling when error is present", () => {
    render(
      <Select label="Type" error="Error">
        <option>A</option>
      </Select>,
    );
    const select = screen.getByRole("combobox");
    expect(select.className).toContain("border-danger-500");
  });

  it("does not show error when no error provided", () => {
    const { container } = render(
      <Select label="Type">
        <option>A</option>
      </Select>,
    );
    expect(container.querySelector(".text-danger-600")).toBeNull();
  });
});
