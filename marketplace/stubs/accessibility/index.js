export default function setup(api) {
  api.registerPrompt({
    name: 'a11y-review',
    description: 'Review component accessibility and ARIA usage',
    template: 'Review this React component for accessibility issues:\n\n{{code}}',
    variables: ['code'],
  });
}
