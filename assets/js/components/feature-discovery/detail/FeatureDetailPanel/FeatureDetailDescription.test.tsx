/**
 * FeatureDetailDescription tests.
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
import { createElement, createInterpolateElement } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Link from '@/js/components/Link';
import { SIZE_MEDIUM } from '@/js/components/Typography/constants';
import P from '@/js/components/Typography/P';
import { CORE_FEATURE_DISCOVERY } from '@/js/googlesitekit/datastore/feature-discovery/constants';
import { provideFeatures } from '@/js/googlesitekit/datastore/feature-discovery/test-utils';
import { Feature } from '@/js/googlesitekit/datastore/feature-discovery/types';
import { createTestRegistry, render } from '@tests/js/test-utils';
import FeatureDetailDescription from './FeatureDetailDescription';

describe( 'FeatureDetailDescription', () => {
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

	it( 'should render catalog descriptions and benefits with markup', () => {
		feature.detail = {
			description: {
				whatIs: createInterpolateElement(
					'<p>Learn about <a>your audience</a>.</p>',
					{
						p: createElement( P, { size: SIZE_MEDIUM } ),
						a: createElement( Link, {
							href: 'https://example.com/',
						} ),
					}
				),
				whyUseHeading: 'Why use this feature?',
				whyUseList: [
					{ term: 'First benefit', description: 'First explanation' },
					{
						term: 'Second benefit',
						description: <strong>Second explanation</strong>,
					},
				],
			},
		};

		const { container } = render(
			<FeatureDetailDescription feature={ feature } />
		);

		expect( container ).toMatchSnapshot();
	} );

	it.each( [
		undefined,
		{},
		{
			description: {
				whatIs: '',
				whyUseHeading: 'Unused heading',
				whyUseList: [],
			},
		},
	] )( 'should omit empty sections for %s', ( detail ) => {
		feature.detail = detail;

		const { container } = render(
			<FeatureDetailDescription feature={ feature } />
		);

		expect( container ).toMatchSnapshot();
	} );

	it( 'should render benefits without an optional heading', () => {
		feature.detail = {
			description: {
				whyUseList: [ { term: 'Benefit', description: 'Explanation' } ],
			},
		};

		const { container } = render(
			<FeatureDetailDescription feature={ feature } />
		);

		expect( container ).toMatchSnapshot();
	} );
} );
