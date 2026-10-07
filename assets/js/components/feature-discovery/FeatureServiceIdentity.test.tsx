/**
 * FeatureServiceIdentity tests.
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
 * External dependencies
 */
import { SVGProps } from 'react';

/**
 * Internal dependencies
 */
import { Registry } from 'googlesitekit-data';
import {
	FEATURE_CATEGORIES,
	FEATURE_EFFORTS,
	FEATURE_SETUP_TYPES,
} from '@/js/googlesitekit/datastore/feature-discovery/constants';
import { Feature } from '@/js/googlesitekit/datastore/feature-discovery/types';
import { MODULE_SLUG_ANALYTICS_4 } from '@/js/modules/analytics-4/constants';
import {
	createTestRegistry,
	provideModuleRegistrations,
	provideModules,
	render,
} from '@tests/js/test-utils';
import FeatureServiceIdentity from './FeatureServiceIdentity';

jest.mock(
	'@/svg/graphics/logo-g.svg',
	() => ( props: SVGProps< SVGSVGElement > ) =>
		<svg { ...props } data-testid="site-kit-icon" />
);

const feature: Feature = {
	slug: 'test-feature',
	title: 'Test feature',
	shortDescription: 'Test feature description.',
	effort: FEATURE_EFFORTS.LOW,
	goalCategories: [ FEATURE_CATEGORIES.AUDIENCE ],
	addedInVersion: '1.186.0',
	prerequisiteModules: [],
	badges: [],
	setup: { type: FEATURE_SETUP_TYPES.BACKGROUND_TOGGLE },
};

describe( 'FeatureServiceIdentity', () => {
	let registry: Registry;

	beforeEach( () => {
		registry = createTestRegistry() as Registry;

		provideModules( registry );
		provideModuleRegistrations( registry, [
			{
				slug: MODULE_SLUG_ANALYTICS_4,
				Icon: ( props: SVGProps< SVGSVGElement > ) => (
					<svg { ...props } data-testid="analytics-icon" />
				),
			},
		] );
	} );

	it( 'should render the feature’s module icon and name', () => {
		const { container } = render(
			<FeatureServiceIdentity
				feature={ { ...feature, moduleSlug: MODULE_SLUG_ANALYTICS_4 } }
			/>,
			{ registry }
		);

		expect( container ).toMatchSnapshot();
	} );

	it( 'should render the Site Kit icon and label for a feature with no module', () => {
		const { container } = render(
			<FeatureServiceIdentity feature={ feature } />,
			{ registry }
		);

		expect( container ).toMatchSnapshot();
	} );
} );
