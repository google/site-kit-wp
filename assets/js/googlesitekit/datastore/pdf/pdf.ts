/**
 * `core/pdf` data store: pdf data.
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
 * Internal dependencies
 */
import { createReducer } from 'googlesitekit-data';

const SET_SELECTION = 'SET_SELECTION' as const;
const SET_STATUS = 'SET_STATUS' as const;
const SET_PROGRESS = 'SET_PROGRESS' as const;
const SET_BLOB = 'SET_BLOB' as const;
const CLEAR_EXPORT = 'CLEAR_EXPORT' as const;
const REQUEST_CANCEL = 'REQUEST_CANCEL' as const;
const CLEAR_CANCEL_REQUEST = 'CLEAR_CANCEL_REQUEST' as const;
const START_EXPORTING = 'START_EXPORTING' as const;
const FINISH_EXPORTING = 'FINISH_EXPORTING' as const;

export type PDFStatus = 'idle' | 'progress' | 'success' | 'error';

export interface PDFSelection {
	contextSlugs: string[];
	widgetSlugs: string[];
}

export interface PDFBlob {
	url: string | null;
	filename: string | null;
}

export interface PDFState {
	selection: PDFSelection;
	status: PDFStatus;
	progress: number;
	blobURL: string | null;
	blobFilename: string | null;
	cancelRequested: boolean;
	isExporting: boolean;
}

type Action =
	| { type: typeof SET_SELECTION; payload: { selection: PDFSelection } }
	| { type: typeof SET_STATUS; payload: { status: PDFStatus } }
	| { type: typeof SET_PROGRESS; payload: { progress: number } }
	| { type: typeof SET_BLOB; payload: { blob: PDFBlob } }
	| { type: typeof CLEAR_EXPORT; payload: Record< string, never > }
	| { type: typeof REQUEST_CANCEL; payload: Record< string, never > }
	| {
			type: typeof CLEAR_CANCEL_REQUEST;
			payload: Record< string, never >;
	  }
	| { type: typeof START_EXPORTING; payload: Record< string, never > }
	| { type: typeof FINISH_EXPORTING; payload: Record< string, never > };

/**
 * Determines whether the given value is an array of strings.
 *
 * @since n.e.x.t
 *
 * @param {*} value Value to test.
 * @return {boolean} `true` if `value` is an array whose every element is a string.
 */
function isStringArray( value: unknown ): value is string[] {
	return (
		Array.isArray( value ) &&
		value.every( ( item ) => typeof item === 'string' )
	);
}

export const initialState: PDFState = {
	selection: {
		contextSlugs: [],
		widgetSlugs: [],
	},
	status: 'idle',
	progress: 0,
	blobURL: null,
	blobFilename: null,
	cancelRequested: false,
	isExporting: false,
};

export const actions = {
	/**
	 * Sets the current PDF export selection.
	 *
	 * @since n.e.x.t
	 *
	 * @param {Object}   selection              The selection object.
	 * @param {string[]} selection.contextSlugs Selected dashboard context slugs.
	 * @param {string[]} selection.widgetSlugs  Selected widget slugs.
	 * @return {Object} Redux-style action.
	 */
	setSelection( selection: PDFSelection ) {
		invariant(
			isPlainObject( selection ),
			'selection must be a plain object.'
		);

		invariant(
			isStringArray( selection.contextSlugs ),
			'selection.contextSlugs must be an array of strings.'
		);

		invariant(
			isStringArray( selection.widgetSlugs ),
			'selection.widgetSlugs must be an array of strings.'
		);

		return {
			payload: { selection },
			type: SET_SELECTION,
		};
	},

	/**
	 * Sets the current PDF export status.
	 *
	 * @since n.e.x.t
	 *
	 * @param {string} status One of 'idle', 'progress', 'success', 'error'.
	 * @return {Object} Redux-style action.
	 */
	setStatus( status: PDFStatus ) {
		const validStatuses: PDFStatus[] = [
			'idle',
			'progress',
			'success',
			'error',
		];

		invariant(
			validStatuses.includes( status ),
			`status must be one of: ${ validStatuses.join( ', ' ) }.`
		);

		return {
			payload: { status },
			type: SET_STATUS,
		};
	},

	/**
	 * Sets the current PDF export progress.
	 *
	 * @since n.e.x.t
	 *
	 * @param {number} progress Progress value between 0 and 100, inclusive.
	 * @return {Object} Redux-style action.
	 */
	setProgress( progress: number ) {
		invariant(
			typeof progress === 'number' &&
				Number.isFinite( progress ) &&
				progress >= 0 &&
				progress <= 100,
			'progress must be a number between 0 and 100.'
		);

		return {
			payload: { progress },
			type: SET_PROGRESS,
		};
	},

	/**
	 * Sets the generated PDF blob URL and filename.
	 *
	 * @since n.e.x.t
	 *
	 * @param {Object} blob          The blob descriptor.
	 * @param {string} blob.url      The blob URL.
	 * @param {string} blob.filename The blob filename.
	 * @return {Object} Redux-style action.
	 */
	setBlob( blob: PDFBlob ) {
		invariant( isPlainObject( blob ), 'blob must be a plain object.' );

		invariant(
			typeof blob.url === 'string' && blob.url.length > 0,
			'blob.url must be a non-empty string.'
		);

		invariant(
			typeof blob.filename === 'string' && blob.filename.length > 0,
			'blob.filename must be a non-empty string.'
		);

		return {
			payload: { blob },
			type: SET_BLOB,
		};
	},

	/**
	 * Resets the export-lifecycle fields (status, progress, blobURL, blobFilename).
	 *
	 * Leaves `selection` untouched so the side sheet retains the user's choices
	 * between exports.
	 *
	 * @since n.e.x.t
	 *
	 * @return {Object} Redux-style action.
	 */
	clearExport() {
		return {
			payload: {},
			type: CLEAR_EXPORT,
		};
	},

	/**
	 * Requests cancellation of the in-flight PDF export.
	 *
	 * @since n.e.x.t
	 *
	 * @return {Object} Redux-style action.
	 */
	requestCancel() {
		return {
			payload: {},
			type: REQUEST_CANCEL,
		};
	},

	/**
	 * Clears a previously-set cancel request.
	 *
	 * @since n.e.x.t
	 *
	 * @return {Object} Redux-style action.
	 */
	clearCancelRequest() {
		return {
			payload: {},
			type: CLEAR_CANCEL_REQUEST,
		};
	},

	/**
	 * Marks the PDF export as in progress.
	 *
	 * @since n.e.x.t
	 *
	 * @return Redux-style action.
	 */
	startExporting() {
		return {
			payload: {},
			type: START_EXPORTING,
		};
	},

	/**
	 * Marks the PDF export as finished.
	 *
	 * @since n.e.x.t
	 *
	 * @return Redux-style action.
	 */
	finishExporting() {
		return {
			payload: {},
			type: FINISH_EXPORTING,
		};
	},
};

