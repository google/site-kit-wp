/**
 * Reader Revenue Manager express setup terms of service step tests.
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
import { Registry } from '@/js/googlesitekit-data';
import { MODULE_SLUG_READER_REVENUE_MANAGER } from '@/js/modules/reader-revenue-manager/constants';
import {
	publications,
	termsOfService,
} from '@/js/modules/reader-revenue-manager/datastore/__fixtures__';
import {
	MODULES_READER_REVENUE_MANAGER,
	PUBLICATION_TYPES,
} from '@/js/modules/reader-revenue-manager/datastore/constants';
import { Publication } from '@/js/modules/reader-revenue-manager/datastore/publications';
import { providePublication } from '@/js/modules/reader-revenue-manager/utils/test-utils';
import {
	createTestRegistry,
	fireEvent,
	freezeFetch,
	provideModuleRegistrations,
	provideModules,
	provideSiteInfo,
	render,
	waitFor,
} from '@tests/js/test-utils';
import StepTermsOfService from './StepTermsOfService';

const TEST_PUBLICATION: Publication = publications[ 3 ];

function provideTermsOfService( registry: Registry ) {
	registry
		.dispatch( MODULES_READER_REVENUE_MANAGER )
		.receiveGetTermsOfService( termsOfService, {
			// eslint-disable-next-line sitekit/acronym-case
			tosURL: TEST_PUBLICATION.rrmProduct?.productTosUrl,
		} );

	registry
		.dispatch( MODULES_READER_REVENUE_MANAGER )
		.finishResolution( 'getTermsOfService', [
			// eslint-disable-next-line sitekit/acronym-case
			{ tosURL: TEST_PUBLICATION.rrmProduct?.productTosUrl },
		] );
}

describe( 'StepTermsOfService', () => {
	let registry: Registry;

	const publicationEndpoint = new RegExp(
		'^/google-site-kit/v1/modules/reader-revenue-manager/data/publication(?:\\?|$)'
	);

	const termsOfServiceEndpoint = new RegExp(
		'^/google-site-kit/v1/modules/reader-revenue-manager/data/terms-of-service'
	);

	beforeEach( () => {
		registry = createTestRegistry() as Registry;

		const moduleData = [
			{
				slug: MODULE_SLUG_READER_REVENUE_MANAGER,
				active: true,
				connected: false,
			},
		];

		provideModules( registry, moduleData );
		provideModuleRegistrations( registry, moduleData );
		provideSiteInfo( registry );
		providePublication( registry, TEST_PUBLICATION );
	} );

	it( 'should disable submission until the terms of service are loaded', () => {
		freezeFetch( termsOfServiceEndpoint );

		const { getByRole } = render(
			<StepTermsOfService onComplete={ () => {} } />,
			{ registry }
		);

		expect( getByRole( 'button', { name: 'I agree' } ) ).toBeDisabled();
		expect( getByRole( 'progressbar' ) ).toBeInTheDocument();
	} );

	it( 'should display a retry-able error if getting the terms of service fails', async () => {
		fetchMock
			.getOnce( termsOfServiceEndpoint, {
				body: {
					code: 'internal_server_error',
					message: 'Internal server error',
					data: { status: 500 },
				},
				status: 500,
			} )
			.getOnce( termsOfServiceEndpoint, {
				body: JSON.stringify( termsOfService ),
				status: 200,
			} );

		const { getByRole, getByText, queryByRole } = render(
			<StepTermsOfService onComplete={ () => {} } />,
			{ registry }
		);

		await waitFor( () => {
			expect( getByRole( 'status' ) ).toHaveTextContent(
				/Internal server error/
			);
		} );

		expect( console ).toHaveErrored();

		fireEvent.click( getByRole( 'button', { name: 'Retry' } ) );

		await waitFor( () => {
			expect( queryByRole( 'status' ) ).not.toBeInTheDocument();
		} );

		expect(
			getByText(
				/To use Reader Revenue Manager, you must accept these Reader Revenue Manager Terms of Service/
			)
		).toBeInTheDocument();
	} );

	it( 'should disable submission when submission is in progress', async () => {
		provideTermsOfService( registry );
		freezeFetch( publicationEndpoint );

		const { getByRole } = render(
			<StepTermsOfService onComplete={ () => {} } />,
			{ registry }
		);

		const submitButton = getByRole( 'button', { name: 'I agree' } );

		fireEvent.click( submitButton );

		await waitFor( () => {
			expect( submitButton ).toBeDisabled();
		} );
	} );

	it( 'should update the publication on submission', async () => {
		provideTermsOfService( registry );

		fetchMock.postOnce( publicationEndpoint, {
			body: TEST_PUBLICATION,
			status: 200,
		} );

		const { getByRole } = render(
			<StepTermsOfService onComplete={ () => {} } />,
			{
				registry,
			}
		);

		fireEvent.click( getByRole( 'radio', { name: 'Non-profit' } ) );

		fireEvent.click(
			getByRole( 'checkbox', {
				name: 'Yes, send me customized help, performance suggestions and product updates for Reader Revenue Manager',
			} )
		);

		fireEvent.click( getByRole( 'button', { name: 'I agree' } ) );

		await waitFor( () => {
			expect( fetchMock ).toHaveFetchedTimes( 1 );
		} );

		expect( fetchMock ).toHaveFetched( publicationEndpoint, {
			body: {
				data: {
					data: {
						publicationType: PUBLICATION_TYPES.NON_PROFIT,
						rrmProduct: {
							tosAcceptance: {
								emailOptIn: true,
								userAccepted: true,
							},
						},
					},
				},
			},
		} );
	} );

	it( 'should display an error notice if submission fails', async () => {
		provideTermsOfService( registry );

		fetchMock.postOnce( publicationEndpoint, {
			body: {
				code: 'internal_server_error',
				message: 'Internal server error',
				data: { status: 500 },
			},
			status: 500,
		} );

		const onComplete = jest.fn();

		const { getByRole } = render(
			<StepTermsOfService onComplete={ onComplete } />,
			{ registry }
		);

		fireEvent.click( getByRole( 'button', { name: 'I agree' } ) );

		await waitFor( () => {
			expect( getByRole( 'status' ) ).toHaveTextContent(
				/Internal server error/
			);
		} );

		expect( getByRole( 'button', { name: 'I agree' } ) ).toBeEnabled();

		expect( onComplete ).not.toHaveBeenCalled();
		expect( console ).toHaveErrored();
	} );

	it( 'should call the complete handler if submission is successful', async () => {
		provideTermsOfService( registry );

		fetchMock.postOnce( publicationEndpoint, {
			body: TEST_PUBLICATION,
			status: 200,
		} );

		const onComplete = jest.fn();

		const { getByRole } = render(
			<StepTermsOfService onComplete={ onComplete } />,
			{ registry }
		);

		fireEvent.click( getByRole( 'button', { name: 'I agree' } ) );

		await waitFor( () => {
			expect( onComplete ).toHaveBeenCalled();
		} );
	} );
} );
