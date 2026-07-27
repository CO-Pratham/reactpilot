export default function setup(api) {
  api.registerPrompt({
    name: 'nextjs-review',
    description: 'Review Next.js App Router patterns and optimizations',
    template: 'Review this Next.js code for App Router best practices:\n\n{{code}}',
    variables: ['code'],
  });
}
