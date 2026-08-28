/**
 * EmptyMessage component.
 *
 * Site Kit by Google, Copyright 2026 Google LLC
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
 * External dependencies
 */
import { FC, ReactNode } from 'react';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Gets the message shown when a search matches no users.
 *
 * Shared by the invite and subscribed-users lists so their empty-search
 * copy can't drift apart. Called at render time, since `__()` needs
 * translations to already be loaded.
 *
 * @since n.e.x.t
 *
 * @return {string} The empty-search message.
 */
export function getNoSearchResultsText(): string {
	return __( 'No users match your search.', 'google-site-kit' );
}

interface EmptyMessageProps {
	text: string;
	icon?: ReactNode;
}

const EmptyMessage: FC< EmptyMessageProps > = ( { text, icon } ) => {
	return (
		<div className="googlesitekit-user-list__empty">
			{ icon }
			{ text }
		</div>
	);
};

export default EmptyMessage;
