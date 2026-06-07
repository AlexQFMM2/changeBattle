import {AnimatedModalLayer, AnimatedPanel} from "../motion/Animated";

export function ErrorDialog({message, onClose}: {message: string; onClose: () => void}) {
  return (
    <AnimatedModalLayer className="modal-layer error-modal-layer" role="presentation" onClick={onClose}>
      <AnimatedPanel className="error-modal" role="alertdialog" aria-modal="true" aria-labelledby="error-title" onClick={event => event.stopPropagation()}>
        <header>
          <h2 id="error-title">操作失败</h2>
          <button onClick={onClose}>关闭</button>
        </header>
        <p>{message}</p>
      </AnimatedPanel>
    </AnimatedModalLayer>
  );
}
