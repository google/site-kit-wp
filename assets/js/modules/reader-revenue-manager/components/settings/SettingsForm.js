/**
 * Reader Revenue Manager SettingsForm component.
 *
 * Site Kit by Google, Copyright 2025 Google LLC
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
import { createInterpolateElement, Fragment } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { useSelect } from 'googlesitekit-data';
import { CORE_MODULES } from '../../../../googlesitekit/modules/datastore/constants';
import { MODULES_READER_REVENUE_MANAGER } from '../../datastore/constants';
import { MODULE_SLUG_READER_REVENUE_MANAGER } from '../../constants';
import {
	PostTypesSelect,
	PublicationOnboardingStateNotice,
	PublicationSelect,
	SnippetModeSelect,
} from '../common';
import ProductIDSettings from './ProductIDSettings';
import StoreErrorNotices from '../../../../components/StoreErrorNotices';
import { getProductIDLabel } from '../../../../../../assets/js/modules/reader-revenue-manager/utils/settings';
import Notice from '../../../../components/Notice';
import ErrorNotice from '../../../../components/ErrorNotice';

export default function SettingsForm( { hasModuleAccess } ) {
	const publicationID = useSelect( ( select ) =>
		select( MODULES_READER_REVENUE_MANAGER ).getPublicationID()
	);

	const productIDs = useSelect( ( select ) =>
		select( MODULES_READER_REVENUE_MANAGER ).getCurrentProductIDs()
	);

	const snippetMode = useSelect( ( select ) =>
		select( MODULES_READER_REVENUE_MANAGER ).getSnippetMode()
	);

	const missingProductID = useSelect( ( select ) => {
		const productID = select(
			MODULES_READER_REVENUE_MANAGER
		).getProductID();

		if ( productID === undefined ) {
			return undefined;
		}

		if ( 'openaccess' === productID ) {
			return null;
		}

		if ( productIDs === undefined ) {
			return undefined;
		}

		return productIDs.includes( productID ) ? null : productID;
	} );

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
			MODULE_SLUG_READER_REVENUE_MANAGER
		);

		return module?.owner?.login
			? `<strong>${ module.owner.login }</strong>`
			: __( 'Another admin', 'google-site-kit' );
	} );

	const publicationsLoaded = useSelect(
		( select ) =>
			hasModuleAccess === false ||
			select( MODULES_READER_REVENUE_MANAGER ).hasFinishedResolution(
				'getPublications'
			)
	);

	return (
		<Fragment>
			<div className="googlesitekit-settings-module__fields-group">
				<StoreErrorNotices
					moduleSlug={ MODULE_SLUG_READER_REVENUE_MANAGER }
					storeName={ MODULES_READER_REVENUE_MANAGER }
				/>

				{ hasModuleAccess && false === publicationAvailable && (
					<ErrorNotice
						message={ sprintf(
							/* translators: 1: Publication ID. */
							__(
								'The previously selected publication with ID %s was not found. Please select a new publication.',
								'google-site-kit'
							),
							publicationID
						) }
						skipRetryMessage
					/>
				) }

				{ hasModuleAccess && publicationAvailable && missingProductID && (
					<ErrorNotice
						message={ sprintf(
							/* translators: 1: Product ID. */
							__(
								'The previously selected product ID %s was not found. Please select a new product ID.',
								'google-site-kit'
							),
							getProductIDLabel( missingProductID )
						) }
						skipRetryMessage
					/>
				) }

				<div className="googlesitekit-setup-module__inputs">
					<PublicationSelect hasModuleAccess={ hasModuleAccess } />
				</div>
				{ hasModuleAccess && publicationAvailable && (
					<PublicationOnboardingStateNotice />
				) }
				{ ! hasModuleAccess && (
					<Notice
						className="googlesitekit-notice--bottom-margin"
						type={ Notice.TYPES.WARNING }
						description={ createInterpolateElement(
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
				{ publicationsLoaded && productIDs?.length > 0 && (
					<ProductIDSettings hasModuleAccess={ hasModuleAccess } />
				) }
			</div>
			<div className="googlesitekit-settings-module__fields-group">
				<h4 className="googlesitekit-settings-module__fields-group-title">
					{ __( 'CTA Placement', 'google-site-kit' ) }
				</h4>
				<div className="googlesitekit-rrm-settings-edit__snippet-mode">
					<SnippetModeSelect hasModuleAccess={ hasModuleAccess } />
				</div>
				{ snippetMode === 'post_types' && (
					<div className="googlesitekit-rrm-settings-edit__post-types">
						<h5>
							{ __(
								'Select the content types where you want your CTAs to appear:',
								'google-site-kit'
							) }
						</h5>
						<PostTypesSelect hasModuleAccess={ hasModuleAccess } />
					</div>
				) }
			</div>
		</Fragment>
	);
}
