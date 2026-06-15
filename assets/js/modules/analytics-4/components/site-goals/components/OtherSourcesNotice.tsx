/**
 * Site Goals Other sources notice.
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
import { createInterpolateElement } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Link from '@/js/components/Link';
import Typography from '@/js/components/Typography';

interface OtherSourcesNoticeProps {
	learnMoreURL: string;
}

const OtherSourcesNotice: FC< OtherSourcesNoticeProps > = ( {
	learnMoreURL,
} ) => {
	return (
		<Typography
			as="p"
			type="body"
			size="large"
			className="googlesitekit-site-goals-other-sources-notice"
		>
			{ createInterpolateElement(
				__(
					'These events were recorded in your Analytics property, but Site Kit doesn’t track additional data for these events. They are shown here so you can still see your total activity in one place. <a>Learn more</a>',
					'google-site-kit'
				),
				{
					a: (
						<Link
							href={ learnMoreURL }
							external
							hideExternalIndicator
						/>
					),
				}
			) }
		</Typography>
	);
};

export default OtherSourcesNotice;
