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
import { trackEvent } from '../../../util';
import useDashboardType from '../../../hooks/useDashboardType';
import useNavChipHelpers from './hooks/useNavChipHelpers';
import useViewContext from '../../../hooks/useViewContext';
import useVisibleSections from './hooks/useVisibleSections';
import NavContentIcon from '../../../../svg/icons/nav-content-icon.svg';
import NavKeyMetricsIcon from '../../../../svg/icons/nav-key-metrics-icon.svg';
import NavMonetizationIcon from '../../../../svg/icons/nav-monetization-icon.svg';
import NavSpeedIcon from '../../../../svg/icons/nav-speed-icon.svg';
import NavTrafficIcon from '../../../../svg/icons/nav-traffic-icon.svg';

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

	const initialHash = global.location.hash?.substring( 1 );

	const [ isJumpingTo, setIsJumpingTo ] = useState(
		initialHash || undefined
	);
	const [ isSticky, setIsSticky ] = useState( false );
	const [ selectedID, setSelectedID ] = useState( initialHash );

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
		const { top } = elementRef?.current?.getBoundingClientRect();

		if ( global.scrollY === 0 ) {
			setIsSticky( false );
		} else {
			const headerBottom = document
				.querySelector( '.googlesitekit-header' )
				?.getBoundingClientRect().bottom;

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
			const changeSelectedChip = ( chipID ) => {
				setValue( ACTIVE_CONTEXT_ID, undefined );
				setSelectedID( chipID );
				setIsJumpingTo( undefined );
			};

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

	// Set up initial chip on mount.
	useMount( () => {
		// If no initial hash is set, set the default chip as selected.
		if ( ! initialHash ) {
			setSelectedID( defaultChipID );
			setTimeout( () => updateURLHash( defaultChipID ) );
			return;
		}

		const chipID = isValidChipID( initialHash )
			? initialHash
			: defaultChipID;

		// Set initial/default chip ID in state.
		setSelectedID( chipID );
		setValue( ACTIVE_CONTEXT_ID, chipID );

		// Scroll to the chip position.
		setTimeout( () => {
			const scrollTo = calculateScrollPosition( chipID );

			if ( global.scrollY === scrollTo ) {
				setValue( ACTIVE_CONTEXT_ID, undefined );
				return;
			}

			scrollToChip( chipID );
		}, 50 );
	} );

	// Handle scroll events to update sticky state and selected chip.
	useEffect( () => {
		const onScroll = ( event ) => {
			handleSticky();
			handleSelectedChip( event );
		};

		const throttledOnScroll = throttle( onScroll, 150 );
		global.addEventListener( 'scroll', throttledOnScroll );

		return () => {
			global.removeEventListener( 'scroll', throttledOnScroll );
		};
	}, [ handleSelectedChip, handleSticky ] );

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
