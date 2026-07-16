import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

/** True when `value` is a real calendar date in strict YYYY-MM-DD form. */
export function isValidDateOnly(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const d = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(d.getTime())) return false;
  // Reject rollovers (e.g. 2026-02-30 -> Mar 02) by round-tripping.
  return d.toISOString().slice(0, 10) === value;
}

/** True when `value` is a 30-min slot in the business day 08:00–18:00 inclusive. */
export function isBusinessSlot(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{2}:\d{2}$/.test(value)) return false;
  const [h, m] = value.split(':').map(Number);
  if (m !== 0 && m !== 30) return false;
  if (h < 8 || h > 18) return false;
  if (h === 18 && m !== 0) return false; // 18:00 is the last valid slot
  return true;
}

@ValidatorConstraint({ name: 'isDateOnly', async: false })
export class IsDateOnlyConstraint implements ValidatorConstraintInterface {
  validate(value: unknown) {
    return isValidDateOnly(value);
  }
  defaultMessage() {
    return 'date must be a valid calendar date in YYYY-MM-DD format';
  }
}

export function IsDateOnly(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsDateOnlyConstraint,
    });
  };
}

@ValidatorConstraint({ name: 'isBusinessSlot', async: false })
export class IsBusinessSlotConstraint implements ValidatorConstraintInterface {
  validate(value: unknown) {
    return isBusinessSlot(value);
  }
  defaultMessage() {
    return 'startTime must be a 30-minute slot between 08:00 and 18:00';
  }
}

export function IsBusinessSlot(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsBusinessSlotConstraint,
    });
  };
}
