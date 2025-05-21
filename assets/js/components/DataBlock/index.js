/**
 * DataBlock component.
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
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { useCallback } from '@wordpress/element';

/**
 * Internal dependencies
 */
import GatheringDataNotice, { NOTICE_STYLE } from '../GatheringDataNotice';
import Content from './Content';

function DataBlock( {
	stat = null,
	className = '',
	title = '',
	datapoint = null,
	datapointUnit = '',
	change = null,
	changeDataUnit = '',
	context = 'default',
	period = '',
	selected = false,
	source,
	sparkline,
	handleStatSelection = null,
	invertChangeColor = false,
	gatheringData = false,
	gatheringDataNoticeStyle = NOTICE_STYLE.DEFAULT,
	badge,
} ) {
	const handleClick = useCallback( () => {
		if ( ! gatheringData && handleStatSelection ) {
			handleStatSelection( stat );
		}
	}, [ gatheringData, handleStatSelection, stat ] );

	const handleKeyDown = useCallback(
		( e ) => {
			if ( 'Enter' === e.key || ' ' === e.key ) {
				e.preventDefault();
				handleClick();
			}
		},
		[ handleClick ]
	);

	const isButtonContext = 'button' === context;
	const role = isButtonContext ? 'button' : '';

	return (
		<div
			className={ classnames(
				'googlesitekit-data-block',
				className,
				`googlesitekit-data-block--${ context }`,
				{
					'googlesitekit-data-block--selected': selected,
					'googlesitekit-data-block--is-gathering-data':
						gatheringData,
				}
			) }
			tabIndex={ isButtonContext && ! gatheringData ? '0' : '-1' }
			role={ handleStatSelection && role }
			onClick={ handleClick }
			onKeyDown={ handleKeyDown }
			aria-disabled={ gatheringData || undefined }
			aria-label={ handleStatSelection && title }
			aria-pressed={ handleStatSelection && selected }
		>
			<Content
				title={ title }
				datapoint={ datapoint }
				datapointUnit={ datapointUnit }
				change={ change }
				changeDataUnit={ changeDataUnit }
				period={ period }
				source={ source }
				sparkline={ sparkline }
				invertChangeColor={ invertChangeColor }
				gatheringData={ gatheringData }
				badge={ badge }
			/>
			{ gatheringData && (
				<GatheringDataNotice style={ gatheringDataNoticeStyle } />
			) }
		</div>
	);
}

DataBlock.propTypes = {
	stat: PropTypes.number,
	className: PropTypes.string,
	title: PropTypes.string,
	datapoint: PropTypes.oneOfType( [ PropTypes.string, PropTypes.number ] ),
	datapointUnit: PropTypes.string,
	change: PropTypes.oneOfType( [ PropTypes.string, PropTypes.number ] ),
	changeDataUnit: PropTypes.oneOfType( [ PropTypes.string, PropTypes.bool ] ),
	context: PropTypes.string,
	period: PropTypes.string,
	selected: PropTypes.bool,
	source: PropTypes.object,
	sparkline: PropTypes.element,
	handleStatSelection: PropTypes.func,
	invertChangeColor: PropTypes.bool,
	gatheringData: PropTypes.bool,
	gatheringDataNoticeStyle: PropTypes.oneOf( Object.values( NOTICE_STYLE ) ),
	badge: PropTypes.oneOfType( [ PropTypes.bool, PropTypes.node ] ),
};

export default DataBlock;
