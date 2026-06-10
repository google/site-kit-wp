/**
 * Site Goals BreakdownSuccessNotice stories.
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
import { WPDataRegistry } from '@wordpress/data/build-types/registry';
import { createInterpolateElement } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Link from '@/js/components/Link';
import { Story } from '@/js/types/Story';
import { provideSiteInfo } from '@tests/js/utils';
import WithRegistrySetup from '@tests/js/WithRegistrySetup';
import BreakdownSuccessNotice from './BreakdownSuccessNotice';

interface BreakdownSuccessNoticeStoryProps {
	title: string;
	description: string;
}

function Template( { title, description }: BreakdownSuccessNoticeStoryProps ) {
	return (
		<WithRegistrySetup
			func={ ( registry: WPDataRegistry ) => provideSiteInfo( registry ) }
		>
			<BreakdownSuccessNotice
				title={ title }
				description={ createInterpolateElement( description, {
					a: <Link href="https://sitekit.withgoogle.com" external />,
				} ) }
				onDismiss={ () => {} }
			/>
		</WithRegistrySetup>
	);
}

export const Ecommerce = Template.bind(
	{}
) as Story< BreakdownSuccessNoticeStoryProps >;
Ecommerce.storyName = 'Ecommerce widget';
Ecommerce.args = {
	title: 'Success! Event breakdown is now active',
	description:
		'Site Kit is now tracking your plugins individually. Because this more precise tracking just started from scratch, your dashboard will show fresh data building up from this moment forward. Individual results will appear soon, with long-term trends following as more data is gathered. <a>Learn more</a>',
};

export const LeadGeneration = Template.bind(
	{}
) as Story< BreakdownSuccessNoticeStoryProps >;
LeadGeneration.storyName = 'Lead generation widget';
LeadGeneration.args = {
	title: 'Success! Individual form tracking is now active',
	description:
		'Site Kit is now tracking data for each of your forms individually. Because this more precise tracking just started from scratch, your dashboard will show fresh data building up from this moment forward. Individual results will appear soon, with long-term trends following as more data is gathered. <a>Learn more</a>',
};

export default {
	title: 'Modules/Analytics4/Components/Site Goals/Notifications/BreakdownSuccessNotice',
	component: BreakdownSuccessNotice,
};
