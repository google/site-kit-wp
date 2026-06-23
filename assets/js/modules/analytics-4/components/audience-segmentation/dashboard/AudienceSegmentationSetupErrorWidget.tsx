/**
 * AudienceSegmentationSetupErrorWidget component.
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
import type { ElementType, FC, ReactNode } from 'react';

/**
 * WordPress dependencies
 */
import { createInterpolateElement } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { Select, useSelect } from 'googlesitekit-data';
import Link from '@/js/components/Link';
import Notice from '@/js/components/Notice';
import { NOTICE_TYPES } from '@/js/components/Notice/constants';
import { CORE_SITE } from '@/js/googlesitekit/datastore/site/constants';
import { isInsufficientPermissionsError } from '@/js/util/errors';

interface AudienceSegmentationSetupErrorWidgetError {
	code?: string | number;
	message?: string;
	data?: {
		reason?: string;
	} & Record< string, unknown >;
}

type AudienceSegmentationSetupErrorWidgetErrors =
	| AudienceSegmentationSetupErrorWidgetError
	| AudienceSegmentationSetupErrorWidgetError[];

export interface AudienceSegmentationSetupErrorWidgetProps {
	Widget: ElementType;
	errors: AudienceSegmentationSetupErrorWidgetErrors;
	isAudienceCreationVariant: boolean;
	onRetry: () => void;
	onDismiss: () => void;
}

const AudienceSegmentationSetupErrorWidget: FC<
	AudienceSegmentationSetupErrorWidgetProps
> = ( { Widget, errors, isAudienceCreationVariant, onRetry, onDismiss } ) => {
	const normalizedErrors = Array.isArray( errors ) ? errors : [ errors ];
	const isPermissionsError = isInsufficientPermissionsError(
		normalizedErrors[ 0 ]
	);

	const visitorGroupsDocumentationLinkURL = useSelect(
		( select: Select ) =>
			select( CORE_SITE ).getDocumentationLinkURL( 'visitor-groups' ),
		[]
	);

	let title = '';
	let descriptionText = '';

	if ( isAudienceCreationVariant ) {
		title = __( 'Creating visitor groups failed', 'google-site-kit' );
		descriptionText = isPermissionsError
			? __(
					'It seems that you don’t have the required permissions to create visitor groups. You can contact your administrator and ask for Analytics write permissions and then retry. <a>Learn more</a>',
					'google-site-kit'
			  )
			: __(
					'To create your audience groups we’ll need to update your Analytics property which failed during setup. <a>Learn more</a>',
					'google-site-kit'
			  );
	} else {
		title = __( 'Visitor groups setup failed', 'google-site-kit' );
		descriptionText = isPermissionsError
			? __(
					'It seems that you don’t have the required permissions to set up visitor groups.<br />You can contact your administrator. <a>Learn more</a>',
					'google-site-kit'
			  )
			: __(
					'An error occurred while setting up visitor groups, please try again. <a>Learn more</a>',
					'google-site-kit'
			  );
	}

	const description = createInterpolateElement( descriptionText, {
		a: (
			<Link
				href={ visitorGroupsDocumentationLinkURL }
				external
				hideExternalIndicator
			>
				{ __( 'Learn more', 'google-site-kit' ) }
			</Link>
		),
		br: <br />,
	} ) as ReactNode;

	return (
		<Widget
			className="googlesitekit-audience-segmentation-setup-error-widget"
			noPadding
		>
			<Notice
				type={ NOTICE_TYPES.ERROR }
				title={ title }
				description={ description }
				ctaButton={ {
					label: __( 'Retry', 'google-site-kit' ),
					onClick: onRetry,
				} }
				dismissButton={ {
					label: __( 'No thanks', 'google-site-kit' ),
					onClick: onDismiss,
				} }
			/>
		</Widget>
	);
};

export default AudienceSegmentationSetupErrorWidget;
