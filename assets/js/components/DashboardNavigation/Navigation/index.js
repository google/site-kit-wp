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
import { useDispatch } from 'googlesitekit-data';
import {
	ANCHOR_ID_CONTENT,
	ANCHOR_ID_MONETIZATION,
	ANCHOR_ID_SPEED,
	ANCHOR_ID_KEY_METRICS,
	ANCHOR_ID_TRAFFIC,
} from '../../../googlesitekit/constants';
import {
	CORE_UI,
	ACTIVE_CONTEXT_ID,
} from '../../../googlesitekit/datastore/ui/constants';
import { getDefaultChipID } from './utils';
import { getNavigationalScrollTop } from '../../../util/scroll';
import { trackEvent } from '../../../util';
import { useBreakpoint } from '../../../hooks/useBreakpoint';
import useDashboardType from '../../../hooks/useDashboardType';
import useViewContext from '../../../hooks/useViewContext';
import useViewOnly from '../../../hooks/useViewOnly';
import useVisibleSections from './hooks/useVisibleSections';
import NavContentIcon from '../../../../svg/icons/nav-content-icon.svg';
import NavKeyMetricsIcon from '../../../../svg/icons/nav-key-metrics-icon.svg';
import NavMonetizationIcon from '../../../../svg/icons/nav-monetization-icon.svg';
import NavSpeedIcon from '../../../../svg/icons/nav-speed-icon.svg';
import NavTrafficIcon from '../../../../svg/icons/nav-traffic-icon.svg';

export default function Navigation() {
	const breakpoint = useBreakpoint();
	const dashboardType = useDashboardType();
	const elementRef = useRef();
	const viewContext = useViewContext();
	const viewOnlyDashboard = useViewOnly();
	const visibleSections = useVisibleSections();

	const initialHash = global.location.hash?.substring( 1 );

	const [ isJumpingTo, setIsJumpingTo ] = useState(
		initialHash || undefined
	);
	const [ isSticky, setIsSticky ] = useState( false );
	const [ selectedID, setSelectedID ] = useState( initialHash );

	const { setValue } = useDispatch( CORE_UI );

	const defaultChipID = getDefaultChipID( {
		visibleSections,
		viewOnlyDashboard,
	} );

	const isValidChipID = useCallback(
		( chipID ) => visibleSections.includes( chipID ),
		[ visibleSections ]
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
					chipID !== defaultChipID
						? getNavigationalScrollTop( `#${ chipID }`, breakpoint )
						: 0,
				behavior: 'smooth',
			} );

			setTimeout( () => {
				setValue( ACTIVE_CONTEXT_ID, chipID );
			}, 50 );
		},
		[ breakpoint, defaultChipID, setValue, viewContext ]
	);

	// Scroll to the initial chip on mount.
	useMount( () => {
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

	// Update the selected chip based on scroll position.
	useEffect( () => {
		const changeSelectedChip = ( chipID ) => {
			setValue( ACTIVE_CONTEXT_ID, undefined );
			setSelectedID( chipID );
			setIsJumpingTo( undefined );
		};

		const onScroll = ( event ) => {
			const yScrollPosition = global.scrollY;
			const entityHeader = document
				.querySelector( '.googlesitekit-entity-header' )
				?.getBoundingClientRect()?.bottom;
			const { bottom: navigationBottom, top: navigationTop } =
				elementRef?.current?.getBoundingClientRect();
			const margin = 20;

			let closest;
			let closestID = defaultChipID;

			if ( yScrollPosition === 0 ) {
				setIsSticky( false );
			} else {
				const headerBottom = document
					.querySelector( '.googlesitekit-header' )
					?.getBoundingClientRect().bottom;
				setIsSticky( navigationTop === headerBottom );
			}

			for ( const areaID of visibleSections ) {
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
		};

		const throttledOnScroll = throttle( onScroll, 150 );
		global.addEventListener( 'scroll', throttledOnScroll );

		return () => {
			global.removeEventListener( 'scroll', throttledOnScroll );
		};
	}, [ defaultChipID, isJumpingTo, setValue, viewContext, visibleSections ] );

	const chips = {
		[ ANCHOR_ID_KEY_METRICS ]: {
			label: __( 'Key metrics', 'google-site-kit' ),
			icon: <NavKeyMetricsIcon width="18" height="16" />,
		},
		[ ANCHOR_ID_TRAFFIC ]: {
			label: __( 'Traffic', 'google-site-kit' ),
			icon: <NavTrafficIcon width="18" height="16" />,
		},
		[ ANCHOR_ID_CONTENT ]: {
			label: __( 'Content', 'google-site-kit' ),
			icon: <NavContentIcon width="18" height="18" />,
		},
		[ ANCHOR_ID_SPEED ]: {
			label: __( 'Speed', 'google-site-kit' ),
			icon: <NavSpeedIcon width="20" height="16" />,
		},
		[ ANCHOR_ID_MONETIZATION ]: {
			label: __( 'Monetization', 'google-site-kit' ),
			icon: <NavMonetizationIcon width="18" height="16" />,
		},
	};

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
			{ visibleSections.map( ( anchorID ) => {
				return (
					<Chip
						key={ anchorID }
						id={ anchorID }
						label={ chips[ anchorID ].label }
						leadingIcon={ chips[ anchorID ].icon }
						onClick={ handleSelect }
						selected={ selectedID === anchorID }
						data-context-id={ anchorID }
					/>
				);
			} ) }
		</nav>
	);
}
