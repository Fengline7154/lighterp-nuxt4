import { restoreAuth } from "~/composables/useAuth";

export default defineNuxtRouteMiddleware(async (to) => {
  const publicPages = ["/login", "/setup"];
  if (publicPages.includes(to.path)) return;

  const authed = await restoreAuth();

  if (!authed) {
    return navigateTo("/login");
  }
});
