/**
 * `useSurveyCustomDimensions` hook tests.
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
import { noop } from 'lodash';

/**
 * WordPress dependencies
 */
import { WPDataRegistry } from '@wordpress/data/build-types/registry';

/**
 * Internal dependencies
 */
import { MODULES_ANALYTICS_4 } from '@/js/modules/analytics-4/datastore/constants';
import {
	SURVEY_CUSTOM_DIMENSIONS,
	SURVEY_CUSTOM_DIMENSION_DEFINITIONS,
} from '@/js/modules/reader-revenue-manager/datastore/constants';
import {
	actHook as act,
	createTestRegistry,
	provideModules,
	renderHook,
} from '@tests/js/test-utils';
import useSurveyCustomDimensions from './useSurveyCustomDimensions';

const PROPERTY_ID = '123456';

const SITE_KIT_DIMENSIONS = [ 'googlesitekit_post_author' ];

const getCustomDimensionsEndpoint = new RegExp(
	'^/google-site-kit/v1/modules/analytics-4/data/custom-dimensions'
);
const createCustomDimensionEndpoint = new RegExp(
	'^/google-site-kit/v1/modules/analytics-4/data/create-custom-dimension'
);
const syncCustomDimensionsEndpoint = new RegExp(
	'^/google-site-kit/v1/modules/analytics-4/data/sync-custom-dimensions'
);

const insufficientPermissionsError = {
	code: 403,
	message: 'The caller does not have permission',
	data: { status: 403, reason: 'insufficientPermissions' },
};

const otherError = {
	code: 500,
	message: 'Internal error',
	data: { status: 500, reason: 'internalError' },
};

