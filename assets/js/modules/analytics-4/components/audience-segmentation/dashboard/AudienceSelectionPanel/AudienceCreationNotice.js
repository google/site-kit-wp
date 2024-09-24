/**
 * Audience Selection Panel AudienceCreationNotice component.
 *
 * Site Kit by Google, Copyright 2024 Google LLC
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
import { useCallback, useEffect, useState } from '@wordpress/element';
import { addQueryArgs } from '@wordpress/url';

/**
 * Internal dependencies
 */
import { useDispatch, useSelect } from 'googlesitekit-data';
import {
	AUDIENCE_CREATION_EDIT_SCOPE_NOTICE_SLUG,
	AUDIENCE_CREATION_FORM,
	AUDIENCE_CREATION_NOTICE_SLUG,
	AUDIENCE_CREATION_SUCCESS_NOTICE_SLUG,
	AUDIENCE_SELECTION_PANEL_OPENED_KEY,
} from './constants';
import { CORE_FORMS } from '../../../../../../googlesitekit/datastore/forms/constants';
import { CORE_SITE } from '../../../../../../googlesitekit/datastore/site/constants';
import { CORE_USER } from '../../../../../../googlesitekit/datastore/user/constants';
import { CORE_UI } from '../../../../../../googlesitekit/datastore/ui/constants';
import {
	EDIT_SCOPE,
	MODULES_ANALYTICS_4,
	SITE_KIT_AUDIENCE_DEFINITIONS,
} from '../../../../datastore/constants';
import { ERROR_CODE_MISSING_REQUIRED_SCOPE } from '../../../../../../util/errors';
import Link from '../../../../../../components/Link';
import CloseIcon from '../../../../../../../svg/icons/close.svg';
import SpinnerButton, {
	SPINNER_POSITION,
} from '../../../../../../googlesitekit/components-gm2/SpinnerButton';
import SubtleNotification, {
	VARIANTS,
} from '../../../../../../components/notifications/SubtleNotification';
import AudienceCreationErrorNotice from './AudienceCreationErrorNotice';

