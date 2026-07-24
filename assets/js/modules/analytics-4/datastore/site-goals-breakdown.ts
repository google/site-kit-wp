/**
 * `modules/analytics-4` data store: site goals breakdown.
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

/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { get } from 'googlesitekit-api';
import {
	Select,
	commonActions,
	createReducer,
	createRegistrySelector,
} from 'googlesitekit-data';
import { createFetchStore } from '@/js/googlesitekit/data/create-fetch-store';
import { combineStores } from '@/js/googlesitekit/data/utils';
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import { MODULE_SLUG_ANALYTICS_4 } from '@/js/modules/analytics-4/constants';
import { getPreviousDate } from '@/js/util';
import { MODULES_ANALYTICS_4 } from './constants';
import { Report } from './types';

// The breakdown tab structure (which provider/form tabs exist, and whether
// there are unattributed "Other sources" events) is determined over the widest
// dashboard date range rather than the selected one, so changing the date
// range never adds or removes tabs — only the metrics follow the selection.
const BREAKDOWN_DISCOVERY_DAYS = 90;

export interface FormMetadata {
	title: string | null;
}

type FormMetadataMap = Record< string, FormMetadata >;

interface State {
	formMetadata: FormMetadataMap;
}

interface DateRange {
	startDate: string;
	endDate: string;
	compareStartDate?: string;
	compareEndDate?: string;
}

interface TotalsReport {
	totals?: Array< {
		dimensionValues?: Array< { value?: string } >;
		metricValues?: Array< { value?: string } >;
	} >;
}

/**
 * Reads a report's total event count for a date range.
 *
 * @since 1.182.0
 *
 * @param {Object} report        Report with totals per date range.
 * @param {string} dateRangeSlug Date range slug, e.g. `date_range_0`.
 * @return {number} The total event count, or `0` when absent.
 */
function getDateRangeTotal( report: TotalsReport, dateRangeSlug: string ) {
	const row = report.totals?.find(
		( total ) => total?.dimensionValues?.[ 0 ]?.value === dateRangeSlug
	);

	return parseInt( row?.metricValues?.[ 0 ]?.value ?? '', 10 ) || 0;
}

/**
 * Reads a single-range report's total event count.
 *
 * @since 1.182.0
 *
 * @param {Object} report Report with a single totals row.
 * @return {number} The total event count, or `0` when absent.
 */
function getSingleRangeTotal( report: TotalsReport ) {
	return (
		parseInt(
			report.totals?.[ 0 ]?.metricValues?.[ 0 ]?.value ?? '',
			10
		) || 0
	);
}

/**
 * Gets the fixed discovery date range (the last 90 days up to the reference
 * date), mirroring the `audiences` 90-day window precedent.
 *
 * @since 1.182.0
 *
 * @param {Function} getReferenceDate Returns the reference date string.
 * @return {Object} Date range with `startDate` and `endDate`.
 */
function getDiscoveryDates( getReferenceDate: () => string ): DateRange {
	const endDate = getReferenceDate();

	return {
		startDate: getPreviousDate( endDate, BREAKDOWN_DISCOVERY_DAYS ),
		endDate,
	};
}

/**
 * Builds the discovery report options for a breakdown custom dimension.
 *
 * The report groups events by the custom dimension and excludes empty values,
 * so its rows surface the distinct values present within the date range.
 *
 * @since 1.182.0
 *
 * @param {Object}        dates               Date range with `startDate` and `endDate`.
 * @param {string}        customDimensionSlug Custom dimension slug.
 * @param {Array<string>} eventNames          Event names to scope discovery to (empty for none).
 * @return {Object} Report options.
 */
function getBreakdownReportOptions(
	dates: DateRange,
	customDimensionSlug: string,
	eventNames: string[]
) {
	const dimension = `customEvent:${ customDimensionSlug }`;

	return {
		...dates,
		dimensions: [ dimension ],
		dimensionFilters: {
			[ dimension ]: {
				filterType: 'emptyFilter',
				notExpression: true,
			},
			// Scope to the goal's own events so providers/forms from other goal
			// types (e.g. a form plugin in the ecommerce provider dimension) don't
			// leak into the tab list.
			...( eventNames.length
				? {
						eventName: {
							filterType: 'inListFilter',
							value: eventNames,
						},
				  }
				: {} ),
		},
		metrics: [ { name: 'eventCount' } ],
		orderby: [ { metric: { metricName: 'eventCount' }, desc: true } ],
		reportID: `analytics-4_site-goals-breakdown_values_${ customDimensionSlug }`,
	};
}

