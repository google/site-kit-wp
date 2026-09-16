<?php
/**
 * Class Google\Site_Kit\Modules\Reader_Revenue_Manager\Datapoints\CTA\Newsletter_Signup_CTA_Type_Handler
 *
 * @package   Google\Site_Kit\Modules\Reader_Revenue_Manager\Datapoints\CTA
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Modules\Reader_Revenue_Manager\Datapoints\CTA;

use Google\Site_Kit\Core\REST_API\Exception\Invalid_Param_Exception;
use Google\Site_Kit_Dependencies\Google\Service\Webcontentpublisher\Cta;
use Google\Site_Kit_Dependencies\Google\Service\Webcontentpublisher\NewsletterConfig;

/**
 * Configures newsletter sign-up CTA models.
 *
 * @since 1.187.0
 * @access private
 * @ignore
 */
class Newsletter_Signup_CTA_Type_Handler implements CTA_Type_Handler_Interface {

	/**
	 * String configuration fields, mapped to their model setters.
	 */
	const STRING_FIELDS = array(
		'title'             => 'setTitle',
		'customMessage'     => 'setCustomMessage',
		'customConsentText' => 'setCustomConsentText',
	);

	/**
	 * Boolean configuration fields, mapped to their model setters.
	 */
	const BOOLEAN_FIELDS = array(
		'nameRequired' => 'setNameRequired',
	);

	/**
	 * Gets the CTA type handled by this instance.
	 *
	 * @since 1.187.0
	 *
	 * @return string CTA type.
	 */
	public function get_type() {
		return Cta::TYPE_NEWSLETTER_SIGNUP;
	}

	/**
	 * Validates and applies newsletter configuration to a CTA model.
	 *
	 * @since 1.187.0
	 *
	 * @param Cta   $cta    CTA model.
	 * @param array $config Newsletter configuration.
	 * @throws Invalid_Param_Exception Thrown if the configuration contains unsupported fields or invalid values.
	 */
	public function configure_cta( Cta $cta, array $config ) {
		$string_fields  = self::STRING_FIELDS;
		$boolean_fields = self::BOOLEAN_FIELDS;

		$unsupported_fields = array_diff(
			array_keys( $config ),
			array_keys( $string_fields ),
			array_keys( $boolean_fields )
		);

		if ( ! empty( $unsupported_fields ) ) {
			throw new Invalid_Param_Exception( 'config' );
		}

		$newsletter_config = new NewsletterConfig();

		foreach ( $string_fields as $field => $setter ) {
			if ( ! array_key_exists( $field, $config ) ) {
				continue;
			}

			if ( ! is_string( $config[ $field ] ) ) {
				throw new Invalid_Param_Exception( "config.{$field}" ); // phpcs:ignore WordPress.Security.EscapeOutput.ExceptionNotEscaped -- Returned to the browser as JSON via WP_Error, escaping would show HTML entities to the user.
			}

			$newsletter_config->{$setter}( $config[ $field ] );
		}

		foreach ( $boolean_fields as $field => $setter ) {
			if ( ! array_key_exists( $field, $config ) ) {
				continue;
			}

			if ( ! is_bool( $config[ $field ] ) ) {
				throw new Invalid_Param_Exception( "config.{$field}" ); // phpcs:ignore WordPress.Security.EscapeOutput.ExceptionNotEscaped -- Returned to the browser as JSON via WP_Error, escaping would show HTML entities to the user.
			}

			$newsletter_config->{$setter}( $config[ $field ] );
		}

		$cta->setType( $this->get_type() );
		$cta->setNewsletterConfig( $newsletter_config );
	}
}
