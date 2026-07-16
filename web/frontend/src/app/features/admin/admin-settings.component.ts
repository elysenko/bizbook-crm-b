import { Component, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminSetting } from '../../core/models';

@Component({
  selector: 'app-admin-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-settings.component.html',
  styleUrl: './admin-settings.component.css',
})
export class AdminSettingsComponent {
  // Mock data — service_agent wires this signal to GET /api/admin/settings.
  readonly settings = signal<AdminSetting[]>([
    {
      key: 'postgresql',
      label: 'PostgreSQL Database',
      configured: false,
      fields: [
        { key: 'DATABASE_URL', label: 'Connection URL', placeholder: 'postgresql://user:pass@host:5432/db', value: '' },
      ],
    },
    {
      key: 'minio',
      label: 'MinIO Object Storage',
      configured: false,
      fields: [
        { key: 'MINIO_ENDPOINT', label: 'Endpoint', placeholder: 'https://minio.example.com', value: '' },
        { key: 'MINIO_ACCESS_KEY', label: 'Access key', placeholder: 'access-key', value: '' },
        { key: 'MINIO_SECRET_KEY', label: 'Secret key', placeholder: 'secret-key', value: '' },
      ],
    },
  ]);

  readonly unconfigured = computed(() => this.settings().filter((s) => !s.configured));

  save(key: string): void {
    this.settings.update((list) =>
      list.map((s) =>
        s.key === key
          ? { ...s, configured: s.fields.every((f) => f.value.trim().length > 0) }
          : s,
      ),
    );
  }
}