type BreakdownReportOptions = ReturnType< typeof getBreakdownReportOptions >;

/**
 * Builds the report options that pair each form with one extra dimension's value.
 *
 * The page and provider breakdowns both group the form events by a second
 * dimension, scoped to the given form IDs and ordered by event count, so the
 * busiest value for each form comes first; only the second dimension and the
 * report ID differ. They are kept as two separate reports — rather than one
 * `[ formID, provider, pagePath ]` report — so each yields its busiest value
 * per form independently: a combined report's first row per form would be the
 * busiest provider-and-page pair, not the busiest of each.
 *
 * @since 1.183.0
 *
 * @param {Object}        dates               Date range with `startDate` and `endDate`.
 * @param {string}        customDimensionSlug Form ID custom dimension slug.
 * @param {Array<string>} formIDs             Form IDs to scope to.
 * @param {string}        secondDimension     Dimension paired with the form ID.
 * @param {string}        reportSlug          Report ID suffix identifying the report.
 * @return {Object} Report options.
 */
function getFormPairedDimensionReportOptions(
	dates: DateRange,
	customDimensionSlug: string,
	formIDs: string[],
	secondDimension: string,
	reportSlug: string
) {
	const dimension = `customEvent:${ customDimensionSlug }`;

	return {
		...dates,
		dimensions: [ dimension, secondDimension ],
		dimensionFilters: {
			[ dimension ]: {
				filterType: 'inListFilter',
				value: formIDs,
			},
		},
		metrics: [ { name: 'eventCount' } ],
		orderby: [ { metric: { metricName: 'eventCount' }, desc: true } ],
		reportID: `analytics-4_site-goals-breakdown_${ reportSlug }_${ customDimensionSlug }`,
	};
}

/**
 * Builds the report options that surface the pages each form appears on.
 *
 * @since 1.182.0
 *
 * @param {Object}        dates               Date range with `startDate` and `endDate`.
 * @param {string}        customDimensionSlug Form ID custom dimension slug.
 * @param {Array<string>} formIDs             Form IDs to look up pages for.
 * @return {Object} Report options.
 */
function getFormPagesReportOptions(
	dates: DateRange,
	customDimensionSlug: string,
	formIDs: string[]
) {
	return getFormPairedDimensionReportOptions(
		dates,
		customDimensionSlug,
		formIDs,
		'pagePath',
		'form-pages'
	);
}

type FormPagesReportOptions = ReturnType< typeof getFormPagesReportOptions >;

type FormPagePathsMap = Record< string, string[] >;

/**
 * Builds the report options that surface the event provider each form came from.
 *
 * Every conversion event carries both the form ID dimension and the
 * `googlesitekit_event_provider` dimension, so this report pairs each form ID
 * with its originating provider slug (e.g. `wpforms`, `optin-monster`) without
 * any server-side plugin detection.
 *
 * @since 1.183.0
 *
 * @param {Object}        dates               Date range with `startDate` and `endDate`.
 * @param {string}        customDimensionSlug Form ID custom dimension slug.
 * @param {Array<string>} formIDs             Form IDs to look up providers for.
 * @return {Object} Report options.
 */
function getFormProvidersReportOptions(
	dates: DateRange,
	customDimensionSlug: string,
	formIDs: string[]
) {
	return getFormPairedDimensionReportOptions(
		dates,
		customDimensionSlug,
		formIDs,
		'customEvent:googlesitekit_event_provider',
		'form-providers'
	);
}

type FormProvidersReportOptions = ReturnType<
	typeof getFormProvidersReportOptions
>;

type FormProvidersMap = Record< string, string >;

/**
 * Builds report options for a total event count over compare dates, optionally
 * scoped to a set of attributed dimension values.
 *
 * @since 1.182.0
 *
 * @param {Object}        dates               Compare date range.
 * @param {string}        customDimensionSlug Breakdown custom dimension slug.
 * @param {Array<string>} eventNames          Events to count.
 * @param {Array<string>} [attributedValues]  Dimension values to scope to; omit for all events.
 * @return {Object} Report options.
 */
