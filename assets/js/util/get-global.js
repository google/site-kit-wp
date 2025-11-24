/**
 * Returns a reference to the global scope.
 *
 * @since n.e.x.t
 *
 * @return {Object} Global scope object.
 */

/* global globalThis */
export default function getGlobal() {
	if ( typeof globalThis !== 'undefined' ) {
		return globalThis;
	}

	if ( typeof self !== 'undefined' ) {
		return self;
	}

	if ( typeof global !== 'undefined' ) {
		return global;
	}

	return {};
}
