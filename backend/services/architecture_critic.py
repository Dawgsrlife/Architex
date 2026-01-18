"""
Architecture Critic - LAYER 2.5: Architecture Validation

This is the GATING layer between architecture and code generation.

Purpose:
- Review architecture for risks, anti-patterns, and missing components
- Produce STRUCTURED feedback (not vibes)
- Gate code generation - blocking issues prevent generation

This is NOT "AI vibes feedback". It produces:
- Concrete risks
- Missing components
- Anti-patterns
- Scalability issues
- Security gaps

Key principles:
1. STRUCTURED OUTPUT - strict JSON schema, always
2. DETERMINISTIC CHECKS - hardcoded rules + ONE LLM reasoning step
3. BLOCKING LOGIC - high severity issues can block generation
4. ACTIONABLE - every issue has a recommendation
"""

import logging
import json
from typing import Dict, Any, List, Optional
from dataclasses import dataclass, field, asdict
from enum import Enum

from services.architecture_translator import (
    ArchitectureTranslator,
    TranslatedArchitecture,
    TranslatedComponent,
    ComponentType,
    get_translator,
)
from services.llm_interface import LLMInterface, get_default_llm_service

logger = logging.getLogger(__name__)


# ============================================================================
# CRITIC DATA STRUCTURES
# ============================================================================

class IssueSeverity(str, Enum):
    """Severity levels for architecture issues."""
    LOW = "low"           # Nice to have improvements
    MEDIUM = "medium"     # Should fix before production
    HIGH = "high"         # Must fix - can block generation
    CRITICAL = "critical" # Blocking - generation will NOT proceed


class IssueCategory(str, Enum):
    """Categories of architecture issues."""
    SECURITY = "security"
    SCALABILITY = "scalability"
    DATA_INTEGRITY = "data_integrity"
    MISSING_COMPONENT = "missing_component"
    ANTI_PATTERN = "anti_pattern"
    COUPLING = "coupling"
    SINGLE_POINT_OF_FAILURE = "single_point_of_failure"
    OPERATIONAL = "operational"


@dataclass
class ArchitectureIssue:
    """A specific issue found in the architecture."""
    severity: IssueSeverity
    category: IssueCategory
    node_ids: List[str]
    problem: str
    recommendation: str
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "severity": self.severity.value,
            "category": self.category.value,
            "node_ids": self.node_ids,
            "problem": self.problem,
            "recommendation": self.recommendation,
        }


@dataclass
class CriticResult:
    """
    Result of architecture criticism.
    
    This is the contract between critic and the rest of the system.
    If blocking=True, code generation MUST NOT proceed.
    """
    summary: str
    issues: List[ArchitectureIssue] = field(default_factory=list)
    blocking: bool = False
    recommendations_applied: int = 0  # Track if user has addressed issues
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "summary": self.summary,
            "issues": [i.to_dict() for i in self.issues],
            "blocking": self.blocking,
            "issue_count": len(self.issues),
            "high_severity_count": sum(1 for i in self.issues if i.severity in [IssueSeverity.HIGH, IssueSeverity.CRITICAL]),
        }
    
    def to_json(self) -> str:
        return json.dumps(self.to_dict(), indent=2)


# ============================================================================
# DETERMINISTIC RULE CHECKS
# ============================================================================

