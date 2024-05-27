<?php
/**
 * Class Google\Site_Kit\Modules\Ads\PAX_Config
 *
 * @package   Google\Site_Kit
 * @copyright 2024 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Modules\Ads;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Authentication\Token;

/**
 * Class representing PAX configuration.
 *
 * @since n.e.x.t
 * @access private
 * @ignore
 */
class PAX_Config {

	/**
	 * Context instance.
	 *
	 * @since n.e.x.t
	 * @var Context
	 */
	private $context;

	/**
	 * Token instance.
	 *
	 * @since n.e.x.t
	 * @var Token
	 */
	private $token;

	/**
	 * Constructor.
	 *
	 * @since n.e.x.t
	 *
	 * @param Context $context Context instance.
	 * @param Token   $token   Token instance.
	 */
	public function __construct( Context $context, Token $token ) {
		$this->context = $context;
		$this->token   = $token;
	}

	/**
	 * Gets the configuration data.
	 *
	 * @since n.e.x.t
	 * @return array
	 */
	public function get() {
		$token = $this->token->get();

		return array(
			'authAccess'      => array(
				'oauthTokenAccess' => array(
					'token' => $token['access_token'] ?? '',
				),
			),
			'locale'          => substr( $this->context->get_locale( 'user' ), 0, 2 ),
			'debuggingConfig' => array(
				'env' => $this->get_env(),
			),
		);
	}

	/**
	 * Gets the environment configuration.
	 *
	 * @since n.e.x.t
	 * @return string
	 */
	protected function get_env() {
		$allowed = array( 'PROD', 'QA_PROD' );

		if ( defined( 'GOOGLESITEKIT_PAX_ENV' ) && in_array( GOOGLESITEKIT_PAX_ENV, $allowed, true ) ) {
			return GOOGLESITEKIT_PAX_ENV;
		}

		return 'PROD';
	}
}
