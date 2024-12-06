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
import { useCallback, useState, useEffect, useMemo } from '@wordpress/element';
import { usePrevious } from '@wordpress/compose';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { useSelect, useDispatch } from 'googlesitekit-data';
import { Tab, TabBar } from 'googlesitekit-components';
import {
	EFFECTIVE_SELECTION,
	KEY_METRICS_CURRENT_SELECTION_GROUP_SLUG,
	KEY_METRICS_SUGGESTED_GROUP_SLUG,
	KEY_METRICS_GROUP_CONTENT_PERFORMANCE,
	KEY_METRICS_GROUP_DRIVING_TRAFFIC,
	KEY_METRICS_GROUP_GENERATING_LEADS,
	KEY_METRICS_GROUP_SELLING_PRODUCTS,
	KEY_METRICS_GROUP_VISITORS,
	KEY_METRICS_SELECTED,
	KEY_METRICS_SELECTION_FORM,
	KEY_METRICS_SELECTION_PANEL_OPENED_KEY,
	UNSTAGED_SELECTION,
} from '../constants';
import { CORE_FORMS } from '../../../googlesitekit/datastore/forms/constants';
import Chip from './Chip';
import MetricItem from '../MetricsSelectionPanel/MetricItem';
import NoSelectedItemsSVG from '../../../../svg/graphics/key-metrics-no-selected-items.svg';
import { BREAKPOINT_SMALL, useBreakpoint } from '../../../hooks/useBreakpoint';
import CheckMark from '../../../../svg/icons/check-2.svg';
import { MODULES_ANALYTICS_4 } from '../../../modules/analytics-4/datastore/constants';
import { CORE_UI } from '../../../googlesitekit/datastore/ui/constants';
import { CORE_USER } from '../../../googlesitekit/datastore/user/constants';

const currentSelectionGroup = {
	SLUG: KEY_METRICS_CURRENT_SELECTION_GROUP_SLUG,
	LABEL: __( 'Current selection', 'google-site-kit' ),
};

const suggestedGroup = {
	SLUG: KEY_METRICS_SUGGESTED_GROUP_SLUG,
	LABEL: __( 'Suggested', 'google-site-kit' ),
};

