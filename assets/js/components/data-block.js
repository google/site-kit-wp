/**
 * DataBlock component.
 *
 * Site Kit by Google, Copyright 2019 Google LLC
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

import PropTypes from 'prop-types';
import SourceLink from 'GoogleComponents/source-link';
import SvgIcon from 'GoogleUtil/svg-icon';

const { Component, Fragment } = wp.element;

class DataBlock extends Component {
	constructor( props ) {
		super( props );

		this.handleClick = this.handleClick.bind( this );
		this.handleKeyPress = this.handleKeyPress.bind( this );
	}

	handleClick() {
		const { stat, handleStatSelection } = this.props;
		handleStatSelection( stat );
	}

	handleKeyPress( e ) {
		e.preventDefault();
		const { stat, handleStatSelection } = this.props;
		if ( 'Enter' === e.key || ' ' === e.key ) {
			handleStatSelection( stat );
		}
	}

	render() {
		const {
			className,
			title,
			datapoint,
			datapointUnit,
			change,
			changeDataUnit,
			context,
			period,
			selected,
			handleStatSelection,
			source,
			sparkline,
			reverseArrowDirection
		} = this.props;

		const role = ( 'button' === context ) ? 'button' : '';
		const changeType = 0 <= change ? '-positive' : '-negative';

		return (
			<div
				className={ `
					googlesitekit-data-block
					googlesitekit-data-block--${ context }
					${ selected ? 'googlesitekit-data-block--selected' : '' }
					${ className }
				` }
				tabIndex={ 'button' === context ? '0' : '-1' }
				role={ handleStatSelection && role }
				onClick={ handleStatSelection && this.handleClick }
				onKeyPress={ handleStatSelection && this.handleKeyPress }
				aria-label={ handleStatSelection && title }
				aria-pressed={ handleStatSelection && selected }
			>
				<div className="googlesitekit-data-block__title-datapoint-wrapper">
					<h3 className="
						googlesitekit-subheading-1
						googlesitekit-data-block__title
					">
						{ title }
					</h3>
					<div className="googlesitekit-data-block__datapoint">
						{ `${ datapoint }${ datapointUnit }` }
					</div>
				</div>
				{ sparkline &&
					<div className="googlesitekit-data-block__sparkline">
						{ sparkline }
					</div>
				}
				<div className="googlesitekit-data-block__change-source-wrapper">
					<div className={ `
						googlesitekit-data-block__change
						googlesitekit-data-block__change--${ 0 <= change ? 'positive' : 'negative' }
					` }>
						{ '' === change && <Fragment>&nbsp;</Fragment> }
						{ change && [
							<span key='arrow' className={ `googlesitekit-data-block__arrow ${ reverseArrowDirection ? 'googlesitekit-data-block__arrow--reverse' : '' }` }><SvgIcon id={ `arrow${ changeType }` } height="9" width="9"/></span>,
							<span key='values' className="googlesitekit-data-block__value">{ `${Math.abs( change )}${changeDataUnit} ${period}` }</span>
						] }
					</div>
					{ source && (
						<SourceLink
							className="googlesitekit-data-block__source"
							name={ source.name }
							href={ source.link }
						/>
					) }
				</div>
			</div>
		);
	}
}

DataBlock.propTypes = {
	stat: PropTypes.number,
	onClick: PropTypes.func,
	className: PropTypes.string,
	title: PropTypes.string,
	datapoint: PropTypes.oneOfType( [
		PropTypes.string,
		PropTypes.number,
	] ),
	datapointUnit: PropTypes.string,
	change: PropTypes.oneOfType( [
		PropTypes.string,
		PropTypes.number,
	] ),
	changeDataUnit: PropTypes.string,
	context: PropTypes.string,
	period: PropTypes.string,
	selected: PropTypes.bool,
	handleStatSelection: PropTypes.func,
	reverseArrowDirection: PropTypes.bool,
};

DataBlock.defaultProps = {
	stat: null,
	onClick: null,
	className: '',
	title: '',
	datapoint: null,
	datapointUnit: '',
	change: null,
	changeDataUnit: '',
	context: 'default',
	period: '',
	selected: false,
	handleStatSelection: null,
	reverseArrowDirection: false,
};

export default DataBlock;
