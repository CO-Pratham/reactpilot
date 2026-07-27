export default function setup(api) {
  api.registerPrompt({
    name: 'react-query-review',
    description: 'Review TanStack Query hook usage and cache keys',
    template: 'Review this React Query code for key naming and staleTime usage:\n\n{{code}}',
    variables: ['code'],
  });
}
