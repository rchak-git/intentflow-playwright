import * as fs from 'fs';
import { parse } from 'yaml';
import { z } from 'zod';
import { TestScenarioSchema, TestScenario } from '../types/intentSchema';

export function loadAndValidateYaml(filePath: string): TestScenario {
  const raw = fs.readFileSync(filePath, 'utf-8');
  const parsedYaml: unknown = parse(raw);

  try {
    return TestScenarioSchema.parse(parsedYaml);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(
        `YAML Validation Failed for ${filePath}:\n${z.prettifyError(error)}`,
      );
    }
    throw error;
  }
}
