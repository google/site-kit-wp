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
 * WordPress dependencies
 */
import { WPDataRegistry } from '@wordpress/data/build-types/registry';

/**
 * Internal dependencies
 */
import {
	EXPRESS_SETUP_STEPS,
	MODULES_READER_REVENUE_MANAGER,
} from '@/js/modules/reader-revenue-manager/datastore/constants';
import { mockLocation } from '@tests/js/mock-browser-utils';
import {
	createTestRegistryWithFeatures,
	fireEvent,
	render,
	waitFor,
} from '@tests/js/test-utils';
import StepPublicationPolicies from './StepPublicationPolicies';

const PUBLICATION_ID_KEY = 'publicationId';
const PUBLICATION_TOS_URL_KEY = 'publicationTosUrl';
const PUBLICATION_PRIVACY_POLICY_URL_KEY = 'publicationPrivacyPolicyUrl';

describe( 'StepPublicationPolicies', () => {
	let registry: WPDataRegistry;
	let onSetStep: jest.Mock< void, [ string ] >;

	mockLocation();

	beforeEach( () => {
		registry = createTestRegistryWithFeatures( [ 'rrmExpressSetup' ] );
		onSetStep = jest.fn();
		global.location.href =
			'http://example.com/?step=publication-policies&cta=newsletter-signup';
		global._googlesitekitBaseData.wpPrivacyURL =
			'https://example.com/wp-privacy';
	} );

	function renderStep() {
		return render( <StepPublicationPolicies onSetStep={ onSetStep } />, {
			registry,
		} );
	}

	function receiveSettingsAndPublication( {
		organizationID = 'organization-1',
		publicationID = 'publication-1',
		// eslint-disable-next-line sitekit/acronym-case
		publicationTosUrl,
		publicationPrivacyPolicyURL,
	}: {
		organizationID?: string;
		publicationID?: string;
		// eslint-disable-next-line sitekit/acronym-case
		publicationTosUrl?: string;
		publicationPrivacyPolicyURL?: string;
	} = {} ) {
		registry
			.dispatch( MODULES_READER_REVENUE_MANAGER )
			.receiveGetSettings( {
				organizationID,
				publicationID,
			} );

		registry
			.dispatch( MODULES_READER_REVENUE_MANAGER )
			.receiveGetPublication(
				{
					[ PUBLICATION_ID_KEY ]: publicationID,
					// eslint-disable-next-line sitekit/acronym-case
					[ PUBLICATION_TOS_URL_KEY ]: publicationTosUrl,
					[ PUBLICATION_PRIVACY_POLICY_URL_KEY ]:
						publicationPrivacyPolicyURL,
				},
				{
					organizationID,
					publicationID,
				}
			);
	}

	it( 'renders existing publication policy URLs', () => {
		receiveSettingsAndPublication( {
			// eslint-disable-next-line sitekit/acronym-case
			publicationTosUrl: 'https://example.com/terms',
			publicationPrivacyPolicyURL: 'https://example.com/privacy',
		} );

		const { getByLabelText } = renderStep();

		expect( getByLabelText( 'Terms of service' ) ).toHaveValue(
			'https://example.com/terms'
		);
		expect( getByLabelText( 'Privacy policy' ) ).toHaveValue(
			'https://example.com/privacy'
		);
	} );

	it( 'falls back to the WordPress privacy policy URL when publication value is empty', () => {
		receiveSettingsAndPublication( {
			// eslint-disable-next-line sitekit/acronym-case
			publicationTosUrl: 'https://example.com/terms',
			publicationPrivacyPolicyURL: '',
		} );

		const { getByLabelText } = renderStep();

		expect( getByLabelText( 'Privacy policy' ) ).toHaveValue(
			'https://example.com/wp-privacy'
		);
	} );

	it( 'keeps submit disabled until both values are valid URLs', () => {
		receiveSettingsAndPublication();
		global._googlesitekitBaseData.wpPrivacyURL = '';

		const { getByLabelText, getByRole } = renderStep();

		const termsField = getByLabelText( 'Terms of service' );
		const privacyField = getByLabelText( 'Privacy policy' );
		const submitButton = getByRole( 'button', { name: 'Submit policies' } );

		expect( submitButton ).toBeDisabled();

		fireEvent.change( termsField, { target: { value: 'not-a-url' } } );
		fireEvent.change( privacyField, {
			target: { value: 'https://example.com/privacy' },
		} );
		expect( submitButton ).toBeDisabled();

		fireEvent.change( termsField, {
			target: { value: 'https://example.com/terms' },
		} );
		expect( submitButton ).toBeEnabled();
	} );

	it( 'submits policies and advances to setup-cta when update succeeds', async () => {
		receiveSettingsAndPublication();

		const updatePublicationMock = jest
			.spyOn(
				registry.dispatch( MODULES_READER_REVENUE_MANAGER ),
				'updatePublication'
			)
			.mockResolvedValue( { response: {}, error: undefined } );

		const { getByLabelText, getByRole } = renderStep();

		fireEvent.change( getByLabelText( 'Terms of service' ), {
			target: { value: 'https://example.com/terms' },
		} );
		fireEvent.change( getByLabelText( 'Privacy policy' ), {
			target: { value: 'https://example.com/privacy' },
		} );

		fireEvent.click( getByRole( 'button', { name: 'Submit policies' } ) );

		await waitFor( () => {
			expect( updatePublicationMock ).toHaveBeenCalledWith( {
				organizationID: 'organization-1',
				publicationID: 'publication-1',
				data: {
					[ PUBLICATION_TOS_URL_KEY ]: 'https://example.com/terms',
					[ PUBLICATION_PRIVACY_POLICY_URL_KEY ]:
						'https://example.com/privacy',
				},
			} );
		} );

		expect( onSetStep ).toHaveBeenCalledWith(
			EXPRESS_SETUP_STEPS.SETUP_CTA
		);
	} );

	it( 'renders error UI on failed submit and keeps user-entered values', async () => {
		receiveSettingsAndPublication();

		jest.spyOn(
			registry.dispatch( MODULES_READER_REVENUE_MANAGER ),
			'updatePublication'
		).mockResolvedValue( {
			error: { message: 'Failed to update publication policies' },
		} );

		const { container, getByLabelText, getByRole, getByText } =
			renderStep();

		fireEvent.change( getByLabelText( 'Terms of service' ), {
			target: { value: 'https://example.com/my-terms' },
		} );
		fireEvent.change( getByLabelText( 'Privacy policy' ), {
			target: { value: 'https://example.com/my-privacy' },
		} );

		fireEvent.click( getByRole( 'button', { name: 'Submit policies' } ) );

		await waitFor( () => {
			expect(
				getByText( 'Failed to update publication policies' )
			).toBeInTheDocument();
		} );

		expect(
			container.querySelectorAll( '.mdc-text-field-helper-text' )
		).toHaveLength( 2 );
		expect(
			container.querySelectorAll( '.mdc-text-field--error' )
		).toHaveLength( 2 );
		expect( getByLabelText( 'Terms of service' ) ).toHaveValue(
			'https://example.com/my-terms'
		);
		expect( getByLabelText( 'Privacy policy' ) ).toHaveValue(
			'https://example.com/my-privacy'
		);
	} );
} );
