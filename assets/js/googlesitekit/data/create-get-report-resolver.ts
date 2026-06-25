/**
 * Creates the shared `getReport` resolver.
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
import invariant from 'invariant';
import { isPlainObject } from 'lodash';

/**
 * WordPress dependencies
 */
import { WPDataRegistry } from '@wordpress/data/build-types/registry';

/**
 * Internal dependencies
 */
import { commonActions } from 'googlesitekit-data';
import {
	ReportRequestOptions,
	getReportCacheKey,
} from '@/js/util/report-options';
import { actions as errorStoreActions } from './create-error-store';

const { clearSelectorError, setErrorForSelector } = errorStoreActions;

/**
 * Creates the `getReport` resolver for a report datastore.
 *
 * The Analytics 4, Search Console, and AdSense report stores share this
 * resolver. `reportID` is only a label that says which part of the plugin
 * asked for the report, and it does not change the report data. So two calls
 * ask for the same report when they differ only in `reportID`. The resolver
 * sends one request for them and shares the saved report.
 *
 * When a request for the same report is already running, the resolver waits
 * for it instead of sending a second one. If that request fails, the resolver
 * copies the error to each waiting call, so every call can read its own error.
 *
 * A call that passes its own `signal` makes its own request and never shares
 * one. That call decides when its request is cancelled, so sharing would let
 * one call's cancellation abort another call's report.
 *
 * @since n.e.x.t
 *
 * @param storeName Report datastore name, such as `modules/analytics-4`.
 * @return Generator resolver for the store's `getReport` selector.
 */
export function createGetReportResolver( storeName: string ) {
	invariant(
		'string' === typeof storeName && storeName,
		'storeName is required.'
	);

	// Report requests that are still running, stored for each registry. Each
	// request is saved under its report cache key. That key leaves out
	// `reportID`, so two calls that differ only in `reportID` find the same
	// running request.
	//
	// This holds the request promise, not just an `isFetching` flag. A waiting
	// call must read the same request's result to copy its error, and a flag
	// can't hand that result back.
	const runningReportRequests = new WeakMap<
		WPDataRegistry,
		Map< string, Promise< unknown > >
	>();

	// This resolver and the `getReport` selector take the same arguments, and
	// neither sets a default. The registry compares the arguments to decide if
	// a call is new, so this resolver must receive the exact arguments the
	// caller sent.
	return function* getReport(
		options?: ReportRequestOptions,
		fetchOptions?: { signal?: AbortSignal }
	): Generator< unknown, void, unknown > {
		const registryResult = yield commonActions.getRegistry();
		const registry = registryResult as WPDataRegistry;

		const existingReport = registry
			.select( storeName )
			.getReport( options, fetchOptions );

		// An earlier call that differs only in `reportID` already loaded this
		// report, so stop without sending a request. Don't clear an existing
		// error here. A report and an error can both apply to these options,
		// and components that show a report error need the error to stay set.
		if ( existingReport ) {
			return;
		}

		// A call that brings its own `signal` decides when its request is
		// cancelled. Sharing one request across such calls would let one
		// call's cancellation abort another call's report. So this call makes
		// its own request and skips the shared map below. Calls without a
		// signal still share one request.
		if ( isPlainObject( fetchOptions ) && fetchOptions?.signal ) {
			yield commonActions.await(
				registry
					.dispatch( storeName )
					.fetchGetReport( options, fetchOptions )
			);
			return;
		}

		let runningRequests = runningReportRequests.get( registry );
		if ( ! runningRequests ) {
			runningRequests = new Map();
			runningReportRequests.set( registry, runningRequests );
		}
		const reportCacheKey = getReportCacheKey( options );

		// A request for the same report may already be running. An earlier
		// call that differs only in `reportID` started it. Wait for that
		// request instead of sending a second one.
		const runningRequest = runningRequests.get( reportCacheKey );
		if ( runningRequest ) {
			// Clear this call's own stale error before waiting. If the shared
			// request now succeeds, this call should not keep an old error.
			// The cached-report branch above keeps an existing error on
			// purpose, because there a report and an error apply at once.
			yield clearSelectorError( 'getReport', [ options ] );

			const awaitResult = yield commonActions.await( runningRequest );
			const { error } = awaitResult as { error?: unknown };

			if ( error ) {
				// Report state drops `reportID`, but error state keeps the full
				// options, so each call has its own error key. The call that
				// sent the request saves the error under its own options. Save
				// it under this call's options too, so `getErrorForSelector`
				// finds it for this call.
				yield setErrorForSelector( error, 'getReport', [ options ] );
			}

			return;
		}

		const request = registry
			.dispatch( storeName )
			.fetchGetReport( options, fetchOptions );
		runningRequests.set( reportCacheKey, request );

		try {
			yield commonActions.await( request );
		} finally {
			runningRequests.delete( reportCacheKey );
		}
	};
}
