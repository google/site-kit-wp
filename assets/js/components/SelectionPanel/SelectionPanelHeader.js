import Link from '../Link';
import CloseIcon from '../../../svg/icons/close.svg';

export default function SelectionPanelHeader( {
	children,
	title,
	onCloseClick,
} ) {
	return (
		<header className="googlesitekit-km-selection-panel-header">
			<div className="googlesitekit-km-selection-panel-header__row">
				<h3>{ title }</h3>
				<Link
					className="googlesitekit-km-selection-panel-header__close"
					onClick={ onCloseClick }
					linkButton
				>
					<CloseIcon width="15" height="15" />
				</Link>
			</div>
			{ children }
		</header>
	);
}
