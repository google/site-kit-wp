/**
 * Tag Manager factory utils.
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
import { MODULES_TAGMANAGER } from '../constants';
import {
	buildLiveContainerVersionWeb,
	buildLiveContainerVersionAMP,
} from './builders';

export const parseLiveContainerVersionIDs = (
	// eslint-disable-next-line sitekit/acronym-case
	{ accountId, containerId, container },
	callback
) => {
	const ids = {
		accountID: accountId, // eslint-disable-line sitekit/acronym-case
		containerID: container.publicId, // eslint-disable-line sitekit/acronym-case
		ampContainerID: container.publicId, // eslint-disable-line sitekit/acronym-case
		internalContainerID: containerId, // eslint-disable-line sitekit/acronym-case
		internalAMPContainerID: containerId, // eslint-disable-line sitekit/acronym-case
	};
	if ( callback ) {
		callback( ids );
	}
	return ids;
};

export const createBuildAndReceivers = ( registry ) => {
	return {
		buildAndReceiveWebAndAMP: ( {
			webPropertyID,
			ampPropertyID,
			accountID = '12345',
		} = {} ) => {
			const liveContainerVersionWeb = buildLiveContainerVersionWeb( {
				accountID,
				propertyID: webPropertyID,
			} );
			const liveContainerVersionAMP = buildLiveContainerVersionAMP( {
				accountID,
				propertyID: ampPropertyID,
			} );
			registry.dispatch( MODULES_TAGMANAGER ).setAccountID( accountID );
			parseLiveContainerVersionIDs(
				liveContainerVersionWeb,
				( { containerID, internalContainerID } ) => {
					registry
						.dispatch( MODULES_TAGMANAGER )
						.setContainerID( containerID );
					registry
						.dispatch( MODULES_TAGMANAGER )
						.setInternalContainerID( internalContainerID );
					registry
						.dispatch( MODULES_TAGMANAGER )
						.receiveGetLiveContainerVersion(
							liveContainerVersionWeb,
							{ accountID, internalContainerID }
						);
				}
			);
			parseLiveContainerVersionIDs(
				liveContainerVersionAMP,
				( { containerID, internalContainerID } ) => {
					registry
						.dispatch( MODULES_TAGMANAGER )
						.setAMPContainerID( containerID );
					registry
						.dispatch( MODULES_TAGMANAGER )
						.setInternalAMPContainerID( internalContainerID );
					registry
						.dispatch( MODULES_TAGMANAGER )
						.receiveGetLiveContainerVersion(
							liveContainerVersionAMP,
							{ accountID, internalContainerID }
						);
				}
			);
			return {
				accountID,
				liveContainerVersionWeb,
				liveContainerVersionAMP,
			};
		},
	};
};
