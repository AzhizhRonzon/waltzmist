

## Fix: Admin Dashboard Access Blocked by Recursive RLS

### Problem
The `user_roles` table has a recursive RLS policy -- it checks "is this user an admin?" by querying `user_roles` from *within* the `user_roles` SELECT policy. Postgres cannot resolve this circular reference, so the query always returns empty, and the admin check on line 94-99 of `Admin.tsx` always fails.

Your admin role entry **does exist** in the database (user_id: `91d1f61c-...`, role: `admin`), so the data is fine.

### Solution
Replace the recursive RLS policy with one that uses the existing `has_role()` SECURITY DEFINER function, which bypasses RLS internally and avoids the recursion.

### Technical Details

**Database migration** -- Drop the old policy and create a corrected one:

```sql
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;

CREATE POLICY "Users can view own role or admins view all"
  ON public.user_roles
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR public.has_role(auth.uid(), 'admin')
  );
```

No code changes needed in `Admin.tsx` -- once the policy is fixed, the existing client query will work correctly.

