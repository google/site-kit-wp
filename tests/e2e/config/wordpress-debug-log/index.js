/**
 * WordPress debug log observation.
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
import { printReceived } from 'jest-matcher-utils';

/**
 * Internal dependencies
 */
import {
	logIgnoreList,
	siteKitDeprecationLogIgnoreList,
} from './log-ignore-list';

const docker = new Docker( { socketPath: '/var/run/docker.sock' } );

/**
 * @since 1.81.0
 *
 * @type {Docker.Container} Docker `wordpress-debug-log` container instance.
 */
let container;

/**
 * @since 1.81.0
 *
 * @type {NodeJS.ReadableStream} Container logs Stream instance.
 */
let dockerLogsStream;

/**
 * Debug log data store.
 *
 * @since 1.81.0
 *
 * @type {Array} Array of lines written to the log.
 */
let debugLogData = [];

// A PassThrough stream handles incoming data for the Docker logs
// and pushes each chunk to our log data array.
const logStream = new PassThrough();
logStream.on( 'data', ( chunk ) => {
	const string = chunk.toString( 'utf8' ).trim();

	debugLogData.push( string );

	if ( '1' === process.env.DEBUG_PHP ) {
		global.console.debug( string );
	}
} );

/**
 * Gets the logs container API instance.
 *
 * @since 1.81.0
 *
 * @return {Docker.Container} Container instance.
 */
async function getContainer() {
	const e2eContainers = await docker.listContainers( {
		filters: JSON.stringify( { name: [ 'googlesitekit-e2e' ] } ),
	} );

	// This avoids conflicts due to variations in the formatting of container names.
	const containerInfo = e2eContainers.find(
		( { Labels } ) =>
			Labels[ 'com.docker.compose.service' ] === 'wordpress-debug-log'
	);

	if ( ! containerInfo ) {
		throw new Error(
			'Failed to get container info for the wordpress-debug-log container. Try stopping your E2E environment and starting it again.'
		);
	}
	// eslint-disable-next-line sitekit/acronym-case
	return docker.getContainer( containerInfo.Id );
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

async function assertEmptyDebugLog() {
	// Filter out some lines from WP core that we can't do anything about.
	const errorsToIgnore = [
		...( logIgnoreList[ process.env.WP_VERSION ] || [] ),
		...siteKitDeprecationLogIgnoreList,
	];

	// Wait 1 second for any log data to finish propagating.
	// Without this, node can disconnect from the log stream
	// before the entries are recorded and result in a false success.
	await page.waitForTimeout( 1000 );

	// Filter out lines that are ignored.
	const filteredDebugLog = debugLogData.filter( ( line ) => {
		const lineWithoutTimestamp = line.replace( /^\[[^\]]+\]\s+/, '' );

		return ! errorsToIgnore.some( ( ignoreLine ) =>
			lineWithoutTimestamp.startsWith( ignoreLine )
		);
	} );

	if ( filteredDebugLog.length ) {
		throw new Error(
			'Entries found in the WordPress debug log: ' +
				printReceived( filteredDebugLog )
		);
	}
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
