/**
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
import classnames from 'classnames';
import { FC, ReactNode } from 'react';

/**
 * Internal dependencies
 */
import Typography from '@/js/components/Typography';
import { SIZE_MEDIUM, TYPE_TITLE } from '@/js/components/Typography/constants';

interface AdsConversionTrackingIntentStepProps {
	/** Title of the step. */
	title: string;
	/** Whether the step can be acted on, which fills its marker. */
	isActive: boolean;
	/** Content shown under the title. */
	children: ReactNode;
}

const AdsConversionTrackingIntentStep: FC<
	AdsConversionTrackingIntentStepProps
> = ( { title, isActive, children } ) => (
	<li
		className={ classnames(
			'googlesitekit-ads-conversion-tracking-intent__step',
			{
				'googlesitekit-ads-conversion-tracking-intent__step--active':
					isActive,
			}
		) }
	>
		<span className="googlesitekit-ads-conversion-tracking-intent__step-marker" />
		<div className="googlesitekit-ads-conversion-tracking-intent__step-content">
			<Typography
				as="h2"
				className="googlesitekit-ads-conversion-tracking-intent__step-title"
				size={ SIZE_MEDIUM }
				type={ TYPE_TITLE }
			>
				{ title }
			</Typography>
			{ children }
		</div>
	</li>
);

export default AdsConversionTrackingIntentStep;
