/**
 * AdSense User Profile component.
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
import { ProgressBar } from 'googlesitekit-components';
import { CORE_USER } from '../../../../googlesitekit/datastore/user/constants';

export default function UserProfile() {
	const userEmail = useSelect( ( select ) => select( CORE_USER ).getEmail() );
	const userPicture = useSelect( ( select ) =>
		select( CORE_USER ).getPicture()
	);
	const hasResolvedGetUser = useSelect( ( select ) =>
		select( CORE_USER ).hasFinishedResolution( 'getUser' )
	);

	if ( ! hasResolvedGetUser ) {
		return <ProgressBar small />;
	}

	return (
		<p className="googlesitekit-setup-module__user">
			<img
				className="googlesitekit-setup-module__user-image"
				src={ userPicture }
				alt=""
			/>
			<span className="googlesitekit-setup-module__user-email">
				{ userEmail }
			</span>
		</p>
	);
}
