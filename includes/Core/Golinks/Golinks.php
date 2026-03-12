<?php
/**
 * Class Google\Site_Kit\Core\Golinks\Golinks
 *
 * @package   Google\Site_Kit\Core\Golinks
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Golinks;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Permissions\Permissions;
use InvalidArgumentException;
use WP_Error;

/**
 * Class for handling Site Kit golinks.
 *
 * @since 1.174.0
 * @access private
 * @ignore
 */
class Golinks {

	/**
	 * Action name for handling golinks.
	 *
	 * @since 1.174.0
	 */
	const ACTION_GO = 'googlesitekit_go';

	/**
	 * Plugin context.
	 *
	 * @since 1.174.0
	 * @var Context
	 */
	private $context;

	/**
	 * Registered golink handlers keyed by golink key.
	 *
	 * @since 1.174.0
	 * @var array<string, Golink_Handler_Interface>
	 */
	private $handlers = array();

	/**
	 * Constructor.
	 *
	 * @since 1.174.0
	 *
	 * @param Context $context Plugin context.
	 */
	public function __construct( Context $context ) {
		$this->context = $context;
	}

	/**
	 * Registers functionality through WordPress hooks.
	 *
	 * @since 1.174.0
	 */
	public function register() {
		add_action( 'admin_action_' . self::ACTION_GO, array( $this, 'handle_go' ) );
	}

	/**
	 * Registers a handler for a golink key.
	 *
	 * @since 1.174.0
	 *
	 * @param string                   $key     Golink key.
	 * @param Golink_Handler_Interface $handler Handler instance.
	 * @throws InvalidArgumentException Thrown if a handler is already registered for the key.
	 */
	public function register_handler( string $key, Golink_Handler_Interface $handler ) {
		$key = sanitize_key( $key );

		if ( isset( $this->handlers[ $key ] ) ) {
			throw new InvalidArgumentException( sprintf( 'A handler is already registered for golink key "%s".', $key ) );
		}

		$this->handlers[ $key ] = $handler;
	}

	/**
	 * Gets a golink URL for a registered key.
	 *
	 * @since 1.174.0
	 *
	 * @param string $key Golink key.
	 * @return string|null Golink URL if registered, otherwise null.
	 */
	public function get_url( $key ) {
		$key = sanitize_key( (string) $key );

		return add_query_arg(
			array(
				'action' => self::ACTION_GO,
				'to'     => $key,
			),
			$this->get_action_url()
		);
	}

	/**
	 * Handles a golink redirect action.
	 *
	 * @since 1.174.0
	 */
	public function handle_go() {
		$key = sanitize_key( (string) $this->context->input()->filter( INPUT_GET, 'to', FILTER_DEFAULT ) );

		if ( empty( $this->handlers[ $key ] ) ) {
			$this->handle_destination_error( $this->get_invalid_golink_error() );
			exit;
		}

		$destination = $this->handlers[ $key ]->handle( $this->context );

		if ( is_wp_error( $destination ) ) {
			$this->handle_destination_error( $destination );
			exit;
		}

		wp_safe_redirect( $destination );
		exit;
	}

	/**
	 * Handles a handler error by displaying a wp_die screen.
	 *
	 * @since 1.174.0
	 *
	 * @param WP_Error $error Handler error.
	 */
	private function handle_destination_error( WP_Error $error ) {
		$status = 500;
		$data   = $error->get_error_data();
		$args   = array();

		if ( ! empty( $data['status'] ) ) {
			$status = (int) $data['status'];
		}

		if ( ! empty( $data['link_url'] ) ) {
			$args['link_url'] = esc_url_raw( $data['link_url'] );
		}

		if ( ! empty( $data['link_text'] ) ) {
			$args['link_text'] = esc_html( $data['link_text'] );
		}

		$args['response'] = absint( $status );
		$message          = $error->get_error_message();

		if ( '' === $message ) {
			$message = __( 'Something went wrong.', 'google-site-kit' );
		}

		wp_die( esc_html( $message ), '', $args ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- wp_die args are sanitized above.
	}

	/**
	 * Gets the URL used for handling golink actions.
	 *
	 * @since 1.174.0
	 *
	 * @return string Action URL.
	 */
	private function get_action_url() {
		if ( $this->context->is_network_mode() ) {
			return network_admin_url( 'index.php' );
		}

		return admin_url( 'index.php' );
	}

	/**
	 * Gets invalid golink error.
	 *
	 * @since 1.174.0
	 *
	 * @return WP_Error Invalid golink error.
	 */
	private function get_invalid_golink_error() {
		if ( current_user_can( Permissions::VIEW_DASHBOARD ) ) {
			$link_url  = $this->context->admin_url( 'dashboard' );
			$link_text = __( 'Site Kit dashboard', 'google-site-kit' );
		} else {
			$link_url  = $this->context->admin_url( 'splash' );
			$link_text = __( 'Site Kit setup page', 'google-site-kit' );
		}

		return new WP_Error(
			'googlesitekit_invalid_golink',
			__( 'The link you followed is invalid.', 'google-site-kit' ),
			array(
				'status'    => 404,
				'link_url'  => $link_url,
				'link_text' => $link_text,
			)
		);
	}
}
