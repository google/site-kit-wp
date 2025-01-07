<?php

/**
 * FirstPartyServing redirect file
 *
 * @package   Google\FirstPartyLibrary
 * @copyright 2024 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 *
 * @version   288a45a
 *
 * NOTICE: This file has been modified from its original version in accordance with the Apache License, Version 2.0.
 */

// This file should run in isolation from any other PHP file. This means using
// minimal to no external dependencies, which leads us to suppressing the
// following linting rules:
//
// phpcs:disable PSR1.Files.SideEffects.FoundWithSymbols
// phpcs:disable PSR1.Classes.ClassDeclaration.MultipleClasses

namespace Google\FirstPartyLibrary;

/* Start of Site Kit modified code. */
if ( isset( $_GET['healthCheck'] ) ) { // phpcs:ignore WordPress.Security.NonceVerification
	echo 'ok';
	exit;
}
/* End of Site Kit modified code. */

/** Core measurement.php logic. */
final class Measurement
{
    private const TAG_ID_QUERY = '?id=';
    private const PATH_QUERY = '&s=';
    private const FPS_PATH = 'PHP_FPM_REPLACE_PATH';

    private RequestHelper $helper;

    /**
     * Create the measurement request handler.
     *
     * @param RequestHelper $helper
     */
    public function __construct(RequestHelper $helper)
    {
        $this->helper = $helper;
    }

    /** Run the measurement logic. */
    public function run()
    {
        $redirectorFile = $_SERVER['SCRIPT_NAME'] ?? '';
        if (empty($redirectorFile)) {
            $this->helper->invalidRequest(500);
            return "";
        }

        $parameters = self::extractParameters();

        $tagId = $parameters['tag_id'];
        $path = $parameters['path'];

        if (empty($tagId) || empty($path)) {
            $this->helper->invalidRequest(400);
            return "";
        }

        if (!self::isScriptRequest($path)) {
            $path = self::appendRequestIP($path);
        }

        $fpsUrl = 'https://' . $tagId . '.fps.goog/' . self::FPS_PATH . $path;

        $response = $this->helper->sendRequest($fpsUrl);
        if (self::isScriptResponse($response['headers'])) {
            $response['body'] = str_replace(
                '/' . self::FPS_PATH . '/',
                $redirectorFile . self::TAG_ID_QUERY . $tagId . self::PATH_QUERY,
                $response['body']
            );
        }
        return $response;
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
        if (false !== strpos($path, $gaPath)) {
            return $path . '&_uip=' . $requestIP;
        } else {
            return $path . '&uip=' . $requestIP;
        }
    }

    /**
     * Use best effort for determining if a request path is a script request.
     *
     * @param string $requestPath
     * @return bool
     */
    private static function isScriptRequest(string $requestPath): bool
    {
        return substr($requestPath, 0, 7) === "/gtm.js"
            || substr($requestPath, 0, 8) === "/gtag.js"
            || substr($requestPath, 0, 8) === "/gtag/js";
    }

    /**
     * @param string[] $headers
     */
    private static function isScriptResponse(array $headers): bool
    {
        if (empty($headers)) {
            return false;
        }

        foreach ($headers as $header) {
            if (empty($header)) {
                continue;
            }

            $normalizedHeader = strtolower(str_replace(' ', '', $header));
            if (strpos($normalizedHeader, 'content-type:application/javascript') === 0) {
                return true;
            }
        }
        return false;
    }

    private static function extractParameters(): array
    {
        $get = $_GET;
        if (empty($get)) {
            return array(
                "tag_id" => '',
                "path" => '',
            );
        }

        $tagId = $get['id'] ?? '';
        $path = $get['s'] ?? '';

        // Validate tagId
        if (!preg_match('/^[A-Za-z0-9-]*$/', $tagId)) {
            return array(
                "tag_id" => '',
                "path" => '',
            );
        }

        unset($get['id'], $get['s']);

        if (!empty($get)) {
            $containsQueryParameters = strpos($path, '?') !== false;
            $paramSeparator = $containsQueryParameters ? '&' : '?';
            $path .= $paramSeparator . http_build_query($get, '', '&', PHP_QUERY_RFC3986);
        }

        return array(
            "tag_id" => $tagId,
            "path" => $path,
        );
    }
}

