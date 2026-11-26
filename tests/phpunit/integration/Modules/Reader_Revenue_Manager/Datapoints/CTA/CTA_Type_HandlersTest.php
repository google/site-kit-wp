<?php
/**
 * Class Google\Site_Kit\Tests\Modules\Reader_Revenue_Manager\Datapoints\CTA\CTA_Type_HandlersTest
 *
 * @package   Google\Site_Kit\Tests\Modules\Reader_Revenue_Manager\Datapoints\CTA
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Modules\Reader_Revenue_Manager\Datapoints\CTA;

use Google\Site_Kit\Modules\Reader_Revenue_Manager\Datapoints\CTA\CTA_Type_Handlers;
use Google\Site_Kit\Modules\Reader_Revenue_Manager\Datapoints\CTA\Newsletter_Signup_CTA_Type_Handler;
use Google\Site_Kit\Modules\Reader_Revenue_Manager\Datapoints\CTA\Survey_CTA_Type_Handler;
use Google\Site_Kit\Tests\TestCase;
use Google\Site_Kit_Dependencies\Google\Service\WebContentPublisher\Cta;

/**
 * @group Modules
 * @group Reader_Revenue_Manager
 * @group Datapoints
 */
class CTA_Type_HandlersTest extends TestCase {

	public function test_get_handlers() {
		$handlers = ( new CTA_Type_Handlers() )->get_handlers();

		$this->assertSame(
			array( Cta::TYPE_NEWSLETTER_SIGNUP ),
			array_keys( $handlers ),
			'Only the newsletter sign-up handler should be returned when the rrmSurveyCTA feature flag is disabled.'
		);
		$this->assertInstanceOf(
			Newsletter_Signup_CTA_Type_Handler::class,
			$handlers[ Cta::TYPE_NEWSLETTER_SIGNUP ],
			'The newsletter sign-up type should be handled by its own handler.'
		);
	}

	public function test_get_handlers__with_survey_flag() {
		$this->enable_feature( 'rrmSurveyCTA' );

		$handlers = ( new CTA_Type_Handlers() )->get_handlers();

		$this->assertSame(
			array( Cta::TYPE_NEWSLETTER_SIGNUP, Cta::TYPE_SURVEY ),
			array_keys( $handlers ),
			'The survey handler should be returned when the rrmSurveyCTA feature flag is enabled.'
		);
		$this->assertInstanceOf(
			Survey_CTA_Type_Handler::class,
			$handlers[ Cta::TYPE_SURVEY ],
			'The survey type should be handled by its own handler.'
		);
	}

	public function test_get_config_field() {
		$this->assertSame(
			'newsletterConfig',
			( new Newsletter_Signup_CTA_Type_Handler() )->get_config_field(),
			'The newsletter sign-up configuration should be held in the newsletterConfig field.'
		);
		$this->assertSame(
			'surveyConfig',
			( new Survey_CTA_Type_Handler() )->get_config_field(),
			'The survey configuration should be held in the surveyConfig field.'
		);
	}
}
