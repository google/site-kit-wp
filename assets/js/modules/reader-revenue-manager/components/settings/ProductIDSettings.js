/**
 * Reader Revenue Manager Product ID Settings component.
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
import { createInterpolateElement } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { useSelect, useDispatch } from 'googlesitekit-data';
import { CORE_SITE } from '@/js/googlesitekit/datastore/site/constants';
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import { MODULES_READER_REVENUE_MANAGER } from '@/js/modules/reader-revenue-manager/datastore/constants';
import {
	RRM_PRODUCT_ID_INFO_NOTICE_SLUG,
	RRM_PRODUCT_ID_OPEN_ACCESS_NOTICE_SLUG,
} from '@/js/modules/reader-revenue-manager/constants';
import { ProductIDSelect } from '@/js/modules/reader-revenue-manager/components/common';
import Link from '@/js/components/Link';
import Notice from '@/js/components/Notice';

export default function ProductIDSettings( { hasModuleAccess } ) {
	const productID = useSelect( ( select ) =>
		select( MODULES_READER_REVENUE_MANAGER ).getProductID()
	);
	const currentProductIDs = useSelect( ( select ) =>
		select( MODULES_READER_REVENUE_MANAGER ).getCurrentProductIDs()
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

	const showOpenAccessNotice =
		hasPaymentSubscription &&
		productID === 'openaccess' &&
		! isOpenAccessNoticeDismissed &&
		hasModuleAccess;

	const showInfoNotice = ! isInfoNoticeDismissed && hasModuleAccess;

	const { dismissItem } = useDispatch( CORE_USER );
	const { setProductIDs } = useDispatch( MODULES_READER_REVENUE_MANAGER );

	return (
		<div className="googlesitekit-rrm-settings-edit__product-id-container">
			<div className="googlesitekit-rrm-settings-edit__product-id">
				<ProductIDSelect
					onChange={ () => {
						setProductIDs( currentProductIDs );
					} }
					hasModuleAccess={ hasModuleAccess }
				/>
			</div>
			{ showOpenAccessNotice && (
				<div className="googlesitekit-rrm-settings-edit__product-id-warning-notice">
					<Notice
						type={ Notice.TYPES.WARNING }
						description={ __(
							'Selecting “open access” will allow your reader to access your content without a subscription',
							'google-site-kit'
						) }
						dismissButton={ {
							onClick: () =>
								dismissItem(
									RRM_PRODUCT_ID_OPEN_ACCESS_NOTICE_SLUG
								),
						} }
						hideIcon
					/>
				</div>
			) }
			{ showInfoNotice && (
				<div className="googlesitekit-rrm-settings-edit__product-id-info-notice">
					<Notice
						type={ Notice.TYPES.INFO }
						title={ createInterpolateElement(
							__(
								'Use the new settings in the block editor to select different product IDs for individual pages or control where CTAs appear on an individual post. <learnMore>Learn more</learnMore>',
								'google-site-kit'
							),
							{
								learnMore: (
									<Link
										aria-label={ __(
											'Learn more about setting product IDs at a content-level',
											'google-site-kit'
										) }
										href={ learnMoreURL }
										external
										hideExternalIndicator
									/>
								),
							}
						) }
						dismissButton={ {
							onClick: () =>
								dismissItem( RRM_PRODUCT_ID_INFO_NOTICE_SLUG ),
						} }
					/>
				</div>
			) }
		</div>
	);
}
