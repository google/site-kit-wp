/**
 * Analytics WebDataStreamHint component.
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
import { __ } from '@wordpress/i18n';
import { createInterpolateElement } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Link from '@/js/components/Link';
import StepHint from '@/js/components/setup/StepHint';

export default function WebDataStreamHint() {
	return (
		<StepHint
			leadingText={ __(
				'What is a web data stream?',
				'google-site-kit'
			) }
			tooltipText={ createInterpolateElement(
				__(
					'A data stream is a flow of data from your visitors to Analytics. When a data stream is created, Analytics generates a snippet of code that is added to your site to collect that data. <a>Learn more</a>',
					'google-site-kit'
				),
				{
					a: <Link external hideExternalIndicator />,
				}
			) }
		/>
	);
}
