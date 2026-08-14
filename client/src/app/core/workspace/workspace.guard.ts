import { inject } from '@angular/core';

import {
  ActivatedRouteSnapshot,
  CanActivateFn,
  Router,
  RouterStateSnapshot,
} from '@angular/router';

export const workspaceGuard: CanActivateFn = (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot,
) => {
  const router = inject(Router);

  const workspaceId = route.queryParamMap.get('workspace');

  if (workspaceId) {
    return true;
  }

  /*
   * Workspace is required for all
   * workspace-scoped application pages.
   *
   * Send the user to workspace selection.
   */

  return router.createUrlTree(['/workspace/select'], {
    queryParams: {
      returnUrl: state.url,
    },
  });
};
