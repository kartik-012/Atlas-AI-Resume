import { describe, it, expect } from 'vitest';
import { matchChatbotIntent } from '../src/data/chatbotIntents';

describe('Phase 2: First 10 Seconds Architecture & Contracts', () => {
  it('offline fallback intent engine covers top recruiter queries with verified facts', () => {
    // 1. Why hire query
    const whyHireAns = matchChatbotIntent('Why should I hire Kartik?');
    expect(whyHireAns).toBeTruthy();
    expect(typeof whyHireAns).toBe('string');
    expect(whyHireAns?.toLowerCase()).toContain('strong hire');

    // 2. AIOps RCA query
    const aiopsAns = matchChatbotIntent('Tell me about AIOps Root Cause Correlator');
    expect(aiopsAns).toBeTruthy();
    expect(aiopsAns).toContain('Root Cause');

    // 3. VersionRAG query
    const versionRagAns = matchChatbotIntent('Tell me about VersionRAG');
    expect(versionRagAns).toBeTruthy();
    expect(versionRagAns).toContain('VersionRAG');

    // 4. SPARK Fellowship query
    const sparkAns = matchChatbotIntent('Tell me about IIT Roorkee');
    expect(sparkAns).toBeTruthy();
    expect(sparkAns).toContain('SPARK');
  });

  it('offline fallback returns null for unknown prompt to allow graceful fallback message', () => {
    const unknownAns = matchChatbotIntent('xyz123_non_existent_unmatched_query_999');
    expect(unknownAns).toBeNull();
  });
});
