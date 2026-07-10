export const LANGUAGE_TEMPLATES: Record<string, string> = {
  Java: `import java.util.*;
import java.io.*;

public class Solution {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int n = sc.nextInt();
        // Write your solution here
        sc.close();
    }
}`,
  Python: `import sys
from collections import *
from math import *

def solve() -> None:
    data = sys.stdin.read().strip().split()
    if not data:
        return
    # Write your solution here

if __name__ == "__main__":
    solve()`,
  "C++": `#include <bits/stdc++.h>
using namespace std;

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(nullptr);

    int n;
    cin >> n;
    // Write your solution here

    return 0;
}`,
  JavaScript: `const readline = require("readline");

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});

// Write your solution here`,
  TypeScript: `// Write your solution here

function solve(): void {
    // Implementation
}

export default solve;`,
  C: `#include <stdio.h>
#include <stdlib.h>

int main() {
    int n;
    scanf("%d", &n);
    // Write your solution here
    return 0;
}`,
  Go: `package main

import "fmt"

func main() {
    var n int
    fmt.Scan(&n)
    // Write your solution here
}`,
};
