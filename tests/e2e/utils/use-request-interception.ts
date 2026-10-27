/**
 * External dependencies
 */
import type { Request, Route } from '@playwright/test';

/**
 * A mocked response, as passed to `request.respond()`.
 */
export interface MockedResponse {
	status?: number;
	headers?: Record< string, string >;
	contentType?: string;
	body?: string | Buffer;
}

/**
 * The request object that request handlers receive.
 */
export interface InterceptedRequest {
	url(): string;
	method(): string;
	headers(): Record< string, string >;
	postData(): string | null | undefined;
	resourceType(): string;
	isNavigationRequest(): boolean;
	respond( response: MockedResponse ): Promise< void >;
	continue(): Promise< void >;
	abort(): Promise< void >;
}

export type RequestHandler = ( request: InterceptedRequest ) => void;

export type RequestInterceptionConfig =
	| RequestHandler
	| Record< string, MockedResponse | RequestHandler >;

export interface RequestCase {
	isMatch( request: InterceptedRequest ): boolean;
	getResponse( request: InterceptedRequest ): MockedResponse;
}

interface TrackedRequest extends InterceptedRequest {
	// Whether the handler responded, continued or aborted.
	handled: boolean;
	request: Request;
}

/**
 * Asks a handler what to do with the target of a redirect.
 *
 * Playwright only routes the first request of a redirect chain. Specs mock
 * URLs that WordPress redirects to, such as Google's OAuth URLs, so each
 * redirect target is offered to the handler too.
 *
 * @since n.e.x.t
 *
 * @param handler Request handler.
 * @param url     Redirect target URL.
 * @return The handler's response, or `null` to follow the redirect.
 */
function resolveRedirectTarget( handler: RequestHandler, url: string ) {
	let result = null as MockedResponse | null;
	handler( {
		url: () => url,
		method: () => 'GET',
		headers: () => ( {} ),
		postData: () => undefined,
		resourceType: () => 'document',
		isNavigationRequest: () => true,
		respond: ( response ) => {
			result = response;
			return Promise.resolve();
		},
		continue: () => Promise.resolve(),
		abort: () => Promise.resolve(),
	} );
	return result;
}

/**
 * Maps a mocked response to Playwright `route.fulfill()` options.
 *
 * @since n.e.x.t
 *
 * @param response             Mocked response.
 * @param response.status      HTTP status. Defaults to 200.
 * @param response.headers     Response headers.
 * @param response.contentType Content type.
 * @param response.body        Response body. Defaults to an empty string.
 * @return Playwright fulfill options.
 */
function toFulfillOptions( {
	status = 200,
	headers,
	contentType,
	body = '',
}: MockedResponse ) {
	return { status, headers, contentType, body };
}

/**
 * Continues a navigation request, offering any redirect target to the
 * handler before the browser follows it.
 *
 * @since n.e.x.t
 *
 * @param route   Playwright route.
 * @param handler Request handler.
 * @return Resolves once the route is fulfilled.
 */
async function continueNavigation( route: Route, handler: RequestHandler ) {
	const response = await route.fetch( { maxRedirects: 0 } );
	const status = response.status();
	const location = response.headers().location;

	if ( status >= 300 && status < 400 && location ) {
		const target = new URL( location, route.request().url() ).href;
		const mocked = resolveRedirectTarget( handler, target );
		if ( mocked ) {
			return route.fulfill( toFulfillOptions( mocked ) );
		}
	}

	return route.fulfill( { response } );
}

/**
 * Wraps a Playwright route in the request object that handlers receive.
 *
 * @since n.e.x.t
 *
 * @param route   Playwright route.
 * @param handler Request handler.
 * @return Request with `respond()`, `continue()` and `abort()` methods.
 */
