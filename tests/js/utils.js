/**
 * External dependencies
 */
import { castArray } from 'lodash';

/**
 * Mute a given console during tests.
 *
 * Use this to mute expect console output during tests for things like
 * API fetch errors or other things you expect to log to console but don't
 * want appearing in the jest output.
 *
 * @param {string} type  Type of console to mute (one of: `'error'`, `'warn'`, `'log'`, `'info'`, or `'debug'`)
 * @param {number} times Number of times to mute console output perform resuming.
 * @return {void}
 */
export const muteConsole = ( type = 'error', times = 1 ) => {
	Array.from( { length: times } ).forEach( () => {
		global.console[ type ].mockImplementationOnce( () => jest.fn() );
	} );
};

const unsubscribes = [];
export const subscribeWithUnsubscribe = ( registry, ...args ) => {
	const unsubscribe = registry.subscribe( ...args );
	unsubscribes.push( unsubscribe );
	return unsubscribe;
};

export const subscribeUntil = ( registry, predicates ) => {
	predicates = castArray( predicates );

	return new Promise( ( resolve ) => {
		subscribeWithUnsubscribe( registry, () => {
			if ( predicates.every( ( predicate ) => predicate() ) ) {
				resolve();
			}
		} );
	} );
};

export const unsubscribeFromAll = () => {
	let unsubscribe;
	while ( ( unsubscribe = unsubscribes.shift() ) ) {
		unsubscribe();
	}
};

/**
 * Return a rejection.
 *
 * Used to ensure that a test will fail if it reaches this point.
 * Useful for asynchronous code that has multiple code paths, eg:
 *
 * ```js
 * try {
 *   await codeThatThrowsAnError();
 *   return unexpectedSuccess();
 * } catch (err) {
 *   expect(err.message).toEqual('Some error.');
 * }
 * ```
 *
 * Use this to ensure that the unintended path throws an error rather than
 * silently succeed.
 *
 * @return {Promise} A rejected promise.
 */
export const unexpectedSuccess = () => {
	return Promise.reject( new Error(
		'Some code (likely a Promise) succeeded unexpectedly; check your test.'
	) );
};
