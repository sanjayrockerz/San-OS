"use server";

export type AiAssistantAction = "explain" | "optimize" | "bug" | "tests";

export interface AiAssistantResponse {
  markdown: string;
  suggestedAction?: string;
}

export async function askCodeAssistant(
  action: AiAssistantAction,
  code: string,
  language: string,
): Promise<AiAssistantResponse> {
  // Simulate network latency for a realistic UX
  await new Promise((resolve) => setTimeout(resolve, 1500));

  if (!code || code.trim().length === 0) {
    return {
      markdown: "Please write or select some code first so I can analyze it.",
    };
  }

  // Pre-canned responses based on action until a real LLM is connected.
  switch (action) {
    case "explain":
      return {
        markdown: `### Code Explanation\n\nI've analyzed your ${language} code. This snippet appears to be working through the core logic of the problem.\n\n- The time complexity is likely bound by the primary loop or recursion depth.\n- The space complexity depends on the auxiliary data structures you've allocated.\n\n> **Tip:** Make sure to trace through edge cases (like empty inputs or maximum bounds) to ensure correctness.`,
        suggestedAction: "Run a mental trace with input `n = 0`.",
      };
    case "optimize":
      return {
        markdown: `### Optimization Suggestions\n\nYour ${language} code looks functionally correct, but there might be room for improvement:\n\n1. **Time Complexity:** Can you replace any nested loops with a single pass using a hash map or two pointers?\n2. **Space Complexity:** Are you allocating unnecessary arrays when a few scalar variables would suffice?\n3. **Redundancy:** Look for repeated operations that can be cached or computed once outside the loop.\n\nTry refactoring to reduce the Big-O bound.`,
      };
    case "bug":
      return {
        markdown: `### Bug Detection\n\nI ran a static analysis on your ${language} snippet. Here are a few things to double-check:\n\n- **Off-by-one errors:** Check your loop boundaries (` + "`<` vs `<=`" + `).\n- **Null/Undefined:** Ensure you handle cases where the input is missing or empty.\n- **Type Mismatches:** If using strict types, ensure your return type matches the expected output.\n\nIf the logic seems sound, try adding a few debug print statements to track the state.`,
      };
    case "tests":
      return {
        markdown: `### Generated Test Cases\n\nHere are some edge cases you should test your ${language} code against:\n\n1. **Empty/Null Input:** What happens if the input array is empty?\n2. **Single Element:** Test with an array of size 1.\n3. **Negative Numbers:** If applicable, ensure negative values don't break the logic.\n4. **Maximum Constraints:** Test with the largest possible input size to check for Time Limit Exceeded (TLE) or integer overflow.\n\nConsider adding these to your test suite!`,
      };
    default:
      return {
        markdown: "I'm ready to help with your code!",
      };
  }
}