function getUnattributedReportOptions(
	dates: DateRange,
	customDimensionSlug: string,
	eventNames: string[],
	attributedValues?: string[]
) {
	const dimension = `customEvent:${ customDimensionSlug }`;

	return {
		...dates,
		metrics: [ { name: 'eventCount' } ],
		dimensionFilters: {
			eventName: { filterType: 'inListFilter', value: eventNames },
			...( attributedValues
				? {
						[ dimension ]: {
							filterType: 'inListFilter',
							value: attributedValues,
						},
				  }
				: {} ),
		},
		reportID: `analytics-4_site-goals-breakdown_other-sources-${
			attributedValues ? 'attributed' : 'all'
		}_${ customDimensionSlug }`,
	};
}

type UnattributedReportOptions = ReturnType<
	typeof getUnattributedReportOptions
>;

interface UnattributedEventCounts {
	currentCount: number;
	previousCount: number;
}

interface BreakdownRegistry {
	select: ( store: string ) => {
		getDateRangeDates: ( options: {
			offsetDays?: number;
			compare?: boolean;
		} ) => DateRange;
		getReferenceDate: () => string;
		getFormMetadataForID: ( formID: string ) => FormMetadata | undefined;
	};
	resolveSelect: ( store: string ) => {
		getSettings: () => Promise< unknown >;
		getReport: (
			options:
				| BreakdownReportOptions
				| FormPagesReportOptions
				| FormProvidersReportOptions
				| UnattributedReportOptions
		) => Promise< Report | undefined >;
	};
}

const fetchGetFormMetadataStore = createFetchStore( {
	baseName: 'getFormMetadata',
	controlCallback: ( params: { formIDs: string[] } ) =>
		get( 'modules', MODULE_SLUG_ANALYTICS_4, 'form-metadata', params ),
	reducerCallback: createReducer(
		(
			state: State,
			formMetadata: FormMetadataMap,
			params: { formIDs: string[] }
		) => {
			state.formMetadata = { ...state.formMetadata, ...formMetadata };

			// Resolve every requested ID, even ones the server couldn't echo back
			// (e.g. dropped as a non-positive ID). Without this they'd stay
			// `undefined` and wedge the metadata selectors in a loading state.
			params.formIDs.forEach( ( formID ) => {
				if ( state.formMetadata[ formID ] === undefined ) {
					state.formMetadata[ formID ] = {
						title: null,
					};
				}
			} );
		}
	),
	argsToParams: ( formIDs: string[] ) => ( { formIDs } ),
	validateParams: ( params: { formIDs?: unknown } ) => {
		invariant(
			Array.isArray( params.formIDs ),
			'formIDs must be an array.'
		);
	},
} ) as {
	actions: { fetchGetFormMetadata: ( formIDs: string[] ) => unknown };
};

const baseInitialState: State = {
	formMetadata: {},
};

/**
 * Loads a paired-dimension form report (pages or providers).
 *
 * `getFormPagePaths` and `getFormProviders` resolve the same form-dimension
 * report shape over the same events and date range; only the options builder
 * (and therefore the second dimension) differs.
 *
 * @since 1.183.0
 *
 * @param {Object}        registry            WordPress data registry.
 * @param {Function}      optionsBuilder      Builds the report options to resolve.
 * @param {string}        customDimensionSlug Form ID custom dimension slug.
 * @param {Array<string>} formIDs             Form IDs to scope to.
 * @return {Promise<void>} Resolves once the report has loaded.
 */
async function loadFormDimensionReport(
	registry: BreakdownRegistry,
	optionsBuilder: (
		dates: DateRange,
		customDimensionSlug: string,
		formIDs: string[]
	) => ReturnType< typeof getFormPairedDimensionReportOptions >,
	customDimensionSlug: string,
	formIDs: string[]
): Promise< void > {
	await registry.resolveSelect( MODULES_ANALYTICS_4 ).getSettings();

	const dates = getDiscoveryDates(
		registry.select( CORE_USER ).getReferenceDate
	);

	await registry
		.resolveSelect( MODULES_ANALYTICS_4 )
		.getReport( optionsBuilder( dates, customDimensionSlug, formIDs ) );
}

