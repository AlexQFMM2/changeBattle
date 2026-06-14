import "./ComponentGalleryButton.css";

export function ComponentGalleryButton({disabled = false, onClick}: {disabled?: boolean; onClick?: () => void}) {
  return (
    <button className="component-gallery-button" type="button" disabled={disabled} onClick={onClick}>
      查看组件
    </button>
  );
}
