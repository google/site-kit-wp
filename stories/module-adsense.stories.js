/**
 * AdSense Stories.
 *
 * Site Kit by Google, Copyright 2021 Google LLC
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
import { storiesOf } from '@storybook/react';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Layout from '../assets/js/components/layout/Layout';
import AdSensePerformanceWidget from '../assets/js/modules/adsense/components/dashboard/AdSensePerformanceWidget';
import DashboardZeroData from '../assets/js/modules/adsense/components/dashboard/DashboardZeroData';
import {
	AccountSelect,
	UseSnippetSwitch,
	AdBlockerWarning,
	UserProfile,
	SiteSteps,
} from '../assets/js/modules/adsense/components/common';
import { provideAdSenseMockReport } from '../assets/js/modules/adsense/util/data-mock';
import { WithTestRegistry } from '../tests/js/utils';
import * as fixtures from '../assets/js/modules/adsense/datastore/__fixtures__';
import { STORE_NAME } from '../assets/js/modules/adsense/datastore/constants';
import { CORE_USER } from '../assets/js/googlesitekit/datastore/user/constants';

function SetupWrap( { children } ) {
	return (
		<div className="googlesitekit-setup">
			<section className="googlesitekit-setup__wrapper">
				<div className="googlesitekit-setup-module">
					{ children }
				</div>
			</section>
		</div>
	);
}

storiesOf( 'AdSense Module', module )
	.add( 'Account Select, none selected', () => {
		const accounts = fixtures.accountsMultiple;
		const setupRegistry = ( { dispatch } ) => {
			dispatch( STORE_NAME ).receiveGetAccounts( accounts );
			dispatch( STORE_NAME ).receiveGetSettings( {} );
		};

		return (
			<WithTestRegistry callback={ setupRegistry }>
				<SetupWrap>
					<div className="googlesitekit-setup-module__inputs">
						<AccountSelect />
					</div>
				</SetupWrap>
			</WithTestRegistry>
		);
	} )
	.add( 'Account Select, selected', () => {
		const accounts = fixtures.accountsMultiple;
		const setupRegistry = ( { dispatch } ) => {
			dispatch( STORE_NAME ).receiveGetAccounts( accounts );
			dispatch( STORE_NAME ).receiveGetSettings( {
				accountID: accounts[ 0 ]._id,
			} );
		};

		return (
			<WithTestRegistry callback={ setupRegistry }>
				<SetupWrap>
					<div className="googlesitekit-setup-module__inputs">
						<AccountSelect />
					</div>
				</SetupWrap>
			</WithTestRegistry>
		);
	} )
	.add( 'Use Snippet Switch, toggled on (default)', () => {
		const setupRegistry = ( { dispatch } ) => {
			dispatch( STORE_NAME ).setUseSnippet( true );
		};

		return (
			<WithTestRegistry callback={ setupRegistry }>
				<SetupWrap>
					<div className="googlesitekit-setup-module__inputs">
						<UseSnippetSwitch />
					</div>
				</SetupWrap>
			</WithTestRegistry>
		);
	} )
	.add( 'Use Snippet Switch, toggled off', () => {
		const setupRegistry = ( { dispatch } ) => {
			dispatch( STORE_NAME ).setUseSnippet( false );
		};

		return (
			<WithTestRegistry callback={ setupRegistry }>
				<SetupWrap>
					<div className="googlesitekit-setup-module__inputs">
						<UseSnippetSwitch />
					</div>
				</SetupWrap>
			</WithTestRegistry>
		);
	} )
	.add( 'AdBlocker Warning', () => {
		const setupRegistry = ( { dispatch } ) => {
			dispatch( STORE_NAME ).receiveIsAdBlockerActive( true );
		};

		return (
			<WithTestRegistry callback={ setupRegistry }>
				<SetupWrap>
					<div className="googlesitekit-setup-module__inputs">
						<AdBlockerWarning />
					</div>
				</SetupWrap>
			</WithTestRegistry>
		);
	} )
	.add( 'User Profile', () => {
		const setupRegistry = () => {};

		return (
			<WithTestRegistry callback={ setupRegistry }>
				<SetupWrap>
					<div className="googlesitekit-setup-module__inputs">
						<UserProfile />
					</div>
				</SetupWrap>
			</WithTestRegistry>
		);
	} )
	.add( 'Site Steps', () => {
		const setupRegistry = ( registry ) => {
			registry.dispatch( STORE_NAME ).setAccountID( fixtures.accounts[ 0 ]._id );
		};

		return (
			<WithTestRegistry callback={ setupRegistry }>
				<SetupWrap>
					<SiteSteps />
				</SetupWrap>
			</WithTestRegistry>
		);
	} )
	.add( 'Dashboard Zero Data', () => {
		const setupRegistry = ( registry ) => {
			registry.dispatch( STORE_NAME ).setAccountID( fixtures.accounts[ 0 ]._id );
		};

		return (
			<WithTestRegistry callback={ setupRegistry }>
				<Layout fill>
					<DashboardZeroData />
				</Layout>
			</WithTestRegistry>
		);
	} )
	.add( 'Performance', () => {
		const setupRegistry = ( registry ) => {
			registry.dispatch( CORE_USER ).setReferenceDate( '2021-06-18' );

			const {
				startDate,
				endDate,
				compareStartDate,
				compareEndDate,
			} = registry.select( CORE_USER ).getDateRangeDates( { compare: true } );

			const currentStatsArgs = {
				startDate,
				endDate,
				dimensions: [
					'DATE',
				],
				metrics: [
					'ESTIMATED_EARNINGS',
					'PAGE_VIEWS_RPM',
					'IMPRESSIONS',
					'PAGE_VIEWS_CTR',
				],
			};

			const prevStatsArgs = {
				...currentStatsArgs,
				startDate: compareStartDate,
				endDate: compareEndDate,
			};

			const currentSummaryArgs = {
				startDate,
				endDate,
				metrics: [
					'ESTIMATED_EARNINGS',
					'PAGE_VIEWS_RPM',
					'IMPRESSIONS',
					'PAGE_VIEWS_CTR',
				],
			};

			const prevSummaryArgs = {
				...currentSummaryArgs,
				startDate: compareStartDate,
				endDate: compareEndDate,
			};

			provideAdSenseMockReport( registry, currentStatsArgs );
			provideAdSenseMockReport( registry, prevStatsArgs );
			provideAdSenseMockReport( registry, currentSummaryArgs );
			provideAdSenseMockReport( registry, prevSummaryArgs );
		};

		return (
			<WithTestRegistry callback={ setupRegistry }>
				<Layout
					header
					title={ __( 'Performance over the last 28 days', 'google-site-kit' ) }
					headerCTALabel={ __( 'See full stats in AdSense', 'google-site-kit' ) }
					headerCTALink="#"
				>
					<AdSensePerformanceWidget
						handleDataError={ () => {} }
						handleDataSuccess={ () => {} }
					/>
				</Layout>
			</WithTestRegistry>
		);
	} )
;