const baseResolvers = {
	*getBreakdownValues(
		customDimensionSlug: string,
		eventNames: string[] = []
	): Generator< unknown, void, unknown > {
		const registry =
			( yield commonActions.getRegistry() ) as BreakdownRegistry;

		yield commonActions.await(
			registry.resolveSelect( MODULES_ANALYTICS_4 ).getSettings()
		);

		const dates = getDiscoveryDates(
			registry.select( CORE_USER ).getReferenceDate
		);

		yield commonActions.await(
			registry
				.resolveSelect( MODULES_ANALYTICS_4 )
				.getReport(
					getBreakdownReportOptions(
						dates,
						customDimensionSlug,
						eventNames
					)
				)
		);
	},

	*getFormPagePaths(
		customDimensionSlug: string,
		formIDs: string[]
	): Generator< unknown, void, unknown > {
		if ( ! formIDs?.length ) {
			return;
		}

		const registry =
			( yield commonActions.getRegistry() ) as BreakdownRegistry;

		yield commonActions.await(
			loadFormDimensionReport(
				registry,
				getFormPagesReportOptions,
				customDimensionSlug,
				formIDs
			)
		);
	},

	*getFormProviders(
		customDimensionSlug: string,
		formIDs: string[]
	): Generator< unknown, void, unknown > {
		if ( ! formIDs?.length ) {
			return;
		}

		const registry =
			( yield commonActions.getRegistry() ) as BreakdownRegistry;

		yield commonActions.await(
			loadFormDimensionReport(
				registry,
				getFormProvidersReportOptions,
				customDimensionSlug,
				formIDs
			)
		);
	},

	*getUnattributedEventCounts(
		customDimensionSlug: string,
		detectionEventNames: string[] = [],
		attributedValues: string[] = []
	): Generator< unknown, void, unknown > {
		if ( ! detectionEventNames.length || ! attributedValues.length ) {
			return;
		}

		const registry =
			( yield commonActions.getRegistry() ) as BreakdownRegistry;

		yield commonActions.await(
			registry.resolveSelect( MODULES_ANALYTICS_4 ).getSettings()
		);

		const dates = registry
			.select( CORE_USER )
			.getDateRangeDates( { compare: true } );

		yield commonActions.await(
			Promise.all( [
				registry
					.resolveSelect( MODULES_ANALYTICS_4 )
					.getReport(
						getUnattributedReportOptions(
							dates,
							customDimensionSlug,
							detectionEventNames
						)
					),
				registry
					.resolveSelect( MODULES_ANALYTICS_4 )
					.getReport(
						getUnattributedReportOptions(
							dates,
							customDimensionSlug,
							detectionEventNames,
							attributedValues
						)
					),
			] )
		);
	},

	*hasUnattributedEvents(
		customDimensionSlug: string,
		detectionEventNames: string[] = [],
		attributedValues: string[] = []
	): Generator< unknown, void, unknown > {
		if ( ! detectionEventNames.length || ! attributedValues.length ) {
			return;
		}

		const registry =
			( yield commonActions.getRegistry() ) as BreakdownRegistry;

		yield commonActions.await(
			registry.resolveSelect( MODULES_ANALYTICS_4 ).getSettings()
		);

		const dates = getDiscoveryDates(
			registry.select( CORE_USER ).getReferenceDate
		);

		yield commonActions.await(
			Promise.all( [
				registry
					.resolveSelect( MODULES_ANALYTICS_4 )
					.getReport(
						getUnattributedReportOptions(
							dates,
							customDimensionSlug,
							detectionEventNames
						)
					),
				registry
					.resolveSelect( MODULES_ANALYTICS_4 )
					.getReport(
						getUnattributedReportOptions(
							dates,
							customDimensionSlug,
							detectionEventNames,
							attributedValues
						)
					),
			] )
		);
	},

	*getFormMetadata( formIDs: string[] ): Generator< unknown, void, unknown > {
		const registry =
			( yield commonActions.getRegistry() ) as BreakdownRegistry;

		const missingFormIDs = formIDs.filter(
			( formID ) =>
				registry
					.select( MODULES_ANALYTICS_4 )
					.getFormMetadataForID( formID ) === undefined
		);

		if ( missingFormIDs.length > 0 ) {
			yield fetchGetFormMetadataStore.actions.fetchGetFormMetadata(
				missingFormIDs
			);
		}
	},
};

