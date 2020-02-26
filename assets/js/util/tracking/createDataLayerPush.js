
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
	 * Must use `arguments` internally.
	 */
	return function dataLayerPush() {
		target[ DATA_LAYER ] = target[ DATA_LAYER ] || [];
		target[ DATA_LAYER ].push( arguments );
	};
}
