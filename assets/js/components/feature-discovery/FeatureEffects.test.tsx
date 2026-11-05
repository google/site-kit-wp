/**
 * FeatureEffects component tests.
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
import {
	CORE_FEATURE_DISCOVERY,
	FEATURE_CATEGORIES,
	FEATURE_EFFORTS,
	FEATURE_SETUP_TYPES,
} from '@/js/googlesitekit/datastore/feature-discovery/constants';
import type { FeatureSettings } from '@/js/googlesitekit/datastore/feature-discovery/types';
import { createTestRegistry, render } from '@tests/js/test-utils';
import FeatureEffects from './FeatureEffects';

describe( 'FeatureEffects', () => {
	let registry: Registry;

	function registerFeature(
		slug: string,
		overrides: Partial< FeatureSettings > = {}
	) {
		registry.dispatch( CORE_FEATURE_DISCOVERY ).registerFeature( slug, {
			title: 'Test feature',
			shortDescription: 'A feature used in tests.',
			effort: FEATURE_EFFORTS.LOW,
			goalCategories: [ FEATURE_CATEGORIES.AUDIENCE ],
			addedInVersion: '1.100.0',
			setup: { type: FEATURE_SETUP_TYPES.BACKGROUND_TOGGLE },
			...overrides,
		} );
	}

	beforeEach( () => {
		registry = createTestRegistry() as Registry;
	} );

	it( "should render a registered feature's effect component", () => {
		registerFeature( 'test-feature', {
			EffectComponent: () => <div>Test effect</div>,
		} );

		const { getByText } = render( <FeatureEffects />, { registry } );

		expect( getByText( 'Test effect' ) ).toBeInTheDocument();
	} );

	it( 'should render nothing for a feature without an effect component', () => {
		registerFeature( 'test-feature' );

		const { container } = render( <FeatureEffects />, { registry } );

		expect( container ).toBeEmptyDOMElement();
	} );

	it( 'should render the effect component of every feature that has one', () => {
		registerFeature( 'first-feature', {
			EffectComponent: () => <div>First effect</div>,
		} );
		registerFeature( 'second-feature' );
		registerFeature( 'third-feature', {
			EffectComponent: () => <div>Third effect</div>,
		} );

		const { getByText, queryAllByText } = render( <FeatureEffects />, {
			registry,
		} );

		expect( getByText( 'First effect' ) ).toBeInTheDocument();
		expect( getByText( 'Third effect' ) ).toBeInTheDocument();
		expect( queryAllByText( /effect/ ) ).toHaveLength( 2 );
	} );
} );
