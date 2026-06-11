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
	Select,
	useDispatch,
	useRegistry,
	useSelect,
} from 'googlesitekit-data';
import { CORE_PDF } from '@/js/googlesitekit/datastore/pdf/constants';
import { CORE_SITE } from '@/js/googlesitekit/datastore/site/constants';
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import { CORE_WIDGETS } from '@/js/googlesitekit/widgets/datastore/constants';
import type {
	PDFReportDates,
	Widget,
	WidgetArea,
	WidgetPDFConfig,
} from '@/js/googlesitekit/widgets/types';
import useViewOnly from '@/js/hooks/useViewOnly';
import { getPreviousDate } from '@/js/util';
import { registerPDFFonts } from './pdf-fonts-react';
import { getPDFFilename, triggerDownload } from './pdf-utils';
import DashboardReport from './shared-react-pdf-components/DashboardReport';
import type { PDFReportArea, PDFReportWidget } from './types';

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

type WidgetWithPDF = Widget & { pdf: WidgetPDFConfig };

/**
 * Determines whether a registry widget declares a PDF export configuration.
 *
 * @since n.e.x.t
 *
 * @param widget Registry widget.
 * @return `true` when the widget has a `pdf` config.
 */
function hasPDFConfig( widget: Widget ): widget is WidgetWithPDF {
	return !! widget.pdf;
}

interface State {
	stage: Stage;
}

type Action = { type: 'TRANSITION'; nextStage: Stage };

const initialState: State = { stage: STAGE_IDLE };

/**
 * Validates and applies stage transitions for the export state machine.
 *
 * @since n.e.x.t
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
 * @since n.e.x.t
 *
 * @param error The caught value.
 * @return `true` when the error is an AbortError.
 */
function isAbortError( error: unknown ): boolean {
	return error instanceof DOMException && error.name === 'AbortError';
}

// Throws an `AbortError` when the signal has been aborted. `getData` swallows
// abort and resolves normally, so the orchestrator cannot rely on its return
// value to detect cancellation: it must check the signal after every await.
function throwIfAborted( signal: AbortSignal ): void {
	if ( signal.aborted ) {
		throw new DOMException( 'Aborted', 'AbortError' );
	}
}

/**
 * Returns a promise that resolves on the next animation frame, or rejects
 * if the signal is aborted before the frame fires.
 *
 * @since n.e.x.t
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
	onComplete: () => void;
}

const PDFExportOrchestrator: FC< PDFExportOrchestratorProps > = ( {
	onComplete,
} ) => {
	const [ , dispatch ] = useReducer( reducer, initialState );
	const registry = useRegistry();
	const { setStatus, setProgress, setBlob, clearExport, clearCancelRequest } =
		useDispatch( CORE_PDF );

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
	const selectedContextSlugs = useSelect(
		( select: Select ) => select( CORE_PDF ).getSelectedContextSlugs(),
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

		const referenceName =
			typeof siteName === 'string' && siteName.length > 0
				? siteName
				: referenceSiteURL || '';

		async function run() {
			try {
				dispatch( { type: 'TRANSITION', nextStage: STAGE_LOADING } );
				setStatus( 'progress' );
				setProgress( 0 );

				armStageTimeout( LOADING_TIMEOUT_MS );
				// Yield a frame so the progress snackbar paints before loading.
				await nextFrame( signal );

				// Discovery: walk the registry inline (the orchestrator owns the
				// contexts → areas → widgets walk; there is no centralised
				// PDF-aware selector). `selectedContextSlugs`, `dates` and
				// `viewableModules` are snapshotted once above; nothing below
				// re-reads reactive state.
				const widgetsSelect = (
					registry as unknown as {
						select: ( storeName: string ) => {
							getWidgetAreas: (
								contextSlug: string
							) => WidgetArea[];
							getWidgets: (
								areaSlug: string,
								options?: { modules?: string[] }
							) => Widget[];
						};
					}
				 ).select( CORE_WIDGETS );
				const discoveredAreas: Array< {
					areaSlug: string;
					areaTitle: string;
					widgets: WidgetWithPDF[];
				} > = [];

				selectedContextSlugs.forEach( ( contextSlug: string ) => {
					const contextAreas: WidgetArea[] =
						widgetsSelect.getWidgetAreas( contextSlug );

					contextAreas.forEach( ( area ) => {
						const pdfWidgets: WidgetWithPDF[] = widgetsSelect
							.getWidgets( area.slug, {
								modules: viewableModules || undefined,
							} )
							.filter( hasPDFConfig );

						if ( pdfWidgets.length === 0 ) {
							return;
						}

						discoveredAreas.push( {
							areaSlug: area.slug,
							areaTitle: area.pdfTitle || area.title || '',
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

				// Loading: resolve each widget's data sequentially. A failing
				// widget is isolated and renders a placeholder; the export only
				// errors when every widget fails.
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
						// Resolve the lazy component chunk up front: @react-pdf
						// does not honour Suspense, so the document tree must
						// hold a concrete component.
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
						} );
						throwIfAborted( signal );

						loaded.set( widget.slug, {
							Component,
							data: result?.data ?? null,
							chartImages: result?.chartImages,
						} );
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
				dispatch( { type: 'TRANSITION', nextStage: STAGE_BUILDING } );
				armStageTimeout( BUILDING_TIMEOUT_MS );

				registerPDFFonts();
				throwIfAborted( signal );

				const areas: PDFReportArea[] = discoveredAreas.map(
					( area ) => ( {
						areaSlug: area.areaSlug,
						areaTitle: area.areaTitle,
						widgets: area.widgets.map( ( widget ) => {
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
				const filename = getPDFFilename(
					referenceName,
					typeof dateRange === 'string' ? dateRange : undefined
				);

				const document = (
					<DashboardReport
						siteName={ referenceName }
						dateRange={
							typeof dateRange === 'string'
								? dateRange
								: undefined
						}
						dashboardURL={ dashboardURL || '' }
						helpCenterURL="https://sitekit.withgoogle.com/support/"
						privacyPolicyURL="https://policies.google.com/privacy"
						areas={ areas }
					/>
				);

				const blob = await pdf( document ).toBlob();

				if ( signal.aborted ) {
					throw new DOMException( 'Aborted', 'AbortError' );
				}

				const blobURL = URL.createObjectURL( blob );
				setBlob( { url: blobURL, filename } );

				triggerDownload( blobURL, filename );
				revokeTimeoutRef.current = setTimeout( () => {
					revokeTimeoutRef.current = null;
					URL.revokeObjectURL( blobURL );
				}, BLOB_REVOKE_DELAY_MS );

				clearStageTimeout();
				dispatch( { type: 'TRANSITION', nextStage: STAGE_COMPLETE } );
				setStatus( 'success' );

				completeTimeoutRef.current = setTimeout( () => {
					completeTimeoutRef.current = null;
					onCompleteRef.current();
				}, COMPLETE_UNMOUNT_DELAY_MS );
			} catch ( error ) {
				clearStageTimeout();

				// User cancel is silent (IDLE). Timeout abort routes to ERROR
				// so the snackbar shows the failure.
				if ( isAbortError( error ) && ! timeoutAbortRef.current ) {
					dispatch( {
						type: 'TRANSITION',
						nextStage: STAGE_IDLE,
					} );
					clearExport();
					onCompleteRef.current();
					return;
				}

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
