/**
 * Reader Revenue Manager SetupMainExpress component tests.
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
import { MODULES_ANALYTICS_4 } from '@/js/modules/analytics-4/datastore/constants';
import { MODULE_SLUG_READER_REVENUE_MANAGER } from '@/js/modules/reader-revenue-manager/constants';
import { publications } from '@/js/modules/reader-revenue-manager/datastore/__fixtures__';
import {
	MODULES_READER_REVENUE_MANAGER,
	SURVEY_CUSTOM_DIMENSIONS,
} from '@/js/modules/reader-revenue-manager/datastore/constants';
import { providePublications } from '@/js/modules/reader-revenue-manager/utils/test-utils';
import { mockLocation } from '@tests/js/mock-browser-utils';
import { mockSurveyEndpoints } from '@tests/js/mock-survey-endpoints';
import {
	createTestRegistry,
	provideModuleRegistrations,
	provideModules,
	provideSiteInfo,
	provideUserAuthentication,
	provideUserCapabilities,
	render,
} from '@tests/js/test-utils';
import { EXPRESS_SETUP_SCOPES } from './constants';
import SetupMainExpress from './index';

jest.mock( './PoweredBy', () => () => null );

describe( 'SetupMainExpress', () => {
	mockLocation();

	const userSettingsEndpoint = new RegExp(
		'^/google-site-kit/v1/modules/reader-revenue-manager/data/user-settings'
	);
	const customDimensionsEndpoint = new RegExp(
		'^/google-site-kit/v1/modules/analytics-4/data/(custom-dimensions|create-custom-dimension)'
	);

	const propertyID = '123456';

	let registry: Registry;

	beforeEach( () => {
		registry = createTestRegistry() as Registry;
		provideUserAuthentication( registry );
		provideUserCapabilities( registry );
		provideSiteInfo( registry );
		mockSurveyEndpoints();

		fetchMock.post( userSettingsEndpoint, {
			body: { lastActionedExpressSetups: {} },
			status: 200,
		} );

		provideUserAuthentication( registry, {
			grantedScopes: EXPRESS_SETUP_SCOPES,
		} );

		const moduleData = [
			{
				slug: MODULE_SLUG_READER_REVENUE_MANAGER,
				active: true,
				connected: false,
			},
		];

		provideModules( registry, moduleData );
		provideModuleRegistrations( registry, moduleData );

		registry
			.dispatch( MODULES_READER_REVENUE_MANAGER )
			.receiveGetSettings( { publicationID: '' } );

		registry
			.dispatch( MODULES_READER_REVENUE_MANAGER )
			.finishResolution( 'getSettings', [] );

		providePublications( registry, [] );

		// The property's custom dimensions are not provided, so reading them
		// would make a request.
		registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetSettings( {
			propertyID,
			availableCustomDimensions: [],
		} );
	} );

	it( 'renders the newsletter CTA component for newsletter-signup CTA', async () => {
		global.location.href =
			'http://example.com/?cta=newsletter-signup&step=newsletter-signup-form';

		// Has accepted the terms of service and set both policy URLs.
		const publication = publications[ 3 ];

		registry
			.dispatch( MODULES_READER_REVENUE_MANAGER )
			// eslint-disable-next-line sitekit/acronym-case -- `Id` is the identifier used by the API.
			.setPublicationID( publication.publicationId );

		providePublications( registry, [ publication ] );

		registry
			.dispatch( MODULES_READER_REVENUE_MANAGER )
			.receiveGetCTAs( { ctas: [], params: {} } );

		const { getByText, waitForRegistry } = render( <SetupMainExpress />, {
			registry,
		} );

		await waitForRegistry();

		expect( getByText( 'Set up your sign-up form' ) ).toBeInTheDocument();
		expect( fetchMock ).not.toHaveFetched( customDimensionsEndpoint );
	} );

	it( 'renders the survey CTA component for survey CTA when rrmSurveyCTA is enabled', async () => {
		global.location.href =
			'http://example.com/?cta=survey&step=survey-questions';

		// Has accepted the terms of service and set both policy URLs.
		const publication = publications[ 3 ];

		registry
			.dispatch( MODULES_READER_REVENUE_MANAGER )
			// eslint-disable-next-line sitekit/acronym-case -- `Id` is the identifier used by the API.
			.setPublicationID( publication.publicationId );

		providePublications( registry, [ publication ] );

		registry
			.dispatch( MODULES_READER_REVENUE_MANAGER )
			.receiveGetCTAs( { ctas: [], params: {} } );

		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.receiveGetCustomDimensions( SURVEY_CUSTOM_DIMENSIONS, {
				propertyID,
			} );

		const { getByText, waitForRegistry } = render( <SetupMainExpress />, {
			registry,
			features: [ 'rrmSurveyCTA' ],
		} );

		await waitForRegistry();

		expect(
			getByText( 'Survey questions placeholder' )
		).toBeInTheDocument();
	} );

	it( 'renders the default express setup for survey CTA when rrmSurveyCTA is disabled', async () => {
		global.location.href =
			'http://example.com/?cta=survey&step=connect-publication';

		const { getByText, queryByText, waitForRegistry } = render(
			<SetupMainExpress />,
			{ registry }
		);

		await waitForRegistry();

		expect( getByText( /Let's get started/ ) ).toBeInTheDocument();
		expect(
			queryByText( 'Survey questions placeholder' )
		).not.toBeInTheDocument();
		expect( fetchMock ).not.toHaveFetched( customDimensionsEndpoint );
	} );

	it( 'renders the default express setup when no CTA is specified', async () => {
		global.location.href = 'http://example.com/?step=connect-publication';

		const { getByText, queryByText, container, waitForRegistry } = render(
			<SetupMainExpress />,
			{ registry }
		);

		await waitForRegistry();

		expect( getByText( /Let's get started/ ) ).toBeInTheDocument();
		expect(
			queryByText( 'Set up a sign-up form' )
		).not.toBeInTheDocument();
		expect(
			container.querySelectorAll( '.googlesitekit-stepper__step' )
		).toHaveLength( 4 );

		expect( fetchMock ).not.toHaveFetched( userSettingsEndpoint );
		expect( fetchMock ).not.toHaveFetched( customDimensionsEndpoint );
	} );

	it( 'renders the default express setup for an unknown CTA', async () => {
		global.location.href =
			'http://example.com/?cta=unknown-cta&step=connect-publication';

		const { getByText, queryByText, waitForRegistry } = render(
			<SetupMainExpress />,
			{ registry }
		);

		await waitForRegistry();

		expect( getByText( /Let's get started/ ) ).toBeInTheDocument();
		expect(
			queryByText( 'Set up a sign-up form' )
		).not.toBeInTheDocument();

		expect( fetchMock ).not.toHaveFetched( userSettingsEndpoint );
		expect( fetchMock ).not.toHaveFetched( customDimensionsEndpoint );
	} );
} );
