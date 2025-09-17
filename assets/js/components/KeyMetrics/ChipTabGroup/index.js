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
 * External dependencies.
 */

/**
 * WordPress dependencies.
 */
import {
	useCallback,
	useState,
	useEffect,
	useMemo,
	useRef,
} from '@wordpress/element';
import { usePrevious } from '@wordpress/compose';

/**
 * Internal dependencies.
 */
import { useSelect, useDispatch } from 'googlesitekit-data';
import {
	EFFECTIVE_SELECTION,
	KEY_METRICS_GROUP_CURRENT,
	KEY_METRICS_SELECTED,
	KEY_METRICS_SELECTION_FORM,
	KEY_METRICS_SELECTION_PANEL_OPENED_KEY,
	UNSTAGED_SELECTION,
} from '@/js/components/KeyMetrics/constants';
import { CORE_FORMS } from '@/js/googlesitekit/datastore/forms/constants';
import { MODULES_ANALYTICS_4 } from '@/js/modules/analytics-4/datastore/constants';
import { MODULE_SLUG_ANALYTICS_4 } from '@/js/modules/analytics-4/constants';
import { CORE_UI } from '@/js/googlesitekit/datastore/ui/constants';
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import { CORE_MODULES } from '@/js/googlesitekit/modules/datastore/constants';
import TabItems from './TabItems';
import TabContent from './TabContent';
import { BREAKPOINT_SMALL, useBreakpoint } from '@/js/hooks/useBreakpoint';

import useFormValue from '@/js/hooks/useFormValue';

import useCurrentlyActiveEvents from '@/js/components/KeyMetrics/hooks/useCurrentlyActiveEvents';
import useKeyMetricsGroups from '@/js/components/KeyMetrics/hooks/useKeyMetricsGroups';
import useFilteredKeyMetrics from '@/js/components/KeyMetrics/hooks/useFilteredKeyMetrics';
import useOverflowingTabs from '@/js/components/KeyMetrics/hooks/useOverflowingTabs';
import useNewBadgeEvents from '@/js/components/KeyMetrics/hooks/useNewBadgeEvents';

const emptyArray = Object.freeze( [] );

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

	const selectedMetrics = useFormValue(
		KEY_METRICS_SELECTION_FORM,
		KEY_METRICS_SELECTED
	);
	const effectiveSelection =
		useFormValue( KEY_METRICS_SELECTION_FORM, EFFECTIVE_SELECTION ) ||
		emptyArray;
	const unstagedSelection =
		useFormValue( KEY_METRICS_SELECTION_FORM, UNSTAGED_SELECTION ) ||
		emptyArray;

	const isUserInputCompleted = useSelect( ( select ) =>
		select( CORE_USER ).isUserInputCompleted()
	);

	const currentlyActiveEvents = useCurrentlyActiveEvents();

	const isGA4Connected = useSelect( ( select ) =>
		select( CORE_MODULES ).isModuleConnected( MODULE_SLUG_ANALYTICS_4 )
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

	const { keyMetricsGroups, dynamicGroups } = useKeyMetricsGroups( {
		detectedEvents,
		currentlyActiveEvents,
		isUserInputCompleted,
		answerBasedMetrics,
	} );

	const allGroups = useMemo(
		() => [ ...dynamicGroups, ...keyMetricsGroups ],
		[ dynamicGroups, keyMetricsGroups ]
	);

	const newBadgeEvents = useNewBadgeEvents();
	const conversionReportingEventWidgets = useSelect( ( select ) => {
		if ( ! isGA4Connected ) {
			return [];
		}

		return select(
			MODULES_ANALYTICS_4
		).getKeyMetricsConversionEventWidgets();
	} );

	const { selectedCounts, activeMetricItems, newlyDetectedMetrics } =
		useFilteredKeyMetrics( {
			allMetricItems,
			isActive,
			effectiveSelection,
			answerBasedMetrics,
			selectedMetrics,
			newBadgeEvents,
			conversionReportingEventWidgets,
		} );

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
	}, [
		isSelectionPanelOpen,
		isSelectionPanelOpenPrevious,
		unstagedSelection,
		allGroups,
		isMobileBreakpoint,
		newlyDetectedMetricsKeys,
		resetUnstagedSelection,
	] );

	useOverflowingTabs( {
		containerRef,
		isMobileBreakpoint,
		isSelectionPanelOpen,
		isSelectionPanelOpenPrevious,
	} );

	const chipItemRows = [
		[ ...dynamicGroups, ...keyMetricsGroups.slice( 0, 2 ) ],
		[ ...keyMetricsGroups.slice( 2 ) ],
	];

	return (
		<div className="googlesitekit-chip-tab-group">
			<TabItems
				containerRef={ containerRef }
				isMobileBreakpoint={ isMobileBreakpoint }
				chipItemRows={ chipItemRows }
				allGroups={ allGroups }
				isActive={ isActive }
				onChipChange={ onChipChange }
				selectedCounts={ selectedCounts }
				newlyDetectedMetrics={ newlyDetectedMetrics }
				activeGroupIndex={ activeGroupIndex }
			/>
			<TabContent
				activeMetricItems={ activeMetricItems }
				newlyDetectedMetrics={ newlyDetectedMetrics }
				savedItemSlugs={ savedItemSlugs }
			/>
		</div>
	);
}
