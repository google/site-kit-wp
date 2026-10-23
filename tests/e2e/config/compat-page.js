/**
 * Puppeteer-style page API on top of a Playwright page.
 *
 * The specs in `tests/e2e/` were written against Puppeteer. This wrapper lets
 * them run on Playwright unchanged. It covers only the Puppeteer methods and
 * behaviors that those specs use. New specs belong in `tests/playwright/`,
 * and this wrapper can go once the specs here have moved there.
 *
 * Site Kit by Google, Copyright 2026 Google LLC
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
 * Maximum open requests for Puppeteer's network idle `waitUntil` values.
 *
 * Playwright's `networkidle` allows none. It also does not know which
 * requests a spec leaves pending on purpose, so the wrapper handles these
 * values with its own request tracking.
 */
const NETWORK_IDLE_MAX_IN_FLIGHT = {
	networkidle0: 0,
	networkidle2: 2,
};

/**
 * Calls a Playwright evaluate-style method with Puppeteer's variadic
 * arguments. Playwright accepts a single argument, so multiple arguments are
 * passed as an array and spread inside the browser.
 *
 * @since n.e.x.t
 *
 * @param {Function}        method                Bound Playwright method.
 * @param {Array}           prefix                Leading arguments, e.g. a selector.
 * @param {Function|string} fn                    Function or expression to evaluate.
 * @param {Array}           args                  Puppeteer-style arguments.
 * @param {Object}          [options]             Options.
 * @param {Object}          [options.extra]       Trailing options argument for the method.
 * @param {boolean}         [options.withElement] Whether the browser passes an element first.
 * @return {Promise<*>} Evaluation result.
 */
function callEvaluate( method, prefix, fn, args, { extra, withElement } = {} ) {
	const trailing = extra ? [ extra ] : [];

	if ( typeof fn !== 'function' || args.length <= 1 ) {
		return method( ...prefix, fn, args[ 0 ], ...trailing );
	}

	const payload = { source: fn.toString(), values: args };

	/* eslint-disable no-eval */
	const spread = withElement
		? ( element, { source, values } ) =>
				( 0, eval )( `(${ source })` )( element, ...values )
		: ( { source, values } ) => ( 0, eval )( `(${ source })` )( ...values );
	/* eslint-enable no-eval */

	return method( ...prefix, spread, payload, ...trailing );
}

/**
 * Maps Puppeteer `waitForSelector()` options to Playwright options.
 *
 * Playwright waits for a visible element by default, while Puppeteer only
 * waits for the element to be attached.
 *
 * @since n.e.x.t
 *
 * @param {Object} options Puppeteer options.
 * @return {Object} Playwright options.
 */
function toSelectorOptions( options = {} ) {
	const { visible, hidden, ...rest } = options;
	let state = 'attached';
	if ( visible ) {
		state = 'visible';
	} else if ( hidden ) {
		state = 'hidden';
	}
	return { state, ...rest };
}

/**
 * Splits Puppeteer navigation options into Playwright options and a network
 * idle requirement.
 *
 * @since n.e.x.t
 *
 * @param {Object} options Puppeteer navigation options.
 * @return {Object} Playwright options, and `maxInFlight` when the caller waits for network idle.
 */
function toNavigationOptions( options = {} ) {
	const { waitUntil, ...rest } = options;
	if ( waitUntil in NETWORK_IDLE_MAX_IN_FLIGHT ) {
		return {
			playwrightOptions: { ...rest, waitUntil: 'load' },
			maxInFlight: NETWORK_IDLE_MAX_IN_FLIGHT[ waitUntil ],
		};
	}
	return {
		playwrightOptions: waitUntil ? { ...rest, waitUntil } : rest,
	};
}

/**
 * Creates a Puppeteer-style wrapper around a Playwright page.
 *
 * Methods that Playwright already provides with the same behavior pass
 * through. The wrapper only adds or adapts the methods the specs use.
 *
 * @since n.e.x.t
 *
 * @param {Object} page    Playwright page.
 * @param {Object} context Playwright browser context.
 * @return {Object} Wrapped page.
 */
