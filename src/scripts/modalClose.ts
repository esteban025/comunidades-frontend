import { $$, $id } from "@/utils/selectElementsDom";

export interface ModalCloseOptions {
  closeAttribute?: string;
}

export function setupModalCloseHandlers(
  modalId: string,
  onClose: () => void,
  options?: ModalCloseOptions,
): void {
  const modal = $id(modalId) as HTMLDivElement | null;
  if (!modal) return;

  const closeAttr = options?.closeAttribute ?? modalId;
  const closeButtons = $$(`[data-close="${closeAttr}"]`);

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