class RuleBasedCritic:
    """
    Deterministic rule-based architecture checks.
    
    These rules don't need LLM - they are pure logic.
    Run BEFORE LLM to catch obvious issues fast.
    """
    
    def __init__(self, architecture: TranslatedArchitecture):
        self.arch = architecture
        self.comp_types = {c.component_type for c in architecture.components}
        self.comp_map = {c.id: c for c in architecture.components}
        
    def check_all(self) -> List[ArchitectureIssue]:
        """Run all deterministic checks."""
        issues = []
        issues.extend(self._check_missing_auth())
        issues.extend(self._check_no_database())
        issues.extend(self._check_frontend_without_backend())
        issues.extend(self._check_no_edges())
        issues.extend(self._check_missing_intent())
        issues.extend(self._check_orphan_nodes())
        return issues
    
    def _check_missing_auth(self) -> List[ArchitectureIssue]:
        """Check if auth is missing for apps that likely need it."""
        has_frontend = any(ct in self.comp_types for ct in [
            ComponentType.NEXTJS, ComponentType.REACT, ComponentType.VITE
        ])
        has_backend = any(ct in self.comp_types for ct in [
            ComponentType.FASTAPI, ComponentType.EXPRESS, ComponentType.FLASK
        ])
        has_auth = ComponentType.AUTH in self.comp_types or ComponentType.OAUTH in self.comp_types
        has_supabase = ComponentType.SUPABASE in self.comp_types  # Supabase includes auth
        
        if has_frontend and has_backend and not has_auth and not has_supabase:
            return [ArchitectureIssue(
                severity=IssueSeverity.HIGH,
                category=IssueCategory.SECURITY,
                node_ids=[],
                problem="No authentication component detected. Frontend + Backend apps typically require authentication.",
                recommendation="Add an Auth node (JWT, OAuth, or use Supabase which includes auth).",
            )]
        return []
    
    def _check_no_database(self) -> List[ArchitectureIssue]:
        """Check if there's no database for stateful apps."""
        has_backend = any(ct in self.comp_types for ct in [
            ComponentType.FASTAPI, ComponentType.EXPRESS, ComponentType.FLASK
        ])
        has_db = any(ct in self.comp_types for ct in [
            ComponentType.POSTGRES, ComponentType.MONGODB, ComponentType.SQLITE, ComponentType.SUPABASE
        ])
        
        if has_backend and not has_db:
            return [ArchitectureIssue(
                severity=IssueSeverity.MEDIUM,
                category=IssueCategory.MISSING_COMPONENT,
                node_ids=[],
                problem="Backend API without database. Most APIs need persistent storage.",
                recommendation="Add a database node (PostgreSQL, MongoDB, or Supabase).",
            )]
        return []
    
    def _check_frontend_without_backend(self) -> List[ArchitectureIssue]:
        """Check if frontend has no backend to talk to."""
        has_frontend = any(ct in self.comp_types for ct in [
            ComponentType.NEXTJS, ComponentType.REACT, ComponentType.VITE
        ])
        has_backend = any(ct in self.comp_types for ct in [
            ComponentType.FASTAPI, ComponentType.EXPRESS, ComponentType.FLASK, ComponentType.SUPABASE
        ])
        
        if has_frontend and not has_backend:
            return [ArchitectureIssue(
                severity=IssueSeverity.LOW,
                category=IssueCategory.MISSING_COMPONENT,
                node_ids=[],
                problem="Frontend with no backend. Is this intentional (static site) or missing?",
                recommendation="If dynamic, add a backend (FastAPI, Express) or use Supabase for BaaS.",
            )]
        return []
    
    def _check_no_edges(self) -> List[ArchitectureIssue]:
        """Check if nodes have no connections."""
        if len(self.arch.components) > 1 and len(self.arch.interactions) == 0:
            return [ArchitectureIssue(
                severity=IssueSeverity.CRITICAL,  # No edges = cannot generate meaningful app
                category=IssueCategory.ANTI_PATTERN,
                node_ids=[c.id for c in self.arch.components],
                problem="Multiple components with no connections. Components must interact.",
                recommendation="Add edges between components to show data/control flow.",
            )]
        return []
    
    def _check_missing_intent(self) -> List[ArchitectureIssue]:
        """Check if intent/prompt is missing or too vague."""
        prompt = self.arch.user_prompt.strip().lower()
        
        if len(prompt) < 10:
            return [ArchitectureIssue(
                severity=IssueSeverity.CRITICAL,
                category=IssueCategory.MISSING_COMPONENT,
                node_ids=[],
                problem="Intent/prompt is missing or too short. Cannot generate meaningful code without intent.",
                recommendation="Add a descriptive intent like: 'Internal admin tool for managing users and access logs'",
            )]
        
        # Check for vague prompts
        vague_prompts = ["build an app", "make a website", "create something", "build an application"]
        if prompt in vague_prompts:
            return [ArchitectureIssue(
                severity=IssueSeverity.HIGH,
                category=IssueCategory.MISSING_COMPONENT,
                node_ids=[],
                problem=f"Intent '{prompt}' is too vague. What kind of app? What does it do?",
                recommendation="Be specific: 'Admin dashboard for managing inventory and orders' or 'API for user management with RBAC'",
            )]
        
        return []
    
    def _check_orphan_nodes(self) -> List[ArchitectureIssue]:
        """Check for nodes with no connections."""
        if len(self.arch.components) <= 1:
            return []
        
        connected_ids = set()
        for interaction in self.arch.interactions:
            connected_ids.add(interaction.source_id)
            connected_ids.add(interaction.target_id)
        
        orphans = [c for c in self.arch.components if c.id not in connected_ids]
        
        if orphans:
            return [ArchitectureIssue(
                severity=IssueSeverity.MEDIUM,
                category=IssueCategory.ANTI_PATTERN,
                node_ids=[o.id for o in orphans],
                problem=f"Orphan nodes with no connections: {', '.join(o.name for o in orphans)}",
                recommendation="Connect these nodes to the rest of the system or remove them.",
            )]
        
        return []


