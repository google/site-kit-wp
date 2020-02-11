
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
	 *
	 * @param {...any} args Arguments to push onto the data layer.
	 */
	return function dataLayerPush( ...args ) {
		target[ DATA_LAYER ] = target[ DATA_LAYER ] || [];
		target[ DATA_LAYER ].push( args );
	};
}
