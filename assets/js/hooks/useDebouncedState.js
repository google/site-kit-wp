/**
 * WordPress dependencies
 */
import { useState, useEffect } from '@wordpress/element';

/**
 * useDebouncedState hook
 *
 * @since n.e.x.t
 *
 * @param {string} value The value to be debounced.
 * @param {number} delay Number of milliseconds to debounce
 * @return {string} The update value after the delay
 */
export function useDebouncedState( value, delay ) {
	const [ debouncedValue, setDebouncedValue ] = useState( value );

	useEffect(
		() => {
			// Update debounced value after the delay
			const timeout = setTimeout(
				() => {
					setDebouncedValue( value );
				},
				delay
			);

			return () => {
				clearTimeout( timeout );
			};
		},
		[ value, delay ]
	);

	return debouncedValue;
}
