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
   * @var string
   */
  public $displayName;
  /**
   * @var string
   */
  public $emailAddress;
  /**
   * @var string
   */
  public $familyName;
  /**
   * @var string
   */
  public $givenName;
  /**
   * @var bool
   */
  public $isReaderInfoAvailable;
  /**
   * @var string
   */
  public $name;
  /**
   * @var string
   */
  public $readerId;

  /**
   * @param string
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
   * @param string
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
   * @param string
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
   * @param string
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
   * @param bool
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
   * @param string
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
   * @param string
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
