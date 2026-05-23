/**
 * InviteUserRow component.
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
import { createInterpolateElement, useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { Button } from 'googlesitekit-components';
import { useDispatch, useSelect } from 'googlesitekit-data';
import Link from '@/js/components/Link';
import { CORE_SITE } from '@/js/googlesitekit/datastore/site/constants';
import useViewContext from '@/js/hooks/useViewContext';
import { trackEvent } from '@/js/util';
import MailIcon from '@/svg/icons/manage-email-reports.svg';
import TickIcon from '@/svg/icons/tick.svg';

export default function InviteUserRow( {
	user,
	inviteResult = null,
	onInviteResult,
} ) {
	const viewContext = useViewContext();

	const { id, name, email, role } = user;

	const { inviteUser } = useDispatch( CORE_SITE );

	const isInviting = useSelect( ( select ) =>
		select( CORE_SITE ).isInvitingUser( id )
	);

	const handleInvite = useCallback( async () => {
		trackEvent(
			`${ viewContext }_email_reports_user_settings-sidebar`,
			'send_invite'
		);

		const { error } = await inviteUser( id );

		if ( error ) {
			onInviteResult( id, { status: 'error', message: error.message } );
		} else {
			onInviteResult( id, { status: 'success' } );
		}
	}, [ viewContext, id, inviteUser, onInviteResult ] );

	function renderAction() {
		if ( inviteResult?.status === 'success' || user.invited ) {
			return (
				<span className="googlesitekit-invite-user-row__success">
					{ __( 'Invitation sent', 'google-site-kit' ) }
					<TickIcon width="14" height="14" />
				</span>
			);
		}

		if ( inviteResult?.status === 'error' ) {
			return (
				<span className="googlesitekit-invite-user-row__error">
					{ createInterpolateElement(
						__(
							'Failed to send invite. <RetryLink>Retry</RetryLink>',
							'google-site-kit'
						),
						{
							RetryLink: (
								<Link
									aria-label={ __(
										'Retry sending email subscription invite',
										'google-site-kit'
									) }
									onClick={ handleInvite }
								/>
							),
						}
					) }
				</span>
			);
		}

		return (
			<Button
				onClick={ handleInvite }
				disabled={ isInviting }
				trailingIcon={ <MailIcon width="18" height="18" /> }
				tertiary
			>
				{ isInviting
					? __( 'Sending…', 'google-site-kit' )
					: __( 'Send invite', 'google-site-kit' ) }
			</Button>
		);
	}

	return (
		<div className="googlesitekit-invite-user-row">
			<div className="googlesitekit-invite-user-row__info">
				<div className="googlesitekit-invite-user-row__name">
					{ name }
					<span className="googlesitekit-invite-user-row__role">
						({ role })
					</span>
				</div>
				<div className="googlesitekit-invite-user-row__email">
					{ email }
				</div>
			</div>
			<div className="googlesitekit-invite-user-row__action">
				{ renderAction() }
			</div>
		</div>
	);
}

InviteUserRow.propTypes = {
	user: PropTypes.shape( {
		id: PropTypes.number.isRequired,
		name: PropTypes.string.isRequired,
		email: PropTypes.string.isRequired,
		role: PropTypes.string,
		invited: PropTypes.bool,
	} ).isRequired,
	inviteResult: PropTypes.shape( {
		status: PropTypes.oneOf( [ 'success', 'error' ] ),
		message: PropTypes.string,
	} ),
	onInviteResult: PropTypes.func.isRequired,
};