// REQUEST_HELPER_START
/**
 * NOTE: DO NOT edit RequestHelper directly nor remove the start and end tags.
 *
 * This class is copied over from src/RequestHelper.php. If any changes are
 * needed, change that file and run the command `npm run copy:RequestHelper`.
 */
/**
 * Isolates network requests and other methods like exit to inject into classes.
 */
class RequestHelper
{
    /**
     * Helper method to exit the script early and send back a status code.
     *
     * @param int $statusCode
     */
    public function invalidRequest(int $statusCode): void
    {
        http_response_code($statusCode);
        exit();
    }

    /**
     * Set the headers from a headers array.
     *
     * @param string[] $headers
     */
    public function setHeaders(array $headers): void
    {
        foreach ($headers as $header) {
            if (!empty($header)) {
                header($header);
            }
        }
    }

    /**
     * Helper method to send requests depending on the PHP environment.
     *
     * @param string $url
     * @return array{
     *      body: string,
     *      headers: string[],
     *      statusCode: int,
     * }
     */
    public function sendRequest(string $url): array
    {
        if ($this->isCurlInstalled()) {
            $response = $this->sendCurlRequest($url);
        } else {
            $response = $this->sendFileGetContents($url);
        }
        return $response;
    }

    /**
     * @param string $url
     * @return array{
     *      body: string,
     *      headers: string[],
     *      statusCode: int,
     * }
     */
    protected function sendCurlRequest(string $url): array
    {
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_HEADER, true);
        curl_setopt($ch, CURLOPT_URL, $url);

        $result = curl_exec($ch);

        $statusCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);

        $headerSize = curl_getinfo($ch, CURLINFO_HEADER_SIZE);
        $headersString = substr($result, 0, $headerSize);
        $headers = explode("\r\n", $headersString);
        $headers = $this->normalizeHeaders($headers);

        $body = substr($result, $headerSize);

        curl_close($ch);

        return array(
            'body' => $body,
            'headers' => $headers,
            'statusCode' => $statusCode,
        );
    }

    /**
     * @param string $url
     * @return array{
     *      body: string,
     *      headers: string[],
     *      statusCode: int,
     * }
     */
    protected function sendFileGetContents(string $url): array
    {
        $streamContext = stream_context_create(array(
            'http' => array(
                'method' => 'GET',
            )
        ));

        // Calling file_get_contents will set the variable $http_response_header
        // within the local scope.
        $result = file_get_contents($url, false, $streamContext);

        /** @var string[] $headers */
        $headers = $http_response_header ?? [];

        $statusCode = 200;
        if (!empty($headers)) {
            // The first element in the headers array will be the HTTP version
            // and status code used, parse out the status code and remove this
            // value from the headers.
            preg_match('/HTTP\/\d\.\d\s+(\d+)/', $headers[0], $statusHeader);
            $statusCode = intval($statusHeader[1]) ?? 200;
        }
        $headers = $this->normalizeHeaders($headers);

        return array(
            'body' => $result,
            'headers' => $headers,
            'statusCode' => $statusCode,
        );
    }

    protected function isCurlInstalled(): bool
    {
        return extension_loaded('curl');
    }

    /** @param string[] $headers */
    protected function normalizeHeaders(array $headers): array
    {
        if (empty($headers)) {
            return $headers;
        }

        // The first element in the headers array will be the HTTP version
        // and status code used, this value is not needed in the headers.
        array_shift($headers);
        return $headers;
    }
}
// REQUEST_HELPER_END

// Skip initial run for testing
if (!defined('IS_FIRST_PARTY_MODE_TEST')) {
    $requestHelper = new RequestHelper();
    $response = (new Measurement($requestHelper))->run();

    $requestHelper->setHeaders($response['headers']);
    http_response_code($response['statusCode']);
    echo $response['body'];
}
