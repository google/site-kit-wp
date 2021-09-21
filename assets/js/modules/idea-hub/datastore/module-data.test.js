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
	let registry;

	beforeEach( () => {
		enabledFeatures.add( 'ideaHubModule' );
		registry = createTestRegistry();
	} );

	afterEach( () => {
		unsubscribeFromAll( registry );
	} );

	describe( 'actions', () => {
		describe( 'receiveIdeaHubData', () => {
			it( 'should correctly set idea hub data', () => {
				const lastIdeaPostUpdatedAt = 12345;
				const interactionCount = 17;

				registry.dispatch( MODULES_IDEA_HUB ).receiveIdeaHubData( {
					lastIdeaPostUpdatedAt,
					interactionCount,
				} );

				const { store } = registry.stores[ MODULES_IDEA_HUB ];
				const { ideaHubData } = store.getState();

				expect( ideaHubData.interactionCount ).toBe( interactionCount );
				expect( ideaHubData.lastIdeaPostUpdatedAt ).toBe(
					lastIdeaPostUpdatedAt
				);
			} );
		} );

		describe( 'incrementInteractions', () => {
			it( 'should start from zero if the data has not been loaded yet', () => {
				registry.dispatch( MODULES_IDEA_HUB ).incrementInteractions();

				const { store } = registry.stores[ MODULES_IDEA_HUB ];
				const { ideaHubData } = store.getState();
				const { interactionCount } = ideaHubData;

				expect( interactionCount ).toBe( 1 );
			} );

			it( 'should increment interactions count received with the idea hub data', () => {
				const initialInteractionCount = 5;

				registry.dispatch( MODULES_IDEA_HUB ).receiveIdeaHubData( {
					interactionCount: initialInteractionCount,
				} );

				registry.dispatch( MODULES_IDEA_HUB ).incrementInteractions();

				const { store } = registry.stores[ MODULES_IDEA_HUB ];
				const { ideaHubData } = store.getState();
				const { interactionCount } = ideaHubData;

				expect( interactionCount ).toBe( initialInteractionCount + 1 );
			} );
		} );
	} );

	describe( 'selectors', () => {
		const globalVar = '_googlesitekitIdeaHub';
		const globalVarData = {
			lastIdeaPostUpdatedAt: 12345,
			interactionCount: 4,
		};

		afterEach( () => {
			delete global[ globalVar ];
		} );

		describe.each( [
			[ 'getLastIdeaPostUpdatedAt', 'lastIdeaPostUpdatedAt' ],
			[ 'getInteractionCount', 'interactionCount' ],
		] )( '%s', ( selector, dataKey ) => {
			it( 'uses a resolver to load Idea Hub data then returns the data when this specific selector is used', async () => {
				global[ globalVar ] = globalVarData;

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
				).toEqual( globalVarData[ dataKey ] );
			} );

			it( 'will return initial state (undefined) when no data is available', () => {
				expect( global[ globalVar ] ).toBeUndefined();

				const result = registry
					.select( MODULES_IDEA_HUB )
					[ selector ]();

				expect( result ).toBeUndefined();
			} );
		} );
	} );
} );
