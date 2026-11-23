/**
 * Feature card CTA label utility tests.
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
	FEATURE_CATEGORIES,
	FEATURE_EFFORTS,
	FEATURE_SETUP_TYPES,
} from '@/js/googlesitekit/datastore/feature-discovery/constants';
import {
	Feature,
	FeatureSetupType,
} from '@/js/googlesitekit/datastore/feature-discovery/types';
import getFeatureCardCTALabel from './getFeatureCardCTALabel';

function createFeature( type: FeatureSetupType ): Feature {
	return {
		slug: 'test-feature',
		title: 'Test feature',
		shortDescription: 'Test feature description.',
		effort: FEATURE_EFFORTS.LOW,
		goalCategories: [ FEATURE_CATEGORIES.AUDIENCE ],
		addedInVersion: '1.186.0',
		prerequisiteModules: [],
		badges: [],
		setup: {
			type,
			ctaLabel: 'Set up the test feature',
		},
	};
}

describe( 'getFeatureCardCTALabel', () => {
	it( 'should return "Try it now" for an in-place panel feature', () => {
		expect(
			getFeatureCardCTALabel(
				createFeature( FEATURE_SETUP_TYPES.IN_PLACE_PANEL )
			)
		).toBe( 'Try it now' );
	} );

	it( 'should return "Set up now" for a setup flow feature', () => {
		expect(
			getFeatureCardCTALabel(
				createFeature( FEATURE_SETUP_TYPES.SETUP_FLOW )
			)
		).toBe( 'Set up now' );
	} );

	it( 'should return "Set up now" for a background toggle feature', () => {
		expect(
			getFeatureCardCTALabel(
				createFeature( FEATURE_SETUP_TYPES.BACKGROUND_TOGGLE )
			)
		).toBe( 'Set up now' );
	} );
} );
