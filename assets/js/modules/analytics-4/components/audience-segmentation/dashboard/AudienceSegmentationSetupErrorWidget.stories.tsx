/**
 * AudienceSegmentationSetupErrorWidget stories.
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
import { withWidgetComponentProps } from '@/js/googlesitekit/widgets/util';
import { MODULE_SLUG_ANALYTICS_4 } from '@/js/modules/analytics-4/constants';
import { Story } from '@/js/types/Story';
import { ERROR_REASON_INSUFFICIENT_PERMISSIONS } from '@/js/util/errors';
import {
	provideModuleRegistrations,
	provideModules,
	provideSiteInfo,
} from '@tests/js/utils';
import WithRegistrySetup from '@tests/js/WithRegistrySetup';
import AudienceSegmentationSetupErrorWidget from './AudienceSegmentationSetupErrorWidget';

const WidgetWithComponentProps = withWidgetComponentProps(
	'analyticsAudienceSegmentationSetupErrorWidget'
)( AudienceSegmentationSetupErrorWidget );

const INSUFFICIENT_PERMISSIONS_ERROR = {
	code: 'test_error',
	message: 'Error message.',
	data: { reason: ERROR_REASON_INSUFFICIENT_PERMISSIONS },
};

const GENERAL_ERROR = {
	code: 'test_error',
	message: 'Error message.',
	data: { status: 500 },
};

interface AudienceSegmentationSetupErrorWidgetStoryProps {
	errors: typeof INSUFFICIENT_PERMISSIONS_ERROR;
	isAudienceCreationVariant: boolean;
	onDismiss: () => void;
}

function setupRegistry( registry: WPDataRegistry ) {
	provideSiteInfo( registry );
	provideModules( registry, [
		{
			slug: MODULE_SLUG_ANALYTICS_4,
			active: true,
			connected: true,
		},
	] );
	provideModuleRegistrations( registry );
}

function Template( {
	errors,
	isAudienceCreationVariant,
	onDismiss,
}: AudienceSegmentationSetupErrorWidgetStoryProps ) {
	return (
		<WithRegistrySetup func={ setupRegistry }>
			<WidgetWithComponentProps
				errors={ errors }
				isAudienceCreationVariant={ isAudienceCreationVariant }
				onRetry={ () => {} }
				onDismiss={ onDismiss }
			/>
		</WithRegistrySetup>
	);
}

export const AudienceCreationPermissionsError = Template.bind(
	{}
) as Story< AudienceSegmentationSetupErrorWidgetStoryProps >;
AudienceCreationPermissionsError.storyName =
	'Audience creation permissions error';
AudienceCreationPermissionsError.args = {
	errors: INSUFFICIENT_PERMISSIONS_ERROR,
	isAudienceCreationVariant: true,
	onDismiss: () => {},
};
AudienceCreationPermissionsError.scenario = {};

export const AudienceCreationGeneralError = Template.bind(
	{}
) as Story< AudienceSegmentationSetupErrorWidgetStoryProps >;
AudienceCreationGeneralError.storyName = 'Audience creation general error';
AudienceCreationGeneralError.args = {
	errors: GENERAL_ERROR,
	isAudienceCreationVariant: true,
	onDismiss: () => {},
};
AudienceCreationGeneralError.scenario = {};

export const VisitorGroupsSetupPermissionsError = Template.bind(
	{}
) as Story< AudienceSegmentationSetupErrorWidgetStoryProps >;
VisitorGroupsSetupPermissionsError.storyName =
	'Visitor groups setup permissions error';
VisitorGroupsSetupPermissionsError.args = {
	errors: INSUFFICIENT_PERMISSIONS_ERROR,
	isAudienceCreationVariant: false,
	onDismiss: () => {},
};
VisitorGroupsSetupPermissionsError.scenario = {};

export const VisitorGroupsSetupGeneralError = Template.bind(
	{}
) as Story< AudienceSegmentationSetupErrorWidgetStoryProps >;
VisitorGroupsSetupGeneralError.storyName = 'Visitor groups setup general error';
VisitorGroupsSetupGeneralError.args = {
	errors: GENERAL_ERROR,
	isAudienceCreationVariant: false,
	onDismiss: () => {},
};
VisitorGroupsSetupGeneralError.scenario = {};

export default {
	title: 'Modules/Analytics4/Components/AudienceSegmentation/Dashboard/AudienceSegmentationSetupErrorWidget',
	component: AudienceSegmentationSetupErrorWidget,
};
