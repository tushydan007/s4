import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import HomePage from "../pages/HomePage";

function renderPage() {
  return render(
    <MemoryRouter>
      <HomePage />
    </MemoryRouter>,
  );
}

describe("HomePage", () => {
  it("renders hero section with main heading", () => {
    renderPage();
    expect(screen.getByText("Report Incidents.")).toBeInTheDocument();
    expect(screen.getByText("Save Lives.")).toBeInTheDocument();
  });

  it("renders feature cards", () => {
    renderPage();
    expect(screen.getByText("Voice Reports")).toBeInTheDocument();
    expect(screen.getByText("Location Mapping")).toBeInTheDocument();
    expect(screen.getByText("Real-Time Alerts")).toBeInTheDocument();
    expect(screen.getByText("Community Safety")).toBeInTheDocument();
    expect(screen.getByText("Verified Users")).toBeInTheDocument();
    expect(screen.getByText("Agency Integration")).toBeInTheDocument();
  });

  it("renders how it works steps", () => {
    renderPage();
    expect(screen.getByText("Register & Verify")).toBeInTheDocument();
    expect(screen.getByText("Record & Report")).toBeInTheDocument();
    expect(screen.getByText("Agencies Respond")).toBeInTheDocument();
  });

  it("renders stats section", () => {
    renderPage();
    expect(screen.getByText("Security Stations")).toBeInTheDocument();
    expect(screen.getByText("Verified Citizens")).toBeInTheDocument();
    expect(screen.getByText("Reports Submitted")).toBeInTheDocument();
  });

  it("renders category tags", () => {
    renderPage();
    const robberyEls = screen.getAllByText("Robbery");
    expect(robberyEls.length).toBeGreaterThanOrEqual(1);
    const assaultEls = screen.getAllByText("Assault");
    expect(assaultEls.length).toBeGreaterThanOrEqual(1);
  });

  it("renders get started CTA links", () => {
    renderPage();
    const links = screen.getAllByText(/Get Started/i);
    expect(links.length).toBeGreaterThanOrEqual(1);
  });

  it("renders footer with S4 Security text", () => {
    renderPage();
    const logos = screen.getAllByText("S4 Security");
    expect(logos.length).toBeGreaterThanOrEqual(1);
  });

  it("renders emergency contacts section", () => {
    renderPage();
    const contacts = screen.getAllByText("Emergency Contacts");
    expect(contacts.length).toBeGreaterThanOrEqual(1);
  });

  it("renders Why S4 section", () => {
    renderPage();
    expect(screen.getByText("Why S4?")).toBeInTheDocument();
  });
});
