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
 * External dependencies
 */
import type {
	BrowserContext,
	CDPSession,
	Cookie,
	ElementHandle,
	Frame,
	Page,
	Request,
	Response,
} from '@playwright/test';

type PlaywrightWaitUntil =
	| 'load'
	| 'domcontentloaded'
	| 'networkidle'
	| 'commit';

export interface NavigationOptions {
	timeout?: number;
	waitUntil?: PlaywrightWaitUntil | 'networkidle0' | 'networkidle2';
}

export interface SelectorOptions {
	visible?: boolean;
	hidden?: boolean;
	timeout?: number;
}

export interface NetworkIdleOptions {
	idleTime?: number;
	timeout?: number;
	maxInFlight?: number;
}

// Page functions run in the browser, so their arguments are not checked here.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PageFunction = string | ( ( ...args: any[] ) => unknown );

// Playwright's evaluate methods are generic overloads, which a single
// signature cannot describe.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type EvaluateMethod = ( ...args: any[] ) => Promise< any >;

/**
 * The methods the wrapper adds, or adapts from Puppeteer.
 *
 * @since n.e.x.t
 */
export interface CompatOverrides {
	__interceptionEnabled: boolean;
	__ignoreForNetworkIdle( request: Request ): void;
	setRequestInterception( enabled: boolean ): Promise< void >;
	waitForSelector(
		selector: string,
		options?: SelectorOptions
	): Promise< ElementHandle | null >;
	waitForNavigation(
		options?: NavigationOptions
	): Promise< Response | null >;
	goto(
		url: string,
		options?: NavigationOptions
	): Promise< Response | null >;
	reload( options?: NavigationOptions ): Promise< Response | null >;
	waitForNetworkIdle( options?: NetworkIdleOptions ): Promise< void >;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	evaluate( fn: PageFunction, ...args: unknown[] ): Promise< any >;
	$eval(
		selector: string,
		fn: PageFunction,
		...args: unknown[]
	): // eslint-disable-next-line @typescript-eslint/no-explicit-any
	Promise< any >;
	$$eval(
		selector: string,
		fn: PageFunction,
		...args: unknown[]
	): // eslint-disable-next-line @typescript-eslint/no-explicit-any
	Promise< any >;
	waitForFunction(
		fn: PageFunction,
		options?: { timeout?: number; polling?: number | 'raf' },
		...args: unknown[]
	): Promise< unknown >;
	select( selector: string, ...values: string[] ): Promise< string[] >;
	setViewport( viewport: { width: number; height: number } ): Promise< void >;
	cookies(): Promise< Cookie[] >;
	deleteCookie( ...cookies: Array< { name: string } > ): Promise< void >;
	setJavaScriptEnabled( enabled: boolean ): Promise< void >;
}

/**
 * A Playwright page with the Puppeteer-style methods the specs use.
 *
 * @since n.e.x.t
 */
export type CompatPage = Omit< Page, keyof CompatOverrides > & CompatOverrides;

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
 * @param method              Bound Playwright method.
 * @param prefix              Leading arguments, e.g. a selector.
 * @param fn                  Function or expression to evaluate.
 * @param args                Puppeteer-style arguments.
 * @param options             Options.
 * @param options.extra       Trailing options argument for the method.
 * @param options.withElement Whether the browser passes an element first.
 * @return Evaluation result.
 */
function callEvaluate(
	method: EvaluateMethod,
	prefix: string[],
	fn: PageFunction,
	args: unknown[],
	{ extra, withElement }: { extra?: object; withElement?: boolean } = {}
) {
	const trailing = extra ? [ extra ] : [];

	if ( typeof fn !== 'function' || args.length <= 1 ) {
		return method( ...prefix, fn, args[ 0 ], ...trailing );
	}

	const payload = { source: fn.toString(), values: args };

	type Payload = typeof payload;

	/* eslint-disable no-eval */
	const spread = withElement
		? ( element: unknown, { source, values }: Payload ) =>
				( 0, eval )( `(${ source })` )( element, ...values )
		: ( { source, values }: Payload ) =>
				( 0, eval )( `(${ source })` )( ...values );
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
 * @param options Puppeteer options.
 * @return Playwright options.
 */
function toSelectorOptions( options: SelectorOptions = {} ) {
	const { visible, hidden, ...rest } = options;
	let state: 'attached' | 'visible' | 'hidden' = 'attached';
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
 * @param options Puppeteer navigation options.
 * @return Playwright options, and `maxInFlight` when the caller waits for network idle.
 */
function toNavigationOptions( options: NavigationOptions = {} ): {
	playwrightOptions: { timeout?: number; waitUntil?: PlaywrightWaitUntil };
	maxInFlight?: number;
} {
	const { waitUntil, ...rest } = options;
	if ( waitUntil === 'networkidle0' || waitUntil === 'networkidle2' ) {
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
 * @param page    Playwright page.
 * @param context Playwright browser context.
 * @return Wrapped page.
 */
export function createCompatPage(
	page: Page,
	context: BrowserContext
): CompatPage {
	const inFlight = new Set< Request >();
	const ignored = new WeakSet< Request >();
	let cdpSession: CDPSession | undefined;
	// Network idle tracking measures elapsed test time, so the reference
	// date does not apply here or below.
	let lastActivity = Date.now(); // eslint-disable-line sitekit/no-direct-date

	function trackRequest( request: Request ) {
		if ( ! ignored.has( request ) ) {
			inFlight.add( request );
		}
		lastActivity = Date.now(); // eslint-disable-line sitekit/no-direct-date
	}

	function settleRequest( request: Request ) {
		inFlight.delete( request );
		lastActivity = Date.now(); // eslint-disable-line sitekit/no-direct-date
	}

	page.on( 'request', trackRequest );
	// Like Puppeteer, count a request as done once its response headers
	// arrive, even if the body never finishes.
	page.on( 'response', ( response ) => settleRequest( response.request() ) );
	page.on( 'requestfinished', settleRequest );
	page.on( 'requestfailed', settleRequest );
	page.on( 'framenavigated', ( frame: Frame ) => {
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
	 * @param run     Calls the Playwright method with the given options.
	 * @param options Puppeteer navigation options.
	 * @return The navigation method's result.
	 */
	async function navigate(
		run: (
			navigationOptions: ReturnType<
				typeof toNavigationOptions
			>[ 'playwrightOptions' ]
		) => Promise< Response | null >,
		options?: NavigationOptions
	) {
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

	const overrides: CompatOverrides = {
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
				return overrides[ prop as keyof CompatOverrides ];
			}
			const value = target[ prop as keyof Page ];
			return typeof value === 'function' ? value.bind( target ) : value;
		},
	} );

	return proxy as unknown as CompatPage;
}
