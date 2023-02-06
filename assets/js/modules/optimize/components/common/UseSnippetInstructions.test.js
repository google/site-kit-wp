/**
 * UseSnippetInstructions component tests.
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
import UseSnippetInstructions from './UseSnippetInstructions';
import {
	createTestRegistry,
	render,
	unsubscribeFromAll,
} from '../../../../../../tests/js/test-utils';
import { MODULES_OPTIMIZE } from '../../datastore/constants';
import { CORE_MODULES } from '../../../../googlesitekit/modules/datastore/constants';
import { MODULES_ANALYTICS } from '../../../analytics/datastore/constants';
import { MODULES_TAGMANAGER } from '../../../tagmanager/datastore/constants';
import { withActive } from '../../../../googlesitekit/modules/datastore/__fixtures__';

describe( 'UseSnippetInstructions', () => {
	let registry;
	beforeEach( () => {
		registry = createTestRegistry();
		// Receive empty settings & modules to prevent unexpected fetch by resolver.
		registry.dispatch( MODULES_ANALYTICS ).receiveGetSettings( {} );
		registry.dispatch( MODULES_TAGMANAGER ).receiveGetSettings( {} );
		registry.dispatch( CORE_MODULES ).receiveGetModules( [] );
	} );

	afterEach( () => {
		unsubscribeFromAll( registry );
	} );

	it( 'should not render with analytics active and unresolved useSnippet', () => {
		registry.dispatch( MODULES_OPTIMIZE ).setOptimizeID( 'OPT-1234567' );
		registry
			.dispatch( CORE_MODULES )
			.receiveGetModules( withActive( 'analytics' ) );
		const { container } = render( <UseSnippetInstructions />, {
			registry,
		} );

		expect( container ).toBeEmptyDOMElement();
	} );

	it( 'should render with analytics active and no useSnippet', () => {
		registry.dispatch( MODULES_OPTIMIZE ).setOptimizeID( 'OPT-1234567' );
		registry
			.dispatch( CORE_MODULES )
			.receiveGetModules( withActive( 'analytics' ) );
		registry.dispatch( MODULES_ANALYTICS ).setUseSnippet( false );
		const { container } = render( <UseSnippetInstructions />, {
			registry,
		} );

		const selectedText = container.querySelector( 'p' );
		expect( selectedText ).toHaveTextContent(
			'You disabled Analytics auto insert snippet. If you are using Google Analytics code snippet, add the code below:'
		);
	} );

	it( 'should render with analytics message if analytics is inactive', () => {
		registry.dispatch( MODULES_OPTIMIZE ).setOptimizeID( 'OPT-1234567' );

		const { container } = render( <UseSnippetInstructions />, {
			registry,
		} );

		const selectedText = container.querySelector( 'p' );
		expect( selectedText ).toHaveTextContent(
			'Google Analytics must be active to use Optimize'
		);
	} );

	it( 'should not render with analytics active and a useSnippet', () => {
		registry.dispatch( MODULES_OPTIMIZE ).setOptimizeID( 'OPT-1234567' );
		registry
			.dispatch( CORE_MODULES )
			.receiveGetModules( withActive( 'analytics' ) );
		registry.dispatch( MODULES_ANALYTICS ).setUseSnippet( true );

		const { container } = render( <UseSnippetInstructions />, {
			registry,
		} );
		expect( container.querySelector( 'p' ) ).toEqual( null );
	} );

	it( 'should render with analytics active and no analytics useSnippet, also with tagmanager active and a gtm useSnippet', () => {
		const newFixtures = withActive( 'analytics' ).map( ( fixture ) =>
			fixture.slug === 'tagmanager' || fixture.slug === 'optimize'
				? { ...fixture, active: true, connected: true }
				: fixture
		);

		registry.dispatch( MODULES_OPTIMIZE ).setOptimizeID( 'OPT-1234567' );
		registry.dispatch( CORE_MODULES ).receiveGetModules( newFixtures );
		registry.dispatch( MODULES_TAGMANAGER ).setUseSnippet( true );
		registry.dispatch( MODULES_ANALYTICS ).setUseSnippet( false );

		const { container } = render( <UseSnippetInstructions />, {
			registry,
		} );

		const selectedText = container.querySelector( 'p' );
		expect( selectedText ).toHaveTextContent(
			'You are using auto insert snippet with Tag Manager'
		);
	} );
} );
