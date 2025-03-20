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
 * External dependencies
 */
import { useMount, useUnmount } from 'react-use';

/**
 * WordPress dependencies
 */
import {
	useCallback,
	useState,
	useEffect,
	useMemo,
	useRef,
} from '@wordpress/element';
import { usePrevious } from '@wordpress/compose';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { useSelect, useDispatch } from 'googlesitekit-data';
import { Tab, TabBar } from 'googlesitekit-components';
import {
	EFFECTIVE_SELECTION,
	KEY_METRICS_GROUP_CURRENT,
	KEY_METRICS_GROUP_SUGGESTED,
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
import {
	ENUM_CONVERSION_EVENTS,
	CONVERSION_REPORTING_LEAD_EVENTS,
	MODULES_ANALYTICS_4,
} from '../../../modules/analytics-4/datastore/constants';
import { CORE_UI } from '../../../googlesitekit/datastore/ui/constants';
import { CORE_USER } from '../../../googlesitekit/datastore/user/constants';
import { CORE_MODULES } from '../../../googlesitekit/modules/datastore/constants';
import Chip from './Chip';
import MetricItem from '../MetricsSelectionPanel/MetricItem';
import NoSelectedItemsSVG from '../../../../svg/graphics/key-metrics-no-selected-items.svg';
import { BREAKPOINT_SMALL, useBreakpoint } from '../../../hooks/useBreakpoint';
import { useDebounce } from '../../../hooks/useDebounce';
import CheckMark from '../../../../svg/icons/check-2.svg';
import StarFill from '../../../../svg/icons/star-fill.svg';
import Null from '../../../components/Null';

const icons = {
	[ KEY_METRICS_GROUP_CURRENT.SLUG ]: CheckMark,
	[ KEY_METRICS_GROUP_SUGGESTED.SLUG ]: StarFill,
};

export default function ChipTabGroup( { allMetricItems, savedItemSlugs } ) {
	const containerRef = useRef();
	const [ isActive, setIsActive ] = useState(
		KEY_METRICS_GROUP_CURRENT.SLUG
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

	const currentlyActiveEvents = useSelect( ( select ) => {
		const userPickedMetrics = select( CORE_USER ).getUserPickedMetrics();

		if ( userPickedMetrics?.length ) {
			// It is safe to access the selector without checking if GA4 is connected,
			// since this selector does not make request to the module endpoint.
			const keyMetricsConversionEventWidgets =
				select(
					MODULES_ANALYTICS_4
				).getKeyMetricsConversionEventWidgets();

			return Object.keys( keyMetricsConversionEventWidgets ).filter(
				( event ) =>
					userPickedMetrics.some( ( metric ) =>
						keyMetricsConversionEventWidgets[ event ].includes(
							metric
						)
					)
			);
		}

		const userInputSettings = select( CORE_USER ).getUserInputSettings();
		return userInputSettings?.includeConversionEvents?.values;
	} );

	const isGA4Connected = useSelect( ( select ) =>
		select( CORE_MODULES ).isModuleConnected( 'analytics-4' )
	);
	const detectedEvents = useSelect( ( select ) => {
		if ( ! isGA4Connected ) {
			return [];
		}

		return select( MODULES_ANALYTICS_4 ).getDetectedEvents();
	} );

	const answerBasedMetrics = useSelect( ( select ) =>
		select( CORE_USER ).getAnswerBasedMetrics( null, [
			...( currentlyActiveEvents || [] ),
			...( detectedEvents || [] ),
		] )
	);

	const hasGeneratingLeadsGroup = [
		ENUM_CONVERSION_EVENTS.SUBMIT_LEAD_FORM,
		ENUM_CONVERSION_EVENTS.CONTACT,
		ENUM_CONVERSION_EVENTS.GENERATE_LEAD,
	].filter(
		( item ) =>
			detectedEvents?.includes( item ) ||
			currentlyActiveEvents?.includes( item )
	);
	const hasSellingProductsGroup = [
		ENUM_CONVERSION_EVENTS.ADD_TO_CART,
		ENUM_CONVERSION_EVENTS.PURCHASE,
	].filter(
		( item ) =>
			detectedEvents?.includes( item ) ||
			currentlyActiveEvents?.includes( item )
	);

	const keyMetricsGroups = useMemo( () => {
		return [
			KEY_METRICS_GROUP_VISITORS,
			KEY_METRICS_GROUP_DRIVING_TRAFFIC,
			...( hasGeneratingLeadsGroup?.length
				? [ KEY_METRICS_GROUP_GENERATING_LEADS ]
				: [] ),
			...( hasSellingProductsGroup?.length
				? [ KEY_METRICS_GROUP_SELLING_PRODUCTS ]
				: [] ),
			KEY_METRICS_GROUP_CONTENT_PERFORMANCE,
		];
	}, [ hasGeneratingLeadsGroup, hasSellingProductsGroup ] );

	const dynamicGroups = useMemo( () => {
		if ( isUserInputCompleted && answerBasedMetrics?.length ) {
			return [ KEY_METRICS_GROUP_CURRENT, KEY_METRICS_GROUP_SUGGESTED ];
		}

		return [ KEY_METRICS_GROUP_CURRENT ];
	}, [ isUserInputCompleted, answerBasedMetrics ] );

	const allGroups = useMemo(
		() => [ ...dynamicGroups, ...keyMetricsGroups ],
		[ dynamicGroups, keyMetricsGroups ]
	);

	const newBadgeEvents = useSelect( ( select ) => {
		if ( ! isGA4Connected ) {
			return [];
		}

		const badgeEvents = select( MODULES_ANALYTICS_4 ).getNewBadgeEvents();

		if ( detectedEvents?.length && badgeEvents?.length ) {
			const detectedLeadEvents = detectedEvents.filter( ( event ) =>
				CONVERSION_REPORTING_LEAD_EVENTS.includes( event )
			);
			const newLeadEvents = badgeEvents.filter( ( event ) =>
				CONVERSION_REPORTING_LEAD_EVENTS.includes( event )
			);
			const newNonLeadEvents = badgeEvents.filter(
				( event ) =>
					! CONVERSION_REPORTING_LEAD_EVENTS.includes( event )
			);

			if ( detectedLeadEvents?.length > 1 && newLeadEvents.length > 0 ) {
				return newNonLeadEvents;
			}
		}

		return badgeEvents;
	} );
	const conversionReportingEventWidgets = useSelect( ( select ) => {
		if ( ! isGA4Connected ) {
			return [];
		}

		return select(
			MODULES_ANALYTICS_4
		).getKeyMetricsConversionEventWidgets();
	} );

	// It is not always clear that tabs are scrollable on mobile, so we need to ensure that the last tab item
	// is cutoff to indicate that there are more tabs to scroll to.
	const maybeCutOffLastTabItem = useCallback( () => {
		const scrollContainer = containerRef.current?.querySelector(
			'.mdc-tab-scroller__scroll-content'
		);

		if ( ! isMobileBreakpoint ) {
			return;
		}

		const tabItems = containerRef.current?.querySelectorAll(
			'.googlesitekit-chip-tab-group__tab-items .mdc-tab'
		);

		if ( ! tabItems?.length || ! scrollContainer ) {
			return;
		}

		const containerRect = containerRef.current?.getBoundingClientRect();

		const visibleItems = [];
		tabItems.forEach( ( tabItem, index ) => {
			const tabItemRect = tabItem.getBoundingClientRect();
			if (
				tabItemRect.left >= containerRect.left &&
				tabItemRect.right <= containerRect.right
			) {
				visibleItems.push( index );
			}
		} );
		const nextTabItem = tabItems[ visibleItems.length ];

		if ( ! nextTabItem ) {
			return;
		}

		const nextTabItemRect = nextTabItem.getBoundingClientRect();

		// If the next tab item is either completely off-screen or only barely
		// visible (i.e. cut off by 15px or less, meaning most likely it is still
		// outside the visible area), reduce the column gap so that the last tab
		// item appears properly truncated.
		if (
			nextTabItemRect.left >= containerRect.right ||
			( nextTabItemRect.left - containerRect.right < 0 &&
				-( nextTabItemRect.left - containerRect.right ) <= 20 )
		) {
			// If there is an inline gap of 2px we already adjusted it once, and
			// the last item is still not cut off, we need to adjust the column
			// gap to 20px to ensure the last item is cut off.
			if ( scrollContainer.style.columnGap === '2px' ) {
				scrollContainer.style.columnGap = '20px';
			} else {
				scrollContainer.style.columnGap = '2px';
			}

			maybeCutOffLastTabItem();
		}
	}, [ isMobileBreakpoint ] );

	// Currently selected group does not include total selected number, so it will
	// always be 0.
	const selectedCounts = { [ KEY_METRICS_GROUP_CURRENT.SLUG ]: 0 };
	const activeMetricItems = {};
	const newlyDetectedMetrics = {};

	for ( const metricItemSlug in allMetricItems ) {
		const metricGroup = allMetricItems[ metricItemSlug ].group;
		if (
			metricGroup === isActive ||
			( isActive === KEY_METRICS_GROUP_CURRENT.SLUG &&
				effectiveSelection.includes( metricItemSlug ) )
		) {
			activeMetricItems[ metricItemSlug ] =
				allMetricItems[ metricItemSlug ];
		}

		if (
			isActive === KEY_METRICS_GROUP_SUGGESTED.SLUG &&
			answerBasedMetrics.includes( metricItemSlug )
		) {
			if ( answerBasedMetrics.includes( metricItemSlug ) ) {
				activeMetricItems[ metricItemSlug ] =
					allMetricItems[ metricItemSlug ];
			}
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

		// Check if metric is conversion event related and if new badge should be included.
		if ( newBadgeEvents?.length ) {
			const isNewlyDetectedKeyMetrics = newBadgeEvents.some(
				( conversionEvent ) =>
					conversionReportingEventWidgets[ conversionEvent ].includes(
						metricItemSlug
					)
			);

			if ( isNewlyDetectedKeyMetrics ) {
				newlyDetectedMetrics[ metricGroup ] = [
					...( newlyDetectedMetrics[ metricGroup ] ?? [] ),
					metricItemSlug,
				];
			}
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
	const newlyDetectedMetricsKeys = Object.keys( newlyDetectedMetrics );

	useEffect( () => {
		// Ensure that current selection group is always active when selection panel re-opens.
		if ( ! isSelectionPanelOpenPrevious && isSelectionPanelOpen ) {
			setIsActive( KEY_METRICS_GROUP_CURRENT.SLUG );
			setActiveGroupIndex( 0 );
			if ( newlyDetectedMetricsKeys.length && isMobileBreakpoint ) {
				const firstNewlyDetectedGroup = allGroups.find(
					( group ) => group.SLUG === newlyDetectedMetricsKeys[ 0 ]
				);

				setActiveGroupIndex(
					allGroups.indexOf( firstNewlyDetectedGroup )
				);
				setIsActive( firstNewlyDetectedGroup.SLUG );
			} else {
				setActiveGroupIndex( 0 );
				setIsActive( KEY_METRICS_GROUP_CURRENT.SLUG );
			}
		}

		if ( isSelectionPanelOpenPrevious && ! isSelectionPanelOpen ) {
			// Reset the unstaged selection when selection panel is closed.
			resetUnstagedSelection();
		}

		if ( ! isSelectionPanelOpenPrevious && isSelectionPanelOpen ) {
			maybeCutOffLastTabItem();
		}
	}, [
		isSelectionPanelOpen,
		isSelectionPanelOpenPrevious,
		unstagedSelection,
		allGroups,
		isMobileBreakpoint,
		newlyDetectedMetricsKeys,
		resetUnstagedSelection,
		maybeCutOffLastTabItem,
	] );

	// Debounce the maybeCutOffLastTabItem function
	const debouncedMaybeCutOffLastTabItem = useDebounce(
		maybeCutOffLastTabItem,
		50
	);

	useMount( () => {
		global.addEventListener( 'resize', debouncedMaybeCutOffLastTabItem );
	} );

	useUnmount( () =>
		global.removeEventListener( 'resize', debouncedMaybeCutOffLastTabItem )
	);

	const chipItemRows = [
		[ ...dynamicGroups, ...keyMetricsGroups.slice( 0, 2 ) ],
		[ ...keyMetricsGroups.slice( 2 ) ],
	];

	return (
		<div className="googlesitekit-chip-tab-group">
			<div
				className="googlesitekit-chip-tab-group__tab-items"
				ref={ containerRef }
			>
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
									hasNewBadge={
										!! newlyDetectedMetrics?.[ group.SLUG ]
									}
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
						{ allGroups.map( ( group, index ) => {
							const Icon = icons[ group.SLUG ] || Null;
							return (
								<Tab key={ index } aria-label={ group.LABEL }>
									<Icon
										width={ 12 }
										height={ 12 }
										className={ `googlesitekit-chip-tab-group__chip-item-svg googlesitekit-chip-tab-group__tab-item-mobile-svg googlesitekit-chip-tab-group__chip-item-svg__${ group.SLUG }` }
									/>
									{ group.LABEL }
									{ selectedCounts[ group.SLUG ] > 0 && (
										<span className="googlesitekit-chip-tab-group__chip-item-count">
											({ selectedCounts[ group.SLUG ] })
										</span>
									) }
									{ !! newlyDetectedMetrics?.[
										group.SLUG
									] && (
										<span className="googlesitekit-chip-tab-group__chip-item-new-dot" />
									) }
								</Tab>
							);
						} ) }
					</TabBar>
				) }
			</div>
			<div className="googlesitekit-chip-tab-group__tab-item">
				{ Object.keys( activeMetricItems ).map( ( slug ) => {
					const metricGroup = activeMetricItems[ slug ].group;
					const isNewlyDetected =
						newlyDetectedMetrics?.[ metricGroup ]?.includes( slug );

					return (
						<MetricItem
							key={ slug }
							slug={ slug }
							savedItemSlugs={ savedItemSlugs }
							isNewlyDetected={ isNewlyDetected }
							{ ...activeMetricItems[ slug ] }
						/>
					);
				} ) }
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
