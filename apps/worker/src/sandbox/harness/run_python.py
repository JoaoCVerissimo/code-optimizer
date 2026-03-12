import time
import tracemalloc
import json
import importlib.util
import sys
import resource

def main():
    tracemalloc.start()
    start_cpu = resource.getrusage(resource.RUSAGE_CHILDREN)
    start_wall = time.perf_counter()
    exit_code = 0
    error_msg = ""

    try:
        spec = importlib.util.spec_from_file_location("user_code", "/code/solution.py")
        if spec is None or spec.loader is None:
            raise ImportError("Could not load /code/solution.py")
        mod = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(mod)
        if hasattr(mod, "main"):
            mod.main()
    except Exception as e:
        exit_code = 1
        error_msg = str(e)
    finally:
        elapsed_ms = (time.perf_counter() - start_wall) * 1000
        end_cpu = resource.getrusage(resource.RUSAGE_CHILDREN)
        cpu_ms = (
            (end_cpu.ru_utime - start_cpu.ru_utime)
            + (end_cpu.ru_stime - start_cpu.ru_stime)
        ) * 1000
        _, peak = tracemalloc.get_traced_memory()
        tracemalloc.stop()

        metrics = {
            "execution_time_ms": round(elapsed_ms, 4),
            "cpu_time_ms": round(cpu_ms, 4),
            "peak_memory_bytes": peak,
            "exit_code": exit_code,
            "error": error_msg,
        }

        with open("/results/metrics.json", "w") as f:
            json.dump(metrics, f)

    sys.exit(exit_code)

if __name__ == "__main__":
    main()
