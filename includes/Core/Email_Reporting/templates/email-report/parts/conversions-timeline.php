<?php
/**
 * Conversions timeline image part.
 *
 * Renders a timeline image based on whether the change is positive or negative.
 *
 * @package   Google\Site_Kit\Core\Email_Reporting
 * @copyright 2025 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 *
 * @var float    $change        The percentage change value.
 * @var callable $get_asset_url Function to get asset URLs.
 */

$is_positive = (float) $change >= 0;
$image_url   = $get_asset_url( $is_positive ? 'conversions-timeline-green.png' : 'conversions-timeline-red.png' );
$alt_text    = $is_positive
	? __( 'Positive trend indicator', 'google-site-kit' )
	: __( 'Negative trend indicator', 'google-site-kit' );
?>
<img src="<?php echo esc_url( $image_url ); ?>" alt="<?php echo esc_attr( $alt_text ); ?>" width="9" height="192" style="margin-right: 10px;" />

