/**
 * Reader Revenue Manager plugin tracking tests.
 *
 * Site Kit by Google, Copyright 2025 Google LLC
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
import { select, subscribe } from 'googlesitekit-data';
import * as tracking from '@/js/util/tracking';
import { initializeTracking } from './tracking';
import { CORE_EDITOR } from '../common/constants';
import { MODULES_READER_REVENUE_MANAGER } from '@/js/modules/reader-revenue-manager/datastore/constants';
import { VIEW_CONTEXT_WP_BLOCK_EDITOR } from '@/js/googlesitekit/constants';

jest.mock( 'googlesitekit-data', () => ( {
	select: jest.fn(),
	subscribe: jest.fn(),
} ) );

const mockTrackEvent = jest.spyOn( tracking, 'trackEvent' );
mockTrackEvent.mockImplementation( () => Promise.resolve() );

describe( 'initializeTracking', () => {
	let subscriptionCallback;

	const publicationID = 'ABDEFGH';
	const metaKey = `googlesitekit_rrm_${ publicationID }:productID`;

	beforeEach( () => {
		jest.clearAllMocks();

		// Mock subscribe to capture the callback function.
		subscribe.mockImplementation( ( callback ) => {
			subscriptionCallback = callback;
		} );

		// Set default select mocks.
		select.mockImplementation( ( store ) => {
			if ( store === MODULES_READER_REVENUE_MANAGER ) {
				return {
					getPublicationID: jest
						.fn()
						.mockReturnValue( publicationID ),
				};
			}

			if ( store === CORE_EDITOR ) {
				return {
					getCurrentPost: jest.fn().mockReturnValue( {
						meta: {
							[ metaKey ]: 'none',
						},
					} ),
					isSavingPost: jest.fn().mockReturnValue( false ),
					isAutosavingPost: jest.fn().mockReturnValue( false ),
				};
			}

			return {};
		} );
	} );

	it( 'should subscribe to changes', () => {
		initializeTracking();
		expect( subscribe ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'should track event when metadata changes after saving', () => {
		let isSaving = true;
		const isAutosaving = false;
		let productID = 'none';

		select.mockImplementation( ( store ) => {
			if ( store === MODULES_READER_REVENUE_MANAGER ) {
				return {
					getPublicationID: jest
						.fn()
						.mockReturnValue( publicationID ),
				};
			}

			if ( store === CORE_EDITOR ) {
				return {
					getCurrentPost: jest.fn().mockReturnValue( {
						meta: {
							[ metaKey ]: productID,
						},
					} ),
					isSavingPost: jest
						.fn()
						.mockImplementation( () => isSaving ),
					isAutosavingPost: jest
						.fn()
						.mockImplementation( () => isAutosaving ),
				};
			}

			return {};
		} );

		initializeTracking();

		// First call: sets `previousMetadata`.
		subscriptionCallback();

		// Simulate saving.
		isSaving = true;
		subscriptionCallback();

		// Simulate save complete and metadata changed.
		isSaving = false;
		productID = 'openaccess';
		subscriptionCallback();

		expect( mockTrackEvent ).toHaveBeenCalledWith(
			`${ VIEW_CONTEXT_WP_BLOCK_EDITOR }_rrm`,
			'change_product_id',
			'Open access'
		);
	} );

	it( 'should not track event if publicationID is undefined', () => {
		select.mockImplementation( ( store ) => {
			if ( store === MODULES_READER_REVENUE_MANAGER ) {
				return {
					getPublicationID: jest.fn().mockReturnValue( undefined ),
				};
			}

			return {};
		} );

		initializeTracking();
		subscriptionCallback();
		expect( mockTrackEvent ).not.toHaveBeenCalled();
	} );

	it( 'should not track event on first run (previousMetadata is null)', () => {
		initializeTracking();
		subscriptionCallback();
		expect( mockTrackEvent ).not.toHaveBeenCalled();
	} );

	it( 'should not track event if metadata did not change', () => {
		let isSaving = true;
		const isAutosaving = false;
		const productID = 'none';

		select.mockImplementation( ( store ) => {
			if ( store === MODULES_READER_REVENUE_MANAGER ) {
				return {
					getPublicationID: jest
						.fn()
						.mockReturnValue( publicationID ),
				};
			}

			if ( store === CORE_EDITOR ) {
				return {
					getCurrentPost: jest.fn().mockReturnValue( {
						meta: {
							[ metaKey ]: productID,
						},
					} ),
					isSavingPost: jest
						.fn()
						.mockImplementation( () => isSaving ),
					isAutosavingPost: jest
						.fn()
						.mockImplementation( () => isAutosaving ),
				};
			}

			return {};
		} );

		initializeTracking();

		// First call: sets `previousMetadata`.
		subscriptionCallback();

		// Simulate saving.
		isSaving = true;
		subscriptionCallback();

		// Simulate save complete but metadata did not change.
		isSaving = false;
		subscriptionCallback();

		expect( mockTrackEvent ).not.toHaveBeenCalled();
	} );
} );
