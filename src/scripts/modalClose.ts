export interface ModalCloseOptions {
  /**
   * Valor del atributo data-close que se usará para encontrar los botones
   * que cierran la modal. Por defecto se usa el propio id de la modal.
   */
  closeAttribute?: string;
}

/**
 * Configura el cierre básico de una modal:
 * - Click en botones con data-close="X"
 * - Click en el overlay (fuera del contenedor)
 * - Tecla Escape
 *
 * La lógica concreta de cierre (resetear formularios, limpiar estado, etc.)
 * la define el callback onClose que pasas desde cada modal.
 */
export function setupModalCloseHandlers(
  modalId: string,
  onClose: () => void,
  options?: ModalCloseOptions,
): void {
  const modal = document.getElementById(modalId) as HTMLDivElement | null;
  if (!modal) return;

  const closeAttr = options?.closeAttribute ?? modalId;

  const closeButtons = document.querySelectorAll(
    `[data-close="${closeAttr}"]`,
  );

  const handleClose = () => {
    onClose();
  };

  // Botones con data-close
  closeButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      handleClose();
    });
  });

  // Click fuera del contenido (overlay)
  modal.addEventListener("click", (e) => {
    if (e.target === modal) {
      handleClose();
    }
  });

  // Tecla Escape
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !modal.classList.contains("hidden")) {
      handleClose();
    }
  });
}
