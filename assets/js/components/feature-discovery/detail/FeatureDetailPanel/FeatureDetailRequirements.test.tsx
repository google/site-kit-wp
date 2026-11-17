/**
 * FeatureDetailRequirements tests.
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
import { CORE_FEATURE_DISCOVERY } from '@/js/googlesitekit/datastore/feature-discovery/constants';
import { provideFeatures } from '@/js/googlesitekit/datastore/feature-discovery/test-utils';
import { Feature } from '@/js/googlesitekit/datastore/feature-discovery/types';
import {
	createTestRegistry,
	render,
	screen,
	within,
} from '@tests/js/test-utils';
import FeatureDetailRequirements from './FeatureDetailRequirements';

describe( 'FeatureDetailRequirements', () => {
	let feature: Feature;

	beforeEach( () => {
		const registry = createTestRegistry();

		provideFeatures( registry, [ { slug: 'test-feature' } ] );

		feature = {
			...registry
				.select( CORE_FEATURE_DISCOVERY )
				.getFeature( 'test-feature' ),
		};
	} );

	it( 'should render effort, service requirements, checklist and external help links', () => {
		feature.detail = {
			requirements: {
				serviceRequirements: <strong>A service account</strong>,
				setupList: [
					'Connect your account',
					<span key="finish">Finish setup</span>,
				],
				documentationURL: 'https://example.com/docs/',
			},
		};

		const { container } = render(
			<FeatureDetailRequirements feature={ feature } />
		);

		expect( container ).toMatchSnapshot();
	} );

	it( 'should render a nested list for a setup list step with sub-steps, alongside a plain entry', () => {
		feature.detail = {
			requirements: {
				setupList: [
					'Choose your Google Ads account',
					{
						label: 'Connect your account',
						subSteps: [
							'New account: Set up your account, campaign and payment details.',
							'Existing account: Enter your Ads conversion ID.',
						],
					},
				],
			},
		};

		render( <FeatureDetailRequirements feature={ feature } /> );

		expect(
			screen.getByText( 'Choose your Google Ads account' )
		).toBeInTheDocument();

		const connectAccountStep = screen
			.getByText( 'Connect your account' )
			.closest( 'li' ) as HTMLElement; // eslint-disable-line sitekit/acronym-case

		expect( connectAccountStep ).toBeInTheDocument();

		const subStepsList = connectAccountStep.querySelector(
			'.googlesitekit-feature-details-panel__setup-list-sub-steps'
		) as HTMLElement; // eslint-disable-line sitekit/acronym-case

		expect( subStepsList ).toBeInTheDocument();
		expect( subStepsList.tagName ).toBe( 'UL' );
		expect( subStepsList.children ).toHaveLength( 2 );

		expect(
			within( subStepsList ).getByText(
				'New account: Set up your account, campaign and payment details.'
			)
		).toBeInTheDocument();
		expect(
			within( subStepsList ).getByText(
				'Existing account: Enter your Ads conversion ID.'
			)
		).toBeInTheDocument();
	} );

	it.each( [
		undefined,
		{},
		{ requirements: { serviceRequirements: '', setupList: [] } },
	] )( 'should omit empty requirements sections for %s', ( detail ) => {
		feature.detail = detail;

		const { container } = render(
			<FeatureDetailRequirements feature={ feature } />
		);

		expect( container ).toMatchSnapshot();
	} );
} );
