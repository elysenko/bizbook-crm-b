import { Injectable } from '@nestjs/common';

const PLACEHOLDER = 'PLACEHOLDER_CONFIGURE_IN_SETTINGS';
const MASK = '••••••••';

interface FieldDef {
  key: string;
  label: string;
  placeholder: string;
  /** Env vars consulted (in order) to resolve this field's value. */
  envKeys: string[];
}

interface ServiceDef {
  key: string;
  label: string;
  fields: FieldDef[];
}

const SERVICE_DEFS: ServiceDef[] = [
  {
    key: 'postgresql',
    label: 'PostgreSQL Database',
    fields: [
      {
        key: 'DATABASE_URL',
        label: 'Connection URL',
        placeholder: 'postgresql://user:pass@host:5432/db',
        envKeys: ['DATABASE_URL'],
      },
    ],
  },
  {
    key: 'minio',
    label: 'MinIO Object Storage',
    fields: [
      {
        key: 'MINIO_ENDPOINT',
        label: 'Endpoint',
        placeholder: 'https://minio.example.com',
        envKeys: ['MINIO_ENDPOINT'],
      },
      {
        key: 'MINIO_ACCESS_KEY',
        label: 'Access key',
        placeholder: 'access-key',
        envKeys: ['MINIO_ACCESS_KEY', 'MINIO_ROOT_USER'],
      },
      {
        key: 'MINIO_SECRET_KEY',
        label: 'Secret key',
        placeholder: 'secret-key',
        envKeys: ['MINIO_SECRET_KEY', 'MINIO_ROOT_PASSWORD'],
      },
    ],
  },
];

/**
 * Resolves service credentials for the admin settings panel. Priority:
 *   1. Admin override set via PATCH (kept in-memory for this single-instance demo)
 *   2. Environment variable (mounted from infra secrets at deploy time)
 * Values are masked in GET responses; only a configured/unconfigured flag is exposed.
 */
@Injectable()
export class AdminSettingsService {
  private readonly overrides = new Map<string, string>();

  private resolve(field: FieldDef): string | null {
    const override = this.overrides.get(field.key);
    if (override && override !== PLACEHOLDER) return override;
    for (const envKey of field.envKeys) {
      const val = process.env[envKey];
      if (val && val !== PLACEHOLDER) return val;
    }
    return null;
  }

  list() {
    return SERVICE_DEFS.map((svc) => {
      const fields = svc.fields.map((f) => {
        const value = this.resolve(f);
        return {
          key: f.key,
          label: f.label,
          placeholder: f.placeholder,
          value: value ? MASK : '',
        };
      });
      const configured = svc.fields.every((f) => this.resolve(f) !== null);
      return { key: svc.key, label: svc.label, configured, fields };
    });
  }

  /**
   * Accepts either a nested body ({ postgresql: { DATABASE_URL: '...' } }) or a
   * flat map of field keys to values ({ DATABASE_URL: '...' }). Stores non-empty
   * values as overrides and returns the refreshed settings list.
   */
  update(body: Record<string, unknown>) {
    const knownFieldKeys = new Set(SERVICE_DEFS.flatMap((s) => s.fields.map((f) => f.key)));
    const knownServiceKeys = new Set(SERVICE_DEFS.map((s) => s.key));

    const apply = (fieldKey: string, value: unknown) => {
      if (typeof value === 'string' && value.trim().length > 0) {
        this.overrides.set(fieldKey, value.trim());
      }
    };

    for (const [key, value] of Object.entries(body ?? {})) {
      if (knownServiceKeys.has(key) && value && typeof value === 'object') {
        for (const [fk, fv] of Object.entries(value as Record<string, unknown>)) {
          apply(fk, fv);
        }
      } else if (knownFieldKeys.has(key)) {
        apply(key, value);
      }
    }

    return this.list();
  }
}
