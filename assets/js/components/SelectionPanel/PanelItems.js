/**
 * Panel List Items.
 *
 * Site Kit by Google, Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { Fragment } from '@wordpress/element';
import PanelItem from './PanelItem';

function PanelItems( {
	selectedItems = {},
	availableItems = {},
	currentSelectionHeading = '',
	availableSelectionHeading = '',
} ) {
	const renderMetricItems = ( metricSlugs ) => {
		return Object.keys( metricSlugs ).map( ( slug ) => {
			const { title, children } = metricSlugs[ slug ];

			const id = `key-metric-selection-checkbox-${ slug }`;

			return (
				<PanelItem
					key={ id }
					id={ id }
					slug={ slug }
					title={ title }
					savedMetrics={ [ selectedItems, availableItems ] }
				>
					{ children }
				</PanelItem>
			);
		} );
	};

	return (
		<div className="googlesitekit-km-selection-panel-metrics">
			{
				// Split list into two sections with sub-headings for current selection and
				// additional metrics if there are already saved metrics.
				selectedItems.length !== 0 && (
					<Fragment>
						<p className="googlesitekit-km-selection-panel-metrics__subheading">
							{ currentSelectionHeading }
						</p>
						<div className="googlesitekit-km-selection-panel-metrics__subsection">
							{ renderMetricItems( selectedItems ) }
						</div>
						<p className="googlesitekit-km-selection-panel-metrics__subheading">
							{ availableSelectionHeading }
						</p>
					</Fragment>
				)
			}
			<div className="googlesitekit-km-selection-panel-metrics__subsection">
				{ renderMetricItems( availableItems ) }
			</div>
		</div>
	);
}

export default PanelItems;
