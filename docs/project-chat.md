# ReactPilot Project Chat (`reactpilot ask`)

Project Chat allows you to talk with your React repository code directly from the terminal or the web dashboard.

## Commands

```bash
# Enter interactive chat mode
reactpilot ask

# Force re-indexing of files and query
reactpilot ask "Where is UserContext used?" --index

# Query with streaming disabled
reactpilot ask "Why does my main Dashboard component rerender?" --no-stream
```

## How it works

1. **AST Parsing:** The indexer parses files to extract components, hooks, imports, exports, and routes.
2. **Chunking & Vectoring:** Code is chunked at component/hook boundaries and embedded into vector spaces.
3. **Similarity Retrieval:** Queries match relevant chunks using cosine similarity algorithms.
4. **Context Injection:** Matching snippets are injected into prompts, providing context-aware LLM answers.
