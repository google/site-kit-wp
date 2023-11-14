/**
 * External dependencies
 */
import { set } from 'lodash';

/**
 * Converts a flat object with nested key strings into a multidimensional object.
 *
 * This function iterates over each key-value pair in the provided object.
 * If a key represents a path to a nested structure (e.g., 'metrics[0][name]'),
 * it converts this path into a nested object hierarchy.
 *
 * @since n.e.x.t
 *
 * @param {Object} params The flat object with keys indicating nested paths.
 * @return {Object} A new object with the same data represented in a nested structure.
 */
export default function getMultiDimensionalObjectFromParams( params ) {
	return Object.entries( params ).reduce( ( acc, [ key, value ] ) => {
		set( acc, key, value );
		return acc;
	}, {} );
}
