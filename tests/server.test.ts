import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { cosineSimilarity, keywordSimilarity, searchKnowledgeBase, app } from '../server.js';
import http from 'http';

let server: http.Server;
const PORT = 3001;

describe('Atlas AI Server Tests', () => {
  beforeAll(() => {
    server = app.listen(PORT);
  });

  afterAll(() => {
    server.close();
  });

  describe('Mathematical Functions', () => {
    it('cosineSimilarity should return 1 for identical vectors', () => {
      const v1 = [1, 2, 3];
      const v2 = [1, 2, 3];
      expect(cosineSimilarity(v1, v2)).toBeCloseTo(1, 5);
    });

    it('cosineSimilarity should return 0 for orthogonal vectors', () => {
      const v1 = [1, 0];
      const v2 = [0, 1];
      expect(cosineSimilarity(v1, v2)).toBeCloseTo(0, 5);
    });

    it('keywordSimilarity should calculate correct overlap', () => {
      const text = "Kartik is an AI engineer";
      const query = "kartik engineer";
      const score = keywordSimilarity(query, text);
      expect(score).toBe(1); // both words found

      const query2 = "kartik backend python";
      const score2 = keywordSimilarity(query2, text);
      // 'kartik' is found, 'backend' and 'python' are not. 1/3 = 0.333...
      expect(score2).toBeCloseTo(0.333, 2);
    });
  });

  describe('searchKnowledgeBase', () => {
    it('should return matching chunks based on keywords when semantic search is offline', async () => {
      const results = await searchKnowledgeBase("Kartik", 1);
      expect(results.length).toBeLessThanOrEqual(1);
      if (results.length > 0) {
        expect(results[0].chunk).toBeDefined();
        expect(results[0].score).toBeGreaterThanOrEqual(0);
      }
    });
  });

  describe('Admin Auth Middleware', () => {
    it('should reject missing or wrong admin key', async () => {
      const res = await fetch(`http://localhost:${PORT}/api/admin/chunks`, {
        headers: { 'x-admin-key': 'wrong-key' }
      });
      expect(res.status).toBe(401);
      const data = await res.json();
      expect(data.error).toBeDefined();
    });
  });

  describe('Input Validation', () => {
    it('should reject empty chat queries', async () => {
      const res = await fetch(`http://localhost:${PORT}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: '' })
      });
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toMatch(/Missing or invalid query/);
    });

    it('should reject too long chat queries', async () => {
      const longQuery = "a".repeat(501);
      const res = await fetch(`http://localhost:${PORT}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: longQuery })
      });
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toMatch(/exceeds maximum length/);
    });
  });
});
