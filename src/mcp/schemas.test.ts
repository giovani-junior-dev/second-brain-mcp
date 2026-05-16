import { describe, expect, it } from 'vitest';
import {
  ListSkillsInput,
  RecallInput,
  SessionSearchInput,
  SkillInvokeInput,
  WriteInput,
} from './schemas.js';

describe('RecallInput', () => {
  it('accepts valid', () => {
    expect(RecallInput.parse({ query: 'x' }).query).toBe('x');
  });
  it('rejects empty query', () => {
    expect(() => RecallInput.parse({ query: '' })).toThrow();
  });
  it('rejects limit above 50', () => {
    expect(() => RecallInput.parse({ query: 'x', limit: 100 })).toThrow();
  });
});

describe('WriteInput', () => {
  it('requires content and type', () => {
    expect(() => WriteInput.parse({ content: 'x' })).toThrow();
    expect(() => WriteInput.parse({ type: 'x' })).toThrow();
    expect(WriteInput.parse({ content: 'a', type: 'b' }).content).toBe('a');
  });
});

describe('ListSkillsInput', () => {
  it('accepts empty object', () => {
    expect(ListSkillsInput.parse({})).toEqual({});
  });
});

describe('SkillInvokeInput', () => {
  it('requires name non-empty', () => {
    expect(() => SkillInvokeInput.parse({ name: '' })).toThrow();
  });
});

describe('SessionSearchInput', () => {
  it('parses query', () => {
    expect(SessionSearchInput.parse({ query: 'hi' }).query).toBe('hi');
  });
});

describe('whitespace rejection', () => {
  it('WriteInput rejects content=" " (space only)', () => {
    expect(() => WriteInput.parse({ content: ' ', type: 'note' })).toThrow();
  });
  it('WriteInput rejects content="\\t\\n " (whitespace mix)', () => {
    expect(() => WriteInput.parse({ content: '\t\n ', type: 'note' })).toThrow();
  });
  it('WriteInput trims and accepts " hello "', () => {
    expect(WriteInput.parse({ content: ' hello ', type: 'note' }).content).toBe('hello');
  });
  it('RecallInput rejects whitespace query', () => {
    expect(() => RecallInput.parse({ query: '   ' })).toThrow();
  });
  it('SkillInvokeInput rejects whitespace name', () => {
    expect(() => SkillInvokeInput.parse({ name: ' ' })).toThrow();
  });
});
