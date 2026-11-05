import { HighlightStyle, syntaxHighlighting } from '@codemirror/language';
import { oneDark } from '@codemirror/theme-one-dark';
import { tags } from '@lezer/highlight';

// Match the GitHub light palette used by Markdown code fences.
const lightHighlightStyle = HighlightStyle.define([
    { tag: tags.keyword, color: '#cf222e' },
    { tag: [tags.name, tags.variableName], color: '#24292f' },
    { tag: [tags.propertyName, tags.number, tags.bool, tags.null], color: '#0550ae' },
    { tag: [tags.string, tags.regexp], color: '#0a3069' },
    { tag: [tags.function(tags.variableName), tags.function(tags.propertyName)], color: '#8250df' },
    { tag: [tags.typeName, tags.className, tags.attributeName], color: '#953800' },
    { tag: tags.tagName, color: '#116329' },
    { tag: [tags.comment, tags.meta], color: '#6e7781' },
    { tag: tags.operator, color: '#cf222e' },
    { tag: tags.punctuation, color: '#24292f' },
    { tag: tags.heading, color: '#0550ae', fontWeight: 'bold' },
    { tag: tags.link, color: '#0969da', textDecoration: 'underline' },
    { tag: tags.emphasis, fontStyle: 'italic' },
    { tag: tags.strong, fontWeight: 'bold' }
]);

export function codeTheme(dark: boolean) {
    return dark ? oneDark : syntaxHighlighting(lightHighlightStyle);
}
