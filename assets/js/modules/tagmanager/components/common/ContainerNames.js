/**
 * Tag Manager container names component.
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
import { useSelect } from 'googlesitekit-data';
import AMPContainerNameTextField from './AMPContainerNameTextField';
import WebContainerNameTextField from './WebContainerNameTextField';
import {
	CONTAINER_CREATE,
	MODULES_TAGMANAGER,
} from '../../datastore/constants';

export default function ContainerNames() {
	const containerID = useSelect( ( select ) =>
		select( MODULES_TAGMANAGER ).getContainerID()
	);
	const ampContainerID = useSelect( ( select ) =>
		select( MODULES_TAGMANAGER ).getAMPContainerID()
	);

	if (
		containerID !== CONTAINER_CREATE &&
		ampContainerID !== CONTAINER_CREATE
	) {
		return null;
	}

	return (
		<div className="googlesitekit-setup-module__inputs googlesitekit-setup-module__inputs--collapsed">
			{ containerID === CONTAINER_CREATE && (
				<WebContainerNameTextField />
			) }
			{ ampContainerID === CONTAINER_CREATE && (
				<AMPContainerNameTextField />
			) }
		</div>
	);
}
