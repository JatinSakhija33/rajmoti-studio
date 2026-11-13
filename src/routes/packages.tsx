import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowRight, Check } from "lucide-react";
import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";
export const Route = createFileRoute("/packages")({
  head: () => ({ meta: [{ title: "Session collections — Rajmoti Studio" }] }),
  component: Packages,
});
const collections = [
  {
    name: "Essential",
    subtitle: "A little chapter",
    duration: "45 minutes",
    setups: "1 setup",
    images: "5 edited photographs",
    prints: "Digital collection; prints optional",
    family: "Discuss family participation",
    notes: "A simple portrait session concept.",
  },
  {
    name: "Signature",
    subtitle: "Room for the whole story",
    duration: "90 minutes",
    setups: "2 setups",
    images: "12 edited photographs",
    prints: "A framed print option to discuss",
    family: "Parent & family portraits proposed",
    notes: "An extended session concept.",
  },
  {
    name: "Keepsake",
    subtitle: "Made to live beyond a screen",
    duration: "2 hours",
    setups: "3 setups",
    images: "20 edited photographs",
    prints: "An album or wall art option to discuss",
    family: "Family portraits proposed",
    notes: "A session and printed keepsake concept.",
  },
];
function Packages() {
  const [category, setCategory] = useState("Baby");
  return (
    <div className="editorial">
      <SiteNav />
      <main className="ed-wrap packages-page">
        <p className="ed-kicker">Choose the experience that feels like you</p>
        <h1>
          Thoughtful sessions.
          <br />
          <em>Clear choices.</em>
        </h1>
        <p className="ed-copy">
          Compare what matters: time, photographs, family participation and the keepsakes you take
          home.
        </p>
        <div className="session-tabs" role="group" aria-label="Photography category">
          {["Baby", "Maternity", "Family", "Wedding"].map((c) => (
            <button
              aria-pressed={category === c}
              className={category === c ? "active" : ""}
              key={c}
              onClick={() => setCategory(c)}
            >
              {c}
            </button>
          ))}
        </div>
        <p className="ed-notice">
          Demonstration collections only. The sample durations and inclusions below are proposals,
          not Rajmoti's confirmed packages. All prices and delivery dates require confirmation.
        </p>
        {category === "Wedding" ? (
          <div className="wedding-collection">
            <p className="ed-kicker">Your day deserves its own plan</p>
            <h2>Tell us about your celebration.</h2>
            <p>
              Share the dates, venues, events and coverage you have in mind. Wedding coverage, team
              size, photographs, films and albums are quoted individually.
            </p>
            <Link to="/contact" search={{ session: "Wedding" }} className="ed-button">
              Discuss wedding coverage <ArrowRight size={16} />
            </Link>
          </div>
        ) : (
          <>
            <div className="package-grid">
              {collections.map((c, i) => (
                <article className={"collection-card " + (i === 1 ? "featured" : "")} key={c.name}>
                  <p className="ed-kicker">
                    {category} · Concept 0{i + 1}
                  </p>
                  <h2>{c.name}</h2>
                  <p className="collection-subtitle">{c.subtitle}</p>
                  <strong className="collection-price">Price to be confirmed</strong>
                  <ul>
                    {[
                      c.duration + " proposed",
                      c.setups + " proposed",
                      c.images + " proposed",
                      c.family,
                      c.prints,
                    ].map((x) => (
                      <li key={x}>
                        <Check size={15} />
                        {x}
                      </li>
                    ))}
                  </ul>
                  <Link
                    to="/contact"
                    search={{ package: `${category} ${c.name} (demo concept)`, session: category }}
                    className={"ed-button " + (i === 1 ? "" : "outline")}
                  >
                    Discuss this collection <ArrowRight size={16} />
                  </Link>
                </article>
              ))}
            </div>
            <details className="package-comparison" open>
              <summary>Compare the proposed inclusions</summary>
              <div className="comparison-scroll">
                <table className="comparison-table">
                  <thead>
                    <tr>
                      <th>What is included</th>
                      {collections.map((c) => (
                        <th key={c.name}>{c.name}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      ["Session duration", "duration"],
                      ["Setups", "setups"],
                      ["Edited photographs", "images"],
                      ["Printed keepsakes", "prints"],
                      ["Family participation", "family"],
                    ].map(([label, key]) => (
                      <tr key={key}>
                        <th>{label}</th>
                        {collections.map((c) => (
                          <td key={c.name}>{c[key as keyof typeof c]}</td>
                        ))}
                      </tr>
                    ))}
                    <tr>
                      <th>Delivery & extras</th>
                      {collections.map((c) => (
                        <td key={c.name}>Confirmed in writing before booking</td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            </details>
          </>
        )}
        <div className="package-assurance">
          <h3>Before you confirm</h3>
          <p>
            We agree on the session date, final inclusions, image selection, editing, print sizes,
            delivery and any additional charges. A preferred date is a request until the studio
            confirms it.
          </p>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
