/**
 * PDF export orchestrator: drives the MVP export pipeline.
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
import { pdf } from '@react-pdf/renderer';
import { FC } from 'react';

/**
 * WordPress dependencies
 */
import { useCallback, useEffect, useReducer, useRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import {
	Registry,
	Select,
	useDispatch,
	useRegistry,
	useSelect,
} from 'googlesitekit-data';
import { CORE_PDF } from '@/js/googlesitekit/datastore/pdf/constants';
import { CORE_SITE } from '@/js/googlesitekit/datastore/site/constants';
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import { CORE_MODULES } from '@/js/googlesitekit/modules/datastore/constants';
import { CORE_WIDGETS } from '@/js/googlesitekit/widgets/datastore/constants';
import {
	PDFReportDates,
	Widget,
	WidgetArea,
} from '@/js/googlesitekit/widgets/types';
import useViewContext from '@/js/hooks/useViewContext';
import useViewOnly from '@/js/hooks/useViewOnly';
import { getPreviousDate, trackEvent } from '@/js/util';
import { ORDERED_MAIN_DASHBOARD_CONTEXTS } from './constants';
import { registerPDFFonts } from './pdf-fonts-react';
import { SECTION_ICONS } from './pdf-icons';
import { getPDFFilename, triggerDownload } from './pdf-utils';
import { WidgetWithPDF, isActivePDFWidget } from './pdf-widget-eligibility';
import DashboardReport from './shared-react-pdf-components/DashboardReport';
import { PDFHeaderSection, PDFReportArea, PDFReportWidget } from './types';

const STAGE_IDLE = 'IDLE' as const;
const STAGE_LOADING = 'LOADING' as const;
const STAGE_BUILDING = 'BUILDING' as const;
const STAGE_COMPLETE = 'COMPLETE' as const;
const STAGE_ERROR = 'ERROR' as const;

type Stage =
	| typeof STAGE_IDLE
	| typeof STAGE_LOADING
	| typeof STAGE_BUILDING
	| typeof STAGE_COMPLETE
	| typeof STAGE_ERROR;

const VALID_TRANSITIONS: Record< Stage, readonly Stage[] > = {
	[ STAGE_IDLE ]: [ STAGE_LOADING ],
	[ STAGE_LOADING ]: [ STAGE_BUILDING, STAGE_ERROR, STAGE_IDLE ],
	[ STAGE_BUILDING ]: [ STAGE_COMPLETE, STAGE_ERROR, STAGE_IDLE ],
	[ STAGE_COMPLETE ]: [],
	[ STAGE_ERROR ]: [],
};

const LOADING_TIMEOUT_MS = 45 * 1000;
const BUILDING_TIMEOUT_MS = 15 * 1000;
const COMPLETE_UNMOUNT_DELAY_MS = 2 * 1000;
const BLOB_REVOKE_DELAY_MS = 30 * 1000;
// Progress budget reserved for the data-loading stage; BUILDING fills the rest.
const LOADING_PROGRESS_MAX = 90;

interface State {
	/** The current stage of the export state machine. */
	stage: Stage;
}

type Action = { type: 'TRANSITION'; nextStage: Stage };

const initialState: State = { stage: STAGE_IDLE };

/**
 * Validates and applies stage transitions for the export state machine.
 *
 * @since 1.181.0
 *
 * @param state  Current reducer state.
 * @param action Dispatched action with a `nextStage` payload.
 * @return Next state, unchanged when the transition is invalid.
 */
function reducer( state: State, action: Action ): State {
	if ( action.type === 'TRANSITION' ) {
		const allowed = VALID_TRANSITIONS[ state.stage ];
		if ( ! allowed.includes( action.nextStage ) ) {
			return state;
		}
		return { stage: action.nextStage };
	}

	return state;
}

/**
 * Determines whether the given error is an `AbortError` DOMException.
 *
 * @since 1.181.0
 *
 * @param error The caught value.
 * @return `true` when the error is an AbortError.
 */
function isAbortError( error: unknown ): boolean {
	return error instanceof DOMException && error.name === 'AbortError';
}

/**
 * Throws an `AbortError` when the signal has been aborted.
 *
 * `getData` swallows abort and resolves normally, so the orchestrator cannot
 * rely on its return value to detect cancellation: it must check the signal
 * after every await.
 *
 * @since 1.181.0
 *
 * @param  signal The abort signal to check.
 * @return {void}
 */
function throwIfAborted( signal: AbortSignal ): void {
	if ( signal.aborted ) {
		throw new DOMException( 'Aborted', 'AbortError' );
	}
}

/**
 * Returns a promise that resolves on the next animation frame, or rejects
 * if the signal is aborted before the frame fires.
 *
 * @since 1.181.0
 *
 * @param signal Abort signal to observe.
 * @return Resolves on the next frame, rejects on abort.
 */
function nextFrame( signal: AbortSignal ): Promise< void > {
	return new Promise( ( resolve, reject ) => {
		if ( signal.aborted ) {
			reject( new DOMException( 'Aborted', 'AbortError' ) );
			return;
		}

		function onAbort() {
			global.cancelAnimationFrame( frameID );
			reject( new DOMException( 'Aborted', 'AbortError' ) );
		}

		const frameID = global.requestAnimationFrame( () => {
			signal.removeEventListener( 'abort', onAbort );
			resolve();
		} );

		signal.addEventListener( 'abort', onAbort, { once: true } );
	} );
}

export interface PDFExportOrchestratorProps {
	/** Called when the export finishes, cancels, or fails, so the parent can unmount the orchestrator. */
	onComplete: () => void;
}

const PDFExportOrchestrator: FC< PDFExportOrchestratorProps > = ( {
	onComplete,
} ) => {
	const [ , dispatch ] = useReducer( reducer, initialState );
	// `@wordpress/data` types `useRegistry()` as `Function`, which does not
	// overlap with Site Kit's `Registry` type, so TypeScript needs the
	// `unknown` step between the two.
	const registry = useRegistry() as unknown as Registry;
	const { setStatus, setProgress, setBlob, clearExport, clearCancelRequest } =
		useDispatch( CORE_PDF );

	const viewContext = useViewContext();
	const viewOnly = useViewOnly();

	const cancelRequested = useSelect(
		( select: Select ) => select( CORE_PDF ).isCancelRequested(),
		[]
	);
	const siteName = useSelect(
		( select: Select ) => select( CORE_SITE ).getSiteName(),
		[]
	);
	const referenceSiteURL = useSelect(
		( select: Select ) => select( CORE_SITE ).getReferenceSiteURL(),
		[]
	);
	const dateRange = useSelect(
		( select: Select ) => select( CORE_USER ).getDateRange(),
		[]
	);
	const dashboardURL = useSelect(
		( select: Select ) => select( CORE_SITE ).getGoLinkURL( 'dashboard' ),
		[]
	);
	// A golink with this key opens the Site Kit dashboard with the email
	// reporting setup panel. The key is registered in
	// `Email_Reporting::register()`.
	const emailReportingSetupURL = useSelect(
		( select: Select ) =>
			select( CORE_SITE ).getGoLinkURL(
				'manage-subscription-email-reporting'
			),
		[]
	);
	const selectedContextSlugs = useSelect(
		( select: Select ) =>
			select( CORE_PDF ).getSelectedContextSlugs() || [],
		[]
	);
	const selectedWidgetSlugs = useSelect(
		( select: Select ) => select( CORE_PDF ).getSelectedWidgetSlugs() || [],
		[]
	);
	const dates = useSelect(
		( select: Select ) =>
			select( CORE_USER ).getDateRangeDates( {
				compare: true,
				// The PDF reporting period excludes the current day, so end the
				// range on the day before the reference date.
				referenceDate: getPreviousDate(
					select( CORE_USER ).getReferenceDate(),
					1
				),
			} ) as PDFReportDates,
		[]
	);
	const viewableModules = useSelect(
		( select: Select ) =>
			viewOnly ? select( CORE_USER ).getViewableModules() : undefined,
		[ viewOnly ]
	);

	const abortControllerRef = useRef< AbortController | null >( null );
	const stageTimeoutRef = useRef< ReturnType< typeof setTimeout > | null >(
		null
	);
	const completeTimeoutRef = useRef< ReturnType< typeof setTimeout > | null >(
		null
	);
	const revokeTimeoutRef = useRef< ReturnType< typeof setTimeout > | null >(
		null
	);
	const timeoutAbortRef = useRef( false );
	const userCancelRef = useRef( false );
	const onCompleteRef = useRef( onComplete );

	useEffect( () => {
		onCompleteRef.current = onComplete;
	}, [ onComplete ] );

	const clearStageTimeout = useCallback( () => {
		if ( stageTimeoutRef.current !== null ) {
			clearTimeout( stageTimeoutRef.current );
			stageTimeoutRef.current = null;
		}
	}, [] );

	const armStageTimeout = useCallback(
		( durationMS: number ) => {
			clearStageTimeout();
			stageTimeoutRef.current = setTimeout( () => {
				stageTimeoutRef.current = null;
				timeoutAbortRef.current = true;
				abortControllerRef.current?.abort();
			}, durationMS );
		},
		[ clearStageTimeout ]
	);

	useEffect( () => {
		if ( cancelRequested ) {
			userCancelRef.current = true;
			abortControllerRef.current?.abort();
			clearCancelRequest();
		}
	}, [ cancelRequested, clearCancelRequest ] );

	useEffect( () => {
		const controller = new AbortController();
		abortControllerRef.current = controller;
		const { signal } = controller;

		function beforeUnloadHandler( event: BeforeUnloadEvent ) {
			event.preventDefault();
			// Most browsers ignore the string, but assigning it keeps the legacy contract.
			event.returnValue = '';
		}
		global.addEventListener( 'beforeunload', beforeUnloadHandler );

		const reportSiteName = typeof siteName === 'string' ? siteName : '';
		const referenceName =
			reportSiteName.length > 0 ? reportSiteName : referenceSiteURL || '';
		const resolvedDateRange =
			typeof dateRange === 'string' ? dateRange : undefined;

		// Resolve the lazy component chunk up-front and fetch widget data.
		// @react-pdf does not honour Suspense, so the document tree must hold
		// a concrete component before rendering starts.
		async function resolveWidgetData(
			widget: WidgetWithPDF
		): Promise<
			Pick< PDFReportWidget, 'Component' | 'data' | 'chartImages' >
		> {
			let Component = widget.pdf.Component;

			if ( typeof Component.preload === 'function' ) {
				const loadedModule = await Component.preload();
				throwIfAborted( signal );
				Component = loadedModule.default;
			}

			const result = await widget.pdf.getData( {
				registry,
				dates,
				signal,
				// The same module visibility the area discovery used, so a
				// loader that composes several modules' tiles (Key Metrics) can
				// keep only the tiles the user can view, as the dashboard does.
				viewableModules,
			} );

			throwIfAborted( signal );

			return {
				Component,
				data: result?.data ?? null,
				chartImages: result?.chartImages,
			};
		}

		async function run() {
			let currentStage: Stage = STAGE_LOADING;
			const eventCategory = `${ viewContext }_pdf_generation`;

			try {
				dispatch( { type: 'TRANSITION', nextStage: STAGE_LOADING } );
				setStatus( 'progress' );
				setProgress( 0 );

				armStageTimeout( LOADING_TIMEOUT_MS );
				// Yield a frame so the progress snackbar paints before loading.
				await nextFrame( signal );

				// Discovery: walk the registry inline (the orchestrator owns the
				// contexts → areas → widgets walk; there is no centralised
				// PDF-aware selector). `selectedContextSlugs`,
				// `selectedWidgetSlugs`, `dates` and `viewableModules` are
				// snapshotted once above. Nothing below re-reads reactive state.
				const { resolveSelect } = registry;
				// `Registry` types `select` as `Function`. Narrow it to
				// `Select` so `isActivePDFWidget` can take it.
				const select = registry.select as Select;

				// Wait for modules to load, or `isModuleConnected` returns
				// `undefined` and `isActivePDFWidget` drops every widget
				// that needs a module from the report.
				await resolveSelect( CORE_MODULES ).getModules();
				throwIfAborted( signal );

				const widgetsSelect = select( CORE_WIDGETS ) as {
					getWidgetAreas: ( contextSlug: string ) => WidgetArea[];
					getWidgets: (
						areaSlug: string,
						options?: { modules?: string[] }
					) => Widget[];
				};
				const discoveredAreas: Array< {
					areaSlug: string;
					areaContextSlug: string;
					areaTitle: string;
					widgets: WidgetWithPDF[];
				} > = [];
				// An area can be assigned to more than one context; track the
				// slugs already discovered so a shared area is not rendered (and
				// chipped) twice when multiple of its contexts are selected.
				const discoveredAreaSlugs = new Set< string >();
				// An area can hold several PDF widgets. Export only the ones the
				// user kept checked, not every widget in the area.
				const selectedWidgetSlugSet = new Set( selectedWidgetSlugs );

				// Reorder the selected contexts into the dashboard's order, so
				// the report's sections follow that order, not the stored order.
				const selectedContextSlugSet = new Set( selectedContextSlugs );
				const orderedSelectedContextSlugs =
					ORDERED_MAIN_DASHBOARD_CONTEXTS.filter( ( contextSlug ) =>
						selectedContextSlugSet.has( contextSlug )
					);

				orderedSelectedContextSlugs.forEach( ( contextSlug ) => {
					const contextAreas: WidgetArea[] =
						widgetsSelect.getWidgetAreas( contextSlug ) || [];

					contextAreas.forEach( ( area ) => {
						if ( discoveredAreaSlugs.has( area.slug ) ) {
							return;
						}

						const pdfWidgets: WidgetWithPDF[] = widgetsSelect
							.getWidgets( area.slug, {
								modules: viewableModules || undefined,
							} )
							.filter( ( widget ): widget is WidgetWithPDF =>
								isActivePDFWidget( widget, select )
							)
							.filter( ( widget ) =>
								selectedWidgetSlugSet.has( widget.slug )
							);

						if ( pdfWidgets.length === 0 ) {
							return;
						}

						discoveredAreaSlugs.add( area.slug );
						discoveredAreas.push( {
							areaSlug: area.slug,
							areaContextSlug: contextSlug,
							areaTitle:
								area.pdfReportTitle ||
								area.pdfTitle ||
								area.title ||
								'',
							widgets: pdfWidgets,
						} );
					} );
				} );

				const flatWidgets = discoveredAreas.flatMap(
					( area ) => area.widgets
				);

				if ( flatWidgets.length === 0 ) {
					throw new Error( 'No PDF-capable widgets to export.' );
				}

				/**
				 * Loading: resolve each widget's data sequentially. The report
				 * skips a failing widget, and the export only errors when
				 * every widget fails.
				 */
				const loaded = new Map<
					string,
					Pick<
						PDFReportWidget,
						'Component' | 'data' | 'chartImages'
					>
				>();
				let failureCount = 0;

				for ( let index = 0; index < flatWidgets.length; index++ ) {
					const widget = flatWidgets[ index ];

					try {
						loaded.set(
							widget.slug,
							await resolveWidgetData( widget )
						);
					} catch ( error ) {
						if ( isAbortError( error ) ) {
							throw error;
						}

						failureCount++;
						loaded.set( widget.slug, {
							Component: null,
							data: null,
							chartImages: undefined,
						} );
					}

					setProgress(
						Math.round(
							( ( index + 1 ) / flatWidgets.length ) *
								LOADING_PROGRESS_MAX
						)
					);
				}

				if ( failureCount === flatWidgets.length ) {
					throw new Error( 'All PDF widgets failed to load.' );
				}

				throwIfAborted( signal );
				currentStage = STAGE_BUILDING;
				dispatch( { type: 'TRANSITION', nextStage: STAGE_BUILDING } );
				armStageTimeout( BUILDING_TIMEOUT_MS );

				registerPDFFonts();
				throwIfAborted( signal );

				// Group the discovered areas by dashboard context, so a context
				// with more than one area renders as one section under one chip,
				// not a chip per area. Traffic is the case, since it holds the
				// traffic charts and the audience tiles. The `Map` keeps the
				// first-seen order.
				const contextGroups = new Map<
					string,
					{ title: string; widgets: WidgetWithPDF[] }
				>();

				discoveredAreas.forEach( ( area ) => {
					const group = contextGroups.get( area.areaContextSlug ) ?? {
						title: '',
						widgets: [],
					};

					// The title comes from the first area that has one. The areas
					// of a PDF context share the same `pdfTitle`, so this is the
					// context's title.
					if ( ! group.title && area.areaTitle ) {
						group.title = area.areaTitle;
					}
					group.widgets.push( ...area.widgets );
					contextGroups.set( area.areaContextSlug, group );
				} );

				const areas: PDFReportArea[] = Array.from(
					contextGroups,
					( [ contextSlug, group ] ) => ( {
						areaSlug: contextSlug,
						areaTitle: group.title,
						widgets: group.widgets.map( ( widget ) => {
							const entry = loaded.get( widget.slug );
							return {
								slug: widget.slug,
								label: widget.pdf.label,
								Component: entry?.Component ?? null,
								data: entry?.data ?? null,
								chartImages: entry?.chartImages,
							};
						} ),
					} )
				);

				// One header chip per context, in context order, with the icon
				// from the context slug.
				const sections: PDFHeaderSection[] = Array.from(
					contextGroups,
					( [ contextSlug, group ] ) => ( {
						slug: contextSlug,
						label: group.title,
						Icon: SECTION_ICONS[ contextSlug ],
					} )
				);

				const filename = getPDFFilename(
					referenceName,
					resolvedDateRange
				);

				const document = (
					<DashboardReport
						siteName={ reportSiteName }
						siteURL={ referenceSiteURL || '' }
						dashboardURL={ dashboardURL || '' }
						dateRange={ {
							startDate: dates.startDate,
							endDate: dates.endDate,
						} }
						sections={ sections }
						helpCenterURL="https://sitekit.withgoogle.com/support/?doc=get-support"
						privacyPolicyURL="https://policies.google.com/privacy"
						areas={ areas }
						emailReportingSetupURL={ emailReportingSetupURL }
					/>
				);

				const blob = await pdf( document ).toBlob();

				throwIfAborted( signal );

				const blobURL = URL.createObjectURL( blob );
				setBlob( { url: blobURL, filename } );

				triggerDownload( blobURL, filename );
				revokeTimeoutRef.current = setTimeout( () => {
					revokeTimeoutRef.current = null;
					URL.revokeObjectURL( blobURL );
				}, BLOB_REVOKE_DELAY_MS );

				clearStageTimeout();
				dispatch( { type: 'TRANSITION', nextStage: STAGE_COMPLETE } );
				trackEvent(
					eventCategory,
					'pdf_generation_complete',
					selectedContextSlugs.join( ',' )
				);
				setStatus( 'success' );

				completeTimeoutRef.current = setTimeout( () => {
					completeTimeoutRef.current = null;
					onCompleteRef.current();
				}, COMPLETE_UNMOUNT_DELAY_MS );
			} catch ( error ) {
				clearStageTimeout();

				// User cancel and teardown (unmount/navigate) are both silent
				// (IDLE). Only a user cancel fires a tracking event; teardown
				// aborts are not intentional user actions.
				if ( isAbortError( error ) && ! timeoutAbortRef.current ) {
					if ( userCancelRef.current ) {
						trackEvent(
							eventCategory,
							'pdf_generation_cancel',
							currentStage.toLowerCase()
						);
					}
					dispatch( {
						type: 'TRANSITION',
						nextStage: STAGE_IDLE,
					} );
					clearExport();
					onCompleteRef.current();
					return;
				}

				// Stop any request that is still running, so it ends now
				// instead of finishing in the background after the user sees
				// the error. On the stage-timeout path, `abort()` already ran,
				// so this call does nothing.
				abortControllerRef.current?.abort();

				const errorLabel = timeoutAbortRef.current
					? `${ currentStage.toLowerCase() }_timeout`
					: currentStage.toLowerCase();

				trackEvent( eventCategory, 'pdf_generation_error', errorLabel );
				dispatch( { type: 'TRANSITION', nextStage: STAGE_ERROR } );
				setStatus( 'error' );
				onCompleteRef.current();
			}
		}

		run();

		return () => {
			global.removeEventListener( 'beforeunload', beforeUnloadHandler );
			clearStageTimeout();
			if ( completeTimeoutRef.current !== null ) {
				clearTimeout( completeTimeoutRef.current );
				completeTimeoutRef.current = null;
			}
			if ( revokeTimeoutRef.current !== null ) {
				clearTimeout( revokeTimeoutRef.current );
				revokeTimeoutRef.current = null;
			}
			controller.abort();
		};
		// Runs once on mount. Site and user data are read at start, not re-fetched mid-export.
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [] );

	return null;
};

export default PDFExportOrchestrator;
