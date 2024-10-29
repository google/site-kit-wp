<?php
/**
 * Class Google\Site_Kit\Modules\Sign_In_With_Google
 *
 * @package   Google\Site_Kit\Modules\Sign_In_With_Google
 * @copyright 2024 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Modules\Sign_In_With_Google;

use Google\Site_Kit\Context;
use WP_Error;

/**
 * Class for validating the Google auth request.
 *
 * @since n.e.x.t
 * @access private
 * @ignore
 */
class Validate_Auth_Request {

	/**
	 * Context instance.
	 *
	 * @since n.e.x.t
	 * @var Context
	 */
	protected $context;

	/**
	 * WP_Error instance.
	 *
	 * @since n.e.x.t
	 * @var WP_Error
	 */
	protected $error;

	/**
	 * Constructor.
	 *
	 * @since n.e.x.t
	 *
	 * @param Context $context Context instance.
	 */
	public function __construct( Context $context ) {
		$this->context = $context;
	}

	/**
	 * Error getter.
	 *
	 * @since n.e.x.t
	 */
	public function get_error() {
		return $this->error;
	}

	/**
	 * Invoke all validation methods.
	 *
	 * @since n.e.x.t
	 */
	public function run_validations() {
		$this->validate_csrf_token();
		$this->validate_id_token_is_present();
		$this->validate_request_method();
	}

	/**
	 * Validate that request method is POST.
	 *
	 * @since n.e.x.t
	 */
	protected function validate_request_method() {
		$request_method = $this->context->input()->filter( INPUT_SERVER, 'REQUEST_METHOD' );

		if ( 'POST' !== $request_method ) {
			$this->error = new WP_Error(
				'google_auth_bad_request_method',
				__( 'Bad request method.', 'google-site-kit' ),
				array( 'status' => 400 )
			);
		}
	}

	/**
	 * Validate csrf token from cookie and request.
	 *
	 * @since n.e.x.t
	 */
	protected function validate_csrf_token() {
		$csrf_cookie = $this->context->input()->filter( INPUT_COOKIE, 'g_csrf_token' );
		$csrf_post   = $this->context->input()->filter( INPUT_POST, 'g_csrf_token' );

		if (
			! $csrf_cookie ||
			! $csrf_post ||
			$csrf_cookie !== $csrf_post
		) {
			$this->error = new WP_Error(
				'google_auth_invalid_g_csrf_token',
				__( 'Invalid g_csrf token.', 'google-site-kit' ),
				array( 'status' => 400 )
			);
		}
	}

	/**
	 * Validate ID token from request.
	 *
	 * @since n.e.x.t
	 */
	protected function validate_id_token_is_present() {
		$id_token = $this->context->input()->filter( INPUT_POST, 'credential' );

		if ( empty( $id_token ) ) {
			$this->error = new WP_Error(
				'missing_parameter',
				__( 'Parameter: "credential" is missing".', 'google-site-kit' ),
				array( 'status' => 400 )
			);
		}
	}
}
