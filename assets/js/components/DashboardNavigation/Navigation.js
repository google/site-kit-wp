/**
 * Navigation component.
 *
 * Site Kit by Google, Copyright 2021 Google LLC
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
import classnames from 'classnames';
import { throttle } from 'lodash';
import { useMount } from 'react-use';
import { Chip } from '@material/react-chips';

/**
 * WordPress dependencies
 */
import { useState, useEffect, useCallback, useRef } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { useSelect, useDispatch } from 'googlesitekit-data';
import NavKeyMetricsIcon from '../../../svg/icons/nav-key-metrics-icon.svg';
import NavTrafficIcon from '../../../svg/icons/nav-traffic-icon.svg';
import NavContentIcon from '../../../svg/icons/nav-content-icon.svg';
import NavSpeedIcon from '../../../svg/icons/nav-speed-icon.svg';
import NavMonetizationIcon from '../../../svg/icons/nav-monetization-icon.svg';
import {
	ANCHOR_ID_CONTENT,
	ANCHOR_ID_MONETIZATION,
	ANCHOR_ID_SPEED,
	ANCHOR_ID_KEY_METRICS,
	ANCHOR_ID_TRAFFIC,
} from '../../googlesitekit/constants';
import { CORE_USER } from '../../googlesitekit/datastore/user/constants';
import { CORE_WIDGETS } from '../../googlesitekit/widgets/datastore/constants';
import {
	CORE_UI,
	ACTIVE_CONTEXT_ID,
} from '../../googlesitekit/datastore/ui/constants';
import {
	CONTEXT_ENTITY_DASHBOARD_TRAFFIC,
	CONTEXT_ENTITY_DASHBOARD_CONTENT,
	CONTEXT_ENTITY_DASHBOARD_SPEED,
	CONTEXT_ENTITY_DASHBOARD_MONETIZATION,
	CONTEXT_MAIN_DASHBOARD_KEY_METRICS,
	CONTEXT_MAIN_DASHBOARD_TRAFFIC,
	CONTEXT_MAIN_DASHBOARD_CONTENT,
	CONTEXT_MAIN_DASHBOARD_SPEED,
	CONTEXT_MAIN_DASHBOARD_MONETIZATION,
} from '../../googlesitekit/widgets/default-contexts';
import useDashboardType, {
	DASHBOARD_TYPE_MAIN,
} from '../../hooks/useDashboardType';
import { useBreakpoint } from '../../hooks/useBreakpoint';
import { getNavigationalScrollTop } from '../../util/scroll';
import { trackEvent } from '../../util';
import useViewContext from '../../hooks/useViewContext';
import useViewOnly from '../../hooks/useViewOnly';

