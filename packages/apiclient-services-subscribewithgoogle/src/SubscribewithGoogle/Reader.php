<?php
/*
 * Copyright 2014 Google Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not
 * use this file except in compliance with the License. You may obtain a copy of
 * the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations under
 * the License.
 */

namespace Google\Service\SubscribewithGoogle;

class Reader extends \Google\Model
{
  /**
   * display_name
   *
   * @var string
   */
  public $displayName;
  /**
   * example_address@example.com
   *
   * @var string
   */
  public $emailAddress;
  /**
   * last_name
   *
   * @var string
   */
  public $familyName;
  /**
   * first_name
   *
   * @var string
   */
  public $givenName;
  /**
   * determine if name and email are available due to wipeout policy.
   *
   * @var bool
   */
  public $isReaderInfoAvailable;
  /**
   * Identifier. The resource name of the reader. Reader names have the form
   * `publications/{publication_id}/readers/{reader_id}`.
   *
   * @var string
   */
  public $name;
  /**
   * obfuscated gaia id of the reader.
   *
   * @var string
   */
  public $readerGoogleId;
  /**
   * Output only. Unique id for the reader shared externally.
   *
   * @var string
   */
  public $readerId;

  /**
   * display_name
   *
   * @param string $displayName
   */
  public function setDisplayName($displayName)
  {
    $this->displayName = $displayName;
  }
  /**
   * @return string
   */
  public function getDisplayName()
  {
    return $this->displayName;
  }
  /**
   * example_address@example.com
   *
   * @param string $emailAddress
   */
  public function setEmailAddress($emailAddress)
  {
    $this->emailAddress = $emailAddress;
  }
  /**
   * @return string
   */
  public function getEmailAddress()
  {
    return $this->emailAddress;
  }
  /**
   * last_name
   *
   * @param string $familyName
   */
  public function setFamilyName($familyName)
  {
    $this->familyName = $familyName;
  }
  /**
   * @return string
   */
  public function getFamilyName()
  {
    return $this->familyName;
  }
  /**
   * first_name
   *
   * @param string $givenName
   */
  public function setGivenName($givenName)
  {
    $this->givenName = $givenName;
  }
  /**
   * @return string
   */
  public function getGivenName()
  {
    return $this->givenName;
  }
  /**
   * determine if name and email are available due to wipeout policy.
   *
   * @param bool $isReaderInfoAvailable
   */
  public function setIsReaderInfoAvailable($isReaderInfoAvailable)
  {
    $this->isReaderInfoAvailable = $isReaderInfoAvailable;
  }
  /**
   * @return bool
   */
  public function getIsReaderInfoAvailable()
  {
    return $this->isReaderInfoAvailable;
  }
  /**
   * Identifier. The resource name of the reader. Reader names have the form
   * `publications/{publication_id}/readers/{reader_id}`.
   *
   * @param string $name
   */
  public function setName($name)
  {
    $this->name = $name;
  }
  /**
   * @return string
   */
  public function getName()
  {
    return $this->name;
  }
  /**
   * obfuscated gaia id of the reader.
   *
   * @param string $readerGoogleId
   */
  public function setReaderGoogleId($readerGoogleId)
  {
    $this->readerGoogleId = $readerGoogleId;
  }
  /**
   * @return string
   */
  public function getReaderGoogleId()
  {
    return $this->readerGoogleId;
  }
  /**
   * Output only. Unique id for the reader shared externally.
   *
   * @param string $readerId
   */
  public function setReaderId($readerId)
  {
    $this->readerId = $readerId;
  }
  /**
   * @return string
   */
  public function getReaderId()
  {
    return $this->readerId;
  }
}

// Adding a class alias for backwards compatibility with the previous class name.
class_alias(Reader::class, 'Google_Service_SubscribewithGoogle_Reader');
