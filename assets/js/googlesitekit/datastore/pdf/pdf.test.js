/**
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
import { createTestRegistry } from '@tests/js/utils';
import { CORE_PDF } from './constants';
import { initialState } from './pdf';

describe( 'core/pdf store', () => {
	let registry;

	beforeEach( () => {
		registry = createTestRegistry();
	} );

	describe( 'initial state', () => {
		it( 'should have the expected shape', () => {
			expect( initialState ).toEqual( {
				selection: {
					contextSlugs: [],
					widgetSlugs: [],
				},
				status: 'idle',
				progress: 0,
				blobURL: null,
				blobFilename: null,
				cancelRequested: false,
			} );
		} );

		it( 'should be exposed via the selectors at registration time', () => {
			expect( registry.select( CORE_PDF ).getSelection() ).toEqual( {
				contextSlugs: [],
				widgetSlugs: [],
			} );
			expect(
				registry.select( CORE_PDF ).getSelectedContextSlugs()
			).toEqual( [] );
			expect(
				registry.select( CORE_PDF ).getSelectedWidgetSlugs()
			).toEqual( [] );
			expect( registry.select( CORE_PDF ).getStatus() ).toBe( 'idle' );
			expect( registry.select( CORE_PDF ).getProgress() ).toBe( 0 );
			expect( registry.select( CORE_PDF ).getBlob() ).toEqual( {
				url: null,
				filename: null,
			} );
			expect( registry.select( CORE_PDF ).isCancelRequested() ).toBe(
				false
			);
		} );
	} );

	describe( 'actions', () => {
		describe( 'setSelection', () => {
			it( 'should require the selection to be a plain object', () => {
				expect( () => {
					registry.dispatch( CORE_PDF ).setSelection();
				} ).toThrow( 'selection must be a plain object.' );

				expect( () => {
					registry.dispatch( CORE_PDF ).setSelection( [] );
				} ).toThrow( 'selection must be a plain object.' );

				expect( () => {
					registry.dispatch( CORE_PDF ).setSelection( 'string' );
				} ).toThrow( 'selection must be a plain object.' );
			} );

			it( 'should require contextSlugs to be an array of strings', () => {
				expect( () => {
					registry.dispatch( CORE_PDF ).setSelection( {
						contextSlugs: 'not-an-array',
						widgetSlugs: [],
					} );
				} ).toThrow(
					'selection.contextSlugs must be an array of strings.'
				);

				expect( () => {
					registry.dispatch( CORE_PDF ).setSelection( {
						contextSlugs: [ 'valid', 123 ],
						widgetSlugs: [],
					} );
				} ).toThrow(
					'selection.contextSlugs must be an array of strings.'
				);
			} );

			it( 'should require widgetSlugs to be an array of strings', () => {
				expect( () => {
					registry.dispatch( CORE_PDF ).setSelection( {
						contextSlugs: [],
						widgetSlugs: 'not-an-array',
					} );
				} ).toThrow(
					'selection.widgetSlugs must be an array of strings.'
				);

				expect( () => {
					registry.dispatch( CORE_PDF ).setSelection( {
						contextSlugs: [],
						widgetSlugs: [ 'valid', null ],
					} );
				} ).toThrow(
					'selection.widgetSlugs must be an array of strings.'
				);
			} );

			it( 'should store the supplied selection', () => {
				const selection = {
					contextSlugs: [ 'mainDashboardTraffic' ],
					widgetSlugs: [ 'allTraffic' ],
				};

				registry.dispatch( CORE_PDF ).setSelection( selection );

				expect( registry.select( CORE_PDF ).getSelection() ).toEqual(
					selection
				);
				expect(
					registry.select( CORE_PDF ).getSelectedContextSlugs()
				).toEqual( [ 'mainDashboardTraffic' ] );
				expect(
					registry.select( CORE_PDF ).getSelectedWidgetSlugs()
				).toEqual( [ 'allTraffic' ] );
			} );

			it( 'should replace the previous selection wholesale', () => {
				registry.dispatch( CORE_PDF ).setSelection( {
					contextSlugs: [ 'a' ],
					widgetSlugs: [ 'w1', 'w2' ],
				} );

				registry.dispatch( CORE_PDF ).setSelection( {
					contextSlugs: [ 'b', 'c' ],
					widgetSlugs: [],
				} );

				expect( registry.select( CORE_PDF ).getSelection() ).toEqual( {
					contextSlugs: [ 'b', 'c' ],
					widgetSlugs: [],
				} );
			} );
		} );

		describe( 'setStatus', () => {
			it.each( [ 'idle', 'progress', 'success', 'error' ] )(
				'should accept the %s status',
				( status ) => {
					registry.dispatch( CORE_PDF ).setStatus( status );

					expect( registry.select( CORE_PDF ).getStatus() ).toBe(
						status
					);
				}
			);

			it( 'should throw when the status is not one of the allowed values', () => {
				expect( () => {
					registry.dispatch( CORE_PDF ).setStatus( 'unknown' );
				} ).toThrow(
					'status must be one of: idle, progress, success, error.'
				);

				expect( () => {
					registry.dispatch( CORE_PDF ).setStatus();
				} ).toThrow(
					'status must be one of: idle, progress, success, error.'
				);

				expect( () => {
					registry.dispatch( CORE_PDF ).setStatus( null );
				} ).toThrow(
					'status must be one of: idle, progress, success, error.'
				);
			} );
		} );

		describe( 'setProgress', () => {
			it.each( [ 0, 25, 50, 99.9, 100 ] )(
				'should accept the in-range value %s',
				( progress ) => {
					registry.dispatch( CORE_PDF ).setProgress( progress );

					expect( registry.select( CORE_PDF ).getProgress() ).toBe(
						progress
					);
				}
			);

			it( 'should throw when progress is below 0', () => {
				expect( () => {
					registry.dispatch( CORE_PDF ).setProgress( -1 );
				} ).toThrow( 'progress must be a number between 0 and 100.' );
			} );

			it( 'should throw when progress is above 100', () => {
				expect( () => {
					registry.dispatch( CORE_PDF ).setProgress( 101 );
				} ).toThrow( 'progress must be a number between 0 and 100.' );
			} );

			it( 'should throw when progress is not a finite number', () => {
				expect( () => {
					registry.dispatch( CORE_PDF ).setProgress( 'fifty' );
				} ).toThrow( 'progress must be a number between 0 and 100.' );

				expect( () => {
					registry.dispatch( CORE_PDF ).setProgress( NaN );
				} ).toThrow( 'progress must be a number between 0 and 100.' );

				expect( () => {
					registry.dispatch( CORE_PDF ).setProgress( Infinity );
				} ).toThrow( 'progress must be a number between 0 and 100.' );
			} );
		} );

		describe( 'setBlob', () => {
			it( 'should require the blob to be a plain object', () => {
				expect( () => {
					registry.dispatch( CORE_PDF ).setBlob();
				} ).toThrow( 'blob must be a plain object.' );

				expect( () => {
					registry.dispatch( CORE_PDF ).setBlob( 'string' );
				} ).toThrow( 'blob must be a plain object.' );
			} );

			it( 'should require blob.url to be a non-empty string', () => {
				expect( () => {
					registry
						.dispatch( CORE_PDF )
						.setBlob( { url: '', filename: 'report.pdf' } );
				} ).toThrow( 'blob.url must be a non-empty string.' );

				expect( () => {
					registry
						.dispatch( CORE_PDF )
						.setBlob( { filename: 'report.pdf' } );
				} ).toThrow( 'blob.url must be a non-empty string.' );
			} );

			it( 'should require blob.filename to be a non-empty string', () => {
				expect( () => {
					registry.dispatch( CORE_PDF ).setBlob( {
						url: 'blob:https://example.com/abc',
						filename: '',
					} );
				} ).toThrow( 'blob.filename must be a non-empty string.' );

				expect( () => {
					registry.dispatch( CORE_PDF ).setBlob( {
						url: 'blob:https://example.com/abc',
					} );
				} ).toThrow( 'blob.filename must be a non-empty string.' );
			} );

			it( 'should store the supplied blob URL and filename', () => {
				registry.dispatch( CORE_PDF ).setBlob( {
					url: 'blob:https://example.com/abc',
					filename: 'site-kit-report.pdf',
				} );

				expect( registry.select( CORE_PDF ).getBlob() ).toEqual( {
					url: 'blob:https://example.com/abc',
					filename: 'site-kit-report.pdf',
				} );
			} );
		} );

		describe( 'clearExport', () => {
			it( 'should reset status, progress, blobURL and blobFilename', () => {
				registry.dispatch( CORE_PDF ).setStatus( 'success' );
				registry.dispatch( CORE_PDF ).setProgress( 80 );
				registry.dispatch( CORE_PDF ).setBlob( {
					url: 'blob:https://example.com/abc',
					filename: 'site-kit-report.pdf',
				} );

				registry.dispatch( CORE_PDF ).clearExport();

				expect( registry.select( CORE_PDF ).getStatus() ).toBe(
					'idle'
				);
				expect( registry.select( CORE_PDF ).getProgress() ).toBe( 0 );
				expect( registry.select( CORE_PDF ).getBlob() ).toEqual( {
					url: null,
					filename: null,
				} );
			} );

			it( 'should leave selection untouched', () => {
				registry.dispatch( CORE_PDF ).setSelection( {
					contextSlugs: [ 'mainDashboardTraffic' ],
					widgetSlugs: [ 'allTraffic' ],
				} );

				registry.dispatch( CORE_PDF ).setStatus( 'progress' );
				registry.dispatch( CORE_PDF ).clearExport();

				expect( registry.select( CORE_PDF ).getSelection() ).toEqual( {
					contextSlugs: [ 'mainDashboardTraffic' ],
					widgetSlugs: [ 'allTraffic' ],
				} );
			} );

			it( 'should leave cancelRequested untouched', () => {
				registry.dispatch( CORE_PDF ).requestCancel();

				registry.dispatch( CORE_PDF ).clearExport();

				expect( registry.select( CORE_PDF ).isCancelRequested() ).toBe(
					true
				);
			} );
		} );

		describe( 'requestCancel', () => {
			it( 'should flip cancelRequested to true', () => {
				expect( registry.select( CORE_PDF ).isCancelRequested() ).toBe(
					false
				);

				registry.dispatch( CORE_PDF ).requestCancel();

				expect( registry.select( CORE_PDF ).isCancelRequested() ).toBe(
					true
				);
			} );
		} );

		describe( 'clearCancelRequest', () => {
			it( 'should flip cancelRequested back to false', () => {
				registry.dispatch( CORE_PDF ).requestCancel();
				registry.dispatch( CORE_PDF ).clearCancelRequest();

				expect( registry.select( CORE_PDF ).isCancelRequested() ).toBe(
					false
				);
			} );
		} );
	} );

	describe( 'selectors', () => {
		describe( 'getBlob', () => {
			it( 'should return null fields before any blob is set', () => {
				expect( registry.select( CORE_PDF ).getBlob() ).toEqual( {
					url: null,
					filename: null,
				} );
			} );

			it( 'should return the combined url and filename once set', () => {
				registry.dispatch( CORE_PDF ).setBlob( {
					url: 'blob:https://example.com/abc',
					filename: 'site-kit-report.pdf',
				} );

				expect( registry.select( CORE_PDF ).getBlob() ).toEqual( {
					url: 'blob:https://example.com/abc',
					filename: 'site-kit-report.pdf',
				} );
			} );
		} );

		describe( 'getSelectedContextSlugs / getSelectedWidgetSlugs', () => {
			it( 'should reflect the current selection slices', () => {
				registry.dispatch( CORE_PDF ).setSelection( {
					contextSlugs: [ 'mainDashboardTraffic' ],
					widgetSlugs: [ 'allTraffic', 'topPages' ],
				} );

				expect(
					registry.select( CORE_PDF ).getSelectedContextSlugs()
				).toEqual( [ 'mainDashboardTraffic' ] );
				expect(
					registry.select( CORE_PDF ).getSelectedWidgetSlugs()
				).toEqual( [ 'allTraffic', 'topPages' ] );
			} );
		} );
	} );
} );
