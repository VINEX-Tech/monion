import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import Ajv, { ValidateFunction } from 'ajv';
import addFormats from 'ajv-formats';
import { parse } from 'yaml';

const contractPath = resolve(__dirname, '../../../../packages/contracts/openapi.yaml');

export interface OpenApiDocument {
  paths: Record<string, Record<string, unknown>>;
  components: { schemas: Record<string, unknown> };
}

export const contract = parse(readFileSync(contractPath, 'utf8')) as OpenApiDocument;

const ajv = new Ajv({ strict: false, allErrors: true });
addFormats(ajv);
ajv.addSchema(contract, 'openapi');

/** Returns an Ajv validator for a named schema in components.schemas. */
export function contractSchema(name: string): ValidateFunction {
  const validate = ajv.getSchema(`openapi#/components/schemas/${name}`);
  if (!validate) throw new Error(`Schema ${name} is not defined in the contract`);
  return validate;
}
