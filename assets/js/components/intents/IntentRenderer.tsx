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

/**
 * Internal dependencies
 */
import { ProgressBar } from 'googlesitekit-components';
import { Select, useSelect } from 'googlesitekit-data';
import Intents from 'googlesitekit-intents';
import DashboardMainApp from '@/js/components/DashboardMainApp';
import Header from '@/js/components/Header';
import HelpMenu from '@/js/components/help/HelpMenu';
import { CORE_INTENTS } from '@/js/googlesitekit/datastore/intents/constants';
import { Intent } from '@/js/googlesitekit/datastore/intents/intents';
import { Cell, Grid, Row } from '@/js/material-components';
import { ErrorObject } from '@/js/util/errors';

interface IntentRendererProps {
	/** Slug of the intent, e.g. `ads-conversion-tracking`. When no component is registered for the slug, the main dashboard renders instead. */
	slug: string;
	/** Code the Site Kit Service created for the intent. */
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
							{ /* The intent component shows the error itself, since what the user should do next differs for each type of intent. */ }
							{ ( intent || intentError ) && (
								<IntentComponent
									slug={ slug }
									intentCode={ intentCode }
									payload={ intent?.payload }
									error={ intentError }
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
