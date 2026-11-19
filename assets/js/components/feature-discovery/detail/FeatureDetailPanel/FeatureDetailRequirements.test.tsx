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
import * as tracking from '@/js/util/tracking';
import { createTestRegistry, fireEvent, render } from '@tests/js/test-utils';
import FeatureDetailRequirements from './FeatureDetailRequirements';

const mockTrackEvent = jest.spyOn( tracking, 'trackEvent' );
mockTrackEvent.mockImplementation( () => Promise.resolve() );

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

	afterEach( () => {
		mockTrackEvent.mockClear();
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

	it.each( [ 'documentation', 'support forum' ] )(
		'should track click_learn_more_link for the %s link',
		( name ) => {
			feature.detail = {
				requirements: {
					documentationURL: 'https://example.com/docs/',
				},
			};

			const { getByRole } = render(
				<FeatureDetailRequirements feature={ feature } />,
				{ viewContext: 'testViewContext' }
			);

			fireEvent.click(
				getByRole( 'link', { name: new RegExp( name ) } )
			);

			expect( mockTrackEvent ).toHaveBeenCalledTimes( 1 );
			expect( mockTrackEvent ).toHaveBeenCalledWith(
				'testViewContext_feature-detail-panel',
				'click_learn_more_link',
				'test-feature'
			);
		}
	);
} );
