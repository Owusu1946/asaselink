import { gooeyToast, type GooeyToastOptions } from "goey-toast";

const defaults: GooeyToastOptions = {
  preset: "subtle",
  bounce: 0.1,
  showTimestamp: false,
};

function messageFrom(error: unknown, fallback = "Please try again.") {
  if (error instanceof Error && error.message.trim()) return error.message;
  return fallback;
}

export const notify = {
  success(title: string, options?: GooeyToastOptions) {
    return gooeyToast.success(title, { ...defaults, duration: 3_000, ...options });
  },
  info(title: string, options?: GooeyToastOptions) {
    return gooeyToast.info(title, { ...defaults, duration: 4_000, ...options });
  },
  warning(title: string, options?: GooeyToastOptions) {
    return gooeyToast.warning(title, { ...defaults, duration: 5_000, ...options });
  },
  error(title: string, options?: GooeyToastOptions) {
    return gooeyToast.error(title, { ...defaults, duration: 8_000, showProgress: true, ...options });
  },
  apiError(error: unknown, title = "Something went wrong", options?: GooeyToastOptions) {
    return gooeyToast.error(title, {
      ...defaults,
      duration: 8_000,
      showProgress: true,
      description: messageFrom(error),
      ...options,
    });
  },
  promise: gooeyToast.promise,
  dismiss: gooeyToast.dismiss,
  update: gooeyToast.update,
};

export { messageFrom };
