export function inferSubject(text) {
  const rules = [
    { subject: 'Biology', keywords: ['photosynthesis', 'cell', 'evolution', 'organism'] },
    { subject: 'Physics', keywords: ['force', 'acceleration', 'velocity', 'gravity', 'law'] },
    { subject: 'Chemistry', keywords: ['atom', 'molecule', 'reaction', 'chemical'] },
    { subject: 'Mathematics', keywords: ['integral', 'derivative', 'equation', 'algebra'] },
    { subject: 'History', keywords: ['war', 'empire', 'revolution', 'ancient'] },
  ];

  const lowerText = text.toLowerCase();

  for (const rule of rules) {
    if (rule.keywords.some(k => lowerText.includes(k))) {
      return rule.subject;
    }
  }
  return 'General';
}
