/**
 * DashboardIdeasWidget component tests.
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
	render,
	fireEvent,
	createTestRegistry,
	provideModules,
} from '../../../../../../../tests/js/test-utils';
import { enabledFeatures } from '../../../../../features';
import { getWidgetComponentProps } from '../../../../../googlesitekit/widgets/util/';
import * as fixtures from '../../../datastore/__fixtures__';
import DashboardIdeasWidget from './index';

describe( 'Idea Hub', () => {
	let registry;
	const widgetComponentProps = getWidgetComponentProps( 'ideaHubIdeas' );

	beforeEach( () => {
		global.location.hash = '';

		enabledFeatures.add( 'ideaHubModule' );

		registry = createTestRegistry();

		provideModules( registry, [ {
			slug: 'idea-hub',
			active: true,
			connected: true,
		} ] );

		fetchMock.get(
			/^\/google-site-kit\/v1\/modules\/idea-hub\/data\/draft-post-ideas/,
			{ body: fixtures.draftPostIdeas, status: 200 }
		);

		fetchMock.get(
			/^\/google-site-kit\/v1\/modules\/idea-hub\/data\/saved-ideas/,
			{ body: fixtures.savedIdeas, status: 200 }
		);

		fetchMock.get(
			/^\/google-site-kit\/v1\/modules\/idea-hub\/data\/new-ideas/,
			{ body: fixtures.newIdeas, status: 200 }
		);
	} );

	it.each( [
		[ 'New', '#new-ideas' ],
		[ 'Saved', '#saved-ideas' ],
		[ 'Drafts', '#draft-ideas' ],
	] )( 'should change location hash & DOM correctly when the %s tab is clicked', async ( args, expected ) => {
		const { getByRole, findByRole } = render(
			<DashboardIdeasWidget { ...widgetComponentProps } />,
			{ registry }
		);

		fireEvent.click( getByRole( 'tab', { name: args } ) );
		expect( global.location.hash ).toEqual( expected );

		const tabItem = await findByRole( 'tab', { selected: true } );
		expect( tabItem ).toHaveTextContent( args );
	} );
} );
