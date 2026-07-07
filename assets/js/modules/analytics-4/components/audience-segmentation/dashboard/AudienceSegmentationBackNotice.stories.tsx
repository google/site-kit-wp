/**
 * AudienceSegmentationBackNotice stories.
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

/**
 * Internal dependencies
 */
import { CORE_UI } from '@/js/googlesitekit/datastore/ui/constants';
import { withWidgetComponentProps } from '@/js/googlesitekit/widgets/util';
import { Story } from '@/js/types/Story';
import WithRegistrySetup from '@tests/js/WithRegistrySetup';
import AudienceSegmentationBackNotice from './AudienceSegmentationBackNotice';
import { AUDIENCE_SELECTION_PANEL_OPENED_KEY } from './AudienceSelectionPanel/constants';

const WidgetWithComponentProps = withWidgetComponentProps(
	'analyticsAudienceSegmentationBackNotice'
)( AudienceSegmentationBackNotice );

interface AudienceSegmentationBackNoticeStoryProps {
	setupRegistry: ( registry: WPDataRegistry ) => void;
}

function Template( {
	setupRegistry,
}: AudienceSegmentationBackNoticeStoryProps ) {
	return (
		<WithRegistrySetup func={ setupRegistry }>
			<WidgetWithComponentProps />
		</WithRegistrySetup>
	);
}

export const Default = Template.bind(
	{}
) as Story< AudienceSegmentationBackNoticeStoryProps >;
Default.storyName = 'Default';
Default.args = {
	setupRegistry: ( registry: WPDataRegistry ) => {
		registry
			.dispatch( CORE_UI )
			.setValue( AUDIENCE_SELECTION_PANEL_OPENED_KEY, false );
	},
};
Default.scenario = {};

export default {
	title: 'Modules/Analytics4/Components/AudienceSegmentation/Dashboard/AudienceSegmentationBackNotice',
	component: AudienceSegmentationBackNotice,
};
