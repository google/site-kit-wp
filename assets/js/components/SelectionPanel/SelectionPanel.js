import SideSheet from '../SideSheet';

export default function SelectionPanel( {
	children,
	isOpen,
	onOpen,
	closeFn,
} ) {
	return (
		<SideSheet
			className="googlesitekit-km-selection-panel"
			isOpen={ isOpen }
			onOpen={ onOpen }
			closeFn={ closeFn }
			focusTrapOptions={ {
				initialFocus:
					'.googlesitekit-km-selection-panel-metrics__metric-item .googlesitekit-selection-box input',
			} }
		>
			{ children }
		</SideSheet>
	);
}
