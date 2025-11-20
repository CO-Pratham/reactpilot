// src/index.ts
import { z } from "zod";
var analysisIssueSchema = z.object({
  file: z.string(),
  type: z.string(),
  line: z.number(),
  suggestion: z.string()
});
function timestamp() {
  return (/* @__PURE__ */ new Date()).toISOString();
}
export {
  analysisIssueSchema,
  timestamp
};
