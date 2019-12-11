<?php
/**
 * Class Google\Site_Kit\Core\Admin\Notice
 *
 * @package   Google\Site_Kit
 * @copyright 2019 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Admin;

/**
 * Class representing a single notice.
 *
 * @since 1.0.0
 * @access private
 * @ignore
 */
final class Notice {

	const TYPE_SUCCESS = 'success';
	const TYPE_INFO    = 'info';
	const TYPE_WARNING = 'warning';
	const TYPE_ERROR   = 'error';

	/**
	 * Unique notice slug.
	 *
	 * @since 1.0.0
	 * @var string
	 */
	private $slug;

	/**
	 * Notice arguments.
	 *
	 * @since 1.0.0
	 * @var array
	 */
	private $args = array();

	/**
	 * Constructor.
	 *
	 * @since 1.0.0
	 *
	 * @param string $slug Unique notice slug.
	 * @param array  $args {
	 *     Associative array of notice arguments.
	 *
	 *     @type string   $content         Required notice content. May contain inline HTML tags.
	 *     @type string   $type            Notice type. Either 'success', 'info', 'warning', 'error'. Default 'info'.
	 *     @type callable $active_callback Callback function to determine whether the notice is active in the
	 *                                     current context. The current admin screen's hook suffix is passed to
	 *                                     the callback. Default is that the notice is active unconditionally.
	 *     @type bool     $dismissible     Whether the notice should be dismissible. Default false.
	 * }
	 */
	public function __construct( $slug, array $args ) {
		$this->slug = $slug;
		$this->args = wp_parse_args(
			$args,
			array(
				'content'         => '',
				'type'            => self::TYPE_INFO,
				'active_callback' => null,
				'dismissible'     => false,
			)
		);
	}

	/**
	 * Gets the notice slug.
	 *
	 * @since 1.0.0
	 *
	 * @return string Unique notice slug.
	 */
	public function get_slug() {
		return $this->slug;
	}

	/**
	 * Checks whether the notice is active.
	 *
	 * This method executes the active callback in order to determine whether the notice should be active or not.
	 *
	 * @since 1.0.0
	 *
	 * @param string $hook_suffix The current admin screen hook suffix.
	 * @return bool True if the notice is active, false otherwise.
	 */
	public function is_active( $hook_suffix ) {
		if ( ! $this->args['content'] ) {
			return false;
		}

		if ( ! $this->args['active_callback'] ) {
			return true;
		}

		return (bool) call_user_func( $this->args['active_callback'], $hook_suffix );
	}

	/**
	 * Renders the notice.
	 *
	 * @since 1.0.0
	 */
	public function render() {
		if ( is_callable( $this->args['content'] ) ) {
			$content = call_user_func( $this->args['content'] );
			if ( empty( $content ) ) {
				return;
			}
		} else {
			$content = '<p>' . wp_kses( $this->args['content'], 'googlesitekit_admin_notice' ) . '</p>';
		}

		$class = 'notice notice-' . $this->args['type'];
		if ( $this->args['dismissible'] ) {
			$class .= ' is-dismissible';
		}

		?>
		<div id="<?php echo esc_attr( 'googlesitekit-notice-' . $this->slug ); ?>" class="<?php echo esc_attr( $class ); ?>">
			<?php echo $content; /* phpcs:ignore WordPress.Security.EscapeOutput */ ?>
		</div>
		<?php
	}
}
