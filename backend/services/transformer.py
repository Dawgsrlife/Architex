"""
Architecture Spec Transformer
Converts visual architecture (nodes/edges) into Cline system prompt
"""
import json
from typing import Dict, Any, List
import logging

logger = logging.getLogger(__name__)


def transform_architecture_to_prompt(architecture_spec: Dict[str, Any]) -> str:
    """
    Transform architecture_spec JSON into a detailed system prompt for Cline.
    
    Args:
        architecture_spec: Dict containing name, description, nodes, edges, metadata
        
    Returns:
        Formatted string prompt for the AI agent
    """
    name = architecture_spec.get("name", "Untitled Project")
    description = architecture_spec.get("description", "No description provided")
    nodes = architecture_spec.get("nodes", [])
    edges = architecture_spec.get("edges", [])
    metadata = architecture_spec.get("metadata", {})
    
    # Build node descriptions
    node_map = {}  # id -> label for edge resolution
    node_sections = []
    
    for node in nodes:
        node_id = node.get("id", "")
        data = node.get("data", {})
        node_type = node.get("type", "generic")
        
        label = data.get("label", "Unnamed Component")
        framework = data.get("framework", "")
        component_desc = data.get("description", "")
        instructions = data.get("instructions", "")
        
        node_map[node_id] = label
        
        section = f"### {label}\n"
        section += f"- **Type**: {node_type}\n"
        if framework:
            section += f"- **Framework**: {framework}\n"
        if component_desc:
            section += f"- **Description**: {component_desc}\n"
        if instructions:
            section += f"- **Instructions**: {instructions}\n"
            
        node_sections.append(section)
    
    # Build edge descriptions (data flow)
    edge_descriptions = []
    for edge in edges:
        source_id = edge.get("source", "")
        target_id = edge.get("target", "")
        source_label = node_map.get(source_id, source_id)
        target_label = node_map.get(target_id, target_id)
        edge_label = edge.get("label", "connects to")
        
        edge_descriptions.append(f"- {source_label} → {target_label} ({edge_label})")
    
    # Build the prompt
    prompt = f"""# Project: {name}

## Overview
{description}

## Architecture Components

{chr(10).join(node_sections)}

## Data Flow / Connections
{chr(10).join(edge_descriptions) if edge_descriptions else "No explicit connections defined."}

## Your Task

You are an expert software engineer. Generate a complete, production-ready codebase for this architecture.

### Requirements:
1. Create all necessary files with proper directory structure
2. Include configuration files (package.json, requirements.txt, Dockerfile, etc.)
3. Implement the connections between components as described
4. Add appropriate error handling and logging
5. Include a README.md with setup instructions

### Output Format:
Generate files one by one using the write_file tool. Start with the project structure, then implement each component.

When finished, call task_complete() to signal completion.
"""
    
    logger.info(f"Generated prompt for project: {name} ({len(nodes)} nodes, {len(edges)} edges)")
    return prompt


def extract_tech_stack(architecture_spec: Dict[str, Any]) -> List[str]:
    """Extract unique technologies/frameworks from the architecture"""
    tech_stack = set()
    
    for node in architecture_spec.get("nodes", []):
        data = node.get("data", {})
        if framework := data.get("framework"):
            tech_stack.add(framework)
        if node_type := node.get("type"):
            tech_stack.add(node_type)
            
    return list(tech_stack)
