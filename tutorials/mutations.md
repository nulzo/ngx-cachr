# Mutations & Optimistic Updates

This tutorial demonstrates how to handle data mutations (creating/updating) and keeping the UI in sync using `mutate`.

## Scenario

We have a user profile form. When we save, we want to update the UI immediately (optimistic update) or after the API confirms success.

## The Component

```typescript
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { cachedResource } from 'ngx-cachr';

@Component({
  selector: 'app-user-profile',
  standalone: true,
  imports: [FormsModule],
  template: `
    <h3>User Profile</h3>

    @if (user.data(); as u) {
      <div class="form-group">
        <label>Name:</label>
        <input [(ngModel)]="editName" placeholder="Enter name">
      </div>
      
      <button (click)="save(u)" [disabled]="isSaving">
        {{ isSaving ? 'Saving...' : 'Save Changes' }}
      </button>
      
      <p>Current Cache: {{ u.name }}</p>
    }
  `
})
export class UserProfileComponent {
  editName = '';
  isSaving = false;

  // Fetch user data
  user = cachedResource({
    key: 'user-profile',
    loader: async () => {
      return { id: 1, name: 'John Doe' };
    }
  });

  constructor() {
    // Initialize form when data loads
    effect(() => {
      const u = this.user.data();
      if (u) this.editName = u.name;
    });
  }

  async save(currentUser: any) {
    this.isSaving = true;
    const newName = this.editName;

    try {
      // 1. Optimistic Update (Optional)
      // Update the cache immediately before the API call finishes
      this.user.mutate({ ...currentUser, name: newName });

      // 2. API Call
      await this.updateUserApi(currentUser.id, newName);

      // 3. Verification (Optional)
      // If the API returns the updated object, we can mutate again with the "real" data
      // or simply invalidate to re-fetch fresh data.
      // this.user.invalidate(); 

    } catch (err) {
      // Revert on error
      console.error('Save failed', err);
      this.user.mutate(currentUser); // Rollback
      alert('Failed to save!');
    } finally {
      this.isSaving = false;
    }
  }

  // Mock API call
  private async updateUserApi(id: number, name: string) {
    return new Promise(resolve => setTimeout(resolve, 1000));
  }
}
```

## Key Concepts

-   **`mutate(newData)`**: Directly updates the signal `data` and the underlying cache (Memory & Storage). This is perfect for instant UI feedback.
-   **Error Handling**: If the API call fails, you can simply call `mutate` again with the old data to rollback the changes.
-   **Persistence**: Since `mutate` updates the storage driver, if the user refreshes the page immediately after an optimistic update, they will still see the new data.
