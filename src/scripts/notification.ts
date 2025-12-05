export function showNotification(
  message: string,
  type: "success" | "error" | "info" = "info",
  duration: number = 4000
) {
  const notification = document.getElementById("notification") as HTMLDivElement;
  const messageElement = notification?.querySelector(
    ".notification-message"
  ) as HTMLParagraphElement;

  if (!notification || !messageElement) return;

  // Limpiar clases anteriores
  notification.classList.remove("success", "error", "info", "hide");

  // Establecer mensaje y tipo
  messageElement.textContent = message;
  notification.classList.add(type);

  // Mostrar notificación
  notification.classList.remove("hidden");
  notification.classList.add("show");

  // Ocultar después de la duración especificada
  setTimeout(() => {
    notification.classList.add("hide");
    setTimeout(() => {
      notification.classList.remove("show", "hide");
      notification.classList.add("hidden");
    }, 300);
  }, duration);
}
