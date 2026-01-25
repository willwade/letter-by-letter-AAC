import { describe, it, expect } from 'vitest';
import { generateBlocks } from '../layoutEngine';
import { SPACE } from '../../constants';

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

describe('layoutEngine', () => {
  describe('Static Mode', () => {
    it('chunks the alphabet correctly', () => {
      const blocks = generateBlocks({
        mode: 'static',
        blockSize: 5,
        alphabet: ALPHABET,
        predictedWords: [],
        predictedLetters: [],
      });

      // A-E, F-J, K-O, P-T, U-Y, Z
      // + Actions block
      // 6 letter blocks + 1 action block = 7
      expect(blocks).toHaveLength(7);

      expect(blocks[0].label).toBe('A - E');
      expect(blocks[0].items).toEqual(['A', 'B', 'C', 'D', 'E']);

      expect(blocks[5].label).toBe('Z');
      expect(blocks[5].items).toEqual(['Z']);

      const lastBlock = blocks[6];
      expect(lastBlock.type).toBe('actions');
    });

    it('generates correct spoken labels for ranges', () => {
      const blocks = generateBlocks({
        mode: 'static',
        blockSize: 5,
        alphabet: ALPHABET,
        predictedWords: [],
        predictedLetters: [],
      });

      expect(blocks[0].spokenLabel).toBe('A to E');
    });
  });

  describe('Predictive Mode', () => {
    it('sorts letters by prediction and chunks them', () => {
      const predictedLetters = ['E', 'T', 'A', 'O', 'I']; // Top 5
      const blocks = generateBlocks({
        mode: 'predictive',
        blockSize: 5,
        alphabet: ALPHABET,
        predictedWords: [],
        predictedLetters,
      });

      // First block should contain the top predictions
      expect(blocks[0].items).toEqual(['E', 'T', 'A', 'O', 'I']);
      // Label should list them because they are not contiguous
      expect(blocks[0].label).toBe('E T A O I');
      expect(blocks[0].spokenLabel).toBe('E, T, A, O, I');

      // Second block should be the remaining alphabet (B, C, D, F...)
      expect(blocks[1].items[0]).toBe('B');
    });
  });

  describe('Hybrid Mode', () => {
    it('creates a hot block first, then normal static blocks', () => {
      const predictedLetters = ['E', 'T', 'A'];
      const blocks = generateBlocks({
        mode: 'hybrid',
        blockSize: 5,
        alphabet: ALPHABET,
        predictedWords: [],
        predictedLetters,
      });

      // Block 0: Hot letters
      expect(blocks[0].type).toBe('prediction');
      expect(blocks[0].items).toEqual(['E', 'T', 'A']);

      // Block 1: Start of Alphabet (A-E)
      // Note: A and E are duplicated here by design (stability)
      expect(blocks[1].type).toBe('alphabet');
      expect(blocks[1].items).toEqual(['A', 'B', 'C', 'D', 'E']);
    });
  });

  describe('Word Predictions', () => {
    it('adds a word prediction block if words are available', () => {
        const blocks = generateBlocks({
            mode: 'static',
            blockSize: 5,
            alphabet: ALPHABET,
            predictedWords: ['THE', 'AND'],
            predictedLetters: [],
        });

        // Block 0 should be words
        expect(blocks[0].type).toBe('prediction');
        expect(blocks[0].label).toBe('THE AND');
        expect(blocks[0].spokenLabel).toBe('THE, AND');
        expect(blocks[0].items).toContain('THE');
        expect(blocks[0].items).toContain('AND');
        expect(blocks[0].items).toContain(SPACE);

        // Block 1 starts alphabet
        expect(blocks[1].type).toBe('alphabet');
        expect(blocks[1].items[0]).toBe('A');
    });
  });
});
