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

function PanelItems( { heading, items, ItemComponent = PanelItem } ) {
	const renderMetricItems = ( metricSlugs ) => {
		return Object.keys( metricSlugs ).map( ( slug ) => {
			const { description } = metricSlugs[ slug ];
			const id = `key-metric-selection-checkbox-${ slug }`;

			return (
				<ItemComponent
					key={ id }
					id={ id }
					slug={ slug }
					{ ...metricSlugs[ slug ] }
				>
					{ description }
				</ItemComponent>
			);
		} );
	};

	// Check if we have items, return if no items.
	if ( ! Object.keys( items ).length ) {
		return null;
	}

	return (
		<Fragment>
			<p className="googlesitekit-km-selection-panel-metrics__subheading">
				{ heading }
			</p>
			<div className="googlesitekit-km-selection-panel-metrics__subsection">
				{ renderMetricItems( items ) }
			</div>
		</Fragment>
	);
}

export default PanelItems;
