<?php
/**
 * Class Google\Site_Kit\Tests\Modules\Reader_Revenue_Manager\Datapoints\CTA\Newsletter_Signup_CTA_Type_HandlerTest
 *
 * @package   Google\Site_Kit\Tests\Modules\Reader_Revenue_Manager\Datapoints\CTA
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Modules\Reader_Revenue_Manager\Datapoints\CTA;

use Google\Site_Kit\Core\REST_API\Exception\Invalid_Param_Exception;
use Google\Site_Kit\Modules\Reader_Revenue_Manager\Datapoints\CTA\Newsletter_Signup_CTA_Type_Handler;
use Google\Site_Kit\Tests\TestCase;
use Google\Site_Kit_Dependencies\Google\Service\Webcontentpublisher\Cta;

/**
 * @group Modules
 * @group Reader_Revenue_Manager
 * @group Datapoints
 */
class Newsletter_Signup_CTA_Type_HandlerTest extends TestCase {

	/**
	 * Newsletter sign-up CTA type handler.
	 *
	 * @var Newsletter_Signup_CTA_Type_Handler
	 */
	private $handler;

	public function set_up() {
		parent::set_up();

		$this->handler = new Newsletter_Signup_CTA_Type_Handler();
	}

	public function test_get_type() {
		$this->assertSame(
			'NEWSLETTER_SIGNUP',
			$this->handler->get_type(),
			'The handler should report the newsletter sign-up CTA type.'
		);
	}

	public function test_configure_cta__applies_all_supported_fields() {
		$cta = new Cta();

		$this->handler->configure_cta(
			$cta,
			array(
				'title'             => 'Subscribe to our newsletter',
				'customMessage'     => 'Join our mailing list.',
				'nameRequired'      => true,
				'customConsentText' => 'I agree to the terms.',
			)
		);

		$this->assertSame(
			'NEWSLETTER_SIGNUP',
			$cta->getType(),
			'The CTA type should be set to newsletter sign-up.'
		);

		$config = $cta->getNewsletterConfig();

		$this->assertSame( 'Subscribe to our newsletter', $config->getTitle(), 'The title should be applied.' );
		$this->assertSame( 'Join our mailing list.', $config->getCustomMessage(), 'The custom message should be applied.' );
		$this->assertTrue( $config->getNameRequired(), 'The name required flag should be applied.' );
		$this->assertSame( 'I agree to the terms.', $config->getCustomConsentText(), 'The custom consent text should be applied.' );
	}

	public function test_configure_cta__omits_fields_that_are_not_provided() {
		$cta = new Cta();

		$this->handler->configure_cta( $cta, array( 'title' => 'Subscribe' ) );

		$config = $cta->getNewsletterConfig();

		$this->assertSame( 'Subscribe', $config->getTitle(), 'The provided field should be applied.' );
		$this->assertNull( $config->getCustomMessage(), 'Fields that are not provided should be left unset.' );
		$this->assertNull( $config->getNameRequired(), 'Fields that are not provided should be left unset.' );
		$this->assertNull( $config->getCustomConsentText(), 'Fields that are not provided should be left unset.' );
	}

	public function test_configure_cta__rejects_unsupported_fields() {
		$this->expectException( Invalid_Param_Exception::class );
		$this->expectExceptionMessage( 'Invalid parameter: config.' );

		$this->handler->configure_cta(
			new Cta(),
			array(
				'title'          => 'Subscribe',
				'unknownSetting' => 'value',
			)
		);
	}

	/**
	 * @dataProvider data_invalid_string_fields
	 */
	public function test_configure_cta__rejects_non_string_values( $field ) {
		$this->expectException( Invalid_Param_Exception::class );
		$this->expectExceptionMessage( "Invalid parameter: config.{$field}." );

		$this->handler->configure_cta( new Cta(), array( $field => 123 ) );
	}

	public function data_invalid_string_fields() {
		return array(
			'title'             => array( 'title' ),
			'customMessage'     => array( 'customMessage' ),
			'customConsentText' => array( 'customConsentText' ),
		);
	}

	public function test_configure_cta__rejects_non_boolean_name_required() {
		$this->expectException( Invalid_Param_Exception::class );
		$this->expectExceptionMessage( 'Invalid parameter: config.nameRequired.' );

		$this->handler->configure_cta( new Cta(), array( 'nameRequired' => 'yes' ) );
	}
}
