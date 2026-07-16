import { Component, HostListener, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

interface NavItem {
  label: string;
  path: string;
  icon: string;
  adminOnly: boolean;
}

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app-shell.component.html',
  styleUrl: './app-shell.component.css',
})
export class AppShellComponent {
  readonly drawerOpen = signal(false);

  private readonly allNav: NavItem[] = [
    { label: 'Today', path: '/today', icon: '📅', adminOnly: false },
    { label: 'Clients', path: '/clients', icon: '👥', adminOnly: false },
    { label: 'Calendar', path: '/appointments', icon: '🗓️', adminOnly: false },
    { label: 'Services', path: '/services', icon: '✂️', adminOnly: false },
    { label: 'Revenue', path: '/revenue', icon: '💰', adminOnly: true },
    { label: 'Settings', path: '/admin/settings', icon: '⚙️', adminOnly: true },
  ];

  constructor(public auth: AuthService) {}

  get nav(): NavItem[] {
    const admin = this.auth.isAdmin();
    return this.allNav.filter((n) => !n.adminOnly || admin);
  }

  toggleDrawer(): void {
    this.drawerOpen.update((v) => !v);
  }

  closeDrawer(): void {
    this.drawerOpen.set(false);
  }

  @HostListener('window:keydown.escape')
  onEsc(): void {
    this.closeDrawer();
  }

  logout(): void {
    this.closeDrawer();
    this.auth.logout();
  }
}
