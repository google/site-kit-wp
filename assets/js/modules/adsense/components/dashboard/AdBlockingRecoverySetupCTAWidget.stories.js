/**
 * AdBlockingRecoverySetupCTAWidget component stories.
 *
 * Site Kit by Google, Copyright 2023 Google LLC
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

/**
 * Internal dependencies
 */
import { provideModules } from '../../../../../../tests/js/utils';
import { withWidgetComponentProps } from '../../../../googlesitekit/widgets/util';
import WithRegistrySetup from '../../../../../../tests/js/WithRegistrySetup';
import {
	useBreakpoint,
	BREAKPOINT_SMALL,
} from '../../../../hooks/useBreakpoint';
import AdBlockingRecoverySetupCTAWidget from './AdBlockingRecoverySetupCTAWidget';
import { MODULES_ADSENSE } from '../../datastore/constants';
import { ACCOUNT_STATUS_READY, SITE_STATUS_READY } from '../../util';

const WidgetWithComponentProps = withWidgetComponentProps(
	'adBlockingRecovery'
)( AdBlockingRecoverySetupCTAWidget );

function Template() {
	return <WidgetWithComponentProps />;
}

const validSettings = {
	accountID: 'pub-12345678',
	clientID: 'ca-pub-12345678',
	useSnippet: false,
	accountStatus: ACCOUNT_STATUS_READY,
	siteStatus: SITE_STATUS_READY,
	adBlockingRecoverySetupStatus: '',
};

export const Ready = Template.bind( {} );
Ready.storyName = 'Ready';
Ready.args = {
	setupRegistry: ( registry ) => {
		registry
			.dispatch( MODULES_ADSENSE )
			.receiveGetSettings( validSettings );

		registry
			.dispatch( MODULES_ADSENSE )
			.receiveGetExistingAdBlockingRecoveryTag( null );
	},
};
Ready.scenario = {
	delay: 250,
};

export default {
	title: 'Modules/AdSense/Widgets/AdBlockingRecoverySetupCTAWidget',
	decorators: [
		( Story, { args } ) => {
			const setupRegistry = ( registry ) => {
				provideModules( registry, [
					{
						active: true,
						connected: true,
						slug: 'adsense',
					},
				] );

				args?.setupRegistry( registry );
			};

			const breakpoint = useBreakpoint();

			return (
				<div
					style={ {
						minHeight: '200px',
						display: 'flex',
						alignItems: 'center',
					} }
				>
					<div id="adminmenu">
						{ /* eslint-disable-next-line jsx-a11y/anchor-has-content */ }
						<a href="http://test.test/?page=googlesitekit-settings" />
					</div>
					<div
						style={ { flex: 1 } }
						className={ classnames( {
							// Turn off animations for non-mobile breakpoints. The standard VRT behaviour is to set
							// animation-duration to 0ms, this does not play well with this component as there is a
							// continual chain of animation at non-mobile breakpoints.
							'googlesitekit-vrt-animation-none':
								breakpoint !== BREAKPOINT_SMALL,
						} ) }
					>
						<WithRegistrySetup func={ setupRegistry }>
							<Story />
						</WithRegistrySetup>
					</div>
				</div>
			);
		},
	],
};
