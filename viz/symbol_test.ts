import assert from 'node:assert';
import { describe, test } from 'node:test';
import * as symbol from './symbol';

describe('parseCPP', () => {
  // These test cases are just capturing the current behavior and verifying we don't crash.
  // Their output could likely be improved.

  test('complex type', () => {
    assert.deepStrictEqual(
      symbol.parseCPP(
        '(anonymous namespace)::itanium_demangle::NameType* (anonymous namespace)::DefaultAllocator::makeNode<(anonymous namespace)::itanium_demangle::NameType, char const (&) [14]>(char const (&) [14])',
      ),
      ['()', 'DefaultAllocator', 'makeNode'],
    );
  });

  test('std::hash', () => {
    assert.deepStrictEqual(
      symbol.parseCPP(
        'std::__2::__hash_const_iterator<std::__2::__hash_node<char const*, void*>*> std::__2::__hash_table<char const*, Json::ValueAllocator::InternHash, Json::ValueAllocator::InternHash, std::__2::allocator<char const*> >::find<char const*>(char const* const&) const',
      ),
      ['std', '__2', '__hash_table', 'find'],
    );
  });

  test('harfbuzz decltype', () => {
    assert.deepStrictEqual(
      symbol.parseCPP(
        'decltype(((hb_forward<unsigned int&>(fp)) <= (hb_forward<unsigned int&>(fp0))) ? (hb_forward<unsigned int&>(fp)) : (hb_forward<unsigned int&>(fp0))) $_4::operator()<unsigned int&, unsigned int&>(unsigned int&, unsigned int&) const',
      ),
      ['$_4', 'operator()'],
    );
  });
});

describe('parseRust', () => {
  test('call_once', () => {
    assert.deepStrictEqual(
      symbol.parseRust(
        'std::sync::once::Once::call_once::{{closure}}::h3895ccd6940cf396'
      ),
      ['std', 'sync', 'once', 'Once', 'call_once', '{{closure}}'],
    );
  });

  test('<a as b>', () => {
    assert.deepStrictEqual(
      symbol.parseRust(
        '<iced_x86::formatter::intel::info::SimpleInstrInfo_Reg32 as iced_x86::formatter::intel::info::InstrInfo>::op_info::h324368603d2df9ba'
      ),
      ['iced_x86', 'formatter', 'intel', 'info', 'SimpleInstrInfo_Reg32', 'op_info'],
    );
  });
});