export default function ChipTabGroup( { allMetricItems, savedItemSlugs } ) {
	const [ isActive, setIsActive ] = useState(
		KEY_METRICS_CURRENT_SELECTION_GROUP_SLUG
	);
	// Used for mobile chip tabs, which leverages the TabBar component for seemless horizontal scroll
	// but it accepts a numerical index for the active tab.
	const [ activeGroupIndex, setActiveGroupIndex ] = useState( 0 );

	const breakpoint = useBreakpoint();
	const isMobileBreakpoint = breakpoint === BREAKPOINT_SMALL;

	const selectedMetrics = useSelect( ( select ) =>
		select( CORE_FORMS ).getValue(
			KEY_METRICS_SELECTION_FORM,
			KEY_METRICS_SELECTED
		)
	);
	const effectiveSelection = useSelect(
		( select ) =>
			select( CORE_FORMS ).getValue(
				KEY_METRICS_SELECTION_FORM,
				EFFECTIVE_SELECTION
			) || []
	);

	const unstagedSelection = useSelect(
		( select ) =>
			select( CORE_FORMS ).getValue(
				KEY_METRICS_SELECTION_FORM,
				UNSTAGED_SELECTION
			) || []
	);
	const isUserInputCompleted = useSelect( ( select ) =>
		select( CORE_USER ).isUserInputCompleted()
	);
	const answerBasedMetrics = useSelect( ( select ) =>
		select( CORE_USER ).getAnswerBasedMetrics()
	);
	const detectedEvents = useSelect( ( select ) =>
		select( MODULES_ANALYTICS_4 ).getDetectedEvents()
	);
	const hasGeneratingLeadsGroup = [
		'submit_lead_form',
		'contact',
		'generate_lead',
	].filter( ( item ) => detectedEvents?.includes( item ) );
	const hasSellingProductsGroup = [ 'add_to_cart', 'purchase' ].filter(
		( item ) => detectedEvents?.includes( item )
	);

	const keyMetricsGroups = useMemo(
		() => [
			KEY_METRICS_GROUP_VISITORS,
			KEY_METRICS_GROUP_DRIVING_TRAFFIC,
			...( hasGeneratingLeadsGroup?.length
				? [ KEY_METRICS_GROUP_GENERATING_LEADS ]
				: [] ),
			...( hasSellingProductsGroup?.length
				? [ KEY_METRICS_GROUP_SELLING_PRODUCTS ]
				: [] ),
			KEY_METRICS_GROUP_CONTENT_PERFORMANCE,
		],
		[ hasGeneratingLeadsGroup, hasSellingProductsGroup ]
	);

	const dynamicGroups = useMemo( () => {
		if ( isUserInputCompleted ) {
			return [ currentSelectionGroup, suggestedGroup ];
		}
		return [ currentSelectionGroup ];
	}, [ isUserInputCompleted ] );

	const allGroups = useMemo(
		() => [ ...dynamicGroups, ...keyMetricsGroups ],
		[ dynamicGroups, keyMetricsGroups ]
	);

	// Currently selected group does not include total selected number, so it will
	// always be 0.
	const selectedCounts = { [ KEY_METRICS_CURRENT_SELECTION_GROUP_SLUG ]: 0 };
	const activeMetricItems = {};

	if ( isActive === suggestedGroup.SLUG ) {
		Object.keys( allMetricItems ).forEach( ( slug ) => {
			if ( answerBasedMetrics.includes( slug ) ) {
				activeMetricItems[ slug ] = allMetricItems[ slug ];
			}
		} );
	}

	for ( const metricItemSlug in allMetricItems ) {
		const metricGroup = allMetricItems[ metricItemSlug ].group;
		if (
			metricGroup === isActive ||
			( isActive === currentSelectionGroup.SLUG &&
				effectiveSelection.includes( metricItemSlug ) )
		) {
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
						selectedMetrics?.includes( slug )
					) {
						return true;
					}

					return false;
				}
			).length;
			selectedCounts[ metricGroup ] = selectedCount;
		}
	}

	const { setValues } = useDispatch( CORE_FORMS );

	const resetUnstagedSelection = useCallback( () => {
		setValues( KEY_METRICS_SELECTION_FORM, {
			[ KEY_METRICS_SELECTED ]: selectedMetrics,
			[ EFFECTIVE_SELECTION ]: [
				...effectiveSelection,
				...unstagedSelection,
			],
			[ UNSTAGED_SELECTION ]: [],
		} );
	}, [ selectedMetrics, effectiveSelection, unstagedSelection, setValues ] );

	const onChipChange = useCallback(
		( slug, index ) => {
			if ( ! slug ) {
				// Set active group for mobile tabs.
				const activeGroup = allGroups[ index ];
				setActiveGroupIndex( index );
				setIsActive( activeGroup.SLUG );
			} else {
				setIsActive( slug );
			}

			if ( unstagedSelection.length ) {
				resetUnstagedSelection();
			}
		},
		[ allGroups, unstagedSelection, setIsActive, resetUnstagedSelection ]
	);

	const isSelectionPanelOpen = useSelect( ( select ) =>
		select( CORE_UI ).getValue( KEY_METRICS_SELECTION_PANEL_OPENED_KEY )
	);
	const isSelectionPanelOpenPrevious = usePrevious( isSelectionPanelOpen );

	useEffect( () => {
		// Ensure that current selection group is always active when selection panel re-opens.
		if ( ! isSelectionPanelOpenPrevious && isSelectionPanelOpen ) {
			setIsActive( KEY_METRICS_CURRENT_SELECTION_GROUP_SLUG );
			setActiveGroupIndex( 0 );
		}

		if ( isSelectionPanelOpenPrevious && ! isSelectionPanelOpen ) {
			// Reset the unstaged selection when selection panel is closed.
			resetUnstagedSelection();
		}
	}, [
		isSelectionPanelOpen,
		isSelectionPanelOpenPrevious,
		unstagedSelection,
		resetUnstagedSelection,
	] );

	const chipItemRows = [
		[ ...dynamicGroups, ...keyMetricsGroups.slice( 0, 2 ) ],
		[ ...keyMetricsGroups.slice( 2 ) ],
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
				{ isMobileBreakpoint && (
					<TabBar
						activeIndex={ activeGroupIndex }
						handleActiveIndexUpdate={ ( index ) =>
							onChipChange( null, index )
						}
					>
						{ allGroups.map( ( group, index ) => (
							<Tab key={ index } aria-label={ group.LABEL }>
								{ index === 0 && (
									<span className="googlesitekit-chip-tab-group__tab-item-mobile-svg">
										<CheckMark width={ 12 } height={ 12 } />
									</span>
								) }
								{ group.LABEL }
								{ selectedCounts[ group.SLUG ] > 0 && (
									<span className="googlesitekit-chip-tab-group__chip-item-count">
										({ selectedCounts[ group.SLUG ] })
									</span>
								) }
							</Tab>
						) ) }
					</TabBar>
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
