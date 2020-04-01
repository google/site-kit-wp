/**
 * External dependencies
 */
import PropTypes from 'prop-types';
import classnames from 'classnames';

function ChangeArrow( { direction, invertColor } ) {
	return (
		<svg
			className={ classnames(
				'googlesitekit-change-arrow',
				`googlesitekit-change-arrow--${ direction }`,
				{ 'googlesitekit-change-arrow--inverted-color': invertColor }
			) }
			width="9"
			height="9"
			viewBox="0 0 10 10"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
		>
			<path
				d="M5.625 10L5.625 2.375L9.125 5.875L10 5L5 -1.76555e-07L-2.7055e-07 5L0.875 5.875L4.375 2.375L4.375 10L5.625 10Z"
				fill="currentColor"
			/>
		</svg>
	);
}

ChangeArrow.propTypes = {
	direction: PropTypes.string,
	invertColor: PropTypes.bool,
};

ChangeArrow.defaultProps = {
	direction: 'up',
	invertColor: false,
};

export default ChangeArrow;
