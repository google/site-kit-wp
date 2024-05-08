import SelectionBox from '../SelectionBox';

export default function SelectionPanelItem( {
	children,
	id,
	slug,
	title,
	description,
	isMetricSelected,
	isMetricDisabled,
	onCheckboxChange,
} ) {
	return (
		<div className="googlesitekit-km-selection-panel-metrics__metric-item">
			<SelectionBox
				checked={ isMetricSelected }
				disabled={ isMetricDisabled }
				id={ id }
				onChange={ onCheckboxChange }
				title={ title }
				value={ slug }
			>
				{ description }
				{ children }
			</SelectionBox>
		</div>
	);
}
