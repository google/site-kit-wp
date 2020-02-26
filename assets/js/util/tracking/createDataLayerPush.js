
/**
 * Internal dependencies
 */
import { DATA_LAYER } from './index.private';

/**
 * Returns a function which, when invoked will initialize the dataLayer and push data onto it.
 *
 * @param {Object} target Object to enhance with dataLayer data.
 * @return {Function} Function that pushes data onto the dataLayer.
 */
export default function createDataLayerPush( target ) {
	/**
	 * Pushes data onto the data layer.
	 * Must push an instance of Arguments to the target.
	 * Using an ES6 spread operator (i.e. `...args`) will cause tracking events to _silently_ fail.
	 * @link https://github.com/google/site-kit-wp/issues/1181
	 */
	return function dataLayerPush() {
		target[ DATA_LAYER ] = target[ DATA_LAYER ] || [];
		target[ DATA_LAYER ].push( arguments );
	};
}
