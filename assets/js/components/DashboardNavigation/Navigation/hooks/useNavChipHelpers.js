/**
 * Navigation `useNavChipHelpers` hook.
 *
 * Site Kit by Google, Copyright 2025 Google LLC
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
import { useCallback } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { getNavigationalScrollTop } from '../../../../util/scroll';
import { useBreakpoint } from '../../../../hooks/useBreakpoint';
import useViewOnly from '../../../../hooks/useViewOnly';
import {
	ANCHOR_ID_KEY_METRICS,
	ANCHOR_ID_TRAFFIC,
} from '../../../../googlesitekit/constants';

/**
 * Returns helper data and functions for navigation chips.
 *
 * @since 1.159.0
 *
 * @param {Object}        params                 Parameters for the hook.
 * @param {Array<string>} params.visibleSections The sections that are currently visible.
 * @return {Object} An object containing helper data and functions for navigation chips.
 */
export default function useNavChipHelpers( { visibleSections } ) {
	const breakpoint = useBreakpoint();
	const viewOnlyDashboard = useViewOnly();

	/**
	 * Gets the default chip ID based on the visibility of various sections.
	 *
	 * @since 1.159.0
	 *
	 * @return {string} The default chip ID.
	 */
	const getDefaultChipID = useCallback( () => {
		if ( visibleSections.includes( ANCHOR_ID_KEY_METRICS ) ) {
			return ANCHOR_ID_KEY_METRICS;
		}

		if ( ! viewOnlyDashboard ) {
			return ANCHOR_ID_TRAFFIC;
		}

		return visibleSections[ 0 ] || '';
	}, [ viewOnlyDashboard, visibleSections ] );

	const defaultChipID = getDefaultChipID();

	/**
	 * Checks if a chip ID is valid based on the visible sections.
	 *
	 * @since 1.159.0
	 *
	 * @param {string} chipID The chip ID to validate.
	 * @return {boolean} True if the chip ID is valid, false otherwise.
	 */
	const isValidChipID = useCallback(
		( chipID ) => visibleSections.includes( chipID ),
		[ visibleSections ]
	);

	/**
	 * Updates the URL hash to reflect the selected chip ID.
	 *
	 * @since 1.159.0
	 *
	 * @param {string} chipID The chip ID to update in the URL hash.
	 * @return {void}
	 */
	const updateURLHash = useCallback( ( chipID ) => {
		global.history.replaceState( {}, '', `#${ chipID }` );
	}, [] );

	/**
	 * Calculates the scroll position for a given chip ID.
	 *
	 * @since 1.159.0
	 *
	 * @param {string} chipID The chip ID for which to calculate the scroll position.
	 * @return {number} The calculated scroll position.
	 */
	const calculateScrollPosition = useCallback(
		( chipID ) => {
			return chipID !== defaultChipID
				? getNavigationalScrollTop( `#${ chipID }`, breakpoint )
				: 0;
		},
		[ breakpoint, defaultChipID ]
	);

	/**
	 * Scrolls to the position of a given chip ID.
	 *
	 * @since 1.159.0
	 *
	 * @param {string} chipID The chip ID to scroll to.
	 * @return {void}
	 */
	const scrollToChip = useCallback(
		( chipID ) => {
			global.scrollTo( {
				top: calculateScrollPosition(
					chipID,
					breakpoint,
					defaultChipID
				),
				behavior: 'smooth',
			} );
		},
		[ breakpoint, calculateScrollPosition, defaultChipID ]
	);

	/**
	 * Finds the closest section ID based on the current scroll position.
	 *
	 * @since 1.159.0
	 *
	 * @param {Object} ref The reference to the navigation element.
	 * @return {string} The ID of the closest section.
	 */
	const findClosestSection = useCallback(
		( ref ) => {
			const entityHeader = document
				.querySelector( '.googlesitekit-entity-header' )
				?.getBoundingClientRect()?.bottom;

			const { bottom } = ref?.current?.getBoundingClientRect();

			const margin = 20;

			let closest;
			let closestID = defaultChipID;

			for ( const areaID of visibleSections ) {
				const area = document.getElementById( areaID );
				if ( ! area ) {
					continue;
				}

				const top =
					area.getBoundingClientRect().top -
					margin -
					( entityHeader || bottom || 0 );

				if ( top < 0 && ( closest === undefined || closest < top ) ) {
					closest = top;
					closestID = areaID;
				}
			}

			return closestID;
		},
		[ defaultChipID, visibleSections ]
	);

	return {
		calculateScrollPosition,
		defaultChipID,
		findClosestSection,
		isValidChipID,
		scrollToChip,
		updateURLHash,
	};
}
