/**
 * OnboardingComplete component.
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
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { createInterpolateElement } from '@wordpress/element';

/**
 * External dependencies
 */
import { FC, ElementType, ReactNode } from 'react';

/**
 * Internal dependencies
 */
import { useSelect } from 'googlesitekit-data';
import { TYPES } from '@/js/components/Notice/constants';
import { MODULES_READER_REVENUE_MANAGER } from '@/js/modules/reader-revenue-manager/datastore/constants';
import { CORE_SITE } from '@/js/googlesitekit/datastore/site/constants';
import { MODULE_SLUG_READER_REVENUE_MANAGER } from '@/js/modules/reader-revenue-manager/constants';
import LearnMoreLink from '@/js/googlesitekit/notifications/components/common/LearnMoreLink';
import NoticeNotification from '@/js/googlesitekit/notifications/components/layout/NoticeNotification';

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- `@wordpress/data` is not typed yet.
type SelectFunction = ( select: any ) => any;

type NotificationContent = {
	title: string;
	description: ReactNode;
	primaryButton: {
		text: string;
		ctaLink: string;
		isCTALinkExternal: boolean;
	};
	secondaryButton: {
		text: string;
		onClick: () => void;
	};
};

interface OnboardingCompleteProps {
	id: string;
	Notification: ElementType;
	gaTrackingEventArgs: Record< string, string >;
	dismissNotice: () => void;
	paymentOption: string;
	productID: string;
	serviceURL: string;
}

const OnboardingComplete: FC< OnboardingCompleteProps > = ( {
	id,
	Notification,
	gaTrackingEventArgs,
	dismissNotice,
	paymentOption,
	productID,
	serviceURL,
} ) => {
	const productIDs = useSelect( ( select: SelectFunction ) =>
		select( MODULES_READER_REVENUE_MANAGER ).getProductIDs()
	);

	const rrmSettingsURL = useSelect( ( select: SelectFunction ) =>
		select( CORE_SITE ).getModuleSettingsEditURL(
			MODULE_SLUG_READER_REVENUE_MANAGER
		)
	);

	// Do not show the notification if the payment option is not set.
	if ( '' === paymentOption ) {
		return null;
	}

	const notificationContent: NotificationContent = {
		title: __(
			'Success! Your Reader Revenue Manager account is set up',
			'google-site-kit'
		),
		description: '',
		primaryButton: {
			text: __( 'Manage CTAs', 'google-site-kit' ),
			ctaLink: rrmSettingsURL,
			isCTALinkExternal: false,
		},
		secondaryButton: {
			text: __( 'Got it', 'google-site-kit' ),
			onClick: dismissNotice,
		},
	};

	switch ( paymentOption ) {
		case 'subscriptions':
			if ( productID === 'openaccess' ) {
				notificationContent.description = __(
					'You can edit your settings to manage product IDs and select which of your site’s pages will include a subscription CTA.',
					'google-site-kit'
				);
			} else {
				notificationContent.description = __(
					'You can edit your settings and select which of your site’s pages will include a subscription CTA.',
					'google-site-kit'
				);
			}
			break;
		case 'contributions':
			if ( productIDs.length > 0 && productID === 'openaccess' ) {
				notificationContent.description = __(
					'You can edit your settings to manage product IDs and select which of your site’s pages will include a contribution CTA.',
					'google-site-kit'
				);
			} else {
				notificationContent.description = __(
					'You can edit your settings and select which of your site’s pages will include a contribution CTA.',
					'google-site-kit'
				);
			}
			break;
		case 'noPayment':
			notificationContent.description = createInterpolateElement(
				__(
					'Explore Reader Revenue Manager’s additional features, such as paywalls, subscriptions and contributions. <a>Learn more</a>',
					'google-site-kit'
				),
				{
					a: (
						<LearnMoreLink
							id={ id }
							ariaLabel={ __(
								'Learn more about Reader Revenue Manager features',
								'google-site-kit'
							) }
							label={ __( 'Learn more', 'google-site-kit' ) }
							url="https://support.google.com/news/publisher-center/answer/12813936"
							gaTrackingEventArgs={ gaTrackingEventArgs }
							hideExternalIndicator
						/>
					),
				}
			);
			notificationContent.primaryButton = {
				text: __( 'Get started', 'google-site-kit' ),
				ctaLink: serviceURL,
				isCTALinkExternal: true,
			};
			break;
	}

	return (
		<Notification gaTrackingEventArgs={ gaTrackingEventArgs }>
			{ /* @ts-expect-error - The `NoticeNotification` component is not typed yet. */ }
			<NoticeNotification
				notificationID={ id }
				type={ TYPES.SUCCESS }
				gaTrackingEventArgs={ gaTrackingEventArgs }
				title={ notificationContent.title }
				description={ notificationContent.description }
				dismissButton={ {
					label: notificationContent.secondaryButton.text,
					onClick: notificationContent.secondaryButton.onClick,
				} }
				ctaButton={ {
					label: notificationContent.primaryButton.text,
					href: notificationContent.primaryButton.ctaLink,
					external:
						notificationContent.primaryButton.isCTALinkExternal,
				} }
			/>
		</Notification>
	);
};

export default OnboardingComplete;
