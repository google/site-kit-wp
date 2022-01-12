/**
 * DashboardNavigation component.
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
import { Chip } from '@material/react-chips';
import { useMount } from 'react-use';
import throttle from 'lodash/throttle';

/**
 * WordPress dependencies
 */
import { useCallback, useState, useEffect, useRef } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { removeQueryArgs } from '@wordpress/url';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import {
	ANCHOR_ID_CONTENT,
	ANCHOR_ID_MONETIZATION,
	ANCHOR_ID_SPEED,
	ANCHOR_ID_TRAFFIC,
} from '../googlesitekit/constants';
import { CORE_WIDGETS } from '../googlesitekit/widgets/datastore/constants';
import {
	CONTEXT_ENTITY_DASHBOARD_TRAFFIC,
	CONTEXT_ENTITY_DASHBOARD_CONTENT,
	CONTEXT_ENTITY_DASHBOARD_SPEED,
	CONTEXT_ENTITY_DASHBOARD_MONETIZATION,
	CONTEXT_MAIN_DASHBOARD_TRAFFIC,
	CONTEXT_MAIN_DASHBOARD_CONTENT,
	CONTEXT_MAIN_DASHBOARD_SPEED,
	CONTEXT_MAIN_DASHBOARD_MONETIZATION,
} from '../googlesitekit/widgets/default-contexts';
import useDashboardType, {
	DASHBOARD_TYPE_MAIN,
} from '../hooks/useDashboardType';
import { useBreakpoint } from '../hooks/useBreakpoint';
import NavTrafficIcon from '../../svg/icons/nav-traffic-icon.svg';
import NavContentIcon from '../../svg/icons/nav-content-icon.svg';
import NavSpeedIcon from '../../svg/icons/nav-speed-icon.svg';
import NavMonetizationIcon from '../../svg/icons/nav-monetization-icon.svg';
import { getContextScrollTop } from '../util/scroll';

const { useSelect } = Data;

