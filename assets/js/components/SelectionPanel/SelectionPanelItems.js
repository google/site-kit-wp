/**
 * WordPress dependencies
 */
import { Fragment } from '@wordpress/element';

// import MetricItem from './MetricItem';

export default function SelectionPanelItems( {
	currentSelectionTitle,
	availableItemsTitle,
	savedMetrics,
	availableSavedMetrics,
	availableUnsavedMetrics,
	ItemComponent,
} ) {
	const renderMetricItems = ( metrics ) => {
		return Object.keys( metrics ).map( ( slug ) => {
			const { title, description } = metrics[ slug ];

			const id = `key-metric-selection-checkbox-${ slug }`;

			return (
				<ItemComponent
					key={ id }
					id={ id }
					slug={ slug }
					title={ title }
					description={ description }
					savedMetrics={ savedMetrics }
				/>
			);
		} );
	};

	return (
		<div className="googlesitekit-km-selection-panel-metrics">
			{
				// Split list into two sections with sub-headings for current selection and
				// additional metrics if there are already saved metrics.
				savedMetrics.length !== 0 && (
					<Fragment>
						<p className="googlesitekit-km-selection-panel-metrics__subheading">
							{ currentSelectionTitle }
						</p>
						<div className="googlesitekit-km-selection-panel-metrics__subsection">
							{ renderMetricItems( availableSavedMetrics ) }
						</div>
						<p className="googlesitekit-km-selection-panel-metrics__subheading">
							{ availableItemsTitle }
						</p>
					</Fragment>
				)
			}
			<div className="googlesitekit-km-selection-panel-metrics__subsection">
				{ renderMetricItems( availableUnsavedMetrics ) }
			</div>
		</div>
	);
}
