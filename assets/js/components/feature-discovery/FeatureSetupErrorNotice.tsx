/**
 * FeatureSetupErrorNotice component.
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
import { Fragment } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { Select, useSelect } from 'googlesitekit-data';
import Link from '@/js/components/Link';
import Notice from '@/js/components/Notice';
import { NOTICE_TYPES } from '@/js/components/Notice/constants';
import { CORE_FEATURE_DISCOVERY } from '@/js/googlesitekit/datastore/feature-discovery/constants';
import { CORE_SITE } from '@/js/googlesitekit/datastore/site/constants';
import { sanitizeHTML } from '@/js/util';
import {
	ErrorObject,
	getErrorNoticeMessage,
	isInsufficientPermissionsError,
	isRetryableErrorType,
} from '@/js/util/errors';

const sanitizeArgs = {
	ALLOWED_TAGS: [ 'a' ],
	ALLOWED_ATTR: [ 'href' ],
};

interface FeatureSetupErrorNoticeProps {
	slug: string;
	error: ErrorObject;
	onRetry: () => void;
	onDismiss: () => void;
	isRetrying?: boolean;
}

const FeatureSetupErrorNotice: FC< FeatureSetupErrorNoticeProps > = ( {
	slug,
	error,
	onRetry,
	onDismiss,
	isRetrying = false,
} ) => {
	const featureTitle = useSelect(
		( select: Select ) => {
			const feature = select( CORE_FEATURE_DISCOVERY ).getFeature( slug );

			return feature?.name || feature?.title;
		},
		[ slug ]
	);

	const errorTroubleshootingLinkURL = useSelect(
		( select: Select ) =>
			select( CORE_SITE ).getErrorTroubleshootingLinkURL( error ),
		[ error ]
	);

	if ( ! featureTitle ) {
		return null;
	}

	let description = '';
	let learnMoreURL: string | undefined;

	if ( isInsufficientPermissionsError( error ) ) {
		description = errorTroubleshootingLinkURL
			? sprintf(
					/* translators: %s: Troubleshooting URL. */
					__(
						'The settings could not be configured due to insufficient permissions. To fix this, contact your administrator or <a href="%s">get help</a>.',
						'google-site-kit'
					),
					errorTroubleshootingLinkURL
			  )
			: __(
					'The settings could not be configured due to insufficient permissions. To fix this, contact your administrator.',
					'google-site-kit'
			  );
	} else {
		description = getErrorNoticeMessage( error.message, error, {
			noPrefix: true,
			skipRetryMessage: true,
		} );

		learnMoreURL = errorTroubleshootingLinkURL;
	}

	let renderedDescription: ReactNode = (
		<span
			dangerouslySetInnerHTML={ sanitizeHTML(
				description,
				sanitizeArgs
			) }
		/>
	);

	if ( learnMoreURL ) {
		renderedDescription = (
			<Fragment>
				{ renderedDescription }{ ' ' }
				<Link href={ learnMoreURL } external>
					{ __( 'Learn more', 'google-site-kit' ) }
				</Link>
			</Fragment>
		);
	}

	return (
		<Notice
			className="googlesitekit-feature-setup-error-notice"
			type={ NOTICE_TYPES.ERROR }
			title={ sprintf(
				/* translators: %s: Feature title. */
				__( '%s setup failed', 'google-site-kit' ),
				featureTitle
			) }
			description={ renderedDescription }
			ctaButton={
				isRetryableErrorType( error )
					? {
							label: __( 'Retry', 'google-site-kit' ),
							onClick: onRetry,
							inProgress: isRetrying,
					  }
					: undefined
			}
			dismissButton={ {
				label: __( 'Got it', 'google-site-kit' ),
				onClick: onDismiss,
			} }
		/>
	);
};

export default FeatureSetupErrorNotice;
