export interface ActionOptions {
  label: string;
  disabled?: boolean;
  className?: string;
  onClick?: () => void;
}

export function actionButton({
  label,
  disabled = false,
  className = 'ui-button',
  onClick,
}: ActionOptions): HTMLButtonElement {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = className;
  button.textContent = label;
  button.disabled = disabled;
  if (onClick) button.addEventListener('click', onClick);
  return button;
}
