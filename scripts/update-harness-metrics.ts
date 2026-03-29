/**
 * Calculates harness effectiveness metrics from progress/current.json
 * and git history, then writes results to docs/quality/harness-metrics.json.
 *
 * Metrics tracked:
 * - Task success rate (completed vs abandoned)
 * - First-pass CI success rate (task commits that passed CI without a follow-up fix)
 * - Rework rate (fix commits following task commits)
 * - Average task duration in days
 */
import { execSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Task = {
  id: string;
  title: string;
  status: string;
  started_at?: string;
  completed_at?: string;
  commit?: string;
};

type ProgressFile = {
  current_sprint: string;
  tasks: Task[];
};

type PerTaskMetric = {
  id: string;
  title: string;
  status: string;
  duration_days: number | null;
  fix_commits_after: number;
  first_pass_ci: boolean | null;
};

type HarnessMetrics = {
  last_updated: string;
  sprint: string;
  metrics: {
    total_tasks: number;
    completed_tasks: number;
    abandoned_tasks: number;
    task_success_rate: number;
    first_pass_ci_success: { passed: number; total: number; rate: number };
    rework_commits: { fix_commits: number; task_commits: number; rate: number };
    avg_task_duration_days: number;
  };
  per_task: PerTaskMetric[];
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Read and parse progress/current.json. */
function readProgress(): ProgressFile {
  const raw = readFileSync("progress/current.json", "utf-8");
  return JSON.parse(raw) as ProgressFile;
}

type CommitInfo = {
  hash: string;
  subject: string;
  body: string;
};

/** Get all commits with hash, subject, and full body. */
function getGitLog(): CommitInfo[] {
  const SEP = "---COMMIT_SEP---";
  const raw = execSync(`git log --format="${SEP}%n%h%n%s%n%b" --no-decorate`, {
    encoding: "utf-8",
    stdio: ["pipe", "pipe", "pipe"],
  });
  const blocks = raw.split(SEP).filter((b) => b.trim());
  return blocks.map((block) => {
    const lines = block.trim().split("\n");
    return {
      hash: lines[0] ?? "",
      subject: lines[1] ?? "",
      body: lines.slice(2).join("\n"),
    };
  });
}

/**
 * Count how many fix-type commits appear after a task's initial commit.
 * Searches commit subjects and bodies for "refs TASK-XXX" references,
 * then counts subsequent fix(...) commits before the next different task.
 */
function countFixCommitsForTask(
  taskId: string,
  commits: CommitInfo[],
): { fixCount: number; hasTaskCommit: boolean } {
  const taskRefPattern = new RegExp(`refs\\s+${taskId}\\b`, "i");
  const fixSubjectPattern = /^fix\(/i;

  /** Check if a commit references this task (in subject or body). */
  const refsTask = (c: CommitInfo) => taskRefPattern.test(c.subject) || taskRefPattern.test(c.body);

  // Commits are newest-first; find the oldest commit referencing this task
  let taskCommitIdx = -1;
  for (let i = 0; i < commits.length; i++) {
    if (refsTask(commits[i] as CommitInfo)) {
      taskCommitIdx = i;
    }
  }

  if (taskCommitIdx === -1) {
    return { fixCount: 0, hasTaskCommit: false };
  }

  // Walk newer commits (lower index) and count fix commits until we hit
  // a commit that references a different task
  let fixCount = 0;
  for (let i = taskCommitIdx - 1; i >= 0; i--) {
    const c = commits[i] as CommitInfo;
    const fullText = `${c.subject}\n${c.body}`;
    const otherTaskMatch = fullText.match(/refs\s+TASK-(\d+)/i);
    if (otherTaskMatch && `TASK-${otherTaskMatch[1]}` !== taskId) {
      break;
    }
    if (fixSubjectPattern.test(c.subject)) {
      fixCount++;
    }
  }

  return { fixCount, hasTaskCommit: true };
}

/**
 * Calculate duration in days between two date strings.
 * Returns null if either date is missing.
 */
function durationDays(startedAt?: string, completedAt?: string): number | null {
  if (!startedAt || !completedAt) return null;
  const start = new Date(startedAt);
  const end = new Date(completedAt);
  const diffMs = end.getTime() - start.getTime();
  // Minimum 1 day if same-day completion
  return Math.max(Math.round(diffMs / (1000 * 60 * 60 * 24)), 1);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

/** Compute all harness metrics and write to docs/quality/harness-metrics.json. */
function main(): void {
  console.log("Reading progress/current.json...");
  const progress = readProgress();
  const tasks = progress.tasks;

  console.log("Reading git log...");
  const commits = getGitLog();

  const completedTasks = tasks.filter((t) => t.status === "completed");
  const abandonedTasks = tasks.filter((t) => t.status === "abandoned");
  const totalTasks = tasks.length;

  const taskSuccessRate =
    totalTasks > 0 ? Math.round((completedTasks.length / totalTasks) * 100) : 0;

  // Per-task analysis
  let totalFixCommits = 0;
  let totalTaskCommits = 0;
  let firstPassPassed = 0;
  let firstPassTotal = 0;
  let totalDuration = 0;
  let durationCount = 0;

  const perTask: PerTaskMetric[] = tasks.map((task) => {
    const { fixCount, hasTaskCommit } = countFixCommitsForTask(task.id, commits);
    const duration = durationDays(task.started_at, task.completed_at);

    if (hasTaskCommit) {
      totalTaskCommits++;
      totalFixCommits += fixCount;
      firstPassTotal++;
      if (fixCount === 0) {
        firstPassPassed++;
      }
    }

    if (duration !== null) {
      totalDuration += duration;
      durationCount++;
    }

    return {
      id: task.id,
      title: task.title,
      status: task.status,
      duration_days: duration,
      fix_commits_after: fixCount,
      first_pass_ci: hasTaskCommit ? fixCount === 0 : null,
    };
  });

  const avgDuration = durationCount > 0 ? Math.round(totalDuration / durationCount) : 0;
  const reworkRate =
    totalTaskCommits > 0 ? Math.round((totalFixCommits / totalTaskCommits) * 100) : 0;
  const firstPassRate =
    firstPassTotal > 0 ? Math.round((firstPassPassed / firstPassTotal) * 100) : 0;

  const output: HarnessMetrics = {
    last_updated: new Date().toISOString().split("T")[0] as string,
    sprint: progress.current_sprint,
    metrics: {
      total_tasks: totalTasks,
      completed_tasks: completedTasks.length,
      abandoned_tasks: abandonedTasks.length,
      task_success_rate: taskSuccessRate,
      first_pass_ci_success: {
        passed: firstPassPassed,
        total: firstPassTotal,
        rate: firstPassRate,
      },
      rework_commits: {
        fix_commits: totalFixCommits,
        task_commits: totalTaskCommits,
        rate: reworkRate,
      },
      avg_task_duration_days: avgDuration,
    },
    per_task: perTask,
  };

  writeFileSync("docs/quality/harness-metrics.json", `${JSON.stringify(output, null, 2)}\n`);
  console.log("Updated docs/quality/harness-metrics.json");
  console.log(JSON.stringify(output, null, 2));
}

main();
