/**
 * Internal dependencies
 */
import { DATA_LAYER } from './constants';

/**
 * Returns a function which, when invoked will initialize the dataLayer and push data onto it.
 *
 * @since 1.3.0
 *
 * @param {Object} target Object to enhance with dataLayer data.
 * @return {Function} Function that pushes data onto the dataLayer.
 */
export default function createDataLayerPush(
	// `target` is the global window object in production, or an arbitrary mock object in tests.
	target: Record< string, unknown >
): ( ...args: unknown[] ) => void {
	/**
	 * Pushes data onto the data layer.
	 *
	 * Must push an instance of Arguments to the target.
	 * Using an ES6 spread operator (i.e. `...args`) will cause tracking events to
	 * _silently_ fail.
	 *
	 * @since 1.0.0
	 * @see {@link https://github.com/google/site-kit-wp/issues/1181}
	 *
	 * @return {void}
	 */
	return function dataLayerPush() {
		target[ DATA_LAYER ] = target[ DATA_LAYER ] || [];
		// eslint-disable-next-line prefer-rest-params -- Must push an instance of `Arguments`, not an array; see the note above.
		( target[ DATA_LAYER ] as unknown[] ).push( arguments );
	};
}
