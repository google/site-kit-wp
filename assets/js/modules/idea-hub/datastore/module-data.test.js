/**
 * `modules/idea-hub` data store: module-data tests.
 *
 * Site Kit by Google, Copyright 2021 Google LLC
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
	unsubscribeFromAll,
	untilResolved,
} from '../../../../../tests/js/utils';
import { enabledFeatures } from '../../../features';
import { MODULES_IDEA_HUB } from './constants';

describe( 'modules/idea-hub module-data', () => {
	const baseInfoVar = '_googlesitekitIdeaHub';
	const baseInfo = {
		lastIdeaPostUpdatedAt: 12345,
		interactionCount: 4,
	};

	let registry;

	beforeEach( () => {
		enabledFeatures.add( 'ideaHubModule' );
		registry = createTestRegistry();
	} );

	afterEach( () => {
		delete global[ baseInfoVar ];
		unsubscribeFromAll( registry );
	} );

	describe( 'actions', () => {} );

	describe( 'selectors', () => {
		describe.each( [
			[ 'getLastIdeaPostUpdatedAt', 'lastIdeaPostUpdatedAt' ],
			[ 'getInteractionCount', 'interactionCount' ],
		] )( '%s', ( selector, dataKey ) => {
			it( 'uses a resolver to load Idea Hub data then returns the data when this specific selector is used', async () => {
				global[ baseInfoVar ] = baseInfo;

				registry.select( MODULES_IDEA_HUB )[ selector ]();

				await untilResolved(
					registry,
					MODULES_IDEA_HUB
				).getIdeaHubData();

				expect(
					registry.select( MODULES_IDEA_HUB ).getIdeaHubData()
				).toHaveProperty( dataKey );

				expect(
					registry.select( MODULES_IDEA_HUB )[ selector ]()
				).toEqual( baseInfo[ dataKey ] );
			} );

			it( 'will return initial state (undefined) when no data is available', async () => {
				expect( global[ baseInfoVar ] ).toBeUndefined();

				const result = registry
					.select( MODULES_IDEA_HUB )
					[ selector ]();

				expect( result ).toBeUndefined();
			} );
		} );
	} );
} );