export default function DashboardNavigation() {
	const dashboardType = useDashboardType();

	const showTraffic = useSelect( ( select ) =>
		select( CORE_WIDGETS ).isWidgetContextActive(
			dashboardType === DASHBOARD_TYPE_MAIN
				? CONTEXT_MAIN_DASHBOARD_TRAFFIC
				: CONTEXT_ENTITY_DASHBOARD_TRAFFIC
		)
	);

	const showContent = useSelect( ( select ) =>
		select( CORE_WIDGETS ).isWidgetContextActive(
			dashboardType === DASHBOARD_TYPE_MAIN
				? CONTEXT_MAIN_DASHBOARD_CONTENT
				: CONTEXT_ENTITY_DASHBOARD_CONTENT
		)
	);

	const showSpeed = useSelect( ( select ) =>
		select( CORE_WIDGETS ).isWidgetContextActive(
			dashboardType === DASHBOARD_TYPE_MAIN
				? CONTEXT_MAIN_DASHBOARD_SPEED
				: CONTEXT_ENTITY_DASHBOARD_SPEED
		)
	);

	const showMonetization = useSelect( ( select ) =>
		select( CORE_WIDGETS ).isWidgetContextActive(
			dashboardType === DASHBOARD_TYPE_MAIN
				? CONTEXT_MAIN_DASHBOARD_MONETIZATION
				: CONTEXT_ENTITY_DASHBOARD_MONETIZATION
		)
	);

	const breakpoint = useBreakpoint();

	const [ selectedID, setSelectedID ] = useState(
		global.location.hash.substr( 1 )
	);

	/**
	 * A race condition occurs between the onScroll
	 * throttle function and the handleSeclect callback.
	 * This ref value will be set as false in the handleSelect callback.
	 * Hence, setting the selectedID and updating the URL hash
	 * won't be exceuted always except the screen is scrolled
	 * to the appropriate section. This prevents the race condition issue.
	 */
	const shouldScroll = useRef( true );

	const handleSelect = useCallback(
		( chipID ) => {
			const hash = chipID;
			if ( hash ) {
				shouldScroll.current = false;

				/**
				 * This sets the #traffic anchor when clicking the `Traffic`
				 * chip for the first time when there is no hash in the URL.
				 * Setting the anchors afterwards will occur in the onScroll function.
				 */
				const context = getContextScrollTop( `#${ hash }`, breakpoint );
				if ( context < 5 ) {
					global.history.replaceState( {}, '', `#${ hash }` );
					setSelectedID( hash );
				}

				global.scrollTo( {
					top:
						hash !== ANCHOR_ID_TRAFFIC
							? getContextScrollTop( `#${ hash }`, breakpoint )
							: 0,
					behavior: 'smooth',
				} );
			} else {
				global.history.replaceState(
					{},
					'',
					removeQueryArgs( global.location.href )
				);
				setSelectedID( hash );
			}
		},
		[ breakpoint ]
	);

	useMount( () => {
		if ( global.location.hash !== '' ) {
			const hash = global.location.hash.substr( 1 );
			shouldScroll.current = false;
			setTimeout( () => {
				global.scrollTo( {
					top:
						hash !== ANCHOR_ID_TRAFFIC
							? getContextScrollTop( `#${ hash }`, breakpoint )
							: 0,
					behavior: 'smooth',
				} );
			}, 10 );
		}
	} );

	useEffect( () => {
		const onScroll = throttle( () => {
			let closest;
			let closestID = ANCHOR_ID_TRAFFIC;

			for ( const areaID of [
				ANCHOR_ID_TRAFFIC,
				ANCHOR_ID_CONTENT,
				ANCHOR_ID_SPEED,
				ANCHOR_ID_MONETIZATION,
			] ) {
				const top = document
					.getElementById( areaID )
					.getBoundingClientRect().top;

				/**
				 * Gets the sticky elements - admin bar, header and navigation height into account.
				 * And subtracts them with the top. When the user scrolls the page,
				 * an appropriate chip becomes selected and the URL hash changes to the new anchor.
				 */
				const header = document.querySelector(
					'.googlesitekit-header'
				);

				const hasStickyAdminBar = breakpoint !== 'small';

				const headerHeight = hasStickyAdminBar
					? header.getBoundingClientRect().bottom
					: header.offsetHeight;

				const navigation = document.querySelector(
					'.googlesitekit-navigation'
				);
				const navigationHeight = navigation.offsetHeight;

				const marginBottom = 20;
				const topExcludingStickyElements =
					top - headerHeight - navigationHeight - marginBottom;

				if (
					topExcludingStickyElements < 0 &&
					( closest === undefined ||
						closest < topExcludingStickyElements )
				) {
					closest = topExcludingStickyElements;
					closestID = areaID;
				}
			}

			const scrollOffset =
				global.scrollY || document.documentElement.scrollTop;
			const selectedElement = closest + scrollOffset;

			/**
			 * Calculates whether the screen is scrolled to the appropriate section.
			 * And then sets the shouldScroll ref value to true.
			 * This ensures setting the selectedID and updating the hash in the URL.
			 */
			if ( scrollOffset - selectedElement < 25 ) {
				shouldScroll.current = true;
			}

			/**
			 * This will be executed when the `scroll` event is triggerred
			 * as well as the handleSelect callback is fired.
			 */
			if ( shouldScroll.current ) {
				global.history.replaceState( {}, '', `#${ closestID }` );
				setSelectedID( closestID );
			}
		}, 50 );

		global.addEventListener( 'scroll', onScroll );

		return () => {
			global.removeEventListener( 'scroll', onScroll );
		};
	}, [ breakpoint ] );

	return (
		<div className="googlesitekit-navigation mdc-chip-set">
			{ showTraffic && (
				<Chip
					id={ ANCHOR_ID_TRAFFIC }
					label={ __( 'Traffic', 'google-site-kit' ) }
					leadingIcon={ <NavTrafficIcon width="18" height="16" /> }
					onClick={ () => handleSelect( ANCHOR_ID_TRAFFIC ) }
					selected={ selectedID === ANCHOR_ID_TRAFFIC }
				/>
			) }
			{ showContent && (
				<Chip
					id={ ANCHOR_ID_CONTENT }
					label={ __( 'Content', 'google-site-kit' ) }
					leadingIcon={ <NavContentIcon width="18" height="18" /> }
					onClick={ () => handleSelect( ANCHOR_ID_CONTENT ) }
					selected={ selectedID === ANCHOR_ID_CONTENT }
				/>
			) }
			{ showSpeed && (
				<Chip
					id={ ANCHOR_ID_SPEED }
					label={ __( 'Speed', 'google-site-kit' ) }
					leadingIcon={ <NavSpeedIcon width="20" height="16" /> }
					onClick={ () => handleSelect( ANCHOR_ID_SPEED ) }
					selected={ selectedID === ANCHOR_ID_SPEED }
				/>
			) }
			{ showMonetization && (
				<Chip
					id={ ANCHOR_ID_MONETIZATION }
					label={ __( 'Monetization', 'google-site-kit' ) }
					leadingIcon={
						<NavMonetizationIcon width="18" height="16" />
					}
					onClick={ () => handleSelect( ANCHOR_ID_MONETIZATION ) }
					selected={ selectedID === ANCHOR_ID_MONETIZATION }
				/>
			) }
		</div>
	);
}
