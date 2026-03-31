import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { InventoryService, InventoryItem } from '../../services/inventory.service';

@Component({
  selector: 'app-inventory',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatIconModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
  ],
  templateUrl: './inventory.component.html',
  styleUrl: './inventory.component.scss',
})
export class InventoryComponent implements OnInit {
  items: InventoryItem[] = [];
  showForm: boolean = false;
  errorMessage: string = '';

  itemForm = new FormGroup({
    name: new FormControl('', [Validators.required]),
    category: new FormControl('other', [Validators.required]),
  });

  categoryOptions = [
    { value: 'cleaning', label: 'Cleaning', icon: 'cleaning_services' },
    { value: 'toiletries', label: 'Toiletries', icon: 'soap' },
    { value: 'kitchen', label: 'Kitchen', icon: 'kitchen' },
    { value: 'pantry', label: 'Pantry', icon: 'shelves' },
    { value: 'other', label: 'Other', icon: 'inventory_2' },
  ];

  statusOptions = [
    { value: 'stocked', label: 'Stocked' },
    { value: 'low', label: 'Running low' },
    { value: 'out', label: 'Out' },
  ];

  constructor(private inventoryService: InventoryService) {}

  ngOnInit(): void {
    this.loadItems();
  }

  loadItems(): void {
    this.inventoryService.getAll().subscribe({
      next: (response) => {
        this.items = response.items;
      },
      error: (error) => {
        this.errorMessage = error.error.message || 'Failed to load items.';
      },
    });
  }

  toggleForm(): void {
    this.showForm = !this.showForm;
  }

  onCreate(): void {
    if (this.itemForm.valid) {
      const { name, category } = this.itemForm.value;

      this.inventoryService.create(name!, category!).subscribe({
        next: (response) => {
          this.items.unshift(response.item);
          this.itemForm.reset({ name: '', category: 'other' });
          this.showForm = false;
        },
        error: (error) => {
          this.errorMessage = error.error.message || 'Failed to add item.';
        },
      });
    }
  }

  onStatusChange(itemId: number, newStatus: string): void {
    this.inventoryService.updateStatus(itemId, newStatus).subscribe({
      next: (response) => {
        const index = this.items.findIndex((i) => i.id === itemId);
        if (index !== -1) {
          this.items[index] = response.item;
        }
        // Re-sort: out first, then low, then stocked
        this.items.sort((a, b) => {
          const order: Record<string, number> = { out: 0, low: 1, stocked: 2 };
          return (order[a.status] ?? 2) - (order[b.status] ?? 2);
        });
      },
      error: (error) => {
        this.errorMessage = error.error.message || 'Failed to update status.';
      },
    });
  }

  onDelete(itemId: number): void {
    this.inventoryService.delete(itemId).subscribe({
      next: () => {
        this.items = this.items.filter((i) => i.id !== itemId);
      },
      error: (error) => {
        this.errorMessage = error.error.message || 'Failed to delete item.';
      },
    });
  }

  getCategoryIcon(category: string): string {
    return this.categoryOptions.find((c) => c.value === category)?.icon || 'inventory_2';
  }

  getCategoryLabel(category: string): string {
    return this.categoryOptions.find((c) => c.value === category)?.label || 'Other';
  }

  getStockedCount(): number {
    return this.items.filter((i) => i.status === 'stocked').length;
  }

  getLowCount(): number {
    return this.items.filter((i) => i.status === 'low').length;
  }

  getOutCount(): number {
    return this.items.filter((i) => i.status === 'out').length;
  }
}