/**
 * GatheringDataNotice Component Stories.
 *
 * Site Kit by Google, Copyright 2022 Google LLC
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
 * Internal dependencies
 */
import GatheringDataNotice, { NOTICE_STYLE } from './GatheringDataNotice';

function Template( args ) {
	return <GatheringDataNotice { ...args } />;
}

export const GatheringDataNoticeUnstyled = Template.bind( {} );
GatheringDataNoticeUnstyled.storyName = 'Unstyled';

export const DefaultGatheringDataNotice = Template.bind( {} );
DefaultGatheringDataNotice.storyName = 'Default';
DefaultGatheringDataNotice.args = {
	style: 'default',
};

export const GatheringDataNoticeOverlay = Template.bind( {} );
GatheringDataNoticeOverlay.storyName = 'Overlay';
GatheringDataNoticeOverlay.args = {
	style: NOTICE_STYLE.OVERLAY,
};

export const GatheringDataNoticeSmall = Template.bind( {} );
GatheringDataNoticeSmall.storyName = 'Small';
GatheringDataNoticeSmall.args = {
	style: NOTICE_STYLE.SMALL,
};

export const GatheringDataNoticeLarge = Template.bind( {} );
GatheringDataNoticeLarge.storyName = 'Large';
GatheringDataNoticeLarge.args = {
	style: NOTICE_STYLE.LARGE,
};

export default {
	title: 'Components/GatheringDataNotice',
	component: GatheringDataNotice,
};