function toInterceptedRequest(
	route: Route,
	handler: RequestHandler
): TrackedRequest {
	const request = route.request();

	function settle( action: () => Promise< void > ) {
		intercepted.handled = true;
		return action().catch( ( error ) => {
			// A navigation can cancel a request before it is answered.
			if (
				! /Target page|Route is already handled/.test( String( error ) )
			) {
				throw error;
			}
		} );
	}

	const intercepted: TrackedRequest = {
		handled: false,
		request,
		url: () => request.url(),
		method: () => request.method(),
		headers: () => request.headers(),
		postData: () => request.postData(),
		resourceType: () => request.resourceType(),
		isNavigationRequest: () => request.isNavigationRequest(),
		respond: ( response ) =>
			settle( () => route.fulfill( toFulfillOptions( response ) ) ),
		continue: () =>
			settle( () =>
				request.isNavigationRequest()
					? continueNavigation( route, handler )
					: route.fallback()
			),
		abort: () => settle( () => route.abort() ),
	};

	return intercepted;
}

/**
 * Routes all page requests through `handler` while interception is enabled.
 *
 * `page.setRequestInterception()` turns interception on and off. While it is
 * off, requests continue untouched.
 *
 * @since n.e.x.t
 *
 * @param handler Receives the intercepted request.
 * @return Removes the route.
 */
function routeRequests( handler: RequestHandler ) {
	function routeHandler( route: Route ) {
		if ( ! page.__interceptionEnabled ) {
			route.fallback();
			return;
		}
		const intercepted = toInterceptedRequest( route, handler );
		handler( intercepted );
		// A handler that neither responds nor continues leaves the request
		// pending. Network idle checks then ignore it.
		if ( ! intercepted.handled ) {
			page.__ignoreForNetworkIdle( intercepted.request );
		}
	}

	page.route( '**/*', routeHandler );

	return () => page.unroute( '**/*', routeHandler );
}

/**
 * Adds a request handler for intercepting requests.
 *
 * Used intercept HTTP requests during tests with either a callback function
 * or a path:response mapping object.
 *
 * @since 1.0.0
 * @since 1.154.0 Added support for path:response mapping object to simplify request handling.
 * @since n.e.x.t Runs on Playwright routing.
 *
 * @param config Either a callback function or a path:response mapping object.
 * @return Function that can be called to remove the added handler function from the page.
 */
export function useRequestInterception( config: RequestInterceptionConfig ) {
	return routeRequests( ( request ) => {
		// If config is a function, use the original callback pattern.
		if ( typeof config === 'function' ) {
			config( request );
			return;
		}

		// Find matching path pattern.
		const matchingPath = Object.keys( config ).find( ( pattern ) =>
			request.url().match( pattern )
		);
		const response = matchingPath ? config[ matchingPath ] : undefined;

		if ( typeof response === 'function' ) {
			// If response is a function, call it with the request.
			response( request );
		} else if ( response && typeof response === 'object' ) {
			// If response is an object, use it directly.
			request.respond( response );
		} else {
			// No matching path or invalid response, continue the request.
			request.continue();
		}
	} );
}

// TODO: Remove this function and it's usages as part of #6433.
/**
 * Adds shared request handler for intercepting requests.
 *
 * Used intercept HTTP requests during tests with a custom handler function.
 * Returns a function that, when called, stops further request
 * handling/interception.
 *
 * @since 1.93.0
 * @since n.e.x.t Runs on Playwright routing.
 *
 * @param requestCases An array of request cases to add to the shared request interception.
 * @return Methods that can be called to remove the added handler function from the page and add new request cases.
 */
export function useSharedRequestInterception( requestCases: RequestCase[] ) {
	const cases = [ ...requestCases ];
	const cleanUp = routeRequests( ( request ) => {
		const requestCase = cases.find( ( { isMatch } ) => isMatch( request ) );
		if ( requestCase ) {
			request.respond( requestCase.getResponse( request ) );
		} else {
			request.continue();
		}
	} );

	return {
		cleanUp,
		addRequestCases: ( newCases: RequestCase[] ) => {
			cases.push( ...newCases );
		},
	};
}
