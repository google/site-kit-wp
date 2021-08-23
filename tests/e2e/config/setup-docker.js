/**
 * Docker debug log observation.
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
 * Node dependencies
 */
import { PassThrough } from 'stream';

/**
 * External dependencies
 */
import Docker from 'dockerode';

const LOGS_CONTAINER_NAME = 'googlesitekit-e2e_logs_1';

const docker = new Docker( { socketPath: '/var/run/docker.sock' } );
// Docker container API instance.
let container;
let dockerLogsStream;
let debugLogData = [];
// A PassThrough stream handles incoming data for the docker logs
// and pushes each chunk to our log data array.
const logStream = new PassThrough();
logStream.on( 'data', ( chunk ) => {
	const string = chunk.toString( 'utf8' ).trim();

	debugLogData.push( string );

	if ( '1' === process.env.DEBUG_PHP ) {
		global.console.debug( string );
	}
} );

async function getContainer() {
	const [ containerObj ] = await docker.listContainers( {
		filters: JSON.stringify( { name: [ LOGS_CONTAINER_NAME ] } ),
	} );

	if ( ! containerObj ) {
		throw new Error(
			`Failed to get container instance for ${ LOGS_CONTAINER_NAME }`
		);
	}
	// eslint-disable-next-line sitekit/acronym-case
	return docker.getContainer( containerObj.Id );
}

async function setupDockerLogging() {
	if ( ! container ) {
		container = await getContainer();
	}
	container.logs(
		{ stdout: true, stderr: true, follow: true, tail: 0 },
		( err, stream ) => {
			if ( err ) {
				global.console.error( err );
				return;
			}
			// Keep a reference to the stream so we can close it later.
			dockerLogsStream = stream;

			container.modem.demuxStream( stream, logStream, logStream );
		}
	);
}

function resetDebugLog() {
	debugLogData = [];
}

function assertEmptyDebugLog() {
	expect( debugLogData.join( '\n' ).trim() ).toEqual( '' );
}

function tearDownDockerLogging() {
	// Close the stream to prevent Jest hanging from open resources.
	if ( dockerLogsStream ) {
		dockerLogsStream.destroy();
	}
}

beforeAll( setupDockerLogging );
beforeEach( resetDebugLog );
afterEach( assertEmptyDebugLog );
afterAll( tearDownDockerLogging );
