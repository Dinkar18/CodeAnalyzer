import logging
import json
from uuid import UUID
from typing import List, Optional, Set
from langchain_core.messages import SystemMessage, HumanMessage
from app.services.agent.llm_provider import llm_factory
from app.services.agent.tools import repo_tools
from app.models.schemas import FindingResponse, FindingCategory, FindingSeverity

logger = logging.getLogger(__name__)

class SpecialistAnalysisAgents:
    async def analyze(self, repository_id: UUID, categories: List[FindingCategory], provider: Optional[str] = None) -> List[FindingResponse]:
        findings: List[FindingResponse] = []
        llm = llm_factory.get_llm(provider)

        # 1. Retrieve all actual existing file paths in the repo to ground the audit
        files = await repo_tools.list_files(repository_id)
        all_file_paths = {f["path"] for f in files}
        
        # 2. Gather sample source code files (services, controllers, routers, models, configs)
        sample_contents = []
        for p in list(all_file_paths)[:40]:
            if any(p.endswith(ext) for ext in ('.java', '.py', '.ts', '.js', '.yml', '.xml', '.json', '.go', '.rs')) and not p.endswith(('.lock', '.min.js')):
                file_data = await repo_tools.read_file(repository_id, p, start_line=1, end_line=120)
                if "content" in file_data and file_data["content"].strip():
                    sample_contents.append(f"--- File: {p} ---\n```\n{file_data['content']}\n```")
                if len(sample_contents) >= 12:
                    break

        context_str = "\n\n".join(sample_contents)

        for category in categories:
            prompt = self._build_anti_hallucination_prompt(category, sorted(list(all_file_paths))[:30], context_str)
            try:
                response = await llm.ainvoke([HumanMessage(content=prompt)])
                category_findings = self._parse_findings_json(response.content, category, all_file_paths)
                findings.extend(category_findings)
            except Exception as e:
                logger.error(f"Error running {category} audit: {e}")

        return findings

    def _build_anti_hallucination_prompt(self, category: FindingCategory, valid_file_paths: List[str], context_str: str) -> str:
        return f"""
You are a Principal Security & Software Quality Engineer performing a rigorous, evidence-grounded **{category.value}** audit.

ANTI-HALLUCINATION POLICY & GROUNDING RULES:
1. **ONLY report issues that can be directly verified in the provided source code.**
2. **DO NOT invent hypothetical files, classes, methods, or fake CVEs.**
3. Every finding MUST reference a real file from the VALID FILE LIST and an exact line number.
4. If the codebase follows good practices and no concrete defects are found in this category, return an EMPTY ARRAY `[]`.
5. DO NOT report generic boilerplate advice (e.g. 'add more comments'). Only report actionable, concrete engineering findings.

VALID FILE PATHS:
{json.dumps(valid_file_paths, indent=2)}

ACTUAL SOURCE CODE CONTEXT:
{context_str}

OUTPUT FORMAT:
Return a strict JSON ARRAY matching this schema:
[
  {{
    "category": "{category.value}",
    "severity": "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
    "title": "Clear, specific finding title",
    "file_path": "Exact path from VALID FILE PATHS",
    "line_number": 1,
    "finding": "Precise explanation of the defect or vulnerability based strictly on the code",
    "evidence": "Exact code snippet demonstrating the issue",
    "recommendation": "Actionable, concrete remediation steps"
  }}
]
Output ONLY valid JSON. No markdown wrappers or preamble.
"""

    def _parse_findings_json(self, content: str, default_category: FindingCategory, valid_paths: Set[str]) -> List[FindingResponse]:
        import re
        findings = []
        try:
            # Extract JSON array
            json_match = re.search(r'\[\s*\{.*\}\s*\]', content, re.DOTALL)
            if json_match:
                raw_list = json.loads(json_match.group(0))
                for item in raw_list:
                    file_p = item.get("file_path")
                    # Grounding Check: Ensure file_path exists in the real repository
                    if file_p and file_p not in valid_paths:
                        # Find closest match if leading slash was included
                        stripped = file_p.lstrip('/')
                        if stripped in valid_paths:
                            file_p = stripped
                        else:
                            # Drop unverified/hallucinated file paths
                            file_p = None

                    findings.append(FindingResponse(
                        category=FindingCategory(item.get("category", default_category.value)),
                        severity=FindingSeverity(item.get("severity", "MEDIUM").upper()),
                        title=item.get("title", f"{default_category.value} Finding"),
                        file_path=file_p,
                        line_number=item.get("line_number"),
                        finding=item.get("finding", ""),
                        evidence=item.get("evidence"),
                        recommendation=item.get("recommendation", "")
                    ))
        except Exception as e:
            logger.warning(f"Failed to parse specialist findings JSON: {e}")

        return findings

specialist_agents = SpecialistAnalysisAgents()
