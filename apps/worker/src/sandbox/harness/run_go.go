package main

import (
	"encoding/json"
	"os"
	"os/exec"
	"runtime"
	"time"
)

type Metrics struct {
	ExecutionTimeMs float64 `json:"execution_time_ms"`
	CpuTimeMs       *float64 `json:"cpu_time_ms"`
	PeakMemoryBytes uint64  `json:"peak_memory_bytes"`
	ExitCode        int     `json:"exit_code"`
	Error           string  `json:"error"`
}

func main() {
	var memBefore runtime.MemStats
	runtime.ReadMemStats(&memBefore)

	start := time.Now()

	cmd := exec.Command("go", "run", "/code/solution.go")
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr

	exitCode := 0
	errMsg := ""

	if err := cmd.Run(); err != nil {
		exitCode = 1
		errMsg = err.Error()
		if exitErr, ok := err.(*exec.ExitError); ok {
			exitCode = exitErr.ExitCode()
		}
	}

	elapsed := time.Since(start).Seconds() * 1000

	var memAfter runtime.MemStats
	runtime.ReadMemStats(&memAfter)

	metrics := Metrics{
		ExecutionTimeMs: elapsed,
		CpuTimeMs:       nil,
		PeakMemoryBytes: memAfter.Sys,
		ExitCode:        exitCode,
		Error:           errMsg,
	}

	data, _ := json.Marshal(metrics)
	os.WriteFile("/results/metrics.json", data, 0644)

	os.Exit(exitCode)
}
