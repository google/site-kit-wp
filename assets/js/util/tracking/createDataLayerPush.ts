/**
 * Internal dependencies
 */
import { DATA_LAYER } from './constants';

interface DataLayerTarget {
	[ DATA_LAYER ]?: IArguments[];
}

type DataLayerPush = ( ...args: unknown[] ) => void;

/**
 * Returns a function which, when invoked will initialize the dataLayer and push data onto it.
 *
 * @since 1.3.0
 *
 * @param {Object} target Object to enhance with dataLayer data.
 * @return {Function} Function that pushes data onto the dataLayer.
 */
export default function createDataLayerPush(
	target: DataLayerTarget
): DataLayerPush {
	/**
	 * Pushes data onto the data layer.
	 *
	 * Must push an instance of Arguments to the target.
	 * Using an ES6 spread operator (i.e. `...args`) will cause tracking events to
	 * _silently_ fail.
	 *
	 * @since 1.0.0
	 * @see {@link https://github.com/google/site-kit-wp/issues/1181}
	 */
	/* eslint-disable prefer-rest-params */
	return function dataLayerPush(): void {
		target[ DATA_LAYER ] = target[ DATA_LAYER ] || [];
		// `arguments` must be passed through verbatim to match the current dataLayer contract.
		target[ DATA_LAYER ]?.push( arguments as IArguments );
	} as DataLayerPush;
	/* eslint-enable prefer-rest-params */
}