describe( 'useSurveyCustomDimensions', () => {
	let registry: WPDataRegistry;

	function getCreatedDimensionNames() {
		return fetchMock
			.calls( createCustomDimensionEndpoint )
			.map(
				( [ , request ] ) =>
					JSON.parse( request?.body as string ).data.customDimension
						.parameterName
			);
	}

	// Responds to each create request with the dimension it was sent.
	function mockCreateCustomDimension() {
		fetchMock.post(
			createCustomDimensionEndpoint,
			( _url: string, { body }: { body: string } ) => ( {
				body: JSON.parse( body ).data.customDimension,
				status: 200,
			} )
		);
	}

	// Lets pending requests and state updates run.
	function flushUpdates() {
		return act(
			() => new Promise< void >( ( resolve ) => setTimeout( resolve ) )
		);
	}

	function receivePropertyDimensions( dimensions: string[] ) {
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.receiveGetCustomDimensions( dimensions, {
				propertyID: PROPERTY_ID,
			} );
	}

	beforeEach( () => {
		registry = createTestRegistry();
		provideModules( registry );

		registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetSettings( {
			propertyID: PROPERTY_ID,
			availableCustomDimensions: SITE_KIT_DIMENSIONS,
		} );
	} );

	it( 'should stay pending without requests while it cannot create the dimensions', async () => {
		const { result } = renderHook(
			() => useSurveyCustomDimensions( false ),
			{ registry }
		);

		await flushUpdates();

		expect( result.current ).toEqual( { status: 'pending' } );
		expect( fetchMock ).not.toHaveFetched();
	} );

	it( 'should stay pending without requests while there is no valid property ID', async () => {
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.setPropertyID( 'invalid-property-id' );

		const { result } = renderHook(
			() => useSurveyCustomDimensions( true ),
			{ registry }
		);

		await flushUpdates();

		expect( result.current ).toEqual( { status: 'pending' } );
		expect( fetchMock ).not.toHaveFetched();
	} );

	it( 'should create nothing and be ready when all the survey dimensions exist', () => {
		receivePropertyDimensions( [
			...SITE_KIT_DIMENSIONS,
			...SURVEY_CUSTOM_DIMENSIONS,
		] );

		const { result } = renderHook(
			() => useSurveyCustomDimensions( true ),
			{ registry }
		);

		// Nothing is missing, so it is ready without waiting for a request.
		expect( result.current ).toEqual( { status: 'ready' } );
		expect( fetchMock ).not.toHaveFetched();
	} );

	it( 'should create only the missing survey dimensions, one at a time', async () => {
		receivePropertyDimensions( [
			...SITE_KIT_DIMENSIONS,
			'survey_question',
			'survey_answer',
		] );

		// Holds the first creation open, to check that the next one waits.
		let resolveFirstCreation: () => void = noop;
		const firstCreation = new Promise< void >( ( resolve ) => {
			resolveFirstCreation = resolve;
		} );

		fetchMock.postOnce(
			createCustomDimensionEndpoint,
			firstCreation.then( () => ( {
				body: SURVEY_CUSTOM_DIMENSION_DEFINITIONS.survey_question_category,
				status: 200,
			} ) )
		);
		mockCreateCustomDimension();

		const { result, waitForValueToChange } = renderHook(
			() => useSurveyCustomDimensions( true ),
			{ registry }
		);

		// Gives a second creation the chance to start before the first ends.
		await flushUpdates();

		expect( result.current ).toEqual( { status: 'pending' } );
		expect( fetchMock ).toHaveFetchedTimes(
			1,
			createCustomDimensionEndpoint
		);

		resolveFirstCreation();

		await waitForValueToChange( () => result.current.status );

		expect( result.current ).toEqual( { status: 'ready' } );

		expect( getCreatedDimensionNames() ).toEqual( [
			'survey_question_category',
			'survey_answer_category',
		] );
		expect( fetchMock ).toHaveFetchedTimes(
			1,
			createCustomDimensionEndpoint,
			{
				body: {
					data: {
						propertyID: PROPERTY_ID,
						customDimension:
							SURVEY_CUSTOM_DIMENSION_DEFINITIONS.survey_answer_category,
					},
				},
			}
		);
	} );

	it( 'should leave the `availableCustomDimensions` setting unchanged after creating the survey dimensions', async () => {
		receivePropertyDimensions( SITE_KIT_DIMENSIONS );
		mockCreateCustomDimension();

		const { result, waitForValueToChange } = renderHook(
			() => useSurveyCustomDimensions( true ),
			{ registry }
		);

		await waitForValueToChange( () => result.current.status );

		expect( result.current ).toEqual( { status: 'ready' } );
		expect( getCreatedDimensionNames() ).toEqual(
			SURVEY_CUSTOM_DIMENSIONS
		);
		expect( fetchMock ).not.toHaveFetched( syncCustomDimensionsEndpoint );
		expect(
			registry
				.select( MODULES_ANALYTICS_4 )
				.getAvailableCustomDimensions()
		).toEqual( SITE_KIT_DIMENSIONS );
	} );

	it.each( [
		[ 'an insufficient permissions error', insufficientPermissionsError ],
		[ 'any other error', otherError ],
	] )(
		'should stop at the first failed creation and return %s',
		async ( _, error ) => {
			receivePropertyDimensions( SITE_KIT_DIMENSIONS );

			fetchMock.post( createCustomDimensionEndpoint, {
				body: error,
				status: error.data.status,
			} );

			const { result, waitForValueToChange } = renderHook(
				() => useSurveyCustomDimensions( true ),
				{ registry }
			);

			await waitForValueToChange( () => result.current.status );

			expect( console ).toHaveErrored();
			expect( result.current ).toEqual( { status: 'failed', error } );
			expect( fetchMock ).toHaveFetchedTimes(
				1,
				createCustomDimensionEndpoint
			);
		}
	);

	it( 'should return the error when the property dimensions cannot be read', async () => {
		fetchMock.get( getCustomDimensionsEndpoint, {
			body: insufficientPermissionsError,
			status: 403,
		} );

		const { result, waitForValueToChange } = renderHook(
			() => useSurveyCustomDimensions( true ),
			{ registry }
		);

		await waitForValueToChange( () => result.current.status );

		expect( console ).toHaveErrored();
		expect( result.current ).toEqual( {
			status: 'failed',
			error: insufficientPermissionsError,
		} );
		expect( fetchMock ).not.toHaveFetched( createCustomDimensionEndpoint );
	} );
} );
