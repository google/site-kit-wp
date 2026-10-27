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
import { Chip } from '@material/react-chips';
import classnames from 'classnames';
import { useEvent, useMount } from 'react-use';

/**
 * WordPress dependencies
 */
import { useThrottle } from '@wordpress/compose';
import { useCallback, useEffect, useRef, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { useDispatch } from 'googlesitekit-data';
import {
	ANCHOR_ID_CONTENT,
	ANCHOR_ID_KEY_METRICS,
	ANCHOR_ID_MONETIZATION,
	ANCHOR_ID_SITE_GOALS,
	ANCHOR_ID_SPEED,
	ANCHOR_ID_TRAFFIC,
} from '@/js/googlesitekit/constants';
import {
	ACTIVE_CONTEXT_ID,
	CORE_UI,
} from '@/js/googlesitekit/datastore/ui/constants';
import useDashboardType from '@/js/hooks/useDashboardType';
import useViewContext from '@/js/hooks/useViewContext';
import { trackEvent } from '@/js/util';
import NavContentIcon from '@/svg/icons/nav-content-icon.svg';
import NavKeyMetricsIcon from '@/svg/icons/nav-key-metrics-icon.svg';
import NavMonetizationIcon from '@/svg/icons/nav-monetization-icon.svg';
import NavSiteGoalsIcon from '@/svg/icons/nav-site-goals-icon.svg';
import NavSpeedIcon from '@/svg/icons/nav-speed-icon.svg';
import NavTrafficIcon from '@/svg/icons/nav-traffic-icon.svg';
import useNavChipHelpers from './hooks/useNavChipHelpers';
import useVisibleSections from './hooks/useVisibleSections';

export default function Navigation() {
	const dashboardType = useDashboardType();
	const elementRef = useRef();
	const viewContext = useViewContext();
	const visibleSections = useVisibleSections();

	const {
		calculateScrollPosition,
		defaultChipID,
		findClosestSection,
		isValidChipID,
		scrollToChip,
		updateURLHash,
	} = useNavChipHelpers( { visibleSections } );

	const [ initialHash ] = useState( () =>
		global.location.hash?.substring( 1 )
	);

	const [ isJumpingTo, setIsJumpingTo ] = useState(
		initialHash || undefined
	);
	const [ isSticky, setIsSticky ] = useState( false );
	const [ selectedID, setSelectedID ] = useState( initialHash );
	const isInitialHashHandled = useRef( false );

	const { setValue } = useDispatch( CORE_UI );

	/**
	 * Handles the selection of a chip.
	 *
	 * @since 1.159.0
	 *
	 * @param {Object} event The click event.
	 * @return {void}
	 */
	const handleSelect = useCallback(
		( { target } ) => {
			const chip = target.closest( '.mdc-chip' );
			const chipID =
				// Uses non-acronym case to meet DOM data attribute standards.
				// eslint-disable-next-line sitekit/acronym-case
				chip?.dataset?.contextId;

			// Prevent a pending scroll to the initial hash's section from
			// overriding the user's selection.
			isInitialHashHandled.current = true;

			// Update URL and scroll to the selected chip.
			updateURLHash( chipID );
			setIsJumpingTo( chipID );
			scrollToChip( chipID );

			// Track user event.
			trackEvent( `${ viewContext }_navigation`, 'tab_select', chipID );

			setTimeout( () => {
				setValue( ACTIVE_CONTEXT_ID, chipID );
			}, 50 );
		},
		[ scrollToChip, setValue, updateURLHash, viewContext ]
	);

	/**
	 * Determines the sticky state of navigation based on scroll position.
	 *
	 * @since 1.159.0
	 *
	 * @return {void}
	 */
	const handleSticky = useCallback( () => {
		if ( ! elementRef?.current ) {
			return;
		}

		const { top } = elementRef?.current?.getBoundingClientRect();

		if ( global.scrollY === 0 ) {
			setIsSticky( false );
		} else {
			const headerBottom = document
				.querySelector( '.googlesitekit-header' )
				?.getBoundingClientRect?.()?.bottom;

			setIsSticky( top === headerBottom );
		}
	}, [] );

	/**
	 * Determines the selected state of a chip based on scroll position.
	 *
	 * @since 1.159.0
	 *
	 * @param {Event} event The scroll event.
	 * @return {void}
	 */
	const handleSelectedChip = useCallback(
		( event ) => {
			function changeSelectedChip( chipID ) {
				setValue( ACTIVE_CONTEXT_ID, undefined );
				setSelectedID( chipID );
				setIsJumpingTo( undefined );
			}

			const closestID = findClosestSection( elementRef );

			// Check if user clicked on a chip and is actively jumping to it.
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

					updateURLHash( closestID );
					changeSelectedChip( closestID );
				}
			}
		},
		[
			findClosestSection,
			isJumpingTo,
			setValue,
			updateURLHash,
			viewContext,
		]
	);

	/**
	 * Selects a chip and scrolls to its section.
	 *
	 * @since n.e.x.t
	 *
	 * @param {string} chipID The chip ID.
	 * @return {void}
	 */
	const jumpToChip = useCallback(
		( chipID ) => {
			setSelectedID( chipID );
			setIsJumpingTo( chipID );
			setValue( ACTIVE_CONTEXT_ID, chipID );

			const scrollTo = calculateScrollPosition( chipID );

			if ( global.scrollY === scrollTo ) {
				setValue( ACTIVE_CONTEXT_ID, undefined );
				setIsJumpingTo( undefined );
				return;
			}

			scrollToChip( chipID );
		},
		[ calculateScrollPosition, scrollToChip, setValue ]
	);

	// Set up initial chip on mount.
	useMount( () => {
		// If no initial hash is set, set the default chip as selected.
		if ( ! initialHash ) {
			setSelectedID( defaultChipID );
			setTimeout( () => updateURLHash( defaultChipID ) );
			return;
		}

		// Use the default chip while the initial hash's section isn't visible,
		// as it may still be loading.
		if ( ! isValidChipID( initialHash ) ) {
			setSelectedID( defaultChipID );
			setTimeout( () => {
				if ( ! isInitialHashHandled.current ) {
					jumpToChip( defaultChipID );
				}
			}, 50 );
		}
	} );

	// Jump to the initial hash's section once it is visible, as sections can
	// become visible after the navigation has mounted. The timeout is cleared
	// if the visible sections change before it runs, so the jump uses the
	// latest layout.
	useEffect( () => {
		if ( isInitialHashHandled.current || ! isValidChipID( initialHash ) ) {
			// Return noop cleanup function to satisfy consistent-return rule.
			return () => {};
		}

		const timeout = setTimeout( () => {
			if ( ! isInitialHashHandled.current ) {
				isInitialHashHandled.current = true;
				jumpToChip( initialHash );
			}
		}, 50 );

		return () => clearTimeout( timeout );
	}, [ initialHash, isValidChipID, jumpToChip ] );

	const onScroll = useCallback(
		( event ) => {
			handleSticky();
			handleSelectedChip( event );
		},
		[ handleSelectedChip, handleSticky ]
	);

	const throttledOnScroll = useThrottle( onScroll, 150 );

	// Handle scroll events to update sticky state and selected chip.
	useEvent( 'scroll', throttledOnScroll );

	const navigationChipIconSize = 20;

	const chips = {
		[ ANCHOR_ID_KEY_METRICS ]: {
			label: __( 'Key metrics', 'google-site-kit' ),
			icon: (
				<NavKeyMetricsIcon
					width={ navigationChipIconSize }
					height={ navigationChipIconSize }
				/>
			),
		},
		[ ANCHOR_ID_TRAFFIC ]: {
			label: __( 'Traffic', 'google-site-kit' ),
			icon: (
				<NavTrafficIcon
					width={ navigationChipIconSize }
					height={ navigationChipIconSize }
				/>
			),
		},
		[ ANCHOR_ID_SITE_GOALS ]: {
			label: __( 'Site goals', 'google-site-kit' ),
			icon: (
				<NavSiteGoalsIcon
					width={ navigationChipIconSize }
					height={ navigationChipIconSize }
				/>
			),
		},
		[ ANCHOR_ID_CONTENT ]: {
			label: __( 'Content', 'google-site-kit' ),
			icon: (
				<NavContentIcon
					width={ navigationChipIconSize }
					height={ navigationChipIconSize }
				/>
			),
		},
		[ ANCHOR_ID_SPEED ]: {
			label: __( 'Speed', 'google-site-kit' ),
			icon: (
				<NavSpeedIcon
					width={ navigationChipIconSize }
					height={ navigationChipIconSize }
				/>
			),
		},
		[ ANCHOR_ID_MONETIZATION ]: {
			label: __( 'Monetization', 'google-site-kit' ),
			icon: (
				<NavMonetizationIcon
					width={ navigationChipIconSize }
					height={ navigationChipIconSize }
				/>
			),
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