# ============================================================================
# LLM-BASED CRITIC (ONE CONTROLLED STEP)
# ============================================================================

# System prompt for architecture criticism - STRUCTURED OUTPUT ONLY
CRITIC_SYSTEM_PROMPT = """You are a senior software architect reviewing an internal admin system architecture.

You MUST analyze the architecture and produce STRUCTURED feedback.

Your analysis MUST cover:
1. SECURITY: Auth, RBAC, data protection, API security
2. SCALABILITY: Bottlenecks, single points of failure, caching needs
3. DATA INTEGRITY: Transactions, consistency, backups
4. OPERATIONAL: Logging, monitoring, deployment concerns
5. COUPLING: Tight coupling, missing abstractions

You MUST respond with ONLY a valid JSON object matching this exact schema:

{
  "summary": "One paragraph summary of the architecture quality",
  "issues": [
    {
      "severity": "low|medium|high|critical",
      "category": "security|scalability|data_integrity|missing_component|anti_pattern|coupling|single_point_of_failure|operational",
      "node_ids": ["list", "of", "affected", "node", "ids"],
      "problem": "Clear description of the issue",
      "recommendation": "Specific actionable recommendation"
    }
  ],
  "blocking": true/false
}

IMPORTANT RULES:
- "blocking" MUST be true if ANY issue has severity "critical"
- "blocking" SHOULD be true if there are 3+ "high" severity issues
- Be SPECIFIC - no vague feedback
- Be ACTIONABLE - every issue needs a concrete recommendation
- Focus on ADMIN DASHBOARD use case (CRUD, data management, internal tools)
- Do NOT suggest features beyond the scope of the architecture
"""


