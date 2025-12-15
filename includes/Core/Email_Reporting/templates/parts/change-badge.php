<?php
/**
 * Change badge reusable part.
 *
 * @package   Google\Site_Kit\Core\Email_Reporting
 * @copyright 2025 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 *
 * @var float|null $value The percentage change value.
 */

$change_value = (float) $value;
$color        = '#1F4C04';
$background   = '#D8FFC0';

if ( $change_value < 0 ) {
	$color      = '#7A1E00';
	$background = '#FFDED3';
}

$prefix        = $change_value > 0 ? '+' : '';
$display_value = $prefix . round( $change_value, 1 ) . '%';
?>
<?php /* Outlook requires custom VML for rounded corners. */ ?>
<!--[if mso]>
<v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word"style="mso-wrap-style:none; mso-fit-shape-to-text: true; height:28;" arcsize="50%" strokecolor="<?php echo esc_attr( $background ); ?>" fillcolor="<?php echo esc_attr( $background ); ?>">
<w:anchorlock/>
<center style="font-family:Arial,sans-serif; font-size:12px; font-weight:500; color:<?php echo esc_attr( $color ); ?>;">
<?php echo esc_html( $display_value ); ?>
</center>
</v:roundrect>
<![endif]-->
<!--[if !mso]><!-->
<span style="display:inline-block; padding:4px 8px; border-radius:12px; font-size:12px; font-weight:500; background:<?php echo esc_attr( $background ); ?>; color:<?php echo esc_attr( $color ); ?>; mso-hide:all;">
	<?php echo esc_html( $display_value ); ?>
</span>
<!--<![endif]-->
