/**
 * Given a C++ function name, simplify it as appropriate for the treemap.
 * Parsing C++ function names correctly is very hard and this code is not correct,
 * but it does at least attempt to match parens and angle brackets as found in complex
 * C++ types.
 */
export function simplifyCPPName(name: string): string[] {
  const stack = [];
  let letters = [];
  for (let i = 0; i < name.length; i++) {
    switch (name[i]) {
      case '(':
        stack.push(name[i]);
        continue;
      case '<':
        if (name[i + 1] !== '=') {
          // `<=`
          stack.push(name[i]);
          continue;
        }
        break;
      case ')':
        if (stack.pop() !== '(') throw new Error('failed to parse C++ symbol');
        if (stack.length === 0) letters.push('()');
        continue;
      case '>':
        if (name[i + 1] !== '=') {
          // `>=`
          if (stack.pop() !== '<') {
            throw new Error('failed to parse C++ symbol');
          }
          continue;
        }
        break;
      case '-':
        if (name[i + 1] === '>') {
          // `->`
          i++;
          if (stack.length === 0) letters.push('->');
          continue;
        }
        break;
    }
    if (stack.length === 0) {
      letters.push(name[i]);
    }
  }
  name = letters.join('');

  // name is now e.g. `foo::iterator bar::fn() const`
  // Rust name comes out like `mangled$gibberish ()` so avoid that in particular.
  let parts = name.split(' ').filter((part) => part !== '()');
  let fn = parts.find((part) => part.endsWith('()') && part !== 'decltype()');
  if (fn) {
    fn = fn.slice(0, -2);
  } else {
    // Fallback when we didn't find a function.
    fn = parts[parts.length - 1];
  }
  return fn.split('::');
}

// Some test cases, if we ever add a test suite:
// console.log(simplifyCPPName('(anonymous namespace)::itanium_demangle::NameType* (anonymous namespace)::DefaultAllocator::makeNode<(anonymous namespace)::itanium_demangle::NameType, char const (&) [14]>(char const (&) [14])'));
// console.log(simplifyCPPName("std::__2::__hash_const_iterator<std::__2::__hash_node<char const*, void*>*> std::__2::__hash_table<char const*, Json::ValueAllocator::InternHash, Json::ValueAllocator::InternHash, std::__2::allocator<char const*> >::find<char const*>(char const* const&) const"));
// console.log(simplifyCPPName("_$LT$alloc..alloc..Global$u20$as$u20$core..alloc..Allocator$GT$::deallocate::h24852c13dde43f03 (.103)"));
// console.log(simplifyCPPName("decltype(((hb_forward<unsigned int&>(fp)) <= (hb_forward<unsigned int&>(fp0))) ? (hb_forward<unsigned int&>(fp)) : (hb_forward<unsigned int&>(fp0))) $_4::operator()<unsigned int&, unsigned int&>(unsigned int&, unsigned int&) const"));
