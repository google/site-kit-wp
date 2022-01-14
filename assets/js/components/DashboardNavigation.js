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
import { useState, useEffect, useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import NavTrafficIcon from '../../svg/icons/nav-traffic-icon.svg';
import NavContentIcon from '../../svg/icons/nav-content-icon.svg';
import NavSpeedIcon from '../../svg/icons/nav-speed-icon.svg';
import NavMonetizationIcon from '../../svg/icons/nav-monetization-icon.svg';
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
		global.location.hash.substring( 1 )
	);

	const handleSelect = useCallback(
		( { target } ) => {
			const chip = target.closest( '.mdc-chip' );
			const chipID = chip?.dataset?.contextId; // eslint-disable-line sitekit/acronym-case

			global.scrollTo( {
				top:
					chipID !== ANCHOR_ID_TRAFFIC
						? getContextScrollTop( `#${ chipID }`, breakpoint )
						: 0,
				behavior: 'smooth',
			} );
		},
		[ breakpoint ]
	);

	useMount( () => {
		const { hash } = global.location;
		if ( ! hash ) {
			return;
		}

		setTimeout( () => {
			global.scrollTo( {
				top:
					hash.substring( 1 ) !== ANCHOR_ID_TRAFFIC
						? getContextScrollTop( hash, breakpoint )
						: 0,
				behavior: 'smooth',
			} );
		}, 25 );
	} );

	useEffect( () => {
		const onScroll = () => {
			const entityHeader = document
				.querySelector( '.googlesitekit-entity-header' )
				?.getBoundingClientRect()?.bottom;
			const navigation = document
				.querySelector( '.googlesitekit-navigation' )
				?.getBoundingClientRect()?.bottom;
			const margin = 20;

			const areas = [
				...( showTraffic ? [ ANCHOR_ID_TRAFFIC ] : [] ),
				...( showContent ? [ ANCHOR_ID_CONTENT ] : [] ),
				...( showSpeed ? [ ANCHOR_ID_SPEED ] : [] ),
				...( showMonetization ? [ ANCHOR_ID_MONETIZATION ] : [] ),
			];

			let closest;
			let closestID = ANCHOR_ID_TRAFFIC;

			for ( const areaID of areas ) {
				const area = document.getElementById( areaID );
				if ( ! area ) {
					continue;
				}

				const top =
					area.getBoundingClientRect().top -
					margin -
					( entityHeader || navigation || 0 );

				if ( top < 0 && ( closest === undefined || closest < top ) ) {
					closest = top;
					closestID = areaID;
				}
			}

			const { hash } = global.location;
			if ( closestID !== hash?.substring( 1 ) ) {
				global.history.replaceState( {}, '', `#${ closestID }` );
				setSelectedID( closestID );
			}
		};

		const throttledOnScroll = throttle( onScroll, 50 );
		global.addEventListener( 'scroll', throttledOnScroll );

		throttledOnScroll();

		return () => {
			global.removeEventListener( 'scroll', throttledOnScroll );
		};
	}, [ showTraffic, showContent, showSpeed, showMonetization ] );

	return (
		<div className="googlesitekit-navigation mdc-chip-set">
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
		</div>
	);
}