export default function Navigation() {
	const dashboardType = useDashboardType();
	const elementRef = useRef();
	const breakpoint = useBreakpoint();

	const initialHash = global.location.hash?.substring( 1 );
	const [ selectedID, setSelectedID ] = useState( initialHash );
	const [ isJumpingTo, setIsJumpingTo ] = useState(
		initialHash || undefined
	);
	const [ isSticky, setIsSticky ] = useState( false );

	const viewContext = useViewContext();
	const viewOnlyDashboard = useViewOnly();

	const { setValue } = useDispatch( CORE_UI );

	const viewableModules = useSelect( ( select ) => {
		if ( ! viewOnlyDashboard ) {
			return null;
		}

		return select( CORE_USER ).getViewableModules();
	} );

	const isKeyMetricsWidgetHidden = useSelect( ( select ) =>
		select( CORE_USER ).isKeyMetricsWidgetHidden()
	);

	const widgetContextOptions = {
		modules: viewableModules ? viewableModules : undefined,
	};

	const showKeyMetrics = useSelect( ( select ) => {
		if (
			dashboardType !== DASHBOARD_TYPE_MAIN ||
			isKeyMetricsWidgetHidden === true
		) {
			return false;
		}

		return select( CORE_WIDGETS ).isWidgetContextActive(
			CONTEXT_MAIN_DASHBOARD_KEY_METRICS,
			widgetContextOptions
		);
	} );

	const showTraffic = useSelect( ( select ) =>
		select( CORE_WIDGETS ).isWidgetContextActive(
			dashboardType === DASHBOARD_TYPE_MAIN
				? CONTEXT_MAIN_DASHBOARD_TRAFFIC
				: CONTEXT_ENTITY_DASHBOARD_TRAFFIC,
			widgetContextOptions
		)
	);

	const showContent = useSelect( ( select ) =>
		select( CORE_WIDGETS ).isWidgetContextActive(
			dashboardType === DASHBOARD_TYPE_MAIN
				? CONTEXT_MAIN_DASHBOARD_CONTENT
				: CONTEXT_ENTITY_DASHBOARD_CONTENT,
			widgetContextOptions
		)
	);

	const showSpeed = useSelect( ( select ) =>
		select( CORE_WIDGETS ).isWidgetContextActive(
			dashboardType === DASHBOARD_TYPE_MAIN
				? CONTEXT_MAIN_DASHBOARD_SPEED
				: CONTEXT_ENTITY_DASHBOARD_SPEED,
			widgetContextOptions
		)
	);

	const showMonetization = useSelect( ( select ) =>
		select( CORE_WIDGETS ).isWidgetContextActive(
			dashboardType === DASHBOARD_TYPE_MAIN
				? CONTEXT_MAIN_DASHBOARD_MONETIZATION
				: CONTEXT_ENTITY_DASHBOARD_MONETIZATION,
			widgetContextOptions
		)
	);

	// Helper functions inside the component
	const getDefaultChipID = useCallback( () => {
		if ( showKeyMetrics ) {
			return ANCHOR_ID_KEY_METRICS;
		}

		if ( ! viewOnlyDashboard ) {
			return ANCHOR_ID_TRAFFIC;
		}

		if ( showTraffic ) {
			return ANCHOR_ID_TRAFFIC;
		}

		if ( showContent ) {
			return ANCHOR_ID_CONTENT;
		}

		if ( showSpeed ) {
			return ANCHOR_ID_SPEED;
		}

		if ( showMonetization ) {
			return ANCHOR_ID_MONETIZATION;
		}

		return '';
	}, [
		showKeyMetrics,
		showTraffic,
		showContent,
		showSpeed,
		showMonetization,
		viewOnlyDashboard,
	] );

	const isValidChipID = useCallback(
		( chipID ) => {
			if ( showKeyMetrics && chipID === ANCHOR_ID_KEY_METRICS ) {
				return true;
			}

			if ( showTraffic && chipID === ANCHOR_ID_TRAFFIC ) {
				return true;
			}

			if ( showContent && chipID === ANCHOR_ID_CONTENT ) {
				return true;
			}

			if ( showSpeed && chipID === ANCHOR_ID_SPEED ) {
				return true;
			}

			if ( showMonetization && chipID === ANCHOR_ID_MONETIZATION ) {
				return true;
			}

			return false;
		},
		[
			showKeyMetrics,
			showTraffic,
			showContent,
			showSpeed,
			showMonetization,
		]
	);

	const handleSelect = useCallback(
		( { target } ) => {
			const chip = target.closest( '.mdc-chip' );
			const chipID = chip?.dataset?.contextId; // eslint-disable-line sitekit/acronym-case

			global.history.replaceState( {}, '', `#${ chipID }` );

			setIsJumpingTo( chipID );
			trackEvent( `${ viewContext }_navigation`, 'tab_select', chipID );

			global.scrollTo( {
				top:
					chipID !== getDefaultChipID()
						? getNavigationalScrollTop( `#${ chipID }`, breakpoint )
						: 0,
				behavior: 'smooth',
			} );

			setTimeout( () => {
				setValue( ACTIVE_CONTEXT_ID, chipID );
			}, 50 );
		},
		[ viewContext, getDefaultChipID, breakpoint, setValue ]
	);

	const calculateClosestAreaID = useCallback(
		( areas, margin, entityHeader, navigationBottom ) => {
			let closest;
			let closestID = getDefaultChipID();

			for ( const areaID of areas ) {
				const area = document.getElementById( areaID );
				if ( ! area ) {
					continue;
				}

				const top =
					area.getBoundingClientRect().top -
					margin -
					( entityHeader || navigationBottom || 0 );

				if ( top < 0 && ( closest === undefined || closest < top ) ) {
					closest = top;
					closestID = areaID;
				}
			}

			return closestID;
		},
		[ getDefaultChipID ]
	);

	const handleStickyHeader = useCallback(
		( yScrollPosition, navigationTop ) => {
			if ( yScrollPosition === 0 ) {
				setIsSticky( false );
			} else {
				const headerBottom = document
					.querySelector( '.googlesitekit-header' )
					?.getBoundingClientRect().bottom;
				setIsSticky( navigationTop === headerBottom );
			}
		},
		[]
	);

	const changeSelectedChip = useCallback(
		( chipID ) => {
			setValue( ACTIVE_CONTEXT_ID, undefined );
			setSelectedID( chipID );
			setIsJumpingTo( undefined );
		},
		[ setValue ]
	);

	const handleHistoryAndTracking = useCallback(
		( closestID, event ) => {
			if ( isJumpingTo ) {
				if ( isJumpingTo === closestID ) {
					changeSelectedChip( closestID );
				}
			} else {
				const { hash } = global.location;
				if ( closestID !== hash?.substring( 1 ) ) {
					if ( event ) {
						trackEvent(
							`${ viewContext }_navigation`,
							'tab_scroll',
							closestID
						);
					}
					global.history.replaceState( {}, '', `#${ closestID }` );
					changeSelectedChip( closestID );
				}
			}
		},
		[ changeSelectedChip, isJumpingTo, viewContext ]
	);

	useMount( () => {
		const defaultChipID = getDefaultChipID();

		if ( ! initialHash ) {
			setSelectedID( defaultChipID );
			setTimeout( () =>
				global.history.replaceState( {}, '', `#${ defaultChipID }` )
			);
			return;
		}

		let chipID = initialHash;

		if ( ! isValidChipID( chipID ) ) {
			chipID = defaultChipID;
		}

		setValue( ACTIVE_CONTEXT_ID, chipID );
		setSelectedID( chipID );

		setTimeout( () => {
			const scrollTo =
				chipID !== defaultChipID
					? getNavigationalScrollTop( `#${ chipID }`, breakpoint )
					: 0;

			if ( global.scrollY === scrollTo ) {
				setValue( ACTIVE_CONTEXT_ID, undefined );
				return;
			}

			global.scrollTo( {
				top: scrollTo,
				behavior: 'smooth',
			} );
		}, 50 );
	} );

	useEffect( () => {
		const onScroll = ( event ) => {
			const yScrollPosition = global.scrollY;
			const entityHeader = document
				.querySelector( '.googlesitekit-entity-header' )
				?.getBoundingClientRect()?.bottom;
			const { bottom: navigationBottom, top: navigationTop } =
				elementRef?.current?.getBoundingClientRect();
			const margin = 20;

			const areas = [
				...( showKeyMetrics ? [ ANCHOR_ID_KEY_METRICS ] : [] ),
				...( showTraffic ? [ ANCHOR_ID_TRAFFIC ] : [] ),
				...( showContent ? [ ANCHOR_ID_CONTENT ] : [] ),
				...( showSpeed ? [ ANCHOR_ID_SPEED ] : [] ),
				...( showMonetization ? [ ANCHOR_ID_MONETIZATION ] : [] ),
			];

			const closestID = calculateClosestAreaID(
				areas,
				margin,
				entityHeader,
				navigationBottom
			);
			handleStickyHeader( yScrollPosition, navigationTop );
			handleHistoryAndTracking( closestID, event );
		};

		const throttledOnScroll = throttle( onScroll, 150 );
		global.addEventListener( 'scroll', throttledOnScroll );

		return () => {
			global.removeEventListener( 'scroll', throttledOnScroll );
		};
	}, [
		showKeyMetrics,
		showTraffic,
		showContent,
		showSpeed,
		showMonetization,
		calculateClosestAreaID,
		handleStickyHeader,
		handleHistoryAndTracking,
	] );

	return (
		<nav
			className={ classnames(
				'mdc-chip-set',
				'googlesitekit-navigation',
				`googlesitekit-navigation--${ dashboardType }`,
				{
					'googlesitekit-navigation--is-sticky': isSticky,
				}
			) }
			ref={ elementRef }
		>
			{ showKeyMetrics && (
				<Chip
					id={ ANCHOR_ID_KEY_METRICS }
					label={ __( 'Key metrics', 'google-site-kit' ) }
					leadingIcon={ <NavKeyMetricsIcon width="18" height="16" /> }
					onClick={ handleSelect }
					selected={ selectedID === ANCHOR_ID_KEY_METRICS }
					data-context-id={ ANCHOR_ID_KEY_METRICS }
				/>
			) }
			{ showTraffic && (
				<Chip
					id={ ANCHOR_ID_TRAFFIC }
					label={ __( 'Traffic', 'google-site-kit' ) }
					leadingIcon={ <NavTrafficIcon width="18" height="16" /> }
					onClick={ handleSelect }
					selected={ selectedID === ANCHOR_ID_TRAFFIC }
					data-context-id={ ANCHOR_ID_TRAFFIC }
				/>
			) }
			{ showContent && (
				<Chip
					id={ ANCHOR_ID_CONTENT }
					label={ __( 'Content', 'google-site-kit' ) }
					leadingIcon={ <NavContentIcon width="18" height="18" /> }
					onClick={ handleSelect }
					selected={ selectedID === ANCHOR_ID_CONTENT }
					data-context-id={ ANCHOR_ID_CONTENT }
				/>
			) }
			{ showSpeed && (
				<Chip
					id={ ANCHOR_ID_SPEED }
					label={ __( 'Speed', 'google-site-kit' ) }
					leadingIcon={ <NavSpeedIcon width="20" height="16" /> }
					onClick={ handleSelect }
					selected={ selectedID === ANCHOR_ID_SPEED }
					data-context-id={ ANCHOR_ID_SPEED }
				/>
			) }
			{ showMonetization && (
				<Chip
					id={ ANCHOR_ID_MONETIZATION }
					label={ __( 'Monetization', 'google-site-kit' ) }
					leadingIcon={
						<NavMonetizationIcon width="18" height="16" />
					}
					onClick={ handleSelect }
					selected={ selectedID === ANCHOR_ID_MONETIZATION }
					data-context-id={ ANCHOR_ID_MONETIZATION }
				/>
			) }
		</nav>
	);
}
