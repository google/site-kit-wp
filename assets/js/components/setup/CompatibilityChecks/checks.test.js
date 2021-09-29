/**
 * Checks functions  tests.
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
import { checkHostname } from './checks';
import { ERROR_INVALID_HOSTNAME } from './constants';

/**
 * Sets up global.location for test.
 *
 * @since n.e.x.t
 *
 * @param {string} hostname The global.location.hostname.
 * @param {string} [port]   The global.location.port.
 */
const setLocationHostnamePort = ( hostname, port = '' ) => {
	// Mock global.location.hostname with value that won't throw error in first check.
	Object.defineProperty( global.window, 'location', {
		value: {
			hostname,
			port,
		},
		writable: true,
	} );
};

const invalidHosts = [
	{ hostname: 'valid.host', port: '8080' },
	{ hostname: 'localhost' },
	{ hostname: 'example' },
	{ hostname: 'example.test' },
	{ hostname: '10.1.2.3' },
	{ hostname: '127.1.2.3' },
	{ hostname: '172.16.1.2' },
	{ hostname: '192.168.1.2' },
];

const validHosts = [
	{ hostname: 'valid.host' },
	{ hostname: 'testsite.com' },
	{ hostname: '8.1.2.3' },
	{ hostname: '129.1.2.3' },
	{ hostname: '172.15.1.2' },
	{ hostname: '192.169.1.2' },
];

const throwErrorOnFail = async () => {
	try {
		await checkHostname();
	} catch ( error ) {
		throw new Error( error );
	}
};

describe( 'checkHostname-fail', () => {
	for ( const { hostname, port } of invalidHosts ) {
		it( `should fail for: ${ hostname }${ port ? ':' : '' }${
			port ?? ''
		}`, async () => {
			setLocationHostnamePort( hostname, port );
			await expect( throwErrorOnFail() ).rejects.toThrow(
				ERROR_INVALID_HOSTNAME
			);
		} );
	}
} );

describe( 'checkHostname-pass', () => {
	for ( const { hostname, port } of validHosts ) {
		it( `should pass for: ${ hostname }${ port ? ':' : '' }${
			port ?? ''
		}`, async () => {
			setLocationHostnamePort( hostname, port );
			await expect( throwErrorOnFail() ).resolves.toBeUndefined();
		} );
	}
} );