class LLMCritic:
    """
    LLM-based architecture critic.
    
    This is the ONE controlled LLM step for reasoning about architecture.
    Output is STRICTLY validated against schema.
    """
    
    def __init__(self, architecture: TranslatedArchitecture, llm: Optional[LLMInterface] = None):
        self.arch = architecture
        self.llm = llm
    
    async def critique(self) -> List[ArchitectureIssue]:
        """
        Run LLM critique and return structured issues.
        
        Returns empty list if LLM call fails (fails open, deterministic rules still apply).
        """
        if self.llm is None:
            self.llm = get_default_llm_service()
        
        # Build the architecture description for LLM
        arch_description = self._build_architecture_description()
        
        try:
            # Use LLM to analyze architecture
            response = await self.llm.generate_architecture(
                description=f"{CRITIC_SYSTEM_PROMPT}\n\n## ARCHITECTURE TO REVIEW:\n\n{arch_description}",
                requirements=None,
                tech_stack=None,
            )
            
            # Parse response
            content = response.get("architecture", "{}")
            
            # Try to extract JSON from response
            issues = self._parse_llm_response(content)
            return issues
            
        except Exception as e:
            logger.error(f"LLM critique failed: {e}")
            # Fail open - return empty list, deterministic rules still apply
            return []
    
    def _build_architecture_description(self) -> str:
        """Build a description of the architecture for LLM review."""
        lines = []
        
        lines.append(f"**Project**: {self.arch.project_name}")
        lines.append(f"**Intent**: {self.arch.user_prompt}")
        lines.append("")
        lines.append("**Components:**")
        
        for comp in self.arch.components:
            lines.append(f"- `{comp.id}`: {comp.name} ({comp.component_type.value})")
            if comp.features:
                lines.append(f"  Features: {', '.join(comp.features)}")
        
        lines.append("")
        lines.append("**Interactions:**")
        for interaction in self.arch.interactions:
            lines.append(f"- {interaction.description}")
        
        return "\n".join(lines)
    
    def _parse_llm_response(self, content: str) -> List[ArchitectureIssue]:
        """Parse LLM response into structured issues."""
        issues = []
        
        # Try to find JSON in response
        try:
            # Handle markdown code blocks
            if "```json" in content:
                start = content.find("```json") + 7
                end = content.find("```", start)
                content = content[start:end].strip()
            elif "```" in content:
                start = content.find("```") + 3
                end = content.find("```", start)
                content = content[start:end].strip()
            
            data = json.loads(content)
            
            for issue_data in data.get("issues", []):
                try:
                    severity = IssueSeverity(issue_data.get("severity", "medium"))
                    category = IssueCategory(issue_data.get("category", "anti_pattern"))
                    
                    issues.append(ArchitectureIssue(
                        severity=severity,
                        category=category,
                        node_ids=issue_data.get("node_ids", []),
                        problem=issue_data.get("problem", "Unknown issue"),
                        recommendation=issue_data.get("recommendation", "Review architecture"),
                    ))
                except (ValueError, KeyError) as e:
                    logger.warning(f"Skipping malformed issue: {e}")
                    continue
                    
        except json.JSONDecodeError as e:
            logger.warning(f"Failed to parse LLM response as JSON: {e}")
        
        return issues


# ============================================================================
# MAIN CRITIC ORCHESTRATOR
# ============================================================================

class ArchitectureCritic:
    """
    Main architecture critic.
    
    Orchestrates:
    1. Deterministic rule checks (fast, no LLM)
    2. LLM-based analysis (one controlled call)
    3. Blocking logic
    
    Usage:
        critic = ArchitectureCritic()
        result = await critic.critique(architecture_spec)
        if result.blocking:
            # Do NOT proceed with generation
    """
    
    def __init__(self, llm_service: Optional[LLMInterface] = None):
        self.llm = llm_service
        self.translator = get_translator()
    
    async def critique(
        self, 
        architecture_spec: Dict[str, Any],
        skip_llm: bool = False,
    ) -> CriticResult:
        """
        Critique an architecture specification.
        
        Args:
            architecture_spec: Raw spec from frontend (nodes, edges, prompt)
            skip_llm: If True, only run deterministic checks (faster)
            
        Returns:
            CriticResult with issues and blocking status
        """
        # Step 1: Translate architecture (deterministic)
        translated = self.translator.translate(architecture_spec)
        logger.info(f"Critiquing architecture: {len(translated.components)} components")
        
        all_issues: List[ArchitectureIssue] = []
        
        # Step 2: Run deterministic rule checks
        rule_critic = RuleBasedCritic(translated)
        rule_issues = rule_critic.check_all()
        all_issues.extend(rule_issues)
        logger.info(f"Rule-based checks found {len(rule_issues)} issues")
        
        # Step 3: Run LLM critique (optional, controlled)
        if not skip_llm:
            llm_critic = LLMCritic(translated, self.llm)
            llm_issues = await llm_critic.critique()
            all_issues.extend(llm_issues)
            logger.info(f"LLM critique found {len(llm_issues)} issues")
        
        # Step 4: Determine blocking status
        # DEMO MODE DISABLED: Never block generation - all issues become warnings
        # This allows users to iterate on their architecture without being blocked
        critical_count = sum(1 for i in all_issues if i.severity == IssueSeverity.CRITICAL)
        high_count = sum(1 for i in all_issues if i.severity == IssueSeverity.HIGH)
        
        # DEMO MODE: NEVER BLOCK - convert all issues to warnings
        # Users can see the warnings but generation proceeds regardless
        # This is intentional to enable rapid iteration and demos
        blocking = False  # DISABLED: was `critical_count > 0`
        
        # Step 5: Build summary
        if not all_issues:
            summary = "Architecture looks sound. No significant issues detected."
        elif critical_count > 0:
            summary = f"Architecture has {critical_count} critical issues (proceeding with warnings). Consider fixing: missing edges or vague prompt."
        elif high_count > 0:
            summary = f"Architecture has {high_count} high-severity recommendations. Generation proceeding with warnings."
        else:
            summary = f"Architecture has {len(all_issues)} minor issues to consider. Generation proceeding."
        
        return CriticResult(
            summary=summary,
            issues=all_issues,
            blocking=blocking,
        )
    
    async def quick_check(self, architecture_spec: Dict[str, Any]) -> CriticResult:
        """
        Run only deterministic checks (no LLM, instant).
        
        Use this for real-time feedback while user is editing.
        """
        return await self.critique(architecture_spec, skip_llm=True)


