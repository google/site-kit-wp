/**
 * KeyMetricsSetupCTAWidget component.
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
import PropTypes from 'prop-types';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { Button } from 'googlesitekit-components';
import { Cell, Grid, Row } from '../../material-components';
import GhostCardsSVG from './GhostCardsSVG';
import { CORE_MODULES } from '../../googlesitekit/modules/datastore/constants';
import { CORE_USER } from '../../googlesitekit/datastore/user/constants';
import { useFeature } from '../../hooks/useFeature';
import Link from '../Link';
import { CORE_SITE } from '../../googlesitekit/datastore/site/constants';
import { BREAKPOINT_SMALL, useBreakpoint } from '../../hooks/useBreakpoint';
const { useSelect } = Data;

function KeyMetricsSetupCTAWidget( { Widget, WidgetNull } ) {
	const userInputEnabled = useFeature( 'userInput' );

	const isUserInputCompleted = useSelect( ( select ) =>
		select( CORE_USER ).isUserInputCompleted()
	);
	const searchConsoleModuleConnected = useSelect( ( select ) =>
		select( CORE_MODULES ).isModuleConnected( 'search-console' )
	);
	const analyticsModuleConnected = useSelect( ( select ) =>
		select( CORE_MODULES ).isModuleConnected( 'analytics-4' )
	);
	const ctaLink = useSelect( ( select ) =>
		select( CORE_SITE ).getAdminURL( 'googlesitekit-user-input' )
	);

	const breakpoint = useBreakpoint();
	const mobileBreakpoint = breakpoint === BREAKPOINT_SMALL;

	if (
		! userInputEnabled ||
		isUserInputCompleted === undefined ||
		isUserInputCompleted ||
		! analyticsModuleConnected ||
		! searchConsoleModuleConnected
	) {
		return <WidgetNull />;
	}

	const Footer = () => {
		return (
			<Row>
				<Cell size={ 12 }>
					<Link href="#">
						{ __( 'Maybe later', 'google-site-kit' ) }
					</Link>
				</Cell>
			</Row>
		);
	};

	return (
		<Widget noPadding Footer={ Footer }>
			<section className="googlesitekit-plugin googlesitekit-setup__wrapper">
				<Grid>
					<Row>
						<Cell smSize={ 6 } mdSize={ 5 } lgSize={ 6 }>
							<h3 className="googlesitekit-publisher-win__title">
								{ __(
									'Get metrics and suggestions tailored to your specific goals',
									'google-site-kit'
								) }
							</h3>
							{ mobileBreakpoint && <GhostCardsSVG /> }
							<p>
								{ __(
									'Answer 3 questions to show relevant stats for your site',
									'google-site-kit'
								) }
							</p>
							<div className="googlesitekit-widget-km-actions__wrapper">
								<Button href={ ctaLink }>
									{ __(
										'Get tailored metrics',
										'google-site-kit'
									) }
								</Button>
								<Link href="#">
									{ __(
										'I’ll pick metrics myself',
										'google-site-kit'
									) }
								</Link>
							</div>
						</Cell>
						{ ! mobileBreakpoint && (
							<Cell smSize={ 6 } mdSize={ 3 } lgSize={ 6 }>
								<GhostCardsSVG />
							</Cell>
						) }
					</Row>
				</Grid>
			</section>
		</Widget>
	);
}

KeyMetricsSetupCTAWidget.propTypes = {
	Widget: PropTypes.elementType.isRequired,
	WidgetNull: PropTypes.elementType,
};

export default KeyMetricsSetupCTAWidget;
