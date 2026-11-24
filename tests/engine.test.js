import {test} from 'node:test';import assert from 'node:assert/strict';import {analyze} from '../src/engine.js';
test('Spanish phishing',()=>assert.equal(analyze('URGENTE cuenta bloqueada contraseña http://example.xyz').level,2));
test('Portuguese phishing',()=>assert.equal(analyze('URGENTE sua conta bloqueada confirme senha').level,2));
test('English phishing',()=>assert.equal(analyze('urgent password verification code').level,2));
test('ordinary message',()=>assert.equal(analyze('Hola, nos vemos mañana').level,0));
test('concealed URL',()=>assert.ok(analyze('https://bank.example@evil.example').score>=3));
test('remote access',()=>assert.ok(analyze('AnyDesk').score>=3));
test('empty input',()=>assert.equal(analyze('').score,0));
test('malformed URL',()=>assert.doesNotThrow(()=>analyze('https://%')));