function createCompatPage( page, context ) {
	const inFlight = new Set();
	const ignored = new WeakSet();
	let cdpSession;
	// Network idle tracking measures elapsed test time, so the reference
	// date does not apply here or below.
	let lastActivity = Date.now(); // eslint-disable-line sitekit/no-direct-date

	function trackRequest( request ) {
		if ( ! ignored.has( request ) ) {
			inFlight.add( request );
		}
		lastActivity = Date.now(); // eslint-disable-line sitekit/no-direct-date
	}

	function settleRequest( request ) {
		inFlight.delete( request );
		lastActivity = Date.now(); // eslint-disable-line sitekit/no-direct-date
	}

	page.on( 'request', trackRequest );
	// Like Puppeteer, count a request as done once its response headers
	// arrive, even if the body never finishes.
	page.on( 'response', ( response ) => settleRequest( response.request() ) );
	page.on( 'requestfinished', settleRequest );
	page.on( 'requestfailed', settleRequest );
	page.on( 'framenavigated', ( frame ) => {
		if ( frame === page.mainFrame() ) {
			inFlight.clear();
		}
	} );

	/**
	 * Runs a Playwright navigation method with Puppeteer options, then waits
	 * for network idle when the options ask for it.
	 *
	 * @since n.e.x.t
	 *
	 * @param {Function} run     Calls the Playwright method with the given options.
	 * @param {Object}   options Puppeteer navigation options.
	 * @return {Promise<*>} The navigation method's result.
	 */
	async function navigate( run, options ) {
		const { playwrightOptions, maxInFlight } =
			toNavigationOptions( options );
		const result = await run( playwrightOptions );
		if ( maxInFlight !== undefined ) {
			await overrides.waitForNetworkIdle( {
				maxInFlight,
				timeout: playwrightOptions.timeout,
			} );
		}
		return result;
	}

	const overrides = {
		// Read by `useRequestInterception()`.
		__interceptionEnabled: false,

		// Called by `useRequestInterception()` for requests that a spec leaves
		// pending on purpose. As in Puppeteer, they do not count against
		// network idle.
		__ignoreForNetworkIdle( request ) {
			ignored.add( request );
			settleRequest( request );
		},

		setRequestInterception( enabled ) {
			overrides.__interceptionEnabled = enabled;
			return Promise.resolve();
		},

		waitForSelector( selector, options ) {
			return page.waitForSelector(
				selector,
				toSelectorOptions( options )
			);
		},

		waitForNavigation( options ) {
			return navigate(
				( navigationOptions ) =>
					page.waitForNavigation( navigationOptions ),
				options
			);
		},

		goto( url, options ) {
			return navigate(
				( navigationOptions ) => page.goto( url, navigationOptions ),
				options
			);
		},

		reload( options ) {
			return navigate(
				( navigationOptions ) => page.reload( navigationOptions ),
				options
			);
		},

		// Puppeteer resolves once no more than `maxInFlight` requests have
		// been open for `idleTime`, measured from the call. Playwright's
		// `networkidle` load state resolves at once if the page reached it
		// earlier.
		waitForNetworkIdle( {
			idleTime = 500,
			timeout = 30_000,
			maxInFlight = 0,
		} = {} ) {
			const start = Date.now(); // eslint-disable-line sitekit/no-direct-date
			const limit = timeout === 0 ? Infinity : timeout;
			return new Promise( ( resolve, reject ) => {
				function check() {
					const now = Date.now(); // eslint-disable-line sitekit/no-direct-date
					if (
						inFlight.size <= maxInFlight &&
						now - Math.max( lastActivity, start ) >= idleTime
					) {
						resolve();
					} else if ( now - start > limit ) {
						reject(
							new Error(
								`waitForNetworkIdle: timeout ${ timeout }ms exceeded`
							)
						);
					} else {
						setTimeout( check, 50 );
					}
				}
				check();
			} );
		},

		evaluate( fn, ...args ) {
			return callEvaluate( page.evaluate.bind( page ), [], fn, args );
		},

		$eval( selector, fn, ...args ) {
			return callEvaluate(
				page.$eval.bind( page ),
				[ selector ],
				fn,
				args,
				{ withElement: true }
			);
		},

		$$eval( selector, fn, ...args ) {
			return callEvaluate(
				page.$$eval.bind( page ),
				[ selector ],
				fn,
				args,
				{ withElement: true }
			);
		},

		waitForFunction( fn, options = {}, ...args ) {
			return callEvaluate(
				page.waitForFunction.bind( page ),
				[],
				fn,
				args,
				{ extra: options }
			);
		},

		select( selector, ...values ) {
			return page.selectOption( selector, values );
		},

		setViewport( { width, height } ) {
			return page.setViewportSize( { width, height } );
		},

		cookies() {
			return context.cookies( page.url() );
		},

		async deleteCookie( ...cookies ) {
			for ( const { name } of cookies ) {
				await context.clearCookies( { name } );
			}
		},

		// Playwright only sets this per browser context, so send the same
		// Chromium DevTools command as Puppeteer. The session stays open,
		// because the setting ends when it detaches.
		async setJavaScriptEnabled( enabled ) {
			cdpSession = cdpSession || ( await context.newCDPSession( page ) );
			await cdpSession.send( 'Emulation.setScriptExecutionDisabled', {
				value: ! enabled,
			} );
		},
	};

	const proxy = new Proxy( page, {
		get( target, prop ) {
			if ( Object.prototype.hasOwnProperty.call( overrides, prop ) ) {
				return overrides[ prop ];
			}
			const value = target[ prop ];
			return typeof value === 'function' ? value.bind( target ) : value;
		},
	} );

	return proxy;
}

// The Jest environment loads this file without Babel, so it uses CommonJS.
module.exports = { createCompatPage };
