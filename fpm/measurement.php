<?php // phpcs:disable ?>
<?php
/**
 * FirstPartyServing redirect file
 *
 * @package   Google\FirstPartyLibrary
 * @copyright 2024 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 *
 * NOTICE: This file has been modified from its original version in accordance with the Apache License, Version 2.0.
 *
 * PHPCS rules have been disabled at the very top of the file to allow it to be included in Site Kit's codebase mostly unmodified.
 */

// This file should run in isolation from any other PHP file. This means using
// minimal to no external dependencies, which leads us to supressing the
// following linting rules:
//
// phpcs:disable PSR1.Files.SideEffects.FoundWithSymbols
// phpcs:disable PSR1.Classes.ClassDeclaration.MultipleClasses

namespace Google\FirstPartyLibrary;

if ( isset( $_GET['healthCheck'] ) ) { // phpcs:ignore WordPress.Security.NonceVerification
	echo 'ok';
	exit;
}

/** Core measurement.php logic. */
final class Measurement
{
    private const TAG_ID_QUERY = '?id=';
    private const REDIRECTOR_ID_QUERY = '.php' . self::TAG_ID_QUERY;
    private const PATH_QUERY = '&s=';
    private const FPS_PATH = 'PHP_FPM_REPLACE_PATH';

    /** @var RequestHelper */
    private $helper;

    /**
     * Create the measurement request handler.
     *
     * @param RequestHelper $helper
     */
    public function __construct($helper)
    {
        $this->helper = $helper;
    }

    /** Run the measurement logic. */
    public function run()
    {
        $requestString = $_SERVER['REQUEST_URI'];
        $documentRoot = $_SERVER['DOCUMENT_ROOT'];

        if (empty($documentRoot) || empty($requestString)) {
            $this->helper->invalidRequest(500);
            return "";
        }

        $redirectorFile = explode($documentRoot, __FILE__)[1];
        if (empty($redirectorFile)) {
            $this->helper->invalidRequest(500);
            return "";
        }

        $parameters = self::extractParameters($requestString);
        if (empty($parameters)) {
            $this->helper->invalidRequest(400);
            return "";
        }

        $tagId = $parameters['tag_id'];
        $path = $parameters['path'];

        if (strlen($tagId) === 0 || strlen($path) === 0) {
            http_response_code(400);
            return "";
        }

        if (!self::isScriptRequest($path)) {
            $path = self::appendRequestIP($path);
        }

        $fpsUrl = 'https://' . $tagId . '.fps.goog/' . self::FPS_PATH . $path;

        if (self::isScriptRequest($path)) {
            $response = $this->helper->sendRequest($fpsUrl);
            return str_replace(
                '/' . self::FPS_PATH . '/',
                $redirectorFile . self::TAG_ID_QUERY . $tagId . self::PATH_QUERY,
                $response
            );
        } else {
            return $this->helper->sendRequest($fpsUrl);
        }
    }

    private static function appendRequestIP($path)
    {
        if (!isset($_SERVER['REMOTE_ADDR'])) {
            return $path;
        }

        $requestIP = $_SERVER['REMOTE_ADDR'];
        //  Use x-forwarded-for IP if behind a proxy
        if (isset($_SERVER['HTTP_X_FORWARDED_FOR'])) {
            $requestIP = $_SERVER['HTTP_X_FORWARDED_FOR'];
        }
        $requestIP = urlencode($requestIP);

        $gaPath = "/g/collect";
        if (strpos($path, $gaPath) !== false) {
            return $path . '&_uip=' . $requestIP;
        } else {
            return $path . '&uip=' . $requestIP;
        }
    }

    private static function isScriptRequest($requestPath)
    {
        return substr($requestPath, 0, 7) === "/gtm.js"
        || substr($requestPath, 0, 8) === "/gtag.js"
        || substr($requestPath, 0, 8) === "/gtag/js";
    }


    private static function extractParameters($requestString)
    {
        $tagIdPosition = strpos($requestString, self::REDIRECTOR_ID_QUERY);
        if ($tagIdPosition === false) {
            return null;
        }

        $tagIdStart = $tagIdPosition + strlen(self::REDIRECTOR_ID_QUERY);
        $tagIdEnd = strpos($requestString, self::PATH_QUERY, $tagIdStart);
        if ($tagIdEnd === false) {
            return null;
        }

        $tagId = substr($requestString, $tagIdStart, $tagIdEnd - $tagIdStart);
        $path = substr($requestString, $tagIdEnd + strlen(self::PATH_QUERY));

        return array(
        "tag_id" =>  $tagId,
        "path" => $path,
        );
    }
}

/**
 * Isolates network requests and other methods like exit to inject into the
 * Measurement class
 */
class RequestHelper
{
    /**
     * Helper method to exit the script early and send back a status code.
     *
     * @param int $statusCode
     */
    public function invalidRequest($statsCode)
    {
        http_response_code($statsCode);
        exit();
    }

    /**
     * Helper method to send requests depending on the PHP environment.
     *
     * @param string $url
     */
    public function sendRequest($url)
    {
        if ($this->isCurlInstalled()) {
            $response = $this->sendCurlRequest($url);
        } else {
            $response = $this->sendFileGetContents($url);
        }
        return $response;
    }

    protected function sendCurlRequest($url)
    {
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_URL, $url);
        $result = curl_exec($ch);
        curl_close($ch);
        return $result;
    }

    protected function sendFileGetContents($url)
    {
        return file_get_contents($url);
    }

    protected function isCurlInstalled()
    {
        return extension_loaded('curl');
    }
}

// Skip initial run for testing
if (!defined('IS_FIRST_PARTY_MODE_TEST')) {
    echo (new Measurement(new RequestHelper()))->run();
}
