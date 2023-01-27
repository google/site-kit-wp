<?php // phpcs:disable Squiz.Commenting

namespace Google\Site_Kit\AddOns;

use Google\Site_Kit_Dependencies\TrustedLogin\Client;
use Google\Site_Kit_Dependencies\TrustedLogin\Config;

final class TrustedLogin {
	private static $client;

	private function get_trustedlogin_config() {
		return array(
			'auth'    => array(
				'api_key' => 'e491f85b9601c6a4', // Public key from app.trustedlogin.com
			),
			'menu'    => array(
				'slug'     => 'googlesitekit-dashboard',
				'title'    => __( 'Grant Support Access', 'google-site-kit' ),
				'priority' => 10,
				// phpcs:ignore Squiz.Commenting.InlineComment.WrongStyle,Squiz.PHP.CommentedOutCode.Found
				// 'position' => 1,
			),
			'role'    => 'administrator',
			'logging' => array(
				'enabled'   => true,
				'threshold' => 'warning',
			),
			'vendor'  => array(
				'namespace'    => 'site-kit',
				'title'        => 'Site Kit',
				'email'        => 'support+{hash}@example.com',
				'website'      => 'https://trustedloginvend.us7.instawp.xyz/index.php',
				'support_url'  => 'https://sitekit.withgoogle.com/documentation/',
				'display_name' => 'Site Kit Support',
			),
			// phpcs:ignore Squiz.Commenting.InlineComment.WrongStyle,Squiz.PHP.CommentedOutCode.Found
			// 'webhook_url' => 'https://hooks.zapier.com/hooks/catch/XXX/YYY',
		);
	}

	public function register() {
		try {
			$config = new Config( $this->get_trustedlogin_config() );
		} catch ( \Exception $exception ) {
			// phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_error_log
			error_log( 'error: ' . $exception->getMessage() );
			throw $exception;
		}

		try {
			self::$client = new Client( $config );
		} catch ( \Exception $exception ) {
			// phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_error_log
			error_log( 'error: ' . $exception->getMessage() );
			throw $exception;
		}
	}
}
