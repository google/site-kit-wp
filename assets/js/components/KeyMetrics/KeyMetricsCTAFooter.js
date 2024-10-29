/**
 * KeyMetricsCTAFooter component.
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
import { Cell, Row } from '../../material-components';
import Link from '../Link';

export default function KeyMetricsCTAFooter( {
	onActionClick = () => {},
	showDismiss,
} ) {
	return (
		<Row className="googlesitekit-widget-key-metrics-footer">
			<Cell
				size={ 12 }
				className="googlesitekit-widget-key-metrics-footer__cta-wrapper"
			>
				{ ! showDismiss && (
					<p>
						{ __(
							'Intereseted in specific metrics?',
							'google-site-kit'
						) }
					</p>
				) }
				<Link onClick={ onActionClick }>
					{ showDismiss
						? __( 'Maybe later', 'google-site-kit' )
						: __( 'Select your own metrics', 'google-site-kit' ) }
				</Link>
			</Cell>
		</Row>
	);
}

KeyMetricsCTAFooter.propTypes = {
	onActionClick: PropTypes.func,
};
