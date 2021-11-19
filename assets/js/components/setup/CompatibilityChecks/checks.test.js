/**
 * Compatibility checks tests.
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
 * @since 1.43.0
 *
 * @param {string} host The global.location.host.
 */
const setLocationHostnamePort = ( host ) => {
	const [ hostname, port = '' ] = host.split( ':' );
	Object.defineProperty( global, 'location', {
		value: {
			hostname,
			port,
		},
		writable: true,
	} );
};

const invalidHosts = [
	'valid.host:8080',
	'localhost',
	'example',
	'example.test',
	'10.1.2.3',
	'127.1.2.3',
	'172.16.1.2',
	'192.168.1.2',
];

const validHosts = [
	'valid.host',
	'testsite.com',
	'8.1.2.3',
	'129.1.2.3',
	'172.15.1.2',
	'192.169.1.2',
];

/**
 * Throws an actual Error Object on error.
 * This is needed because Jest only catches actual `Error` object in `toThrow`.
 */
const throwErrorOnFail = async () => {
	try {
		await checkHostname();
	} catch ( error ) {
		throw new Error( error );
	}
};

describe( 'checkHostname', () => {
	let previousLocation;
	beforeAll( () => {
		previousLocation = global.location;
	} );

	afterAll( () => {
		Object.defineProperty( global, 'location', previousLocation );
	} );

	it.each( validHosts )(
		'should consider %s a valid host',
		async ( host ) => {
			setLocationHostnamePort( host );
			await expect( throwErrorOnFail() ).resolves.toBeUndefined();
		}
	);

	it.each( invalidHosts )(
		'should not consider %s a valid host',
		async ( host ) => {
			setLocationHostnamePort( host );
			await expect( throwErrorOnFail() ).rejects.toThrow(
				ERROR_INVALID_HOSTNAME
			);
		}
	);
} );
