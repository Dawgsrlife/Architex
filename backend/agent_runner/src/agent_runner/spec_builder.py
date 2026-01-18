"""Convert architecture_spec to spec.json"""
import json
from pathlib import Path
from typing import Dict, Any, List, Set
import logging

logger = logging.getLogger(__name__)


def build_spec(architecture_spec: Dict[str, Any], project_name: str = "Generated Project") -> Dict[str, Any]:
    """
    Convert architecture_spec to a stable spec.json format.
    
    Args:
        architecture_spec: Architecture specification with nodes and edges
        project_name: Name of the project
    
    Returns:
        Dictionary representing the spec.json structure
    """
    nodes = architecture_spec.get("nodes", [])
    edges = architecture_spec.get("edges", [])
    
    # Extract node information
    node_types: Set[str] = set()
    node_names: List[str] = []
    node_details: List[Dict[str, Any]] = []
    
    node_map: Dict[str, str] = {}  # id -> name mapping
    
    for node in nodes:
        node_id = node.get("id", "")
        data = node.get("data", {})
        label = data.get("label", "Unknown Component")
        node_type = node.get("type", "generic")
        framework = data.get("framework", "")
        
        node_types.add(node_type)
        node_names.append(label)
        node_map[node_id] = label
        
        node_details.append({
            "id": node_id,
            "name": label,
            "type": node_type,
            "framework": framework,
            "data": data
        })
    
    # Extract connections
    connections: List[Dict[str, str]] = []
    for edge in edges:
        source_id = edge.get("source", "")
        target_id = edge.get("target", "")
        source_label = node_map.get(source_id, source_id)
        target_label = node_map.get(target_id, target_id)
        
        connections.append({
            "from": source_label,
            "to": target_label,
            "source_id": source_id,
            "target_id": target_id
        })
    
    # Determine stack
    frameworks = architecture_spec.get("frameworks", [])
    if not frameworks:
        # Infer from node frameworks
        inferred = set()
        for detail in node_details:
            if detail.get("framework"):
                inferred.add(detail["framework"])
        frameworks = list(inferred) if inferred else ["nextjs", "fastapi", "mongo"]
    
    spec = {
        "project": {
            "name": project_name,
            "description": architecture_spec.get("description", ""),
        },
        "stack": frameworks if isinstance(frameworks, list) else [frameworks],
        "components": {
            "types": list(node_types),
            "nodes": node_details,
            "connections": connections
        },
        "metadata": architecture_spec.get("metadata", {})
    }
    
    return spec


def write_spec(spec: Dict[str, Any], output_path: Path) -> None:
    """Write spec.json to file"""
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(spec, f, indent=2, ensure_ascii=False)
    logger.info(f"Wrote spec.json to {output_path}")
