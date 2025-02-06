/**
 * WidgetAreaHeader component.
 *
 * Site Kit by Google, Copyright 2024 Google LLC
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
import { Fragment } from '@wordpress/element';

/**
 * Internal dependencies
 */
import WidgetNewBadge from './WidgetNewBadge';
import { useWindowWidth } from '../../../hooks/useWindowSize';

export default function WidgetAreaHeader( {
	slug,
	Icon = false,
	title = '',
	subtitle = '',
	CTA,
} ) {
	const windowWidth = useWindowWidth();

	const ctaWithLargeWindow = CTA && windowWidth >= 783;

	const Subtitle = typeof subtitle === 'function' ? subtitle : undefined;

	return (
		<Fragment>
			{ Icon && <Icon width={ 33 } height={ 33 } /> }

			{ title && (
				<h3 className="googlesitekit-widget-area-header__title googlesitekit-heading-3">
					{ title }
					<WidgetNewBadge slug={ slug } />
				</h3>
			) }

			{ ( subtitle || CTA ) && (
				<div className="googlesitekit-widget-area-header__details">
					{ subtitle && (
						<h4 className="googlesitekit-widget-area-header__subtitle">
							{ Subtitle && <Subtitle /> }
							{ ! Subtitle && subtitle }
							{ ! title && <WidgetNewBadge slug={ slug } /> }
						</h4>
					) }

					{ ctaWithLargeWindow && (
						<div className="googlesitekit-widget-area-header__cta">
							<CTA />
						</div>
					) }
				</div>
			) }
		</Fragment>
	);
}

WidgetAreaHeader.propTypes = {
	slug: PropTypes.string.isRequired,
	Icon: PropTypes.bool,
	title: PropTypes.oneOfType( [ PropTypes.string, PropTypes.element ] ),
	subtitle: PropTypes.oneOfType( [
		PropTypes.string,
		PropTypes.elementType,
	] ),
	CTA: PropTypes.elementType,
};
