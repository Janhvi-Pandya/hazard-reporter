// Deterministic severity classification engine for hazard reports

const CATEGORY_TEAM_MAP = {
  electrical: 'electrical_maintenance',
  structural: 'structural_engineering',
  fire_safety: 'fire_safety_team',
  chemical: 'hazmat_response',
  accessibility: 'accessibility_services',
  water_damage: 'plumbing_maintenance',
  lighting: 'facilities_lighting',
  environmental: 'environmental_health',
  security: 'campus_security',
  other: 'general_maintenance',
};

const CRITICAL_KEYWORDS = [
  'fire', 'electrocution', 'collapse', 'gas leak', 'explosion',
  'active shooter', 'chemical spill', 'live wire', 'bomb',
  'structural failure', 'toxic', 'unconscious', 'cardiac',
  'severe burn', 'imminent danger', 'sparking', 'arson',
];

const HIGH_KEYWORDS = [
  'exposed wire', 'flooding', 'blocked exit', 'smoke',
  'structural crack', 'broken ramp', 'ceiling damage',
  'power outage', 'sewage', 'gas smell', 'broken glass',
  'elevator stuck', 'fallen tree', 'missing handrail',
  'asbestos', 'mold', 'black mold', 'sinkhole',
];

const MEDIUM_KEYWORDS = [
  'leak', 'flickering', 'broken light', 'loose railing',
  'trip hazard', 'puddle', 'cracked tile', 'peeling paint',
  'faulty outlet', 'dripping', 'wobbly', 'uneven surface',
  'door jam', 'stuck window', 'buzzing', 'dim lighting',
  'standing water', 'minor crack', 'loose step',
];

function matchKeywords(text, keywords) {
  const lower = text.toLowerCase();
  return keywords.filter(kw => lower.includes(kw));
}

export function classifySeverity(category, description, urgency) {
  const text = `${category} ${description}`.toLowerCase();
  const team = CATEGORY_TEAM_MAP[category] || 'general_maintenance';

  // Check urgency override first
  if (urgency === 'emergency') {
    return {
      severity: 'critical',
      assigned_team: team,
      reasoning: `Classified as CRITICAL: reporter indicated this is an emergency situation. Routed to ${team}.`,
    };
  }

  // Keyword-based classification
  const criticalMatches = matchKeywords(text, CRITICAL_KEYWORDS);
  if (criticalMatches.length > 0) {
    return {
      severity: 'critical',
      assigned_team: team,
      reasoning: `Classified as CRITICAL: detected critical keywords [${criticalMatches.join(', ')}]. Routed to ${team}.`,
    };
  }

  if (urgency === 'urgent') {
    const highMatches = matchKeywords(text, HIGH_KEYWORDS);
    const detail = highMatches.length > 0
      ? `detected high-priority keywords [${highMatches.join(', ')}] and`
      : '';
    return {
      severity: 'high',
      assigned_team: team,
      reasoning: `Classified as HIGH: ${detail} reporter indicated urgent priority. Routed to ${team}.`,
    };
  }

  const highMatches = matchKeywords(text, HIGH_KEYWORDS);
  if (highMatches.length > 0) {
    return {
      severity: 'high',
      assigned_team: team,
      reasoning: `Classified as HIGH: detected high-priority keywords [${highMatches.join(', ')}]. Routed to ${team}.`,
    };
  }

  if (urgency === 'soon') {
    return {
      severity: 'medium',
      assigned_team: team,
      reasoning: `Classified as MEDIUM: reporter indicated this needs attention soon. Routed to ${team}.`,
    };
  }

  const mediumMatches = matchKeywords(text, MEDIUM_KEYWORDS);
  if (mediumMatches.length > 0) {
    return {
      severity: 'medium',
      assigned_team: team,
      reasoning: `Classified as MEDIUM: detected moderate-priority keywords [${mediumMatches.join(', ')}]. Routed to ${team}.`,
    };
  }

  // Default to LOW
  return {
    severity: 'low',
    assigned_team: team,
    reasoning: `Classified as LOW: no urgent keywords detected${urgency === 'when_possible' ? ' and reporter indicated low urgency' : ''}. Routed to ${team}.`,
  };
}
