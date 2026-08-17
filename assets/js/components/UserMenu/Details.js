/**
 * UserMenu Details component.
 *
 * Site Kit by Google, Copyright 2023 Google LLC
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
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { useSelect } from 'googlesitekit-data';
import {
	SIZE_MEDIUM,
	SIZE_SMALL,
	TYPE_LABEL,
} from '@/js/components/Typography/constants';
import P from '@/js/components/Typography/P';
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';

export default function Details() {
	const userPicture = useSelect( ( select ) =>
		select( CORE_USER ).getPicture()
	);
	const userFullName = useSelect( ( select ) =>
		select( CORE_USER ).getFullName()
	);
	const userEmail = useSelect( ( select ) => select( CORE_USER ).getEmail() );

	return (
		<div
			className="googlesitekit-user-menu__details"
			aria-label={ __( 'Google account', 'google-site-kit' ) }
		>
			{ !! userPicture && (
				<img
					className="googlesitekit-user-menu__details-avatar"
					src={ userPicture }
					alt=""
				/>
			) }
			<div className="googlesitekit-user-menu__details-info">
				<P
					className="googlesitekit-user-menu__details-info__name"
					size={ SIZE_MEDIUM }
					type={ TYPE_LABEL }
				>
					{ userFullName }
				</P>
				<P
					aria-label={ __( 'Email', 'google-site-kit' ) }
					className="googlesitekit-user-menu__details-info__email"
					size={ SIZE_SMALL }
				>
					{ userEmail }
				</P>
			</div>
		</div>
	);
}
