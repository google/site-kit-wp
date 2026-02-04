/**
 * PolicyViolationSettingsNotice component tests.
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
import {
	createTestRegistry,
	provideUserAuthentication,
	provideUserInfo,
	render,
} from '../../../../../../tests/js/test-utils';
import {
	MODULES_READER_REVENUE_MANAGER,
	CONTENT_POLICY_STATES,
	PUBLICATION_ONBOARDING_STATES,
} from '@/js/modules/reader-revenue-manager/datastore/constants';
import PolicyViolationSettingsNotice from './PolicyViolationSettingsNotice';

const {
	CONTENT_POLICY_STATE_OK,
	CONTENT_POLICY_VIOLATION_GRACE_PERIOD,
	CONTENT_POLICY_ORGANIZATION_VIOLATION_GRACE_PERIOD,
	CONTENT_POLICY_VIOLATION_ACTIVE,
	CONTENT_POLICY_ORGANIZATION_VIOLATION_ACTIVE,
	CONTENT_POLICY_ORGANIZATION_VIOLATION_IMMEDIATE,
} = CONTENT_POLICY_STATES;

const POLICY_INFO_URL = 'https://example.com/policy-info';

describe( 'PolicyViolationSettingsNotice', () => {
	let registry: ReturnType< typeof createTestRegistry >;

	function setupRegistry( contentPolicyState: string ) {
		registry
			.dispatch( MODULES_READER_REVENUE_MANAGER )
			.receiveGetSettings( {
				publicationID: 'ABCDEFGH',
				publicationOnboardingState:
					PUBLICATION_ONBOARDING_STATES.ONBOARDING_COMPLETE,
				contentPolicyStatus: {
					contentPolicyState,
					policyInfoLink:
						contentPolicyState === CONTENT_POLICY_STATE_OK
							? null
							: POLICY_INFO_URL,
				},
			} );
	}

	beforeEach( () => {
		registry = createTestRegistry();
		provideUserAuthentication( registry );
		provideUserInfo( registry );
	} );

	it( 'should not render the component when content policy state is CONTENT_POLICY_STATE_OK', () => {
		setupRegistry( CONTENT_POLICY_STATE_OK );

		const { container } = render( <PolicyViolationSettingsNotice />, {
			registry,
		} );

		expect( container ).toBeEmptyDOMElement();
	} );

	it( 'should not render the component when content policy state is undefined', () => {
		registry
			.dispatch( MODULES_READER_REVENUE_MANAGER )
			.receiveGetSettings( {
				publicationID: 'ABCDEFGH',
				publicationOnboardingState:
					PUBLICATION_ONBOARDING_STATES.ONBOARDING_COMPLETE,
			} );

		const { container } = render( <PolicyViolationSettingsNotice />, {
			registry,
		} );

		expect( container ).toBeEmptyDOMElement();
	} );

	it.each( [
		CONTENT_POLICY_VIOLATION_GRACE_PERIOD,
		CONTENT_POLICY_ORGANIZATION_VIOLATION_GRACE_PERIOD,
	] )(
		'should render warning notice with pending violation copy for content policy state %s',
		( contentPolicyState ) => {
			setupRegistry( contentPolicyState );

			const { getByText, getByRole, container } = render(
				<PolicyViolationSettingsNotice />,
				{
					registry,
				}
			);

			expect(
				getByText(
					'Action needed: fix a policy issue with Reader Revenue Manager'
				)
			).toBeInTheDocument();

			expect(
				getByText(
					'Your site has content that breaks the rules for Reader Revenue Manager. To keep your account active and CTAs public, you must resolve all policy violations.'
				)
			).toBeInTheDocument();

			expect(
				getByRole( 'button', { name: /View violations/ } )
			).toBeInTheDocument();

			expect(
				container.querySelector( '.googlesitekit-notice--warning' )
			).toBeInTheDocument();

			// Snapshot for the first state to verify visual rendering.
			if (
				contentPolicyState === CONTENT_POLICY_VIOLATION_GRACE_PERIOD
			) {
				expect( container ).toMatchSnapshot();
			}
		}
	);

	it.each( [
		CONTENT_POLICY_VIOLATION_ACTIVE,
		CONTENT_POLICY_ORGANIZATION_VIOLATION_ACTIVE,
	] )(
		'should render warning notice with active violation copy for content policy state %s',
		( contentPolicyState ) => {
			setupRegistry( contentPolicyState );

			const { getByText, getByRole, container } = render(
				<PolicyViolationSettingsNotice />,
				{
					registry,
				}
			);

			expect(
				getByText(
					'Action needed: Your Reader Revenue Manager account is restricted'
				)
			).toBeInTheDocument();

			expect(
				getByText(
					/Your site has content that doesn.t follow the rules\. To see more details and resolve the violation, please visit Publisher Center\./
				)
			).toBeInTheDocument();

			expect(
				getByRole( 'button', { name: /View violations/ } )
			).toBeInTheDocument();

			expect(
				container.querySelector( '.googlesitekit-notice--warning' )
			).toBeInTheDocument();
		}
	);

	it( 'should render error notice with extreme violation copy for CONTENT_POLICY_ORGANIZATION_VIOLATION_IMMEDIATE', () => {
		setupRegistry( CONTENT_POLICY_ORGANIZATION_VIOLATION_IMMEDIATE );

		const { getByText, getByRole, container } = render(
			<PolicyViolationSettingsNotice />,
			{
				registry,
			}
		);

		expect(
			getByText(
				'Action needed: Your Reader Revenue Manager account is terminated'
			)
		).toBeInTheDocument();

		expect(
			getByText(
				/Your account is terminated because your site content doesn.t follow the rules\. Visit Publisher Center for more information\./
			)
		).toBeInTheDocument();

		expect(
			getByRole( 'button', { name: /Learn more/ } )
		).toBeInTheDocument();

		expect(
			container.querySelector( '.googlesitekit-notice--error' )
		).toBeInTheDocument();

		expect( container ).toMatchSnapshot();
	} );

	it( 'should have CTA button with href containing policy info URL', () => {
		setupRegistry( CONTENT_POLICY_VIOLATION_ACTIVE );

		const { container } = render( <PolicyViolationSettingsNotice />, {
			registry,
		} );

		const ctaHref = container
			.querySelector( '.googlesitekit-notice__cta' )
			?.getAttribute( 'href' );

		expect( ctaHref ).toContain( encodeURIComponent( POLICY_INFO_URL ) );
	} );
} );
