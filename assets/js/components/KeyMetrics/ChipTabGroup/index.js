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
import { useSelect } from 'googlesitekit-data';
import {
	KEY_METRICS_CURRENT_SELECTION_GROUP_SLUG,
	KEY_METRICS_GROUPS,
	KEY_METRICS_SELECTED,
	KEY_METRICS_SELECTION_FORM,
} from '../constants';
import { CORE_FORMS } from '../../../googlesitekit/datastore/forms/constants';
import Chip from './Chip';
import MetricItem from '../MetricsSelectionPanel/MetricItem';
import NoSelectedItemsSVG from '../../../../svg/graphics/key-metrics-no-selected-items.svg';
import { BREAKPOINT_SMALL, useBreakpoint } from '../../../hooks/useBreakpoint';

export default function ChipTabGroup( { allMetricItems, savedItemSlugs } ) {
	const [ isActive, setIsActive ] = useState(
		KEY_METRICS_CURRENT_SELECTION_GROUP_SLUG
	);
	const breakpoint = useBreakpoint();
	const isMobileBreakpoint = breakpoint === BREAKPOINT_SMALL;

	const selectedMetrics = useSelect( ( select ) =>
		select( CORE_FORMS ).getValue(
			KEY_METRICS_SELECTION_FORM,
			KEY_METRICS_SELECTED
		)
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
					// Check if metric slug is in selectedMetrics, so the group
					// count is reflected in real time as metrics are checked/unchecked.
					if (
						allMetricItems[ slug ].group === metricGroup &&
						selectedMetrics.includes( slug )
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

	const chipItemRows = [
		[ currentSelectionGroup, ...KEY_METRICS_GROUPS.slice( 0, 2 ) ],
		[ ...KEY_METRICS_GROUPS.slice( 2 ) ],
	];

	return (
		<div className="googlesitekit-chip-tab-group">
			<div className="googlesitekit-chip-tab-group__tab-items">
				{ ! isMobileBreakpoint &&
					chipItemRows.map( ( row ) => (
						<div
							// To avoid using indexes, key is extracted from the first grouo
							// of each row and joined to the string "row-".
							key={ `row-${ row[ 0 ].SLUG }` }
							className="googlesitekit-chip-tab-group__tab-items-row"
						>
							{ row.map( ( group ) => (
								<Chip
									key={ group.SLUG }
									slug={ group.SLUG }
									label={ group.LABEL }
									isActive={ group.SLUG === isActive }
									onClick={ onChipChange }
									selectedCount={
										selectedCounts[ group.SLUG ]
									}
								/>
							) ) }
						</div>
					) ) }
				{ isMobileBreakpoint &&
					[ currentSelectionGroup, ...KEY_METRICS_GROUPS ].map(
						( group ) => (
							<Chip
								key={ group.SLUG }
								slug={ group.SLUG }
								label={ group.LABEL }
								isActive={ group.SLUG === isActive }
								onClick={ onChipChange }
								selectedCount={ selectedCounts[ group.SLUG ] }
							/>
						)
					) }
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
