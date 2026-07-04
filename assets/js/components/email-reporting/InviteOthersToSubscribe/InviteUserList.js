/**
 * InviteUserList component.
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
import PropTypes from 'prop-types';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import InviteUserRow from './InviteUserRow';
import InviteUserSkeletonList from './InviteUserSkeletonList';

function EmptyMessage( { text } ) {
	return (
		<div className="googlesitekit-invite-user-list__empty">{ text }</div>
	);
}

export default function InviteUserList( {
	users,
	searchTerm = '',
	inviteResults = {},
	onInviteResult,
	isLoading = false,
} ) {
	if ( isLoading ) {
		return <InviteUserSkeletonList visibleItems={ 3 } />;
	}

	if ( users.length === 0 ) {
		if ( searchTerm ) {
			return (
				<EmptyMessage
					text={ __(
						'No users match your search.',
						'google-site-kit'
					) }
				/>
			);
		}

		return (
			<EmptyMessage
				text={ __(
					'No users are eligible to receive invitations.',
					'google-site-kit'
				) }
			/>
		);
	}

	return (
		<div className="googlesitekit-invite-user-list">
			{ users.map( ( user ) => (
				<InviteUserRow
					key={ user.id }
					user={ user }
					inviteResult={ inviteResults[ user.id ] }
					onInviteResult={ onInviteResult }
				/>
			) ) }
		</div>
	);
}

InviteUserList.propTypes = {
	users: PropTypes.arrayOf(
		PropTypes.shape( {
			id: PropTypes.number.isRequired,
			name: PropTypes.string,
			email: PropTypes.string.isRequired,
			role: PropTypes.string,
		} )
	).isRequired,
	searchTerm: PropTypes.string,
	inviteResults: PropTypes.objectOf(
		PropTypes.shape( {
			status: PropTypes.oneOf( [ 'success', 'error' ] ),
			message: PropTypes.string,
		} )
	),
	onInviteResult: PropTypes.func.isRequired,
	isLoading: PropTypes.bool,
};
