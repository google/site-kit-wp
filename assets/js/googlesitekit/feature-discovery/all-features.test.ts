/**
 * Common tests for all Feature Discovery features.
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
import fs from 'fs';
import path from 'path';

/**
 * Internal dependencies
 */
import { Registry } from 'googlesitekit-data';
import { enabledFeatures } from '@/js/features';
import { CORE_FEATURE_DISCOVERY } from '@/js/googlesitekit/datastore/feature-discovery/constants';
import type { Feature } from '@/js/googlesitekit/datastore/feature-discovery/types';
import { createFeatureDiscovery } from '@/js/googlesitekit/feature-discovery';
import type { FeatureDiscoveryAPI } from '@/js/googlesitekit/feature-discovery/types';
import { createTestRegistry } from '@tests/js/utils';
import { registerDefaults } from './register-defaults';

// Feature flags that gate features, so that every feature is registered.
const FEATURE_FLAGS = [ 'rrmExpressSetup' ];

const MODULES_DIR = path.join( __dirname, '../../modules' );

// Each module registers its features from its `feature-discovery/index.ts`,
// so finding these files on disk also covers modules that start registering
// features later.
function getModuleRegisterFeatures(): Array<
	( featureDiscovery: FeatureDiscoveryAPI ) => void
> {
	return fs
		.readdirSync( MODULES_DIR )
		.map( ( slug ) =>
			path.join( MODULES_DIR, slug, 'feature-discovery', 'index.ts' )
		)
		.filter( ( file ) => fs.existsSync( file ) )
		.map(
			( file ) =>
				// eslint-disable-next-line @typescript-eslint/no-require-imports -- The module list is read from disk, so each file is loaded by its path.
				require( file ).registerFeatures
		);
}

function countSentences( text: string ): number {
	return text.trim().split( /[.!?]\s+(?=\S)/ ).length;
}

// Jest collects the tests before any `beforeAll()` runs, and `describe.each()`
// needs the list of features at that point. So the registry is set up and the
// features are registered when this file loads, rather than in a hook.
FEATURE_FLAGS.forEach( ( flag ) => enabledFeatures.add( flag ) );

const registry = createTestRegistry() as Registry;
const featureDiscovery = createFeatureDiscovery( registry );

registerDefaults( featureDiscovery );
getModuleRegisterFeatures().forEach( ( registerFeatures ) =>
	registerFeatures( featureDiscovery )
);

// The flags are only read during registration.
FEATURE_FLAGS.forEach( ( flag ) => enabledFeatures.delete( flag ) );

const features: Feature[] = registry
	.select( CORE_FEATURE_DISCOVERY )
	.getFeatures();

describe( 'all Feature Discovery features', () => {
	it( 'should include the features registered by default and by modules', () => {
		expect( features.map( ( { slug } ) => slug ) ).toEqual(
			expect.arrayContaining( [
				'dashboard-sharing',
				'newsletter-signup',
				'visitor-groups',
			] )
		);
	} );

	describe.each( features )( '$slug', ( { shortDescription } ) => {
		it( 'should end its short description with a full stop only when it has more than one sentence', () => {
			expect( shortDescription.trim().endsWith( '.' ) ).toBe(
				countSentences( shortDescription ) > 1
			);
		} );
	} );
} );
