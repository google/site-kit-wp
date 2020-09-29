/**
 * Tag Manager factory utils.
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
import {
	buildLiveContainerVersionWeb,
	buildLiveContainerVersionAMP,
} from './builders';

export const parseLiveContainerVersionIDs = ( { accountId, containerId, container }, callback ) => { // eslint-disable-line sitekit/camelcase-acronyms
	const ids = {
		accountID: accountId, // eslint-disable-line sitekit/camelcase-acronyms
		containerID: container.publicId, // eslint-disable-line sitekit/camelcase-acronyms
		ampContainerID: container.publicId, // eslint-disable-line sitekit/camelcase-acronyms
		internalContainerID: containerId, // eslint-disable-line sitekit/camelcase-acronyms
		internalAMPContainerID: containerId, // eslint-disable-line sitekit/camelcase-acronyms
	};
	if ( callback ) {
		callback( ids );
	}
	return ids;
};

export const createBuildAndReceivers = ( registry ) => {
	return {
		buildAndReceiveWebAndAMP: ( { webPropertyID, ampPropertyID, accountID = '12345' } = {} ) => {
			const liveContainerVersionWeb = buildLiveContainerVersionWeb( { accountID, propertyID: webPropertyID } );
			const liveContainerVersionAMP = buildLiveContainerVersionAMP( { accountID, propertyID: ampPropertyID } );
			registry.dispatch( STORE_NAME ).setAccountID( accountID );
			parseLiveContainerVersionIDs( liveContainerVersionWeb, ( { containerID, internalContainerID } ) => {
				registry.dispatch( STORE_NAME ).setContainerID( containerID );
				registry.dispatch( STORE_NAME ).setInternalContainerID( internalContainerID );
				registry.dispatch( STORE_NAME ).receiveGetLiveContainerVersion( liveContainerVersionWeb, { accountID, internalContainerID } );
			} );
			parseLiveContainerVersionIDs( liveContainerVersionAMP, ( { containerID, internalContainerID } ) => {
				registry.dispatch( STORE_NAME ).setAMPContainerID( containerID );
				registry.dispatch( STORE_NAME ).setInternalAMPContainerID( internalContainerID );
				registry.dispatch( STORE_NAME ).receiveGetLiveContainerVersion( liveContainerVersionAMP, { accountID, internalContainerID } );
			} );
			return { accountID, liveContainerVersionWeb, liveContainerVersionAMP };
		},
	};
};
