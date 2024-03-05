import assert from 'node:assert';
import { describe, test } from 'node:test';
import { simplifyCPPName } from './symbol';

describe('simplifyCPPName', () => {
  // These test cases are just capturing the current behavior and verifying we don't crash.
  // Their output could likely be improved.

  test('complex type', () => {
    assert.deepStrictEqual(
      simplifyCPPName(
        '(anonymous namespace)::itanium_demangle::NameType* (anonymous namespace)::DefaultAllocator::makeNode<(anonymous namespace)::itanium_demangle::NameType, char const (&) [14]>(char const (&) [14])',
      ),
      ['()', 'DefaultAllocator', 'makeNode'],
    );
  });

  test('std::hash', () => {
    assert.deepStrictEqual(
      simplifyCPPName(
        'std::__2::__hash_const_iterator<std::__2::__hash_node<char const*, void*>*> std::__2::__hash_table<char const*, Json::ValueAllocator::InternHash, Json::ValueAllocator::InternHash, std::__2::allocator<char const*> >::find<char const*>(char const* const&) const',
      ),
      ['std', '__2', '__hash_table', 'find'],
    );
  });

  test('harfbuzz decltype', () => {
    assert.deepStrictEqual(
      simplifyCPPName(
        'decltype(((hb_forward<unsigned int&>(fp)) <= (hb_forward<unsigned int&>(fp0))) ? (hb_forward<unsigned int&>(fp)) : (hb_forward<unsigned int&>(fp0))) $_4::operator()<unsigned int&, unsigned int&>(unsigned int&, unsigned int&) const',
      ),
      ['$_4', 'operator()'],
    );
  });
});
