/**
 * DashboardPageSpeedWidget PDF data loader.
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
 * Internal dependencies
 */
import { CORE_SITE } from '@/js/googlesitekit/datastore/site/constants';
import {
	FieldMetrics,
	LabMetrics,
	PSIReport,
	extractFieldMetrics,
	extractLabMetrics,
} from '@/js/modules/pagespeed-insights/components/common/reportMetrics';
import {
	MODULES_PAGESPEED_INSIGHTS,
	STRATEGY_DESKTOP,
	STRATEGY_MOBILE,
} from '@/js/modules/pagespeed-insights/datastore/constants';

/** The two strategies fetched in parallel for the PDF Speed section. */
const PDF_PAGESPEED_STRATEGIES = [ STRATEGY_MOBILE, STRATEGY_DESKTOP ] as const;

/**
 * Minimal registry shape — only the stores and selectors this loader actually
 * calls. Typed structurally (store: string) following the same pattern as
 * other Site Kit data loaders (e.g. site-goals-settings.ts).
 */
interface SpeedPDFRegistry {
	/** Returns the selectors that read the store without starting a fetch. */
	select: ( storeName: string ) => {
		/** Returns the report already in the store, or undefined before one is fetched. */
		getReport: ( url: string, strategy: string ) => PSIReport | undefined;
	};
	resolveSelect: ( storeName: string ) => {
		getCurrentReferenceURL: () => Promise< string >;
		getReport: (
			url: string,
			strategy: string,
			options?: { signal: AbortSignal }
		) => Promise< PSIReport | null >;
	};
	dispatch: ( storeName: string ) => {
		invalidateResolution: ( selectorName: string, args: unknown[] ) => void;
	};
}

export interface GetPDFDataParams {
	/** The Site Kit data registry the loader reads reports through. */
	registry: SpeedPDFRegistry;
	// PageSpeed reports are point-in-time; dates from the orchestrator are unused.
	dates: unknown;
	/** The export's abort signal. When it aborts, the loader resolves with null data. */
	signal: AbortSignal;
}

export interface StrategyData {
	/** The lab metrics from the report's Lighthouse audits. */
	lab: LabMetrics;
	/** The field metrics from real user data, or null when the report has none. */
	field: FieldMetrics | null;
}

export interface SpeedPDFData {
	/** Per-strategy metrics, or `null` when the export is canceled. */
	data: {
		/** The mobile strategy's metrics, or null when the mobile report failed. */
		mobile: StrategyData | null;
		/** The desktop strategy's metrics, or null when the desktop report failed. */
		desktop: StrategyData | null;
	} | null;
}

/**
 * Fetches PageSpeed Insights reports for mobile and desktop strategies and
 * returns the lab and field metrics for each, structured for the PDF component.
 *
 * Per-strategy failures are isolated — only the failing strategy's data is null
 * in the returned object so the other strategy still renders. The loader throws
 * only when both strategies fail so the orchestrator can transition the whole
 * widget to its error state.
 *
 * @since 1.183.0
 *
 * @param params          Loader parameters from the PDF orchestrator.
 * @param params.registry Registry with resolveSelect and dispatch for Site Kit stores.
 * @param params.signal   Abort signal for canceling in-flight requests.
 * @return Resolved speed data with lab and field metrics per strategy.
 */
export default async function getPDFData( {
	registry,
	signal,
}: GetPDFDataParams ): Promise< SpeedPDFData > {
	if ( signal.aborted ) {
		return { data: null };
	}

	const referenceURL = await registry
		.resolveSelect( CORE_SITE )
		.getCurrentReferenceURL();

	// Invalidate any stale resolver-completion state left over from a previous
	// aborted or failed export. AbortSignals serialize identically in the
	// registry, so { signal } always resolves to the same cache key and the
	// invalidation reliably clears any previously poisoned resolution.
	const { invalidateResolution } = registry.dispatch(
		MODULES_PAGESPEED_INSIGHTS
	);
	invalidateResolution( 'getReport', [
		referenceURL,
		STRATEGY_MOBILE,
		{ signal },
	] );
	invalidateResolution( 'getReport', [
		referenceURL,
		STRATEGY_DESKTOP,
		{ signal },
	] );

	const psiSelect = registry.select( MODULES_PAGESPEED_INSIGHTS );

	const [ mobileReport, desktopReport ] = await Promise.all(
		PDF_PAGESPEED_STRATEGIES.map( ( strategy ) => {
			// Use data already in the store (e.g. fetched by the dashboard) to
			// avoid an unnecessary round-trip to the PageSpeed API. A fresh
			// resolveSelect is only needed when the store has no data yet.
			const cached = psiSelect.getReport( referenceURL, strategy );
			if ( cached !== undefined ) {
				return Promise.resolve( cached );
			}

			return registry
				.resolveSelect( MODULES_PAGESPEED_INSIGHTS )
				.getReport( referenceURL, strategy, { signal } )
				.catch( () => null );
		} )
	);

	if ( signal.aborted ) {
		return { data: null };
	}

	const mobile = mobileReport
		? {
				lab: extractLabMetrics( mobileReport ),
				field: extractFieldMetrics( mobileReport ),
		  }
		: null;
	const desktop = desktopReport
		? {
				lab: extractLabMetrics( desktopReport ),
				field: extractFieldMetrics( desktopReport ),
		  }
		: null;

	if ( ! mobile && ! desktop ) {
		throw new Error(
			'Site Kit: PageSpeed Insights reports failed for both strategies.'
		);
	}

	return { data: { mobile, desktop } };
}