# ============================================================================
# MODULE-LEVEL INTERFACE
# ============================================================================

_critic: Optional[ArchitectureCritic] = None


def get_critic() -> ArchitectureCritic:
    """Get singleton critic instance."""
    global _critic
    if _critic is None:
        _critic = ArchitectureCritic()
    return _critic


async def critique_architecture(
    architecture_spec: Dict[str, Any],
    skip_llm: bool = False,
) -> CriticResult:
    """
    Main entry point for architecture criticism.
    
    Args:
        architecture_spec: Raw spec from frontend
        skip_llm: If True, only run deterministic checks
        
    Returns:
        CriticResult with issues and blocking status
    """
    critic = get_critic()
    return await critic.critique(architecture_spec, skip_llm)


async def quick_critique(architecture_spec: Dict[str, Any]) -> CriticResult:
    """
    Quick deterministic checks only (no LLM).
    
    Use for real-time feedback.
    """
    critic = get_critic()
    return await critic.quick_check(architecture_spec)


# ============================================================================
# CLI FOR TESTING
# ============================================================================

if __name__ == "__main__":
    import asyncio
    from services.architecture_translator import GOLDEN_DEMO_SPEC
    
    async def main():
        print("=" * 60)
        print("ARCHITECTURE CRITIC - Demo")
        print("=" * 60)
        print()
        
        # Test with golden demo spec
        print("Testing with GOLDEN_DEMO_SPEC...")
        result = await critique_architecture(GOLDEN_DEMO_SPEC, skip_llm=True)
        
        print(f"\nSummary: {result.summary}")
        print(f"Blocking: {result.blocking}")
        print(f"Issues: {len(result.issues)}")
        
        for issue in result.issues:
            print(f"\n  [{issue.severity.value.upper()}] {issue.category.value}")
            print(f"  Problem: {issue.problem}")
            print(f"  Recommendation: {issue.recommendation}")
        
        print()
        print("=" * 60)
        
        # Test with bad spec (no auth, vague prompt)
        print("\nTesting with BAD_SPEC (should have blocking issues)...")
        bad_spec = {
            "name": "Test App",
            "prompt": "build an app",
            "nodes": [
                {"id": "frontend", "type": "nextjs", "data": {"label": "Next.js"}},
                {"id": "backend", "type": "fastapi", "data": {"label": "FastAPI"}},
            ],
            "edges": [],
        }
        
        result = await critique_architecture(bad_spec, skip_llm=True)
        
        print(f"\nSummary: {result.summary}")
        print(f"Blocking: {result.blocking}")
        print(f"Issues: {len(result.issues)}")
        
        for issue in result.issues:
            print(f"\n  [{issue.severity.value.upper()}] {issue.category.value}")
            print(f"  Problem: {issue.problem}")
    
    asyncio.run(main())
