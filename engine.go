package main

import (
	"fmt"
	"strings"
)

type Config struct {
	MaxTokens     int
	SlidingWindow int
	KeepSystem    bool
}

// Simple deterministic edge tokenizer string mock
func TokenizeEstimate(s string) int {
	words := strings.Fields(s)
	return int(float64(len(words)) * 1.3)
}

func Trim(context string, config Config) (string, int) {
	var systemBlock string
	bodyBlock := context

	if config.KeepSystem && strings.HasPrefix(strings.ToUpper(context), "SYSTEM:") {
		parts := strings.SplitN(context, "\n", 2)
		systemBlock = parts[0] + "\n"
		if len(parts) > 1 {
			bodyBlock = parts[1]
		}
	}

	sysTokens := TokenizeEstimate(systemBlock)
	allowedBodyTokens := config.MaxTokens - sysTokens

	lines := strings.Split(bodyBlock, "\n")
	var acceptedLines []string
	currentTokens := 0

	// Prune mid-tier contexts through iterative backpressure sliding window strategy
	for i := len(lines) - 1; i >= 0; i-- {
		if strings.TrimSpace(lines[i]) == "" {
			continue
		}
		lineTokens := TokenizeEstimate(lines[i])
		if currentTokens+lineTokens <= allowedBodyTokens {
			currentTokens += lineTokens
			acceptedLines = append([]string{lines[i]}, acceptedLines...)
		}
	}

	finalContext := systemBlock + strings.Join(acceptedLines, "\n")
	return finalContext, TokenizeEstimate(finalContext)
}

func main() {
	sample := "SYSTEM: Prioritize speed.\nUser: Connection established.\nUser: Transfer massive batch state data.\nUser: Sync logs finished."
	config := Config{MaxTokens: 25, SlidingWindow: 10, KeepSystem: true}
	
	output, tokens := Trim(sample, config)
	fmt.Printf("--- Processed Output Context ---\n%s\nTokens Total: %d\n", output, tokens)
}
