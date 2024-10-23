/**
 * ChipTabGroup component.
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

/**
 * WordPress dependencies
 */
import { useCallback, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { KEY_METRICS_CURRENT_SELECTION_GROUP_SLUG } from '../constants';
import Chip from './Chip';
import MetricItem from '../MetricsSelectionPanel/MetricItem';
import NoSelectedItemsSVG from '../../../../svg/graphics/key-metrics-no-selected-items.svg';

export default function ChipTabGroup( { allMetricItems, savedItemSlugs } ) {
	const [ isActive, setIsActive ] = useState(
		KEY_METRICS_CURRENT_SELECTION_GROUP_SLUG
	);

	const currentSelectionGroup = {
		SLUG: KEY_METRICS_CURRENT_SELECTION_GROUP_SLUG,
		LABEL: __( 'Current selection', 'google-site-kit' ),
	};
	const selectedCounts = {};
	const activeMetricItems = {};
	for ( const metricItemSlug in allMetricItems ) {
		const metricGroup = allMetricItems[ metricItemSlug ].group;
		if ( metricGroup === isActive ) {
			activeMetricItems[ metricItemSlug ] =
				allMetricItems[ metricItemSlug ];
		}

		if ( ! selectedCounts[ metricGroup ] ) {
			const selectedCount = Object.keys( allMetricItems ).filter(
				( slug ) => {
					if (
						allMetricItems[ slug ].group === metricGroup &&
						savedItemSlugs.includes( slug )
					) {
						return true;
					}

					return false;
				}
			).length;
			selectedCounts[ metricGroup ] = selectedCount;
		}
		// @TODO Will be updated in #9385 for current selection.
		selectedCounts[ KEY_METRICS_CURRENT_SELECTION_GROUP_SLUG ] = 0;
	}

	const onChipChange = useCallback(
		( slug ) => {
			setIsActive( slug );
		},
		[ setIsActive ]
	);

	return (
		<div className="googlesitekit-chip-tab-group">
			<div className="googlesitekit-chip-tab-group__tab-items">
				{ [ currentSelectionGroup ].map( ( group ) => (
					<Chip
						key={ group.SLUG }
						slug={ group.SLUG }
						label={ group.LABEL }
						isActive={ group.SLUG === isActive }
						onClick={ onChipChange }
						selectedCount={ selectedCounts[ group.SLUG ] }
					/>
				) ) }
			</div>
			<div className="googlesitekit-chip-tab-group__tab-item">
				{ Object.keys( activeMetricItems ).map( ( slug ) => (
					<MetricItem
						key={ slug }
						slug={ slug }
						savedItemSlugs={ savedItemSlugs }
						{ ...activeMetricItems[ slug ] }
					/>
				) ) }
				{ ! Object.keys( activeMetricItems ).length && (
					<div className="googlesitekit-chip-tab-group__graphic">
						<NoSelectedItemsSVG height={ 250 } />
						<p>
							{ __(
								'No metrics were selected yet',
								'google-site-kit'
							) }
						</p>
					</div>
				) }
			</div>
		</div>
	);
}
