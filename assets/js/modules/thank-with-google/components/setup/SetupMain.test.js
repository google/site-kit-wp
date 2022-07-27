/**
 * SetupMain component tests.
 *
 * Site Kit by Google, Copyright 2022 Google LLC
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
import { MODULES_THANK_WITH_GOOGLE } from '../../datastore/constants';
import {
	render,
	createTestRegistry,
	freezeFetch,
	provideModules,
	unsubscribeFromAll,
} from '../../../../../../tests/js/test-utils';
import SetupMain from './SetupMain';

describe( 'SetupMain', () => {
	let registry;

	const publicationWithActiveStateA = {
		// eslint-disable-next-line sitekit/acronym-case
		publicationId: 'test-publication-a',
		displayName: 'Test publication title',
		verifiedDomains: [ 'https://example.com' ],
		paymentOptions: {
			virtualGifts: true,
		},
		state: 'ACTIVE',
	};
	const publicationWithActiveStateB = {
		...publicationWithActiveStateA,
		// eslint-disable-next-line sitekit/acronym-case
		publicationId: 'test-publication-b',
	};
	const publicationActionRequiredStateC = {
		...publicationWithActiveStateA,
		// eslint-disable-next-line sitekit/acronym-case
		publicationId: 'test-publication-c',
		state: 'ACTION_REQUIRED',
	};
	const publicationPendingVerificationD = {
		...publicationWithActiveStateA,
		// eslint-disable-next-line sitekit/acronym-case
		publicationId: 'test-publication-d',
		state: 'PENDING_VERIFICATION',
	};
	const publicationsWithActiveState = [
		publicationWithActiveStateA,
		publicationWithActiveStateB,
	];

	beforeEach( () => {
		registry = createTestRegistry();
		provideModules( registry, [
			{
				slug: 'thank-with-google',
				name: 'Thank With Google',
				active: true,
				connected: false,
			},
		] );
		registry.dispatch( MODULES_THANK_WITH_GOOGLE ).receiveGetSettings( {} );
	} );

	afterEach( () => {
		unsubscribeFromAll( registry );
	} );

	it( 'should render the error notices if there are errors', () => {
		freezeFetch(
			/^\/google-site-kit\/v1\/modules\/thank-with-google\/data\/publications/
		);
		registry
			.dispatch( MODULES_THANK_WITH_GOOGLE )
			.receiveGetPublications( [] );
		registry.dispatch( MODULES_THANK_WITH_GOOGLE ).receiveError(
			{
				// Typically thrown when fetching publications.
				message: 'Thank with Google publication is disapproved.',
				data: {
					status: 403,
					reason: 'disapprovedPublication',
				},
			},
			'getPublications',
			[]
		);

		const { container } = render( <SetupMain />, {
			registry,
		} );

		expect(
			container.querySelector( '.googlesitekit-error-text' )
		).toBeInTheDocument();
		expect( container ).toHaveTextContent(
			'Thank with Google publication is disapproved.'
		);
	} );

	it( 'should render the ProgressBar loading animation if the publications are not loaded yet', () => {
		freezeFetch(
			/^\/google-site-kit\/v1\/modules\/thank-with-google\/data\/publications/
		);

		const { getByRole } = render( <SetupMain />, {
			registry,
		} );

		expect( getByRole( 'progressbar' ) ).toBeInTheDocument();
	} );

	it( 'should render the create publication screen if the current publication is null', () => {
		registry
			.dispatch( MODULES_THANK_WITH_GOOGLE )
			.receiveGetPublications( [] );

		const { container } = render( <SetupMain />, {
			registry,
		} );

		expect( container ).toHaveTextContent(
			'To get started, create an account. Currently available only in the US.'
		);
	} );

	it( 'should render the publication action required screen if the current publication state is `ACTION_REQUIRED`', () => {
		registry
			.dispatch( MODULES_THANK_WITH_GOOGLE )
			.receiveGetPublications( [ publicationActionRequiredStateC ] );

		const { container, queryByRole } = render( <SetupMain />, {
			registry,
		} );

		expect( container ).toHaveTextContent(
			'Finish the setup to customize and add Thank with Google on your site.'
		);
		const button = queryByRole( 'button' );
		expect( button ).toBeInTheDocument();
		expect( button ).toHaveTextContent( 'Complete setup' );
	} );

	it( 'should render the publication pending verification screen if the current publication state is `PENDING_VERIFICATION`', () => {
		registry
			.dispatch( MODULES_THANK_WITH_GOOGLE )
			.receiveGetPublications( [ publicationPendingVerificationD ] );

		const { container } = render( <SetupMain />, {
			registry,
		} );

		// TODO: Update this assertion to match the new UI.
		expect( container ).toHaveTextContent(
			'We received your request to create a Thank with Google account. Check again for updates to your status.'
		);
	} );

	it( 'should render the publication active screen if the current publication state is `ACTIVE` and the module setting publicationID is not set', () => {
		registry
			.dispatch( MODULES_THANK_WITH_GOOGLE )
			.receiveGetPublications( publicationsWithActiveState );

		const { container, queryByRole } = render( <SetupMain />, {
			registry,
		} );

		expect( container ).toHaveTextContent(
			'Your account is now active. To get started, customize the appearance of Thank with Google on your site.'
		);
		const button = queryByRole( 'button' );
		expect( button ).toBeInTheDocument();
		expect( button ).toHaveTextContent( 'Customize Thank with Google' );
	} );

	it( 'should render the publication customize screen if the current publication state is `ACTIVE` and the module setting publicationID is already set', () => {
		registry
			.dispatch( MODULES_THANK_WITH_GOOGLE )
			.receiveGetPublications( publicationsWithActiveState );

		registry
			.dispatch( MODULES_THANK_WITH_GOOGLE )
			.setPublicationID( 'test-publication-a' );

		const { container, queryByRole } = render( <SetupMain />, {
			registry,
		} );

		// TODO: Update this assertion to match the new UI.
		expect( container ).toHaveTextContent(
			'Customize the appearance of Thank with Google on your site'
		);
		const button = queryByRole( 'button' );
		expect( button ).toBeInTheDocument();
		expect( button ).toBeDisabled();
		expect( button ).toHaveTextContent( 'Configure Thank with Google' );
	} );
} );
