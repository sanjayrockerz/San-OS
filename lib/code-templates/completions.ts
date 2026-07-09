import type { Monaco } from "@monaco-editor/react";
import type { editor, Position } from "monaco-editor";

type Snippet = {
  label: string;
  detail: string;
  insertText: string;
};

const JAVA_SNIPPETS: Snippet[] = [
  { label: "scanner", detail: "Scanner sc = new Scanner(System.in)", insertText: "Scanner sc = new Scanner(System.in);\n" },
  { label: "sysout", detail: "System.out.println()", insertText: "System.out.println($1);" },
  { label: "main", detail: "public static void main(String[] args)", insertText: "public static void main(String[] args) {\n    $1\n}" },
  { label: "array", detail: "int[] arr = new int[n]", insertText: "int[] $1 = new int[$2];" },
  { label: "fori", detail: "for (int i = 0; i < n; i++)", insertText: "for (int i = 0; i < $1; i++) {\n    $2\n}" },
  { label: "arraylist", detail: "ArrayList<Integer> list = new ArrayList<>()", insertText: "ArrayList<$1> $2 = new ArrayList<>();" },
  { label: "hashmap", detail: "HashMap<K, V> map = new HashMap<>()", insertText: "HashMap<$1, $2> $3 = new HashMap<>();" },
];

const PYTHON_SNIPPETS: Snippet[] = [
  { label: "sysread", detail: "sys.stdin.read().strip().split()", insertText: "data = sys.stdin.read().strip().split()\n" },
  { label: "def", detail: "def function_name(args):", insertText: "def $1($2):\n    $3" },
  { label: "for", detail: "for x in iterable:", insertText: "for $1 in $2:\n    $3" },
  { label: "listcomp", detail: "[expr for x in iterable]", insertText: "[$1 for $2 in $3]" },
  { label: "defaultdict", detail: "defaultdict(list)", insertText: "defaultdict($1)" },
  { label: "deque", detail: "from collections import deque", insertText: "from collections import deque\n" },
  { label: "class", detail: "class ClassName:", insertText: "class $1:\n    def __init__(self):\n        $2" },
];

const CPP_SNIPPETS: Snippet[] = [
  { label: "cin", detail: "cin >> variable", insertText: "cin >> $1;" },
  { label: "cout", detail: "cout << value << endl", insertText: "cout << $1 << endl;" },
  { label: "vector", detail: "vector<int> v", insertText: "vector<$1> $2;" },
  { label: "for", detail: "for (int i = 0; i < n; i++)", insertText: "for (int i = 0; i < $1; i++) {\n    $2\n}" },
  { label: "auto", detail: "auto it = container.begin()", insertText: "auto $1 = $2.$3();" },
  { label: "unordered_map", detail: "unordered_map<K, V> mp", insertText: "unordered_map<$1, $2> $3;" },
  { label: "sort", detail: "sort(v.begin(), v.end())", insertText: "sort($1.begin(), $1.end());" },
  { label: "pb", detail: "v.push_back(val)", insertText: "$1.push_back($2);" },
  { label: "ll", detail: "long long", insertText: "long long" },
];

const JS_SNIPPETS: Snippet[] = [
  { label: "log", detail: "console.log()", insertText: "console.log($1);" },
  { label: "function", detail: "function name(args) {}", insertText: "function $1($2) {\n    $3\n}" },
  { label: "for", detail: "for (let i = 0; i < n; i++)", insertText: "for (let $1 = 0; $1 < $2; $1++) {\n    $3\n}" },
  { label: "if", detail: "if (condition) {}", insertText: "if ($1) {\n    $2\n}" },
  { label: "arrow", detail: "const fn = () => {}", insertText: "const $1 = ($2) => {\n    $3\n};" },
];

const TS_SNIPPETS: Snippet[] = [
  { label: "interface", detail: "interface Name {}", insertText: "interface $1 {\n    $2\n}" },
  { label: "type", detail: "type Name = ...", insertText: "type $1 = $2;" },
  { label: "function", detail: "function name(args): Type", insertText: "function $1($2): $3 {\n    $4\n}" },
  { label: "log", detail: "console.log()", insertText: "console.log($1);" },
  { label: "arrow", detail: "const fn: Type = () => {}", insertText: "const $1: $2 = ($3) => {\n    $4\n};" },
];

const C_SNIPPETS: Snippet[] = [
  { label: "printf", detail: 'printf("format", args)', insertText: 'printf("$1", $2);' },
  { label: "scanf", detail: 'scanf("%d", &var)', insertText: 'scanf("%d", &$1);' },
  { label: "for", detail: "for (int i = 0; i < n; i++)", insertText: "for (int i = 0; i < $1; i++) {\n    $2\n}" },
  { label: "malloc", detail: "malloc(sizeof(type) * n)", insertText: "malloc(sizeof($1) * $2)" },
];

const GO_SNIPPETS: Snippet[] = [
  { label: "fmtp", detail: 'fmt.Printf("format", args)', insertText: 'fmt.Printf("$1", $2)' },
  { label: "fmts", detail: "fmt.Scan(&var)", insertText: "fmt.Scan(&$1)" },
  { label: "for", detail: "for i := 0; i < n; i++", insertText: "for $1 := 0; $1 < $2; $1++ {\n    $3\n}" },
  { label: "slice", detail: "make([]Type, n)", insertText: "make([]$1, $2)" },
  { label: "iferr", detail: "if err != nil", insertText: "if err != nil {\n    $1\n}" },
];

const LANGUAGE_SNIPPETS: Record<string, Snippet[]> = {
  java: JAVA_SNIPPETS,
  python: PYTHON_SNIPPETS,
  cpp: CPP_SNIPPETS,
  c: C_SNIPPETS,
  javascript: JS_SNIPPETS,
  typescript: TS_SNIPPETS,
  go: GO_SNIPPETS,
};

export function registerCompletionProviders(monaco: Monaco, language: string): void {
  const lang = language.toLowerCase();
  const snippets = LANGUAGE_SNIPPETS[lang];
  if (!snippets) return;

  monaco.languages.registerCompletionItemProvider(lang, {
    triggerCharacters: [".", "("],
    provideCompletionItems: (model: editor.ITextModel, position: Position) => {
      const word = model.getWordUntilPosition(position);
      const range = {
        startLineNumber: position.lineNumber,
        endLineNumber: position.lineNumber,
        startColumn: word.startColumn,
        endColumn: word.endColumn,
      };

      const items = snippets.map((s) => ({
        label: s.label,
        detail: s.detail,
        kind: monaco.languages.CompletionItemKind.Snippet,
        insertText: s.insertText,
        range,
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
      }));

      return { suggestions: items };
    },
  });
}
