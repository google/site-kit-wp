/**
 * Reader Revenue Manager SettingsEdit component.
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
import { createInterpolateElement } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { ProgressBar } from 'googlesitekit-components';
import { useSelect, useDispatch } from 'googlesitekit-data';
import { useFeature } from '../../../../hooks/useFeature';
import { CORE_MODULES } from '../../../../googlesitekit/modules/datastore/constants';
import { CORE_SITE } from '../../../../googlesitekit/datastore/site/constants';
import { CORE_USER } from '../../../../googlesitekit/datastore/user/constants';
import {
	MODULES_READER_REVENUE_MANAGER,
	READER_REVENUE_MANAGER_MODULE_SLUG,
} from '../../datastore/constants';
import {
	RRM_PRODUCT_ID_INFO_NOTICE_SLUG,
	RRM_PRODUCT_ID_OPEN_ACCESS_NOTICE_SLUG,
} from '../../constants';
import ErrorText from '../../../../components/ErrorText';
import {
	PostTypesSelect,
	PublicationOnboardingStateNotice,
	PublicationSelect,
	ProductIDSelect,
	SnippetModeSelect,
} from '../common';
import SettingsNotice, {
	TYPE_INFO,
} from '../../../../components/SettingsNotice';
import Link from '../../../../components/Link';
import SubtleNotification from '../../../../components/notifications/SubtleNotification';
import WarningIcon from '../../../../../../assets/svg/icons/warning-icon.svg';

export default function SettingsEdit() {
	const isRRMv2Enabled = useFeature( 'rrmModuleV2' );

	const isDoingSubmitChanges = useSelect( ( select ) =>
		select( MODULES_READER_REVENUE_MANAGER ).isDoingSubmitChanges()
	);
	const hasModuleAccess = useSelect( ( select ) => {
		const { hasModuleOwnershipOrAccess, getErrorForAction } =
			select( CORE_MODULES );

		const hasAccess = hasModuleOwnershipOrAccess(
			READER_REVENUE_MANAGER_MODULE_SLUG
		);

		if ( hasAccess ) {
			return true;
		}

		const checkAccessError = getErrorForAction( 'checkModuleAccess', [
			READER_REVENUE_MANAGER_MODULE_SLUG,
		] );

		// Return early if request is not completed yet.
		if ( undefined === hasAccess && ! checkAccessError ) {
			return undefined;
		}

		// Return false if RRM is connected and access is concretely missing.
		if ( false === hasAccess ) {
			return false;
		}

		if ( 'module_not_connected' === checkAccessError?.code ) {
			return true;
		}

		return false;
	} );
	const publicationID = useSelect( ( select ) =>
		select( MODULES_READER_REVENUE_MANAGER ).getPublicationID()
	);
	const publicationAvailable = useSelect( ( select ) => {
		if ( hasModuleAccess === undefined ) {
			return undefined;
		}

		if ( hasModuleAccess === false ) {
			return false;
		}

		const publications = select(
			MODULES_READER_REVENUE_MANAGER
		).getPublications();

		if ( ! Array.isArray( publications ) ) {
			return undefined;
		}

		return publications.some(
			// eslint-disable-next-line sitekit/acronym-case
			( { publicationId: id } ) => id === publicationID
		);
	} );
	const formattedOwnerName = useSelect( ( select ) => {
		const module = select( CORE_MODULES ).getModule(
			READER_REVENUE_MANAGER_MODULE_SLUG
		);

		return module?.owner?.login
			? `<strong>${ module.owner.login }</strong>`
			: __( 'Another admin', 'google-site-kit' );
	} );
	const snippetMode = useSelect( ( select ) =>
		select( MODULES_READER_REVENUE_MANAGER ).getSnippetMode()
	);
	const productID = useSelect( ( select ) =>
		select( MODULES_READER_REVENUE_MANAGER ).getProductID()
	);
	const productIDs = useSelect( ( select ) =>
		select( MODULES_READER_REVENUE_MANAGER ).getProductIDs()
	);
	const paymentOption = useSelect( ( select ) =>
		select( MODULES_READER_REVENUE_MANAGER ).getPaymentOption()
	);
	const learnMoreURL = useSelect( ( select ) => {
		return select( CORE_SITE ).getDocumentationLinkURL(
			'rrm-content-settings'
		);
	} );
	const isOpenAccessNoticeDismissed = useSelect( ( select ) =>
		select( CORE_USER ).isItemDismissed(
			RRM_PRODUCT_ID_OPEN_ACCESS_NOTICE_SLUG
		)
	);
	const isInfoNoticeDismissed = useSelect( ( select ) =>
		select( CORE_USER ).isItemDismissed( RRM_PRODUCT_ID_INFO_NOTICE_SLUG )
	);
	const hasPaymentSubscription = paymentOption === 'subscriptions';

	const { dismissItem } = useDispatch( CORE_USER );

	if ( isDoingSubmitChanges || undefined === hasModuleAccess ) {
		return <ProgressBar />;
	}

	return (
		<div className="googlesitekit-setup-module googlesitekit-setup-module--reader-revenue-manager googlesitekit-rrm-settings-edit">
			<div className="googlesitekit-settings-module__fields-group">
				{ hasModuleAccess && false === publicationAvailable && (
					<ErrorText
						message={ sprintf(
							/* translators: 1: Publication ID. */
							__(
								'The previously selected publication with ID %s was not found. Please select a new publication.',
								'google-site-kit'
							),
							publicationID
						) }
					/>
				) }
				<div className="googlesitekit-setup-module__inputs">
					<PublicationSelect hasModuleAccess={ hasModuleAccess } />
				</div>
				{ hasModuleAccess && publicationAvailable && (
					<PublicationOnboardingStateNotice />
				) }
				{ ! hasModuleAccess && (
					<SettingsNotice
						type={ TYPE_INFO }
						Icon={ WarningIcon }
						notice={ createInterpolateElement(
							sprintf(
								/* translators: %s: module owner's name */
								__(
									'%s configured Reader Revenue Manager and you don’t have access to its configured publication. Contact them to share access or change the configured publication.',
									'google-site-kit'
								),
								formattedOwnerName
							),
							{
								strong: <strong />,
							}
						) }
					/>
				) }
			</div>
			{ isRRMv2Enabled && productIDs?.length > 0 && (
				<div className="googlesitekit-settings-module__fields-group googlesitekit-rrm-settings-edit__product-id-container">
					<div className="googlesitekit-rrm-settings-edit__product-id">
						<ProductIDSelect hasModuleAccess={ hasModuleAccess } />
					</div>
					{ hasPaymentSubscription &&
						productID === 'openaccess' &&
						! isOpenAccessNoticeDismissed && (
							<div className="googlesitekit-rrm-settings-edit__product-id-warning-notice">
								<SubtleNotification
									title={ __(
										'Selecting “open access” will allow your reader to access your content without a subscription',
										'google-site-kit'
									) }
									hideIcon
									variant="warning"
									dismissLabel={ __(
										'Got it',
										'google-site-kit'
									) }
									onDismiss={ () =>
										dismissItem(
											RRM_PRODUCT_ID_OPEN_ACCESS_NOTICE_SLUG
										)
									}
								/>
							</div>
						) }
					{ ! isInfoNoticeDismissed && (
						<div className="googlesitekit-rrm-settings-edit__product-id-info-notice">
							<SubtleNotification
								title={ createInterpolateElement(
									__(
										'Use the new settings in the block editor to select different product IDs for individual pages or control where CTAs appear on an individual post. <learnMore>Learn more</learnMore>',
										'google-site-kit'
									),
									{
										learnMore: (
											<Link
												aria-label={ __(
													'Learn more about Product IDs',
													'google-site-kit'
												) }
												href={ learnMoreURL }
												external
												hideExternalIndicator
											/>
										),
									}
								) }
								variant="info"
								dismissLabel={ __(
									'Got it',
									'google-site-kit'
								) }
								onDismiss={ () =>
									dismissItem(
										RRM_PRODUCT_ID_INFO_NOTICE_SLUG
									)
								}
							/>
						</div>
					) }
				</div>
			) }
			{ isRRMv2Enabled && (
				<div className="googlesitekit-settings-module__fields-group">
					<h4 className="googlesitekit-settings-module__fields-group-title">
						{ __( 'CTA Placement', 'google-site-kit' ) }
					</h4>
					<div className="googlesitekit-rrm-settings-edit__snippet-mode">
						<SnippetModeSelect
							hasModuleAccess={ hasModuleAccess }
						/>
					</div>
					{ snippetMode === 'post_types' && (
						<div className="googlesitekit-rrm-settings-edit__post-types">
							<h5>
								{ __(
									'Select the content types where you want your CTAs to appear:',
									'google-site-kit'
								) }
							</h5>
							<PostTypesSelect
								hasModuleAccess={ hasModuleAccess }
							/>
						</div>
					) }
				</div>
			) }
		</div>
	);
}
