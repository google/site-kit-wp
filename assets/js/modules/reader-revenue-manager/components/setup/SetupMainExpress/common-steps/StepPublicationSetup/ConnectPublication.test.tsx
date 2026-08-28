/**
 * Reader Revenue Manager connect publication component tests.
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
import { publications } from '@/js/modules/reader-revenue-manager/datastore/__fixtures__';
import { MODULES_READER_REVENUE_MANAGER } from '@/js/modules/reader-revenue-manager/datastore/constants';
import { providePublications } from '@/js/modules/reader-revenue-manager/utils/test-utils';
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
import ConnectPublication from './ConnectPublication';

const TEST_DEFAULT_PUBLICATION = publications[ publications.length - 1 ];
const TEST_PUBLICATION_WITH_ACCEPTED_TERMS = publications[ 3 ];
const TEST_PUBLICATION_WITHOUT_ACCEPTED_TERMS = publications[ 2 ];

describe( 'ConnectPublication', () => {
	let registry: Registry;

	const publicationsEndpoint = new RegExp(
		'^/google-site-kit/v1/modules/reader-revenue-manager/data/publications'
	);

	const settingsEndpoint = new RegExp(
		'^/google-site-kit/v1/modules/reader-revenue-manager/data/settings'
	);

	beforeEach( () => {
		registry = createTestRegistry() as Registry;

		provideSiteInfo( registry );

		const moduleData = [
			{
				slug: MODULE_SLUG_READER_REVENUE_MANAGER,
				active: true,
				connected: false,
			},
		];

		provideModules( registry, moduleData );
		provideModuleRegistrations( registry, moduleData );

		// Seed the settings required to enable the submit button.
		registry
			.dispatch( MODULES_READER_REVENUE_MANAGER )
			.receiveGetSettings( {
				postTypes: [ 'post' ],
				snippetMode: 'post_types',
			} );

		registry
			.dispatch( MODULES_READER_REVENUE_MANAGER )
			.finishResolution( 'getSettings', [] );
	} );

	it( 'should display a retry-able error if getting publications fails', async () => {
		fetchMock
			.getOnce( publicationsEndpoint, {
				body: {
					code: 'internal_server_error',
					message: 'Internal server error',
					data: { status: 500 },
				},
				status: 500,
			} )
			.getOnce( publicationsEndpoint, {
				body: publications,
				status: 200,
			} );

		const { container, getByRole, queryByRole } = render(
			<ConnectPublication onComplete={ () => {} } />,
			{
				registry,
			}
		);

		await waitFor( () => {
			expect( getByRole( 'status' ) ).toHaveTextContent(
				/Internal server error/
			);
		} );

		expect(
			container.querySelector( '.mdc-select__selected-text' )
		).toBeEmptyDOMElement();

		fireEvent.click( getByRole( 'button', { name: 'Retry' } ) );

		await waitFor( () => {
			expect(
				container.querySelector( '.mdc-select__selected-text' )
			).toHaveTextContent( TEST_DEFAULT_PUBLICATION.displayName );
		} );

		expect( queryByRole( 'status' ) ).not.toBeInTheDocument();
		expect( console ).toHaveErrored();
	} );

	it( 'should disable submission if no publications exist', () => {
		providePublications( registry, [] );

		const { getByRole } = render(
			<ConnectPublication onComplete={ () => {} } />,
			{
				registry,
			}
		);

		expect(
			getByRole( 'button', { name: 'Connect existing publication' } )
		).toBeDisabled();
	} );

	it( 'should disable submission when submission is in progress', async () => {
		providePublications( registry, publications );
		freezeFetch( settingsEndpoint );

		const { getByRole } = render(
			<ConnectPublication onComplete={ () => {} } />,
			{
				registry,
			}
		);

		const submitButton = getByRole( 'button', {
			name: 'Connect existing publication',
		} );

		fireEvent.click( submitButton );

		await waitFor( () => {
			expect( submitButton ).toBeDisabled();
		} );
	} );

	it( 'should select a default publication on load', async () => {
		providePublications( registry, publications );

		expect(
			registry.select( MODULES_READER_REVENUE_MANAGER ).getPublicationID()
		).toBeUndefined();

		const { container } = render(
			<ConnectPublication onComplete={ () => {} } />,
			{
				registry,
			}
		);

		await waitFor( () => {
			const publicationID = registry
				.select( MODULES_READER_REVENUE_MANAGER )
				.getPublicationID();

			expect( publicationID ).toBe(
				// eslint-disable-next-line sitekit/acronym-case
				TEST_DEFAULT_PUBLICATION.publicationId
			);

			const select = container.querySelector(
				'.mdc-select__selected-text'
			);

			expect( select ).toHaveTextContent( publicationID );
		} );
	} );

	it( 'should call the complete handler with true on success if terms have been accepted', async () => {
		providePublications( registry, [
			TEST_PUBLICATION_WITH_ACCEPTED_TERMS,
		] );

		fetchMock.postOnce( settingsEndpoint, {} );

		const onComplete = jest.fn();

		const { getByRole } = render(
			<ConnectPublication onComplete={ onComplete } />,
			{
				registry,
			}
		);

		const submitButton = getByRole( 'button', {
			name: 'Connect existing publication',
		} );

		await waitFor( () => expect( submitButton ).toBeEnabled() );

		fireEvent.click( submitButton );

		await waitFor( () => {
			expect( onComplete ).toHaveBeenCalledWith( true );
		} );

		expect( fetchMock ).toHaveFetched( settingsEndpoint );
	} );

	it( 'should call the complete handler with false if the terms have not been accepted', async () => {
		providePublications( registry, [
			TEST_PUBLICATION_WITHOUT_ACCEPTED_TERMS,
		] );

		fetchMock.postOnce( settingsEndpoint, {} );

		const onComplete = jest.fn();

		const { getByRole } = render(
			<ConnectPublication onComplete={ onComplete } />,
			{
				registry,
			}
		);

		const submitButton = getByRole( 'button', {
			name: 'Connect existing publication',
		} );

		await waitFor( () => expect( submitButton ).toBeEnabled() );

		fireEvent.click( submitButton );

		await waitFor( () => {
			expect( onComplete ).toHaveBeenCalledWith( false );
		} );

		expect( fetchMock ).toHaveFetched( settingsEndpoint );
	} );

	it( 'should display an error notice if the submission fails', async () => {
		providePublications( registry, publications );

		fetchMock.postOnce( settingsEndpoint, {
			body: {
				code: 'internal_server_error',
				message: 'Internal server error',
				data: { status: 500 },
			},
			status: 500,
		} );

		const onComplete = jest.fn();

		const { getByRole } = render(
			<ConnectPublication onComplete={ onComplete } />,
			{
				registry,
			}
		);

		const submitButton = getByRole( 'button', {
			name: 'Connect existing publication',
		} );

		await waitFor( () => expect( submitButton ).toBeEnabled() );

		fireEvent.click( submitButton );

		await waitFor( () => {
			expect( getByRole( 'status' ) ).toHaveTextContent(
				/Internal server error/
			);
		} );

		expect( onComplete ).not.toHaveBeenCalled();
		expect( console ).toHaveErrored();
	} );

	it.each( [
		[ 'en', 'English', 'US', 'United States' ],
		[ 'zh', 'Chinese', 'CN', 'China' ],
		[ 'abc', 'abc', 'xyz', 'xyz' ],
		[ undefined, 'Unknown', undefined, 'Unknown' ],
	] )(
		'should display language code %s as %s and region code %s as %s',
		async ( languageCode, language, regionCode, region ) => {
			providePublications( registry, [
				{
					...TEST_DEFAULT_PUBLICATION,
					languageCode,
					regionCode,
				},
			] );

			const { container } = render(
				<ConnectPublication onComplete={ () => {} } />,
				{
					registry,
				}
			);

			await waitFor( () => {
				const descriptions = container.querySelectorAll(
					'.googlesitekit-rrm-express-setup-details__item'
				);

				expect( descriptions.length ).toBe( 2 );
				expect( descriptions[ 0 ] ).toHaveTextContent( language );
				expect( descriptions[ 1 ] ).toHaveTextContent( region );
			} );
		}
	);
} );