const baseSelectors = {
	/**
	 * Gets the distinct non-empty values for a breakdown custom dimension.
	 *
	 * @since 1.182.0
	 *
	 * @param {Object}        state               Data store's state.
	 * @param {string}        customDimensionSlug Custom dimension slug.
	 * @param {Array<string>} [eventNames]        Event names to scope discovery to (the goal's events).
	 * @return {(Array<string>|undefined)} Distinct values, an empty array when none exist, or `undefined` while loading.
	 */
	getBreakdownValues: createRegistrySelector(
		( select: Select ) =>
			(
				state: State,
				customDimensionSlug: string,
				eventNames: string[] = []
			) => {
				const dates = getDiscoveryDates(
					select( CORE_USER ).getReferenceDate
				);

				const report = select( MODULES_ANALYTICS_4 ).getReport(
					getBreakdownReportOptions(
						dates,
						customDimensionSlug,
						eventNames
					)
				) as Report | undefined;

				if ( report === undefined ) {
					return undefined;
				}

				const values = ( report.rows || [] )
					.map( ( row ) => row.dimensionValues?.[ 0 ]?.value )
					.filter(
						( value ): value is string =>
							!! value && value !== '(not set)'
					);

				return Array.from( new Set( values ) );
			}
	),

	/**
	 * Gets the pages each form appears on, ordered by event count (busiest
	 * first).
	 *
	 * @since 1.182.0
	 *
	 * @param {Object}        state               Data store's state.
	 * @param {string}        customDimensionSlug Form ID custom dimension slug.
	 * @param {Array<string>} formIDs             Form IDs to look up pages for.
	 * @return {(Object|undefined)} Map of form ID to its ordered page paths, or `undefined` while loading.
	 */
	getFormPagePaths: createRegistrySelector(
		( select: Select ) =>
			(
				state: State,
				customDimensionSlug: string,
				formIDs: string[]
			): FormPagePathsMap | undefined => {
				if ( ! formIDs?.length ) {
					return {};
				}

				const dates = getDiscoveryDates(
					select( CORE_USER ).getReferenceDate
				);

				const report = select( MODULES_ANALYTICS_4 ).getReport(
					getFormPagesReportOptions(
						dates,
						customDimensionSlug,
						formIDs
					)
				) as Report | undefined;

				if ( report === undefined ) {
					return undefined;
				}

				const pagesByForm: FormPagePathsMap = {};

				// Rows arrive ordered by event count, so the first page seen for
				// each form is its busiest one.
				for ( const row of report.rows || [] ) {
					const formID = row.dimensionValues?.[ 0 ]?.value;
					const pagePath = row.dimensionValues?.[ 1 ]?.value;

					if ( ! formID || ! pagePath ) {
						continue;
					}

					pagesByForm[ formID ] = pagesByForm[ formID ] || [];

					if ( ! pagesByForm[ formID ].includes( pagePath ) ) {
						pagesByForm[ formID ].push( pagePath );
					}
				}

				return pagesByForm;
			}
	),

	/**
	 * Gets the event provider each form came from.
	 *
	 * Reads the `googlesitekit_event_provider` dimension carried on every
	 * conversion event, mapping each form ID to its originating provider slug
	 * (e.g. `wpforms`, `optin-monster`). This needs no server-side plugin
	 * detection: the source is already attached to the event.
	 *
	 * @since 1.183.0
	 *
	 * @param {Object}        state               Data store's state.
	 * @param {string}        customDimensionSlug Form ID custom dimension slug.
	 * @param {Array<string>} formIDs             Form IDs to look up providers for.
	 * @return {(Object|undefined)} Map of form ID to provider slug, or `undefined` while loading.
	 */
	getFormProviders: createRegistrySelector(
		( select: Select ) =>
			(
				state: State,
				customDimensionSlug: string,
				formIDs: string[]
			): FormProvidersMap | undefined => {
				if ( ! formIDs?.length ) {
					return {};
				}

				const dates = getDiscoveryDates(
					select( CORE_USER ).getReferenceDate
				);

				const report = select( MODULES_ANALYTICS_4 ).getReport(
					getFormProvidersReportOptions(
						dates,
						customDimensionSlug,
						formIDs
					)
				) as Report | undefined;

				if ( report === undefined ) {
					return undefined;
				}

				const providersByForm: FormProvidersMap = {};
				const ambiguousFormIDs = new Set< string >();

				// Form IDs aren't unique across plugins, so one ID can carry more
				// than one provider. When it does we can't name a single creator,
				// so drop the form ID rather than assert the busiest provider.
				for ( const row of report.rows || [] ) {
					const formID = row.dimensionValues?.[ 0 ]?.value;
					const provider = row.dimensionValues?.[ 1 ]?.value;

					if (
						! formID ||
						! provider ||
						ambiguousFormIDs.has( formID )
					) {
						continue;
					}

					const seenProvider = providersByForm[ formID ];

					if ( seenProvider === undefined ) {
						providersByForm[ formID ] = provider;
					} else if ( seenProvider !== provider ) {
						delete providersByForm[ formID ];
						ambiguousFormIDs.add( formID );
					}
				}

				return providersByForm;
			}
	),

	/**
	 * Gets the count of "Other sources" events — the goal's events not attributed
	 * to any tab value — for the current and previous date ranges.
	 *
	 * GA4 reports an unset custom dimension as the literal "(not set)", which a
	 * server-side filter can't reliably isolate, so this subtracts the attributed
	 * total (events whose dimension is one of the tab values) from the overall
	 * total rather than filtering for the unattributed events directly.
	 *
	 * @since 1.182.0
	 *
	 * @param {Object}        state                 Data store's state.
	 * @param {string}        customDimensionSlug   Breakdown custom dimension slug.
	 * @param {Array<string>} [detectionEventNames] Events to count (the goal's events).
	 * @param {Array<string>} [attributedValues]    Dimension values that have a tab.
	 * @return {(Object|undefined)} `{ currentCount, previousCount }`, or `undefined` while loading.
	 */
	getUnattributedEventCounts: createRegistrySelector(
		( select: Select ) =>
			(
				state: State,
				customDimensionSlug: string,
				detectionEventNames: string[] = [],
				attributedValues: string[] = []
			): UnattributedEventCounts | undefined => {
				if (
					! detectionEventNames.length ||
					! attributedValues.length
				) {
					return { currentCount: 0, previousCount: 0 };
				}

				const dates = select( CORE_USER ).getDateRangeDates( {
					compare: true,
				} );
				const allReport = select( MODULES_ANALYTICS_4 ).getReport(
					getUnattributedReportOptions(
						dates,
						customDimensionSlug,
						detectionEventNames
					)
				) as TotalsReport | undefined;

				const attributedReport = select(
					MODULES_ANALYTICS_4
				).getReport(
					getUnattributedReportOptions(
						dates,
						customDimensionSlug,
						detectionEventNames,
						attributedValues
					)
				) as TotalsReport | undefined;

				// Wait for both totals so the difference never briefly equals the
				// full total (which would flash the Other sources tab in then out).
				if (
					allReport === undefined ||
					attributedReport === undefined
				) {
					return undefined;
				}

				return {
					currentCount: Math.max(
						0,
						getDateRangeTotal( allReport, 'date_range_0' ) -
							getDateRangeTotal(
								attributedReport,
								'date_range_0'
							)
					),
					previousCount: Math.max(
						0,
						getDateRangeTotal( allReport, 'date_range_1' ) -
							getDateRangeTotal(
								attributedReport,
								'date_range_1'
							)
					),
				};
			}
	),

	/**
	 * Gets whether any "Other sources" events exist within the discovery window
	 * (the last 90 days), which decides whether the Other sources tab is shown.
	 *
	 * Like the value tabs, this is evaluated over the fixed discovery window
	 * rather than the selected date range, so the tab never appears or vanishes
	 * when the range changes — only its displayed count follows the selection
	 * (see `getUnattributedEventCounts`).
	 *
	 * @since 1.182.0
	 *
	 * @param {Object}        state                 Data store's state.
	 * @param {string}        customDimensionSlug   Breakdown custom dimension slug.
	 * @param {Array<string>} [detectionEventNames] Events to count (the goal's events).
	 * @param {Array<string>} [attributedValues]    Dimension values that have a tab.
	 * @return {(boolean|undefined)} Whether unattributed events exist, or `undefined` while loading.
	 */
	hasUnattributedEvents: createRegistrySelector(
		( select: Select ) =>
			(
				state: State,
				customDimensionSlug: string,
				detectionEventNames: string[] = [],
				attributedValues: string[] = []
			): boolean | undefined => {
				if (
					! detectionEventNames.length ||
					! attributedValues.length
				) {
					return false;
				}

				const dates = getDiscoveryDates(
					select( CORE_USER ).getReferenceDate
				);
				const allReport = select( MODULES_ANALYTICS_4 ).getReport(
					getUnattributedReportOptions(
						dates,
						customDimensionSlug,
						detectionEventNames
					)
				) as TotalsReport | undefined;
				const attributedReport = select(
					MODULES_ANALYTICS_4
				).getReport(
					getUnattributedReportOptions(
						dates,
						customDimensionSlug,
						detectionEventNames,
						attributedValues
					)
				) as TotalsReport | undefined;

				// Wait for both totals so the difference never briefly equals the
				// full total (which would flash the Other sources tab in then out).
				if (
					allReport === undefined ||
					attributedReport === undefined
				) {
					return undefined;
				}

				return (
					getSingleRangeTotal( allReport ) >
					getSingleRangeTotal( attributedReport )
				);
			}
	),

	/**
	 * Gets resolved metadata for a single form ID from state.
	 *
	 * @since 1.182.0
	 *
	 * @param {Object} state  Data store's state.
	 * @param {string} formID Form ID.
	 * @return {(Object|undefined)} The form metadata, or `undefined` while loading.
	 */
	getFormMetadataForID(
		state: State,
		formID: string
	): FormMetadata | undefined {
		return state.formMetadata[ formID ];
	},

	/**
	 * Gets metadata for a set of form IDs.
	 *
	 * @since 1.182.0
	 *
	 * @param {Object}        state   Data store's state.
	 * @param {Array<string>} formIDs Form IDs to resolve.
	 * @return {(Object|undefined)} Map of form ID to metadata, or `undefined` while any is still loading.
	 */
	getFormMetadata: createRegistrySelector(
		( select: Select ) => ( state: State, formIDs: string[] ) => {
			const metadataByID: FormMetadataMap = {};

			for ( const formID of formIDs ) {
				const metadata = select(
					MODULES_ANALYTICS_4
				).getFormMetadataForID( formID ) as FormMetadata | undefined;

				// Any entry still loading means the set isn't ready yet.
				if ( metadata === undefined ) {
					return undefined;
				}

				metadataByID[ formID ] = metadata;
			}

			return metadataByID;
		}
	),

	/**
	 * Gets the display labels for a set of form IDs.
	 *
	 * @since 1.182.0
	 *
	 * @param {Object}        state   Data store's state.
	 * @param {Array<string>} formIDs Form IDs to label.
	 * @return {(Object|undefined)} Map of form ID to display label, or `undefined` while any metadata is still loading.
	 */
	getFormTitles: createRegistrySelector(
		( select: Select ) => ( state: State, formIDs: string[] ) => {
			const metadata =
				select( MODULES_ANALYTICS_4 ).getFormMetadata( formIDs );

			if ( metadata === undefined ) {
				return undefined;
			}

			const labels: Record< string, string > = {};

			for ( const formID of formIDs ) {
				const { title } = metadata[ formID ];

				// `null` means resolved-but-unresolvable; a real title of "0"
				// must still render, so check against null rather than falsy.
				labels[ formID ] =
					title !== null
						? sprintf(
								/* translators: %s: form title, e.g. "Contact". */
								__( '“%s” form', 'google-site-kit' ),
								title
						  )
						: sprintf(
								/* translators: %s: form ID shown as the fallback tab label when no form title resolves, such as "12" or the campaign slug "jnpfwoygltxurnayflew". */
								__( 'Form #%s', 'google-site-kit' ),
								formID
						  );
			}

			return labels;
		}
	),
};

// `combineStores` is untyped JS and returns `Object`, so the combined shape is
// asserted here to keep the re-exports typed.
interface Store {
	initialState: State;
	actions: Record< string, unknown >;
	controls: Record< string, unknown >;
	reducer: Record< string, unknown >;
	resolvers: Record< string, unknown >;
	selectors: Record< string, unknown >;
}

const store = combineStores( fetchGetFormMetadataStore, {
	initialState: baseInitialState,
	resolvers: baseResolvers,
	selectors: baseSelectors,
} ) as Store;

export const initialState = store.initialState;
export const actions = store.actions;
export const controls = store.controls;
export const reducer = store.reducer;
export const resolvers = store.resolvers;
export const selectors = store.selectors;

export default store;
