// Guard for CMS pick-lists: every value already stored in a content file must be one of the choices
// the CMS form offers for that field. A pick-list (select) that does not offer a stored value would
// show the field as empty and could drop the value on the next save, so this fails loudly instead.
//
// Plain TypeScript with no framework imports, so it is unit tested with `node --test` and shared by
// the check scripts. The pick-lists themselves live only in public/admin/config.yml.

export interface CmsField {
  name: string;
  widget?: string;
  options?: unknown[];
  multiple?: boolean;
  fields?: CmsField[];
}

export interface Violation {
  /** Where the value is, e.g. `engine`, `features`, `colors[1].name`. */
  path: string;
  value: string;
  /** The choices the form offers, for the error message. */
  allowed: string[];
}

const isEmpty = (v: unknown) => v === undefined || v === null || v === "";

/** The saved values of a select's options (an option is a plain value or `{ label, value }`). */
export function optionValues(options: unknown[] | undefined): string[] {
  return (options ?? []).map((o) =>
    String(typeof o === "object" && o !== null && "value" in o ? (o as { value: unknown }).value : o),
  );
}

/**
 * Compares by text, so a number saved by the CMS (`year: 2021`) matches the option `2021`
 * and a stored `"5"` matches the option `5`.
 */
export function findViolations(
  fields: CmsField[],
  data: Record<string, unknown>,
  prefix = "",
): Violation[] {
  const found: Violation[] = [];

  for (const field of fields) {
    const value = data[field.name];
    const path = `${prefix}${field.name}`;
    if (isEmpty(value)) continue;

    if (field.widget === "select") {
      const allowed = optionValues(field.options);
      const values = Array.isArray(value) ? value : [value];
      for (const v of values) {
        if (!isEmpty(v) && !allowed.includes(String(v))) {
          found.push({ path, value: String(v), allowed });
        }
      }
    } else if (field.widget === "list" && Array.isArray(field.fields) && Array.isArray(value)) {
      value.forEach((item, i) => {
        if (item && typeof item === "object") {
          found.push(...findViolations(field.fields!, item as Record<string, unknown>, `${path}[${i}].`));
        }
      });
    } else if (field.widget === "object" && Array.isArray(field.fields) && typeof value === "object") {
      found.push(...findViolations(field.fields, value as Record<string, unknown>, `${path}.`));
    }
  }

  return found;
}
