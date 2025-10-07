/**
 * Vitest Console Matchers
 *
 * Custom matchers and console mocking for Vitest to replace @wordpress/jest-console.
 * This utility mocks console methods (error, info, log, warn) and enforces that
 * tests assert console calls using custom matchers.
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
 * External dependencies
 */
import { vi, expect, beforeEach, afterEach } from 'vitest';

/**
 * Console method names we track and mock.
 */
const CONSOLE_METHODS = [ 'error', 'info', 'log', 'warn' ];

/**
 * Store for tracking console calls and assertions.
 */
const consoleState = {
	// Tracks actual calls made to console methods
	calls: {
		error: [],
		info: [],
		log: [],
		warn: [],
	},
	// Tracks which console methods have been asserted
	asserted: {
		error: false,
		info: false,
		log: false,
		warn: false,
	},
	// Original console implementations
	originalMethods: {},
	// Spy instances
	spies: {},
};

/**
 * Initializes console mocks.
 * Sets up spies on console methods and tracks their calls.
 *
 * @since n.e.x.t
 */
function setupConsoleMocks() {
	CONSOLE_METHODS.forEach( ( method ) => {
		// Store original method
		// eslint-disable-next-line no-console
		consoleState.originalMethods[ method ] = console[ method ];

		// Create spy that tracks calls
		consoleState.spies[ method ] = vi
			.spyOn( console, method )
			.mockImplementation( ( ...args ) => {
				// Store the call
				consoleState.calls[ method ].push( args );
				// Don't actually output to console during tests
			} );
	} );
}

/**
 * Resets console state between tests.
 *
 * @since n.e.x.t
 */
function resetConsoleState() {
	CONSOLE_METHODS.forEach( ( method ) => {
		consoleState.calls[ method ] = [];
		consoleState.asserted[ method ] = false;
	} );
}

/**
 * Creates a console matcher for a specific method.
 *
 * @since n.e.x.t
 *
 * @param {string} method Console method name (error, info, log, warn).
 * @return {Function} Matcher function for Vitest.
 */
function createConsoleMatcher( method ) {
	const methodTitle = method.charAt( 0 ).toUpperCase() + method.slice( 1 );
	// Handle special cases for matcher names
	let matcherSuffix = 'ed';
	if ( method === 'log' ) {
		matcherSuffix = 'ged'; // Logged not Loged
	} else if ( method === 'info' ) {
		matcherSuffix = 'rmed'; // Informed not Infoed
	}
	const matcherName = `toHave${ methodTitle }${ matcherSuffix }`;

	return function () {
		// Mark this method as asserted
		consoleState.asserted[ method ] = true;

		const calls = consoleState.calls[ method ];
		const pass = calls.length > 0;

		// Allow arrow function to cleanly pass to return object.
		// eslint-disable-next-line sitekit/function-declaration-consistency
		const message = () => {
			const hint = this.utils.matcherHint( matcherName, 'console', '', {
				isNot: this.isNot,
				promise: this.promise,
			} );

			if ( pass ) {
				return (
					`${ hint }\n\n` +
					`Expected console.${ method }() not to have been called, but it was called ${ calls.length } time(s):\n` +
					calls
						.map(
							( args, index ) =>
								`  ${ index + 1 }. ${ this.utils.printReceived(
									args
								) }`
						)
						.join( '\n' )
				);
			}

			return (
				`${ hint }\n\n` +
				`Expected console.${ method }() to have been called, but it was not called.`
			);
		};

		return {
			pass,
			message,
		};
	};
}

/**
 * Creates a console matcher with arguments for a specific method.
 *
 * @since n.e.x.t
 *
 * @param {string} method Console method name (error, info, log, warn).
 * @return {Function} Matcher function for Vitest.
 */
function createConsoleMatcherWith( method ) {
	const methodTitle = method.charAt( 0 ).toUpperCase() + method.slice( 1 );
	// Handle special cases for matcher names
	let matcherSuffix = 'edWith';
	if ( method === 'log' ) {
		matcherSuffix = 'gedWith'; // LoggedWith not LogedWith
	} else if ( method === 'info' ) {
		matcherSuffix = 'rmedWith'; // InformedWith not InfoedWith
	}
	const matcherName = `toHave${ methodTitle }${ matcherSuffix }`;

	return function ( received, ...expectedArgs ) {
		// Mark this method as asserted
		consoleState.asserted[ method ] = true;

		const calls = consoleState.calls[ method ];

		// Check if any call matches the expected arguments
		const matchingCall = calls.find( ( callArgs ) => {
			if ( callArgs.length !== expectedArgs.length ) {
				return false;
			}
			return callArgs.every( ( arg, index ) =>
				this.equals( arg, expectedArgs[ index ] )
			);
		} );

		const pass = matchingCall !== undefined;

		// Allow arrow function to cleanly pass to return object.
		// eslint-disable-next-line sitekit/function-declaration-consistency
		const message = () => {
			const hint = this.utils.matcherHint(
				matcherName,
				'console',
				this.utils.printExpected( expectedArgs ),
				{
					isNot: this.isNot,
					promise: this.promise,
				}
			);

			if ( pass ) {
				return (
					`${ hint }\n\n` +
					`Expected console.${ method }() not to have been called with:\n` +
					`  ${ this.utils.printExpected( expectedArgs ) }\n\n` +
					'But it was called with these arguments.'
				);
			}

			const callsInfo =
				calls.length > 0
					? '\n\nActual calls:\n' +
					  calls
							.map(
								( args, index ) =>
									`  ${
										index + 1
									}. ${ this.utils.printReceived( args ) }`
							)
							.join( '\n' )
					: '\n\nconsole.' + method + '() was not called at all.';

			return (
				`${ hint }\n\n` +
				`Expected console.${ method }() to have been called with:\n` +
				`  ${ this.utils.printExpected( expectedArgs ) }` +
				callsInfo
			);
		};

		return {
			pass,
			message,
		};
	};
}

/**
 * Installs custom matchers and sets up console mocking.
 *
 * @since n.e.x.t
 */
function installConsoleMatchers() {
	const matchers = {};

	// Create matchers for each console method with proper naming
	CONSOLE_METHODS.forEach( ( method ) => {
		const methodTitle =
			method.charAt( 0 ).toUpperCase() + method.slice( 1 );

		// Handle special cases for matcher names
		let matcherSuffix = 'ed';
		let matcherSuffixWith = 'edWith';
		if ( method === 'log' ) {
			matcherSuffix = 'ged'; // Logged not Loged
			matcherSuffixWith = 'gedWith';
		} else if ( method === 'info' ) {
			matcherSuffix = 'rmed'; // Informed not Infoed
			matcherSuffixWith = 'rmedWith';
		}

		matchers[ `toHave${ methodTitle }${ matcherSuffix }` ] =
			createConsoleMatcher( method );
		matchers[ `toHave${ methodTitle }${ matcherSuffixWith }` ] =
			createConsoleMatcherWith( method );
	} );

	// Extend Vitest's expect with our custom matchers
	expect.extend( matchers );

	// Set up console mocks
	setupConsoleMocks();
}

/**
 * Set up beforeEach and afterEach hooks for console testing.
 */
beforeEach( () => {
	resetConsoleState();
} );

afterEach( () => {
	resetConsoleState();
} );

// Install matchers when this module is imported
installConsoleMatchers();
