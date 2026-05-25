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
import type { FC } from 'react';

/**
 * WordPress dependencies
 */
import { useCallback, useEffect, useReducer, useRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { Select, useDispatch, useSelect } from 'googlesitekit-data';
import { CORE_PDF } from '@/js/googlesitekit/datastore/pdf/constants';
import { CORE_SITE } from '@/js/googlesitekit/datastore/site/constants';
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import DashboardReport from './components/DashboardReport';
import { getPDFFilename, triggerDownload } from './pdf-utils';

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

/**
 * Validates and applies stage transitions for the export state machine.
 *
 * @since n.e.x.t
 *
 * @param {Object} state  Current reducer state.
 * @param {Object} action Dispatched action with a `nextStage` payload.
 * @return {Object} Next state, unchanged when the transition is invalid.
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
 * @param {*} error The caught value.
 * @return {boolean} `true` when the error is an AbortError.
 */
function isAbortError( error: unknown ): boolean {
	return error instanceof DOMException && error.name === 'AbortError';
}

/**
 * Returns a promise that resolves on the next animation frame, or rejects
 * if the signal is aborted before the frame fires.
 *
 * @since n.e.x.t
 *
 * @param {AbortSignal} signal Abort signal to observe.
 * @return {Promise} Resolves on the next frame, rejects on abort.
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

/**
 * Drives the PDF export pipeline through IDLE, LOADING, BUILDING,
 * COMPLETE, and ERROR stages. Renders nothing.
 *
 * @since n.e.x.t
 *
 * @param {Object}   props            Component props.
 * @param {Function} props.onComplete Called when the export finishes or aborts.
 * @return {null} Always null.
 */
const PDFExportOrchestrator: FC< PDFExportOrchestratorProps > = ( {
	onComplete,
} ) => {
	const [ , dispatch ] = useReducer( reducer, initialState );
	const { setStatus, setProgress, setBlob, clearExport, clearCancelRequest } =
		useDispatch( CORE_PDF );

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
	const stageTimeoutRef = useRef< ReturnType< typeof setTimeout > | null >(
		null
	);
	const completeTimeoutRef = useRef< ReturnType< typeof setTimeout > | null >(
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
				await nextFrame( signal );
				setProgress( LOADING_MOCK_PROGRESS );

				if ( signal.aborted ) {
					throw new DOMException( 'Aborted', 'AbortError' );
				}

				dispatch( { type: 'TRANSITION', nextStage: STAGE_BUILDING } );

				armStageTimeout( BUILDING_TIMEOUT_MS );

				// Footer timestamp uses the real generation time, not the dashboard date range.
				// eslint-disable-next-line sitekit/no-direct-date
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
				setTimeout( () => {
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
			controller.abort();
		};
		// Runs once on mount. Site and user data are read at start, not re-fetched mid-export.
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [] );

	return null;
};

export default PDFExportOrchestrator;
