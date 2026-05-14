export function interpolateTemplate(
  input: string,
  variables: Record<string, string>,
): string {
  return input.replace(/\{\{([A-Z0-9_]+)\}\}/g, (_, key: string) => variables[key] ?? `{{${key}}}`);
}

export function resolveEnvironmentVariables(
  values: Record<string, string>,
  activeEnvironment?: Record<string, string>,
): Record<string, string> {
  const resolved: Record<string, string> = {};

  for (const [key, value] of Object.entries(values)) {
    resolved[key] = interpolateTemplate(value, activeEnvironment ?? {});
  }

  return resolved;
}
