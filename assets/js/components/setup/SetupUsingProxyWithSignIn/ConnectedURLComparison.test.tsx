/**
 * ConnectedURLComparison component tests.
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
import { type Registry } from '@/js/googlesitekit-data';
import { DISCONNECTED_REASON_CONNECTED_URL_MISMATCH } from '@/js/googlesitekit/datastore/user/constants';
import {
	createTestRegistry,
	provideSiteInfo,
	provideUserAuthentication,
	render,
} from '@tests/js/test-utils';
import ConnectedURLComparison from './ConnectedURLComparison';

const CONNECTED_PROXY_URL = 'https://old-site.example.com/';
const HOME_URL = 'https://new-site.example.com/';

describe( 'ConnectedURLComparison', () => {
	let registry: Registry;

	beforeEach( () => {
		registry = createTestRegistry() as Registry;
	} );

	function renderComparison(
		overrides: {
			connectedProxyURL?: string | false;
			disconnectedReason?: string;
			homeURL?: string;
		} = {}
	) {
		const { homeURL, ...authentication } = {
			homeURL: HOME_URL,
			connectedProxyURL: CONNECTED_PROXY_URL,
			disconnectedReason: DISCONNECTED_REASON_CONNECTED_URL_MISMATCH,
			...overrides,
		};

		provideSiteInfo( registry, { homeURL } );
		provideUserAuthentication( registry, authentication );

		return render( <ConnectedURLComparison />, { registry } );
	}

	it( 'should show the old and the new URL when the connected proxy URL differs from the home URL', () => {
		const { getByText } = renderComparison();

		expect(
			getByText( `Old URL: ${ CONNECTED_PROXY_URL }`, { exact: false } )
		).toBeInTheDocument();
		expect(
			getByText( `New URL: ${ HOME_URL }`, { exact: false } )
		).toBeInTheDocument();
	} );

	it.each( [
		{
			description: 'the connected proxy URL is `undefined`',
			overrides: { connectedProxyURL: undefined },
		},
		{
			description: 'the connected proxy URL is `false`',
			overrides: { connectedProxyURL: false as const },
		},
		{
			description: 'the home URL is `undefined`',
			overrides: { homeURL: undefined },
		},
		{
			description:
				'Site Kit disconnected the site for a reason other than a URL mismatch',
			overrides: { disconnectedReason: 'some_other_reason' },
		},
		{
			description: 'the connected proxy URL matches the home URL',
			overrides: { connectedProxyURL: HOME_URL },
		},
	] )( 'should show nothing when $description', ( { overrides } ) => {
		const { container } = renderComparison( overrides );

		expect( container ).toBeEmptyDOMElement();
	} );
} );
