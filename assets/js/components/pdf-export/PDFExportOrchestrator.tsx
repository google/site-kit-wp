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
import type { FC, Reducer } from 'react';

/**
 * WordPress dependencies
 */
import {
	useCallback,
	useEffect,
	useReducer,
	useRef,
} from '@wordpress/element';

/**
 * Internal dependencies
 */
import { useSelect, useDispatch, type Select } from 'googlesitekit-data';
import { CORE_SITE } from '@/js/googlesitekit/datastore/site/constants';
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import { CORE_PDF } from '@/js/googlesitekit/datastore/pdf/constants';
import DashboardReport from './components/DashboardReport';
import { getPDFFilename } from './pdf-utils';

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
const LOADING_MOCK_PROGRESS = 35;

interface State {
	stage: Stage;
}

type Action = { type: 'TRANSITION'; nextStage: Stage };

const initialState: State = { stage: STAGE_IDLE };

const reducer: Reducer< State, Action > = ( state, action ) => {
	if ( action.type === 'TRANSITION' ) {
		const allowed = VALID_TRANSITIONS[ state.stage ];
		if ( ! allowed.includes( action.nextStage ) ) {
			return state;
		}
		return { stage: action.nextStage };
	}

	return state;
};

function isAbortError( error: unknown ): boolean {
	return (
		error instanceof DOMException && error.name === 'AbortError'
	);
}

function nextFrame( signal: AbortSignal ): Promise< void > {
	return new Promise( ( resolve, reject ) => {
		if ( signal.aborted ) {
			reject( new DOMException( 'Aborted', 'AbortError' ) );
			return;
		}

		const onAbort = () => {
			window.cancelAnimationFrame( frameId );
			reject( new DOMException( 'Aborted', 'AbortError' ) );
		};

		const frameId = window.requestAnimationFrame( () => {
			signal.removeEventListener( 'abort', onAbort );
			resolve();
		} );

		signal.addEventListener( 'abort', onAbort, { once: true } );
	} );
}

function triggerDownload( url: string, filename: string ): void {
	const link = document.createElement( 'a' );
	link.href = url;
	link.download = filename;
	link.rel = 'noopener';
	link.style.display = 'none';
	document.body.appendChild( link );
	link.click();
	document.body.removeChild( link );
}

export interface PDFExportOrchestratorProps {
	onComplete: () => void;
}

const PDFExportOrchestrator: FC< PDFExportOrchestratorProps > = ( {
	onComplete,
} ) => {
	const [ , dispatch ] = useReducer( reducer, initialState );

	const {
		setStatus,
		setProgress,
		setBlob,
		clearExport,
		clearCancelRequest,
	} = useDispatch( CORE_PDF );

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
	const userName = useSelect(
		( select: Select ) => select( CORE_USER ).getName(),
		[]
	);

	const abortControllerRef = useRef< AbortController | null >( null );
	const stageTimeoutRef = useRef< number | null >( null );
	const completeTimeoutRef = useRef< number | null >( null );
	const timeoutAbortRef = useRef( false );
	const onCompleteRef = useRef( onComplete );

	useEffect( () => {
		onCompleteRef.current = onComplete;
	}, [ onComplete ] );

	const clearStageTimeout = useCallback( () => {
		if ( stageTimeoutRef.current !== null ) {
			window.clearTimeout( stageTimeoutRef.current );
			stageTimeoutRef.current = null;
		}
	}, [] );

	const armStageTimeout = useCallback(
		( durationMS: number ) => {
			clearStageTimeout();
			stageTimeoutRef.current = window.setTimeout( () => {
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

		const beforeUnloadHandler = ( event: BeforeUnloadEvent ) => {
			event.preventDefault();
			// Most browsers ignore the string, but assigning it keeps the legacy contract.
			event.returnValue = '';
		};
		window.addEventListener( 'beforeunload', beforeUnloadHandler );

		const referenceName =
			typeof siteName === 'string' && siteName.length > 0
				? siteName
				: referenceSiteURL || '';

		const run = async () => {
			try {
				dispatch( { type: 'TRANSITION', nextStage: STAGE_LOADING } );
				setStatus( 'progress' );
				setProgress( 0 );

				armStageTimeout( LOADING_TIMEOUT_MS );
				await nextFrame( signal );
				setProgress( LOADING_MOCK_PROGRESS );

				if ( signal.aborted ) {
					throw new DOMException( 'Aborted', 'AbortError' );
				}

				dispatch( { type: 'TRANSITION', nextStage: STAGE_BUILDING } );

				armStageTimeout( BUILDING_TIMEOUT_MS );

				const generatedAt = new Date().toLocaleString();
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
						userName={
							typeof userName === 'string' ? userName : undefined
						}
						generatedAt={ generatedAt }
					/>
				);

				const blob = await pdf( document ).toBlob();

				if ( signal.aborted ) {
					throw new DOMException( 'Aborted', 'AbortError' );
				}

				const blobURL = URL.createObjectURL( blob );
				setBlob( { url: blobURL, filename } );

				triggerDownload( blobURL, filename );
				window.setTimeout( () => {
					URL.revokeObjectURL( blobURL );
				}, BLOB_REVOKE_DELAY_MS );

				clearStageTimeout();
				dispatch( { type: 'TRANSITION', nextStage: STAGE_COMPLETE } );
				setStatus( 'success' );

				completeTimeoutRef.current = window.setTimeout( () => {
					completeTimeoutRef.current = null;
					onCompleteRef.current();
				}, COMPLETE_UNMOUNT_DELAY_MS );
			} catch ( error ) {
				clearStageTimeout();

				// User-initiated cancellation is silent. A timeout uses the
				// same `abort()` plumbing but routes to the error path so the
				// snackbar surfaces the failure to the user.
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
		};

		run();

		return () => {
			window.removeEventListener( 'beforeunload', beforeUnloadHandler );
			clearStageTimeout();
			if ( completeTimeoutRef.current !== null ) {
				window.clearTimeout( completeTimeoutRef.current );
				completeTimeoutRef.current = null;
			}
			controller.abort();
		};
		// Run once on mount. Inputs are sampled at mount time. The AC does
		// not require re-running when site or user info changes mid-export.
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [] );

	return null;
};

export default PDFExportOrchestrator;
