/**
 * ConnectGA4CTATileWidget component.
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
 * Internal dependencies
 */
import ConnectModuleCTATile from '../../../../components/KeyMetrics/ConnectModuleCTATile';
import useWidgetStateEffect from '../../../../googlesitekit/widgets/hooks/useWidgetStateEffect';

// Note: `analytics` is used as the slug here since GA4 "depends" on it.
const metadata = { moduleSlug: 'analytics' };

export default function ConnectGA4CTATileWidget( { Widget, widgetSlug } ) {
	useWidgetStateEffect( widgetSlug, ConnectModuleCTATile, metadata );

	// Note that we need to render the `Widget` component as a wrapper here so this component will display
	// correctly when used as a `FallbackComponent` for the `whenActive` HOC. Conversely, when `ConnectModuleCTATile`
	// is rendered as an `OverrideComponent` in `WidgetRenderer` (as a result of multiple adjacent widgets rendering
	// this component and thus sharing the same state), it is wrapped with a `Widget` component - the net
	// result being the ConnectModuleCTATile is correctly wrapped in a `Widget` in both cases.
	return (
		<Widget>
			<ConnectModuleCTATile { ...metadata } />
		</Widget>
	);
}

ConnectGA4CTATileWidget.propTypes = {
	Widget: PropTypes.elementType.isRequired,
	widgetSlug: PropTypes.string.isRequired,
};
