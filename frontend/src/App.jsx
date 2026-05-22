import { AlertCircle, CheckCircle2, FileText, Loader2, Sparkles, UploadCloud } from "lucide-react";
import { useMemo, useState } from "react";

const API_URL = "http://localhost:8000/analyze-resume";

const roles = [
  "Software Developer",
  "Data Analyst",
  "Machine Learning Engineer",
  "Cybersecurity Analyst",
];

function Badge({ children, tone }) {
  const styles =
    tone === "success"
      ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
      : "bg-rose-50 text-rose-700 ring-rose-200";

  return (
    <span className={`rounded-full px-3 py-1 text-sm font-medium ring-1 ${styles}`}>
      {children}
    </span>
  );
}

function EmptyState() {
  return (
    <div className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center">
      <FileText className="mx-auto mb-3 h-10 w-10 text-slate-400" />
      <h2 className="text-lg font-semibold text-slate-900">Upload a resume to begin</h2>
      <p className="mt-2 text-sm text-slate-500">
        Choose a PDF, DOCX, or TXT file and compare it with a target job role.
      </p>
    </div>
  );
}

function App() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [role, setRole] = useState(roles[0]);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fileName = useMemo(() => selectedFile?.name || "No file selected", [selectedFile]);

  async function handleAnalyze(event) {
    event.preventDefault();
    setError("");
    setResult(null);

    if (!selectedFile) {
      setError("Please upload a resume before analyzing.");
      return;
    }

    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("role", role);

    setLoading(true);

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Resume analysis failed.");
      }

      setResult(data);
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8">
        <header className="rounded-lg bg-slate-900 px-6 py-8 text-white shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-sky-300">
                Student Project Dashboard
              </p>
              <h1 className="mt-2 text-3xl font-bold sm:text-4xl">
                Resume Monitoring Agent
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
                Analyze resume skill coverage against popular tech roles and get clear next steps for improvement.
              </p>
            </div>
            <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-white/10">
              <Sparkles className="h-7 w-7 text-sky-300" />
            </div>
          </div>
        </header>

        <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
          <form onSubmit={handleAnalyze} className="rounded-lg bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <h2 className="text-xl font-semibold text-slate-900">Analyze Resume</h2>

            <label className="mt-5 block">
              <span className="text-sm font-medium text-slate-700">Target job role</span>
              <select
                value={role}
                onChange={(event) => setRole(event.target.value)}
                className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
              >
                {roles.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>

            <label className="mt-5 flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center transition hover:border-sky-400 hover:bg-sky-50">
              <UploadCloud className="mb-3 h-10 w-10 text-sky-500" />
              <span className="text-sm font-semibold text-slate-800">Upload resume</span>
              <span className="mt-1 max-w-full truncate text-xs text-slate-500">{fileName}</span>
              <input
                type="file"
                accept=".pdf,.docx,.txt"
                onChange={(event) => setSelectedFile(event.target.files?.[0] || null)}
                className="sr-only"
              />
            </label>

            {error && (
              <div className="mt-4 flex gap-2 rounded-lg bg-rose-50 p-3 text-sm text-rose-700 ring-1 ring-rose-200">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg bg-sky-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:bg-slate-400"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                "Analyze Resume"
              )}
            </button>
          </form>

          <section className="min-h-[480px]">
            {!result && !loading && <EmptyState />}

            {loading && (
              <div className="flex min-h-[480px] items-center justify-center rounded-lg bg-white p-8 shadow-sm ring-1 ring-slate-200">
                <div className="text-center">
                  <Loader2 className="mx-auto mb-4 h-10 w-10 animate-spin text-sky-600" />
                  <p className="font-medium text-slate-800">Checking resume skills...</p>
                  <p className="mt-1 text-sm text-slate-500">This usually takes a few seconds.</p>
                </div>
              </div>
            )}

            {result && (
              <div className="space-y-6">
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="rounded-lg bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:col-span-1">
                    <p className="text-sm font-medium text-slate-500">Match score</p>
                    <p className="mt-3 text-5xl font-bold text-slate-900">{result.match_score}%</p>
                    <p className="mt-2 text-sm text-slate-500">{result.role}</p>
                  </div>
                  <div className="rounded-lg bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:col-span-2">
                    <div className="flex items-center gap-2 text-emerald-700">
                      <CheckCircle2 className="h-5 w-5" />
                      <h2 className="text-lg font-semibold">Analysis complete</h2>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-slate-600">
                      Your resume was compared with the selected role skills. Review the missing skills and suggestions below to strengthen your profile.
                    </p>
                  </div>
                </div>

                <div className="rounded-lg bg-white p-5 shadow-sm ring-1 ring-slate-200">
                  <h3 className="text-lg font-semibold text-slate-900">Found Skills</h3>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {result.found_skills.length ? (
                      result.found_skills.map((skill) => (
                        <Badge key={skill} tone="success">
                          {skill}
                        </Badge>
                      ))
                    ) : (
                      <p className="text-sm text-slate-500">No matching role skills were found.</p>
                    )}
                  </div>
                </div>

                <div className="rounded-lg bg-white p-5 shadow-sm ring-1 ring-slate-200">
                  <h3 className="text-lg font-semibold text-slate-900">Missing Skills</h3>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {result.missing_skills.length ? (
                      result.missing_skills.map((skill) => (
                        <Badge key={skill} tone="danger">
                          {skill}
                        </Badge>
                      ))
                    ) : (
                      <p className="text-sm text-slate-500">No missing skills for this role list.</p>
                    )}
                  </div>
                </div>

                <div className="rounded-lg bg-white p-5 shadow-sm ring-1 ring-slate-200">
                  <h3 className="text-lg font-semibold text-slate-900">Improvement Suggestions</h3>
                  <div className="mt-4 grid gap-3">
                    {result.suggestions.map((suggestion) => (
                      <div key={suggestion} className="rounded-lg bg-slate-50 p-4 text-sm leading-6 text-slate-700 ring-1 ring-slate-200">
                        {suggestion}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </section>
        </div>
      </section>
    </main>
  );
}

export default App;
