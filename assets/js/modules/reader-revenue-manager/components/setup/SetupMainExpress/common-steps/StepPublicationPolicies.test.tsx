/**
 * Reader Revenue Manager express setup publication policies step tests.
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
import StepPublicationPolicies from '@/js/modules/reader-revenue-manager/components/setup/SetupMainExpress/common-steps/StepPublicationPolicies';
import { MODULE_SLUG_READER_REVENUE_MANAGER } from '@/js/modules/reader-revenue-manager/constants';
import { publications } from '@/js/modules/reader-revenue-manager/datastore/__fixtures__';
import {
	EXPRESS_SETUP_STEPS,
	MODULES_READER_REVENUE_MANAGER,
} from '@/js/modules/reader-revenue-manager/datastore/constants';
import { providePublication } from '@/js/modules/reader-revenue-manager/utils/test-utils';
import { mockLocation } from '@tests/js/mock-browser-utils';
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

const TEST_PUBLICATION = publications[ 0 ];
const TEST_PUBLICATION_WITH_EXISTING_VALUES = publications[ 3 ];

describe( 'StepPublicationPolicies', () => {
	let registry: Registry;

	const publicationEndpoint = new RegExp(
		'^/google-site-kit/v1/modules/reader-revenue-manager/data/publication'
	);

	mockLocation();

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

		global.location.href = `http://example.com/?step=${ EXPRESS_SETUP_STEPS.PUBLICATION_POLICIES }`;
	} );

	it( 'should render as a progress bar if the publication is loading', () => {
		registry
			.dispatch( MODULES_READER_REVENUE_MANAGER )
			.startResolution( 'getPublication', [] );

		const { getByRole } = render(
			<StepPublicationPolicies onComplete={ () => {} } />,
			{
				registry,
			}
		);

		expect( getByRole( 'progressbar' ) ).toBeInTheDocument();
	} );

	it( 'should disable submission until all fields are complete', () => {
		providePublication( registry, TEST_PUBLICATION );

		const { getByRole, getByLabelText } = render(
			<StepPublicationPolicies onComplete={ () => {} } />,
			{
				registry,
			}
		);

		const submitButton = getByRole( 'button', {
			name: 'Submit policies',
		} );

		expect( submitButton ).toBeDisabled();

		fireEvent.change( getByLabelText( 'Terms of service' ), {
			target: { value: 'https://example.com/terms-of-service' },
		} );

		expect( submitButton ).toBeDisabled();

		fireEvent.change( getByLabelText( 'Privacy policy' ), {
			target: { value: 'https://example.com/privacy-policy' },
		} );

		expect( submitButton ).toBeEnabled();
	} );

	it.each( [
		[
			'invalid protocols',
			'ftp://example.com/terms-of-service',
			'ftp://example.com/privacy-policy',
		],
		[
			'malformed URLs',
			'http example.com/terms-of-service',
			'http example.com/privacy-policy',
		],
		[ 'non-URL values', 'Terms of service URL', 'Privacy policy URL' ],
	] )(
		'should disable submission and display an error message for %s',
		( _name, privacyPolicyURL, termsOfServiceURL ) => {
			providePublication( registry, TEST_PUBLICATION );

			const { getByLabelText, getByRole } = render(
				<StepPublicationPolicies onComplete={ () => {} } />,
				{
					registry,
				}
			);

			const privacyPolicyURLInput = getByLabelText( 'Terms of service' );
			const termsOfServiceURLInput = getByLabelText( 'Privacy policy' );

			const submitButton = getByRole( 'button', {
				name: 'Submit policies',
			} );

			expect( privacyPolicyURLInput ).not.toHaveAccessibleDescription();
			expect( termsOfServiceURLInput ).not.toHaveAccessibleDescription();

			fireEvent.change( privacyPolicyURLInput, {
				target: { value: privacyPolicyURL },
			} );

			fireEvent.change( termsOfServiceURLInput, {
				target: { value: termsOfServiceURL },
			} );

			expect( termsOfServiceURLInput ).toHaveAccessibleDescription(
				"Please enter a URL beginning with 'http://' or 'https://'."
			);

			expect( privacyPolicyURLInput ).toHaveAccessibleDescription(
				"Please enter a URL beginning with 'http://' or 'https://'."
			);

			expect( submitButton ).toBeDisabled();
		}
	);

	it( 'should pre-fill the privacy policy URL if the site has a Privacy Policy page set', () => {
		providePublication( registry, TEST_PUBLICATION );
		provideSiteInfo( registry, {
			wpPrivacyURL: 'https://example.com/wp-privacy-policy',
		} );

		const { getByLabelText } = render(
			<StepPublicationPolicies onComplete={ () => {} } />,
			{
				registry,
			}
		);

		expect( getByLabelText( 'Terms of service' ) ).not.toHaveValue();
		expect( getByLabelText( 'Privacy policy' ) ).toHaveValue(
			'https://example.com/wp-privacy-policy'
		);
	} );

	it( 'should pre-fill fields for publications with existing values', () => {
		providePublication( registry, TEST_PUBLICATION_WITH_EXISTING_VALUES );

		const { getByLabelText } = render(
			<StepPublicationPolicies onComplete={ () => {} } />,
			{
				registry,
			}
		);

		expect( getByLabelText( 'Terms of service' ) ).toHaveValue(
			TEST_PUBLICATION_WITH_EXISTING_VALUES.publicationTosUrl // eslint-disable-line sitekit/acronym-case
		);

		expect( getByLabelText( 'Privacy policy' ) ).toHaveValue(
			TEST_PUBLICATION_WITH_EXISTING_VALUES.publicationPrivacyPolicyUrl // eslint-disable-line sitekit/acronym-case
		);
	} );

	it( 'should display a retry-able error if getting the publication fails', async () => {
		registry
			.dispatch( MODULES_READER_REVENUE_MANAGER )
			.receiveGetSettings( {
				publicationID:
					TEST_PUBLICATION_WITH_EXISTING_VALUES.publicationId, // eslint-disable-line sitekit/acronym-case
			} );

		fetchMock
			.getOnce( publicationEndpoint, {
				body: {
					code: 'internal_server_error',
					message: 'Internal server error',
					data: { status: 500 },
				},
				status: 500,
			} )
			.getOnce( publicationEndpoint, {
				body: TEST_PUBLICATION_WITH_EXISTING_VALUES,
				status: 200,
			} );

		const { getByLabelText, getByRole, queryByRole } = render(
			<StepPublicationPolicies onComplete={ () => {} } />,
			{
				registry,
			}
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

		expect( getByLabelText( 'Terms of service' ) ).toHaveValue(
			TEST_PUBLICATION_WITH_EXISTING_VALUES.publicationTosUrl // eslint-disable-line sitekit/acronym-case
		);

		expect( getByLabelText( 'Privacy policy' ) ).toHaveValue(
			TEST_PUBLICATION_WITH_EXISTING_VALUES.publicationPrivacyPolicyUrl // eslint-disable-line sitekit/acronym-case
		);
	} );

	it( 'should disable submission when submission is in progress', () => {
		providePublication( registry, TEST_PUBLICATION_WITH_EXISTING_VALUES );

		freezeFetch( publicationEndpoint );

		const { getByRole } = render(
			<StepPublicationPolicies onComplete={ () => {} } />,
			{
				registry,
			}
		);

		const submitButton = getByRole( 'button', {
			name: 'Submit policies',
		} );

		expect( submitButton ).toBeEnabled();

		fireEvent.click( submitButton );

		expect( submitButton ).toBeDisabled();
	} );

	it( 'should call the complete handler if submission is successful', async () => {
		providePublication( registry, TEST_PUBLICATION_WITH_EXISTING_VALUES );

		fetchMock.postOnce( publicationEndpoint, {
			body: {},
			status: 200,
		} );

		const onComplete = jest.fn();

		const { getByRole } = render(
			<StepPublicationPolicies onComplete={ onComplete } />,
			{
				registry,
			}
		);

		fireEvent.click( getByRole( 'button', { name: 'Submit policies' } ) );

		await waitFor( () => {
			expect( onComplete ).toHaveBeenCalled();
		} );

		expect( fetchMock ).toHaveFetched( publicationEndpoint );
	} );

	it( 'should display an error notice if updating the publication fails', async () => {
		providePublication( registry, TEST_PUBLICATION_WITH_EXISTING_VALUES );

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
			<StepPublicationPolicies onComplete={ onComplete } />,
			{
				registry,
			}
		);

		fireEvent.click( getByRole( 'button', { name: 'Submit policies' } ) );

		await waitFor( () => {
			expect( getByRole( 'status' ) ).toHaveTextContent(
				/Internal server error/
			);
		} );

		expect( onComplete ).not.toHaveBeenCalled();
		expect( fetchMock ).toHaveFetched( publicationEndpoint );
		expect( console ).toHaveErrored();
	} );
} );
