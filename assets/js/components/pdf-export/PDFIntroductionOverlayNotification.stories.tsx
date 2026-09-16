/**
 * PDFIntroductionOverlayNotification component stories.
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
 * Internal dependencies
 */
import { PDF_INTRODUCTION_OVERLAY_NOTIFICATION } from '@/js/components/pdf-export/constants';
import { withNotificationComponentProps } from '@/js/googlesitekit/notifications/util/component-props';
import DownloadIcon from '@/svg/icons/download.svg';
import PDFIntroductionOverlayNotification from './PDFIntroductionOverlayNotification';

const NotificationWithComponentProps = withNotificationComponentProps(
	PDF_INTRODUCTION_OVERLAY_NOTIFICATION
)( PDFIntroductionOverlayNotification );

function Template() {
	return (
		<div>
			<div style={ { display: 'flex', justifyContent: 'flex-end' } }>
				<button
					aria-label="Download PDF report"
					className="googlesitekit-pdf-download__button googlesitekit-border-radius-round googlesitekit-button-icon"
				>
					<DownloadIcon width={ 20 } height={ 20 } />
				</button>
			</div>
			<NotificationWithComponentProps />
		</div>
	);
}

export const Default = Template.bind( {} );
Default.storyName = 'PDFIntroductionOverlayNotification';
Default.scenario = {};

export default {
	title: 'Components/PDFIntroductionOverlayNotification',
};