export const controls = {};

export const reducer = createReducer( ( state: PDFState, action: Action ) => {
	switch ( action.type ) {
		case SET_SELECTION:
			state.selection = action.payload.selection;
			break;

		case SET_STATUS:
			state.status = action.payload.status;
			break;

		case SET_PROGRESS:
			state.progress = action.payload.progress;
			break;

		case SET_BLOB:
			state.blobURL = action.payload.blob.url;
			state.blobFilename = action.payload.blob.filename;
			break;

		case CLEAR_EXPORT:
			state.status = initialState.status;
			state.progress = initialState.progress;
			state.blobURL = initialState.blobURL;
			state.blobFilename = initialState.blobFilename;
			break;

		case REQUEST_CANCEL:
			state.cancelRequested = true;
			break;

		case CLEAR_CANCEL_REQUEST:
			state.cancelRequested = false;
			break;

		case START_EXPORTING:
			state.isExporting = true;
			break;

		case FINISH_EXPORTING:
			state.isExporting = false;
			break;

		default:
			break;
	}
} );

export const resolvers = {};

export const selectors = {
	/**
	 * Gets the `slugs` used to generate content for the PDF export.
	 *
	 * @since n.e.x.t
	 *
	 * @param {PDFState} state Data store's state.
	 * @return {PDFSelection} Current selection: `{ contextSlugs, widgetSlugs }`.
	 */
	getSelection( state: PDFState ): PDFSelection {
		return state.selection;
	},

	/**
	 * Gets the currently selected dashboard context slugs.
	 *
	 * @since n.e.x.t
	 *
	 * @param {PDFState} state Data store's state.
	 * @return {string[]} Selected context slugs.
	 */
	getSelectedContextSlugs( state: PDFState ): string[] {
		return state.selection.contextSlugs;
	},

	/**
	 * Gets the currently selected widget slugs.
	 *
	 * @since n.e.x.t
	 *
	 * @param {PDFState} state Data store's state.
	 * @return {string[]} Selected widget slugs.
	 */
	getSelectedWidgetSlugs( state: PDFState ): string[] {
		return state.selection.widgetSlugs;
	},

	/**
	 * Gets the current PDF export status.
	 *
	 * @since n.e.x.t
	 *
	 * @param {PDFState} state Data store's state.
	 * @return {PDFStatus} One of 'idle', 'progress', 'success', 'error'.
	 */
	getStatus( state: PDFState ): PDFStatus {
		return state.status;
	},

	/**
	 * Gets the current PDF export progress.
	 *
	 * @since n.e.x.t
	 *
	 * @param {PDFState} state Data store's state.
	 * @return {number} Progress value between 0 and 100, inclusive.
	 */
	getProgress( state: PDFState ): number {
		return state.progress;
	},

	/**
	 * Gets the generated PDF blob descriptor.
	 *
	 * @since n.e.x.t
	 *
	 * @param {PDFState} state Data store's state.
	 * @return {PDFBlob} Blob descriptor: `{ url, filename }`.
	 */
	getBlob( state: PDFState ): PDFBlob {
		return {
			url: state.blobURL,
			filename: state.blobFilename,
		};
	},

	/**
	 * Determines whether cancellation has been requested for the in-flight export.
	 *
	 * @since n.e.x.t
	 *
	 * @param {PDFState} state Data store's state.
	 * @return {boolean} `true` if cancellation has been requested.
	 */
	isCancelRequested( state: PDFState ): boolean {
		return state.cancelRequested;
	},

	/**
	 * Determines whether a PDF export is currently in progress.
	 *
	 * @since n.e.x.t
	 *
	 * @param state Data store's state.
	 * @return `true` when exporting.
	 */
	isExporting( state: PDFState ): boolean {
		return state.isExporting;
	},
};

export default {
	initialState,
	actions,
	controls,
	reducer,
	resolvers,
	selectors,
};
