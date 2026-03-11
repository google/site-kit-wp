/**
 * OptIn component.
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
import PropTypes from 'prop-types';
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import {
	useCallback,
	useEffect,
	useState,
	createInterpolateElement,
	Fragment,
} from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { useSelect, useDispatch } from 'googlesitekit-data';
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import { toggleTracking, trackEvent } from '@/js/util/tracking';
import Link from '@/js/components/Link';
import useViewContext from '@/js/hooks/useViewContext';
import { useDebounce } from '@/js/hooks/useDebounce';
import LayoutDefault from './LayoutDefault';
import LayoutStacked from './LayoutStacked';

const DEFAULT_LAYOUT = 'default';
const STACKED_LAYOUT = 'stacked';

export default function OptIn( {
	id = 'googlesitekit-opt-in',
	name = 'optIn',
	className,
	layout = DEFAULT_LAYOUT,
	title = null,
	description = null,
	trackEventCategory,
	trackEventAction = 'tracking_optin',
} ) {
	const [ checked, setChecked ] = useState();

	const enabled = useSelect( ( select ) =>
		select( CORE_USER ).isTrackingEnabled()
	);
	const error = useSelect( ( select ) =>
		select( CORE_USER ).getErrorForAction( 'setTrackingEnabled', [
			! enabled,
		] )
	);

	const { setTrackingEnabled } = useDispatch( CORE_USER );
	const viewContext = useViewContext();

	const handleOptIn = useCallback(
		async ( isChecked ) => {
			const { response, error: responseError } = await setTrackingEnabled(
				isChecked
			);

			if ( ! responseError ) {
				toggleTracking( response.enabled );
				if ( response.enabled ) {
					trackEvent(
						trackEventCategory || viewContext,
						trackEventAction
					);
				}
			} else {
				setChecked( enabled );
			}
		},
		[
			enabled,
			setTrackingEnabled,
			trackEventCategory,
			trackEventAction,
			viewContext,
		]
	);

	useEffect( () => {
		if ( enabled !== undefined && checked === undefined ) {
			setChecked( enabled );
		}
	}, [ enabled, checked ] );

	const debouncedHandleOptIn = useDebounce( handleOptIn, 300 );

	const handleCheck = useCallback(
		( e ) => {
			const isChecked = e.target.checked;
			setChecked( isChecked );
			debouncedHandleOptIn( isChecked );
		},
		[ debouncedHandleOptIn ]
	);

	const labelTitle = title ?? (
		<span>
			{ __(
				'Help us improve Site Kit by sharing anonymous usage data.',
				'google-site-kit'
			) }
		</span>
	);
	const labelDescription =
		description ??
		createInterpolateElement(
			__(
				'<span>All collected data is treated in accordance with the <a>Google Privacy Policy</a></span>',
				'google-site-kit'
			),
			{
				a: (
					<Link
						key="link"
						href="https://policies.google.com/privacy"
						external
					/>
				),
				span: <span />,
			}
		);

	const checkboxProps = {
		id,
		name,
		value: '1',
		checked,
		onChange: handleCheck,
		loading: enabled === undefined,
	};

	return (
		<div
			className={ classnames(
				'googlesitekit-opt-in',
				className,
				layout === STACKED_LAYOUT &&
					'googlesitekit-opt-in--layout-stacked'
			) }
		>
			{ layout === STACKED_LAYOUT ? (
				<LayoutStacked
					checkboxProps={ checkboxProps }
					title={ labelTitle }
					description={ labelDescription }
				/>
			) : (
				<LayoutDefault
					checkboxProps={ checkboxProps }
					label={
						<Fragment>
							{ labelTitle } { labelDescription }
						</Fragment>
					}
				/>
			) }

			{ error?.message && (
				<div className="googlesitekit-error-text">
					{ error?.message }
				</div>
			) }
		</div>
	);
}

OptIn.propTypes = {
	id: PropTypes.string,
	name: PropTypes.string,
	className: PropTypes.string,
	title: PropTypes.node,
	description: PropTypes.node,
	layout: PropTypes.oneOf( [ DEFAULT_LAYOUT, STACKED_LAYOUT ] ),
	trackEventCategory: PropTypes.string,
};
