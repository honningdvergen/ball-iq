// t() for a string with elements in it: rich(t('quiz.leaveBody'), { score: <strong>3</strong> })
// puts each {placeholder} of the translated template where that language
// wants it, as a React node. Pass the template already through t() (plurals
// and plain values filled in there); whatever {name} is left is replaced here.
// Not on Home's eager path: only the game screens import it.
import React from 'react';

export function rich(template, nodes) {
  return template
    .split(/\{(\w+)\}/)
    .map((part, i) => (i % 2 ? <React.Fragment key={i}>{nodes[part]}</React.Fragment> : part))
    .filter((p) => p !== '');
}
