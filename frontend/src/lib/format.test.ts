import { describe, expect, it } from 'vitest'
import { initials, money } from './format'
describe('format helpers',()=>{it('formats INR values',()=>expect(money(6000)).toContain('6,000'));it('creates initials',()=>expect(initials('Suresh Kumar')).toBe('SK'))})
