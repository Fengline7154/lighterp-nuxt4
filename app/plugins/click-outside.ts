export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.directive("click-outside", {
    mounted(el, binding) {
      el.__clickOutside = (e: MouseEvent) => {
        if (!el.contains(e.target as Node)) {
          binding.value();
        }
      };
      document.addEventListener("click", el.__clickOutside);
    },
    unmounted(el) {
      document.removeEventListener("click", el.__clickOutside);
    },
  });
});
