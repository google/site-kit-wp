/**
 * Typical Traffic chart header.
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
import InfoTooltip from '@/js/components/InfoTooltip';
import Link from '@/js/components/Link';
import Typography from '@/js/components/Typography';
import { SIZE_MEDIUM, TYPE_TITLE } from '@/js/components/Typography/constants';

const TypicalTrafficChartHeader: FC = () => {
	return (
		<div className="googlesitekit-traffic-overview__typical-traffic-chart-header">
			<Typography as="h3" type={ TYPE_TITLE } size={ SIZE_MEDIUM }>
				{ __(
					'Your traffic compared to your expected range',
					'google-site-kit'
				) }
			</Typography>
			<InfoTooltip
				title={ createInterpolateElement(
					__(
						'Site Kit analyzes the last 18 months of your traffic history to estimate a typical range, so you can see when visits are higher or lower than expected. <a>Learn more</a>',
						'google-site-kit'
					),
					{
						// TODO: #13875 -- Point the link at the chart's support page.
						a: <Link href="#" external hideExternalIndicator />,
					}
				) }
				tooltipClassName="googlesitekit-info-tooltip__content--typical-traffic"
			/>
		</div>
	);
};

export default TypicalTrafficChartHeader;
