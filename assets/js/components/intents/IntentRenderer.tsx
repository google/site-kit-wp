/**
 * IntentRenderer component.
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
import { Fragment } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { ProgressBar } from 'googlesitekit-components';
import { Select, useSelect } from 'googlesitekit-data';
import Intents from 'googlesitekit-intents';
import DashboardMainApp from '@/js/components/DashboardMainApp';
import Header from '@/js/components/Header';
import HelpMenu from '@/js/components/help/HelpMenu';
import Notice from '@/js/components/Notice';
import { NOTICE_TYPES } from '@/js/components/Notice/constants';
import { CORE_INTENTS } from '@/js/googlesitekit/datastore/intents/constants';
import { Intent } from '@/js/googlesitekit/datastore/intents/intents';
import { CORE_SITE } from '@/js/googlesitekit/datastore/site/constants';
import { Cell, Grid, Row } from '@/js/material-components';
import { ErrorObject } from '@/js/util/errors';

interface IntentRendererProps {
	/** Slug of the intent, which picks the component to render, e.g. `ads-conversion-tracking`. */
	slug: string;
	/** Code that identifies the intent to load from the Site Kit Service. */
	intentCode: string;
}

const IntentRenderer: FC< IntentRendererProps > = ( { slug, intentCode } ) => {
	const IntentComponent = Intents.getRegisteredIntent( slug )?.Component;

	const intent = useSelect(
		( select: Select ) =>
			IntentComponent
				? select( CORE_INTENTS ).getIntent( slug, intentCode )
				: undefined,
		[ IntentComponent, slug, intentCode ]
	) as Intent | undefined;

	const isLoadingIntent = useSelect(
		( select: Select ) =>
			! select( CORE_INTENTS ).hasFinishedResolution( 'getIntent', [
				slug,
				intentCode,
			] ),
		[ slug, intentCode ]
	) as boolean;

	const intentError = useSelect(
		( select: Select ) =>
			select( CORE_INTENTS ).getErrorForSelector( 'getIntent', [
				slug,
				intentCode,
			] ),
		[ slug, intentCode ]
	) as ErrorObject | undefined;

	const dashboardURL = useSelect(
		( select: Select ) =>
			select( CORE_SITE ).getAdminURL( 'googlesitekit-dashboard' ),
		[]
	) as string | undefined;

	if ( ! IntentComponent ) {
		return <DashboardMainApp />;
	}

	return (
		<Fragment>
			<Header>
				<HelpMenu />
			</Header>
			<div className="googlesitekit-page-content">
				<Grid>
					<Row>
						<Cell size={ 12 }>
							{ isLoadingIntent && <ProgressBar /> }
							{ intentError && (
								<Notice
									type={ NOTICE_TYPES.ERROR }
									title={ __(
										'We couldn’t load your request',
										'google-site-kit'
									) }
									description={ __(
										'The link may already have been used, or it may have expired. You can start again from the Google Ads console.',
										'google-site-kit'
									) }
									ctaButton={ {
										label: __(
											'Go to dashboard',
											'google-site-kit'
										),
										href: dashboardURL,
									} }
								/>
							) }
							{ intent && (
								<IntentComponent
									slug={ slug }
									intentCode={ intentCode }
									payload={ intent.payload }
								/>
							) }
						</Cell>
					</Row>
				</Grid>
			</div>
		</Fragment>
	);
};

export default IntentRenderer;
