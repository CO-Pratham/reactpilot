import { useEffect, useMemo, useState } from "react";

/**
 * Analyzer fixtures LIVE OUTSIDE src/ so the UI bundle stays clean.
 * The CLI scans the entire repo, so these patterns still exercise rules.
 */
export const AnalyzerRuleFixtures = () => {
  const [unusedState] = useState(0);
  const [count, setCount] = useState(0);
  const filler = Array.from({ length: 40 }, (_, index) => index);

  if (count > 5) {
    useEffect(() => {
      setCount(count + 1);
    }, []);
  }

  return (
    <div className="space-y-2">
      <h2>Analyzer Fixtures</h2>
      <p>Static file containing intentionally problematic patterns.</p>
      <div>{filler.filter((value) => value % 2 === 0).join(", ")}</div>
    </div>
  );
};
