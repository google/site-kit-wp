/**
 * FeatureSuccessNotice component.
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
import { FC } from 'react';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { Select, useSelect } from 'googlesitekit-data';
import Notice from '@/js/components/Notice';
import { NOTICE_TYPES } from '@/js/components/Notice/constants';
import { CORE_FEATURE_DISCOVERY } from '@/js/googlesitekit/datastore/feature-discovery/constants';
import type { FeatureSuccessNotice as FeatureSuccessNoticeSettings } from '@/js/googlesitekit/datastore/feature-discovery/types';

interface FeatureSuccessNoticeProps {
	slug: string;
	onDismiss: () => void;
}

const FeatureSuccessNotice: FC< FeatureSuccessNoticeProps > = ( {
	slug,
	onDismiss,
} ) => {
	const successNotice = useSelect(
		( select: Select ): FeatureSuccessNoticeSettings | undefined =>
			select( CORE_FEATURE_DISCOVERY ).getFeature( slug )?.successNotice,
		[ slug ]
	);

	const ctaURL = useSelect(
		( select: Select ) => successNotice?.cta?.getURL?.( select ),
		[ successNotice ]
	);

	if ( ! successNotice ) {
		return null;
	}

	const { title, description, cta, dismissLabel } = successNotice;

	return (
		<Notice
			className="googlesitekit-feature-success-notice"
			type={ NOTICE_TYPES.SUCCESS }
			title={ title }
			description={ description }
			ctaButton={
				cta
					? {
							label: cta.label,
							onClick: cta.onClick,
							href: ctaURL,
							external: cta.external,
					  }
					: undefined
			}
			dismissButton={ {
				label: dismissLabel || __( 'Got it', 'google-site-kit' ),
				onClick: onDismiss,
			} }
		/>
	);
};

export default FeatureSuccessNotice;
