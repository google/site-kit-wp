/**
 * SubscribedUserRow component.
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
import { FC, memo, useCallback } from 'react';

/**
 * WordPress dependencies
 */
import { createInterpolateElement } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { Button } from 'googlesitekit-components';
import { Select, useDispatch, useSelect } from 'googlesitekit-data';
import Link from '@/js/components/Link';
import { CORE_SITE } from '@/js/googlesitekit/datastore/site/constants';
import useViewContext from '@/js/hooks/useViewContext';
import { trackEvent } from '@/js/util';
import CloseIcon from '@/svg/icons/close.svg';
import UnsubscribeIcon from '@/svg/icons/unsubscribe.svg';

export interface SubscribedUser {
	id: number;
	name?: string;
	email: string;
	role?: string;
}

export interface SubscribedUserRowProps {
	/** The subscribed user this row renders. */
	user: SubscribedUser;
}

const SubscribedUserRow: FC< SubscribedUserRowProps > = ( { user } ) => {
	const viewContext = useViewContext();

	const { id, name, email, role } = user;

	const { unsubscribeUser, dismissUnsubscribedUser } =
		useDispatch( CORE_SITE );

	const isUnsubscribing = useSelect(
		( select: Select ) => select( CORE_SITE ).isUnsubscribingUser( id ),
		[ id ]
	);
	// `unsubscribeUser` snapshots a successfully-unsubscribed user into the
	// store instead of just deleting their row, so this reads as the single
	// source of truth for "should this row show as unsubscribed" — no
	// component-local state to keep in sync with it.
	const isJustUnsubscribed = useSelect(
		( select: Select ) =>
			!! select( CORE_SITE ).getJustUnsubscribedUsers()[ id ],
		[ id ]
	);
	// The fetch store behind `unsubscribeUser` records its own failures via
	// the shared action-error store, so a failed attempt doesn't need
	// separate local tracking either.
	const unsubscribeError = useSelect(
		( select: Select ) =>
			select( CORE_SITE ).getErrorForAction( 'unsubscribeUser', [ id ] ),
		[ id ]
	);

	const handleUnsubscribe = useCallback( async () => {
		trackEvent(
			`${ viewContext }_email_reports_user_settings-sidebar`,
			'unsubscribe_user'
		);

		await unsubscribeUser( id );
	}, [ viewContext, id, unsubscribeUser ] );

	const handleDismiss = useCallback( () => {
		dismissUnsubscribedUser( id );
	}, [ id, dismissUnsubscribedUser ] );

	function renderAction() {
		if ( isJustUnsubscribed ) {
			return (
				<span className="googlesitekit-user-row__unsubscribed">
					{ __( 'User unsubscribed', 'google-site-kit' ) }
					<button
						type="button"
						className="googlesitekit-user-row__dismiss"
						onClick={ handleDismiss }
						aria-label={ __( 'Dismiss', 'google-site-kit' ) }
					>
						<CloseIcon width="10" height="10" />
					</button>
				</span>
			);
		}

		if ( unsubscribeError ) {
			return (
				<span className="googlesitekit-user-row__error">
					{ createInterpolateElement(
						__(
							'Failed to unsubscribe. <RetryLink>Retry</RetryLink>',
							'google-site-kit'
						),
						{
							RetryLink: (
								<Link
									aria-label={ __(
										'Retry unsubscribing this user from email reports',
										'google-site-kit'
									) }
									onClick={ handleUnsubscribe }
								/>
							),
						}
					) }
				</span>
			);
		}

		return (
			// @ts-expect-error - `Button` component typing is incomplete.
			<Button
				className="googlesitekit-user-row__unsubscribe-button"
				onClick={ handleUnsubscribe }
				disabled={ isUnsubscribing }
				trailingIcon={ <UnsubscribeIcon width="18" height="18" /> }
				tertiary
			>
				{ isUnsubscribing
					? __( 'Unsubscribing…', 'google-site-kit' )
					: __( 'Unsubscribe', 'google-site-kit' ) }
			</Button>
		);
	}

	return (
		<div className="googlesitekit-user-row">
			<div className="googlesitekit-user-row__info">
				<div className="googlesitekit-user-row__name">
					{ name }
					{ role && (
						<span className="googlesitekit-user-row__role">
							({ role })
						</span>
					) }
				</div>
				<div className="googlesitekit-user-row__email">{ email }</div>
			</div>
			<div className="googlesitekit-user-row__action">
				{ renderAction() }
			</div>
		</div>
	);
};

export default memo( SubscribedUserRow );
