import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminSetting } from '../../core/models';
import { AdminSettingsApiService } from '../../core/services/admin-settings-api.service';

@Component({
  selector: 'app-admin-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-settings.component.html',
  styleUrl: './admin-settings.component.css',
})
export class AdminSettingsComponent implements OnInit {
  private readonly api = inject(AdminSettingsApiService);

  // Wired to GET /api/v1/admin/settings.
  readonly settings = signal<AdminSetting[]>([]);

  readonly unconfigured = computed(() => this.settings().filter((s) => !s.configured));

  ngOnInit(): void {
    this.api.list().subscribe({
      next: (settings) => this.settings.set(settings),
      error: () => this.settings.set([]),
    });
  }

  save(key: string): void {
    const svc = this.settings().find((s) => s.key === key);
    if (!svc) return;

    const body: Record<string, string> = {};
    for (const field of svc.fields) {
      const value = (field.value ?? '').trim();
      if (value) body[field.key] = value;
    }

    this.api.update(body).subscribe({
      next: (settings) => this.settings.set(settings),
      error: () => {
        /* keep current form state on failure */
      },
    });
  }
}
