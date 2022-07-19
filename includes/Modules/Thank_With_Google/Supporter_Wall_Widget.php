<?php
/**
 * Class Google\Site_Kit\Modules\Thank_With_Google\Supporter_Wall_Widget
 *
 * @package   Google\Site_Kit\Modules\Thank_With_Google
 * @copyright 2022 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Modules\Thank_With_Google;

use WP_Widget;

/**
 * The supporter wall widget for Thank with Google.
 *
 * @since n.e.x.t
 * @access private
 * @ignore
 */
class Supporter_Wall_Widget extends WP_Widget {

	const WIDGET_ID = 'googlesitekit-twg-supporter-wall';

	/**
	 * Constructor.
	 *
	 * @since n.e.x.t
	 */
	public function __construct() {
		parent::__construct(
			self::WIDGET_ID,
			sprintf( 'Thank with Google: %s', __( 'Supporter Wall', 'google-site-kit' ) )
		);
	}

	/**
	 * Renders the widget form.
	 *
	 * @since n.e.x.t
	 *
	 * @param array $instance The widget instance.
	 */
	public function form( $instance ) {
		$title    = ! empty( $instance['title'] ) ? $instance['title'] : '';
		$title_id = $this->get_field_id( 'title' );

		echo '<p>';
			echo '<label for="', esc_attr( $title_id ), '">';
				esc_html_e( 'Title:', 'google-site-kit' );
			echo '</label>';
			printf(
				'<input type="text" id="%s" class="widefat" name="%s" value="%s">',
				esc_attr( $title_id ),
				esc_attr( $this->get_field_name( 'title' ) ),
				esc_attr( $title )
			);
		echo '</p>';
	}

	/**
	 * Updates the widget settings.
	 *
	 * @since n.e.x.t
	 *
	 * @param array $new_instance The array with new settings for the widget.
	 * @param array $old_instance The array with old settings for the widget.
	 * @return array New settings widgets.
	 */
	public function update( $new_instance, $old_instance ) {
		$instance = array();

		$instance['title'] = ! empty( $new_instance['title'] )
			? sanitize_text_field( $new_instance['title'] )
			: '';

		return $instance;
	}

	/**
	 * Displays the widget.
	 *
	 * @since n.e.x.t
	 *
	 * @param array $args The widget arguments.
	 * @param array $instance The widget settings.
	 */
	public function widget( $args, $instance ) {
		echo $args['before_widget']; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped

		if ( ! empty( $instance['title'] ) ) {
			echo $args['before_title'], apply_filters( 'widget_title', $instance['title'] ), $args['after_title'];  // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
		}

		echo '<div twg-thank-wall style="width:100%;height:490px;min-height:150px;overflow:hidden;border:1px solid #e3e3e3;border-radius:15px;margin:20px 0"></div>';

		echo $args['after_widget'];  // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
	}

}
