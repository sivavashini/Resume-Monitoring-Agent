from io import BytesIO
from typing import Dict, List
import re

from docx import Document
from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pypdf import PdfReader


app = FastAPI(title="Resume Monitoring Agent API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


ROLE_SKILLS: Dict[str, List[str]] = {
    "Software Developer": [
        "Python",
        "JavaScript",
        "React",
        "Node.js",
        "Git",
        "SQL",
        "REST API",
        "Data Structures",
        "Algorithms",
        "Testing",
    ],
    "Data Analyst": [
        "Excel",
        "SQL",
        "Python",
        "Power BI",
        "Tableau",
        "Data Visualization",
        "Statistics",
        "Pandas",
        "Data Cleaning",
        "Reporting",
    ],
    "Machine Learning Engineer": [
        "Python",
        "Machine Learning",
        "Deep Learning",
        "TensorFlow",
        "PyTorch",
        "Scikit-learn",
        "Pandas",
        "NumPy",
        "Model Deployment",
        "MLOps",
    ],
    "Cybersecurity Analyst": [
        "Network Security",
        "Linux",
        "SIEM",
        "Incident Response",
        "Risk Assessment",
        "Vulnerability Assessment",
        "Firewalls",
        "Python",
        "SOC",
        "Threat Analysis",
    ],
}


def normalize_text(text: str) -> str:
    return re.sub(r"\s+", " ", text.lower()).strip()


def skill_pattern(skill: str) -> re.Pattern:
    escaped = re.escape(skill.lower())
    flexible = escaped.replace(r"\ ", r"[\s\-]+").replace(r"\.", r"\.?")
    return re.compile(rf"(?<![a-z0-9]){flexible}(?![a-z0-9])", re.IGNORECASE)


async def extract_text(file: UploadFile) -> str:
    filename = file.filename or ""
    extension = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
    content = await file.read()

    if not content:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")

    try:
        if extension == "pdf":
            reader = PdfReader(BytesIO(content))
            return "\n".join(page.extract_text() or "" for page in reader.pages)

        if extension == "docx":
            document = Document(BytesIO(content))
            return "\n".join(paragraph.text for paragraph in document.paragraphs)

        if extension == "txt":
            try:
                return content.decode("utf-8")
            except UnicodeDecodeError:
                return content.decode("latin-1")

    except Exception as exc:
        raise HTTPException(
            status_code=400,
            detail=f"Could not extract text from the uploaded {extension.upper()} file.",
        ) from exc

    raise HTTPException(
        status_code=400,
        detail="Unsupported file type. Please upload a PDF, DOCX, or TXT resume.",
    )


def build_suggestions(role: str, missing_skills: List[str], score: int) -> List[str]:
    if not missing_skills:
        return [
            f"Excellent alignment for the {role} role. Add measurable achievements to make your resume even stronger.",
            "Include project links, certifications, or portfolio examples that prove these skills in action.",
        ]

    priority_skills = ", ".join(missing_skills[:3])
    suggestions = [
        f"Add practical experience or projects that demonstrate {priority_skills}.",
        "Use role-specific keywords naturally in your summary, skills, and project descriptions.",
        "Quantify your impact with numbers, outcomes, tools used, and business results.",
    ]

    if score < 50:
        suggestions.append(
            f"Consider completing a focused project or certification related to {role} before applying."
        )

    return suggestions


@app.get("/")
def health_check():
    return {"message": "Resume Monitoring Agent API is running."}


@app.post("/analyze-resume")
async def analyze_resume(role: str = Form(...), file: UploadFile = File(...)):
    if role not in ROLE_SKILLS:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid role. Choose one of: {', '.join(ROLE_SKILLS.keys())}.",
        )

    resume_text = normalize_text(await extract_text(file))
    if not resume_text:
        raise HTTPException(
            status_code=400,
            detail="No readable text was found in the uploaded resume.",
        )

    required_skills = ROLE_SKILLS[role]
    found_skills = [
        skill for skill in required_skills if skill_pattern(skill).search(resume_text)
    ]
    missing_skills = [skill for skill in required_skills if skill not in found_skills]
    match_score = round((len(found_skills) / len(required_skills)) * 100)

    return {
        "role": role,
        "match_score": match_score,
        "found_skills": found_skills,
        "missing_skills": missing_skills,
        "suggestions": build_suggestions(role, missing_skills, match_score),
    }
