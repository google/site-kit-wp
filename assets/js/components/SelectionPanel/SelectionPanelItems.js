/**
 * WordPress dependencies
 */
import { Fragment } from '@wordpress/element';

// import MetricItem from './MetricItem';

export default function SelectionPanelItems( {
	currentSelectionTitle,
	availableItemsTitle,
	savedItemSlugs,
	availableSavedItems,
	availableUnsavedItems,
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
					savedItemSlugs={ savedItemSlugs }
				/>
			);
		} );
	};

	return (
		<div className="googlesitekit-km-selection-panel-metrics">
			{
				// Split list into two sections with sub-headings for current selection and
				// additional metrics if there are already saved metrics.
				savedItemSlugs.length !== 0 && (
					<Fragment>
						<p className="googlesitekit-km-selection-panel-metrics__subheading">
							{ currentSelectionTitle }
						</p>
						<div className="googlesitekit-km-selection-panel-metrics__subsection">
							{ renderMetricItems( availableSavedItems ) }
						</div>
						<p className="googlesitekit-km-selection-panel-metrics__subheading">
							{ availableItemsTitle }
						</p>
					</Fragment>
				)
			}
			<div className="googlesitekit-km-selection-panel-metrics__subsection">
				{ renderMetricItems( availableUnsavedItems ) }
			</div>
		</div>
	);
}
