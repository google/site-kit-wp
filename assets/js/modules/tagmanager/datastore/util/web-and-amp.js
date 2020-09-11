/**
 * modules/tagmanager datastore test helpers.
 *
 * Site Kit by Google, Copyright 2020 Google LLC
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
import { STORE_NAME } from '../constants';
import * as factories from '../__factories__';

export function parseIDs( { accountId, containerId, container: { publicId } }, callback ) {
	const ids = {
		accountID: accountId,
		containerID: publicId,
		ampContainerID: publicId,
		internalContainerID: containerId,
		internalAMPContainerID: containerId,
	};

	if ( callback ) {
		callback( ids );
	}

	return ids;
}

export function makeBuildAndReceiveWebAndAMP( registry ) {
	return ( { webPropertyID, ampPropertyID, accountID = '12345' } = {} ) => {
		const liveContainerVersionWeb = factories.buildLiveContainerVersionWeb( { accountID, propertyID: webPropertyID } );
		const liveContainerVersionAMP = factories.buildLiveContainerVersionAMP( { accountID, propertyID: ampPropertyID } );

		registry.dispatch( STORE_NAME ).setAccountID( accountID );

		parseIDs( liveContainerVersionWeb, ( { containerID, internalContainerID } ) => {
			registry.dispatch( STORE_NAME ).setContainerID( containerID );
			registry.dispatch( STORE_NAME ).setInternalContainerID( internalContainerID );
			registry.dispatch( STORE_NAME ).receiveGetLiveContainerVersion( liveContainerVersionWeb, { accountID, internalContainerID } );
		} );

		parseIDs( liveContainerVersionAMP, ( { containerID, internalContainerID } ) => {
			registry.dispatch( STORE_NAME ).setAMPContainerID( containerID );
			registry.dispatch( STORE_NAME ).setInternalAMPContainerID( internalContainerID );
			registry.dispatch( STORE_NAME ).receiveGetLiveContainerVersion( liveContainerVersionAMP, { accountID, internalContainerID } );
		} );

		return { accountID, liveContainerVersionWeb, liveContainerVersionAMP };
	};
}