export default function AudienceCreationNotice() {
	const [ isCreatingAudience, setIsCreatingAudience ] = useState( false );

	const siteKitConfigurableAudiences = useSelect( ( select ) => {
		const { getConfigurableAudiences } = select( MODULES_ANALYTICS_4 );

		const audiences = getConfigurableAudiences();

		if ( undefined === audiences ) {
			return undefined;
		}

		if ( ! audiences.length ) {
			return [];
		}

		return audiences.filter(
			( { audienceType } ) => audienceType === 'SITE_KIT_AUDIENCE'
		);
	} );

	const { dismissItem } = useDispatch( CORE_USER );
	const { setValue } = useDispatch( CORE_UI );

	const isItemDismissed = useSelect( ( select ) =>
		select( CORE_USER ).isItemDismissed( AUDIENCE_CREATION_NOTICE_SLUG )
	);
	const isEditScopeNoticeDismissed = useSelect( ( select ) =>
		select( CORE_USER ).isItemDismissed(
			AUDIENCE_CREATION_EDIT_SCOPE_NOTICE_SLUG
		)
	);
	const hasAnalytics4EditScope = useSelect( ( select ) =>
		select( CORE_USER ).hasScope( EDIT_SCOPE )
	);

	const onCloseClick = () => {
		dismissItem( AUDIENCE_CREATION_NOTICE_SLUG );
	};

	const redirectURL = addQueryArgs( global.location.href, {
		notification: 'audience_segmentation',
	} );

	const { setValues } = useDispatch( CORE_FORMS );
	const { setPermissionScopeError } = useDispatch( CORE_USER );
	const { createAudience, syncAvailableAudiences } =
		useDispatch( MODULES_ANALYTICS_4 );

	const isCreatingAudienceFromOAuth = useSelect( ( select ) =>
		select( CORE_FORMS ).getValue( AUDIENCE_CREATION_FORM, 'autoSubmit' )
	);

	const failedAudienceToCreate = useSelect( ( select ) =>
		select( CORE_FORMS ).getValue(
			AUDIENCE_CREATION_FORM,
			'audienceToCreate'
		)
	);

	const [ apiErrors, setApiErrors ] = useState( [] );

	const handleCreateAudience = useCallback(
		async ( audienceSlug ) => {
			setIsCreatingAudience( audienceSlug );

			if ( ! hasAnalytics4EditScope ) {
				setValues( AUDIENCE_CREATION_FORM, {
					autoSubmit: true,
					audienceToCreate: audienceSlug,
				} );

				// Set permission scope error to trigger OAuth flow.
				setPermissionScopeError( {
					code: ERROR_CODE_MISSING_REQUIRED_SCOPE,
					message: __(
						'Additional permissions are required to create a new audience in Analytics.',
						'google-site-kit'
					),
					data: {
						status: 403,
						scopes: [ EDIT_SCOPE ],
						skipModal: true,
						redirectURL,
					},
				} );

				return;
			}

			setValues( AUDIENCE_CREATION_FORM, {
				autoSubmit: false,
				audienceToCreate: undefined,
			} );

			const { error } = await createAudience(
				SITE_KIT_AUDIENCE_DEFINITIONS[ audienceSlug ]
			);

			if ( !! error ) {
				setApiErrors( [ error ] );
			}

			await syncAvailableAudiences();

			setIsCreatingAudience( false );

			if ( ! error ) {
				setValue( AUDIENCE_CREATION_SUCCESS_NOTICE_SLUG, true );
			}
		},
		[
			hasAnalytics4EditScope,
			createAudience,
			syncAvailableAudiences,
			setValues,
			setPermissionScopeError,
			redirectURL,
			setValue,
		]
	);

	const handleDismissEditScopeNotice = () => {
		dismissItem( AUDIENCE_CREATION_EDIT_SCOPE_NOTICE_SLUG );
	};

	const setupErrorCode = useSelect( ( select ) =>
		select( CORE_SITE ).getSetupErrorCode()
	);

	const hasOAuthError =
		isCreatingAudienceFromOAuth && setupErrorCode === 'access_denied';

	useEffect( () => {
		async function createAudienceFromOAuth() {
			if ( hasAnalytics4EditScope && isCreatingAudienceFromOAuth ) {
				setValue( AUDIENCE_SELECTION_PANEL_OPENED_KEY, true );
				await handleCreateAudience( failedAudienceToCreate );
			}
		}

		createAudienceFromOAuth();
	}, [
		failedAudienceToCreate,
		handleCreateAudience,
		hasAnalytics4EditScope,
		isCreatingAudienceFromOAuth,
		setValue,
	] );

	// Show the notice if the user has no site kit audiences, or has
	// created one, and the user has not dismissed it.
	const shouldShowNotice =
		! isItemDismissed && siteKitConfigurableAudiences?.length < 2;

	if ( ! shouldShowNotice ) {
		return null;
	}

	const siteKitAvailableAudiences = Object.keys(
		SITE_KIT_AUDIENCE_DEFINITIONS
	).filter(
		( audienceSlug ) =>
			! siteKitConfigurableAudiences.some(
				( configuredAudience ) =>
					configuredAudience.audienceSlug === audienceSlug
			)
	);

	return (
		<div className="googlesitekit-audience-selection-panel__audience-creation-notice">
			<div className="googlesitekit-audience-selection-panel__audience-creation-notice-header">
				<p className="googlesitekit-audience-selection-panel__audience-creation-notice-title">
					{ __(
						'Create groups suggested by Site Kit',
						'google-site-kit'
					) }
				</p>

				<Link
					className="googlesitekit-audience-selection-panel__audience-creation-notice-close"
					onClick={ onCloseClick }
					linkButton
				>
					<CloseIcon width="15" height="15" />
				</Link>
			</div>
			<div className="googlesitekit-audience-selection-panel__audience-creation-notice-body">
				{ siteKitAvailableAudiences &&
					siteKitAvailableAudiences.map( ( audienceSlug ) => (
						<div
							key={ audienceSlug }
							className="googlesitekit-audience-selection-panel__audience-creation-notice-audience"
						>
							<div className="googlesitekit-audience-selection-panel__audience-creation-notice-audience-details">
								<h3>
									{
										SITE_KIT_AUDIENCE_DEFINITIONS[
											audienceSlug
										].displayName
									}
								</h3>
								<p className="googlesitekit-audience-selection-panel__audience-creation-notice-audience-description">
									{
										SITE_KIT_AUDIENCE_DEFINITIONS[
											audienceSlug
										].description
									}
								</p>
							</div>
							<div className="googlesitekit-audience-selection-panel__audience-creation-notice-audience-button">
								<SpinnerButton
									spinnerPosition={ SPINNER_POSITION.BEFORE }
									onClick={ () => {
										handleCreateAudience( audienceSlug );
									} }
									isSaving={
										isCreatingAudience === audienceSlug
									}
								>
									{ __( 'Create', 'google-site-kit' ) }
								</SpinnerButton>
							</div>
						</div>
					) ) }
			</div>
			{ ! hasAnalytics4EditScope && ! isEditScopeNoticeDismissed && (
				<div className="googlesitekit-audience-selection-panel__audience-creation-notice-info">
					<SubtleNotification
						title={ __(
							'Creating these groups require more data tracking. You will be directed to update your Analytics property.',
							'google-site-kit'
						) }
						dismissLabel={ __( 'Got it', 'google-site-kit' ) }
						onDismiss={ handleDismissEditScopeNotice }
						variant={ VARIANTS.WARNING }
						hideIcon
					/>
				</div>
			) }
			{ ( apiErrors.length > 0 || hasOAuthError ) && (
				<AudienceCreationErrorNotice
					apiErrors={ apiErrors }
					hasOAuthError={ hasOAuthError }
				/>
			) }
		</div>
	);
}
