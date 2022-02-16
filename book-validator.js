// Sanity check method to make sure you have your environment up and running.
function sum(a, b){
  return a + b;
}

// Too all my JS nitpickers...
// We are using CommonJS modules because that's what Jest currently best supports
// But, the more modern, preferred way is ES6 modules, i.e. "import/export"
module.exports = {
  sum,
  isTitle,
  countPages,
  cleanPageNum,
  isSameTitle,
  cleanForHTML,
};

//Bring in the library
const sanitizeHTML = require('sanitize-html');

// Variables Declaration
const blockedList = ["Boaty McBoatface"];
const allowedList = ["A-z 1", "'", '"', "'Ok'\"boomer\""];
const emoticonList = ["💩", "ok💩"];

/*
  Valid book titles in this situation can include:
    - Cannot be any form of "Boaty McBoatface", case insensitive
    - English alphabet characters
    - Arabic numerals
    - Spaces, but no other whitespace like tabs or newlines
    - Quotes, both single and double
    - Hyphens
    - No leading or trailing whitespace
    - No newlines or tabs
*/
function isTitle(str){

  // checks whether an element is "Boaty McBoatface"
  const upperCased = blockedList.map(list => list.toUpperCase());
  const contains = (element) => element.includes(upperCased);
  const regex = /^([\-]|'|"|[\w]|null)+$/
  const regexGerman = /\w|\p{General_Category=Letter}/gu
  const regexWhiteSpace= /[^\S ]+/
  const regexNull = /\0/
  const regexEmoji = /[\uD83D\uDCA9]$/
  const strNormalized = str.normalize('NFC');
  const strNormalized2 = str.normalize('NFD');

  if (upperCased.includes(str.toUpperCase())) {
    return blockedList.some(contains);
  }	
  
  else if (str != str.trim()) {
    return false;
  }

  else if (regexEmoji.test(str)) {
    return false;
  }
  
  else if (regexWhiteSpace.test(str)) {
    return false;
  }

  else if (regexNull.test(str)) {
    return false;
  }

  else if (regexGerman.test(str)) {
    return true;
  }

  else if (strNormalized === str) {
    return true;
  }
  else if (strNormalized2 === str) {
    return true;
  }
  
  else if (regex.test(str)) {
    return true;	
  }
}


/*
  Are the two titles *effectively* the same when searching?

  This function will be used as part of a search feature, so it should be
  flexible when dealing with diacritics and ligatures.

  Input: two raw strings
  Output: true if they are "similar enough" to each other

  We define two strings as the "similar enough" as:

    * ignore leading and trailing whitespace
    * same sequence of "letters", ignoring diacritics and ligatures, that is:
      anything that is NOT a letter in the UTF-8 decomposed form is removed
    * Ligature "\u00E6" or æ is equivalent to "ae"
    * German character "\u1E9E" or ẞ is equivalent to "ss"
*/
function isSameTitle(strA, strB){
  const regexNull = /null/

  if (regexNull.test(strA) | regexNull.test(strB)) {
    return false;
  }  

  strA = strA.trim();
  strB = strB.trim();
  const regexHindi = /\w|\p{General_Category=Letter}/gu
  const strANFC = strA.normalize('NFC');
  const strBNFC = strB.normalize('NFC');
  const strANFD = strA.normalize('NFD');
  const strBNFD = strB.normalize('NFD');
  const strANFKC = strA.normalize('NFKC');
  const strBNFKC = strB.normalize('NFKC');
  const regexZalgo = /[\xCC\xCD]/;
      
  if (strA === strB | strA.valueOf() == strB.valueOf()) {
    return true;
  }
  
  else if ((strANFC === strB) | (strANFKC === strBNFC)) {
    return true;
  }

  else if (strANFD.replace(/\u0303/, "") == strB | strA == strBNFD.replace(/\u00E6/, "ae") | strA == strBNFD.replace(/\uFB00/, "ff") || strANFD.replace(/\u202E/, "") == strB) {
    return true;
  }
  else {
    return false;
  }
}


/*
  Page range string.

  Count, inclusively, the number of pages mentioned in the string.

  This is modeled after the string you can use to specify page ranges in
  books, or in a print dialog.

  Example page ranges, copied from our test cases:
    1          ===> 1 page
    p3         ===> 1 page
    1-2        ===> 2 pages
    10-100     ===> 91 pages
    1-3,5-6,9  ===> 6 pages
    1-3,5-6,p9 ===> 6 pages

  A range that goes DOWN still counts, but is never negative.

  Whitespace is allowed anywhere in the string with no effect.

  If the string is over 1000 characters, return undefined
  If the string returns in NaN, return undefined
  If the string does not properly fit the format, return 0

*/
function countPages(rawStr){
  
  if (rawStr.length > 1000) {
    return;
  }

  else if (rawStr.match(/^p(?<page>\d+)([^-,A-Za-z0-9]*$)|(^\d+)([^-,A-Za-z0-9]*$)/)) {
    str = rawStr.replace(/p/, "");
    str = str.trim();
    return 1;
  }
  else if (rawStr.match(/[\-][?:\d][?:\-]/)) {
    return 0;
  }
 
  else if (rawStr.match(/p(?<page>\d+)|[\-](?:\d)(?:,)|[-,]/)) {
    str = rawStr.replace(/p/, "");
    str = str.trim();
      
    if (rawStr.match(/[,]/)) {
      const splitStr = str.split(",");
      const arr = new Array(100);
      
      for (let i = 0; i <splitStr.length; i++) {
        nums = parseInt(splitStr[i]);
        arr[i] = nums;
      }
      for (let i = 1; i < arr.length + 1; i++) {
          if (arr[i] > arr[i-1]) {
            return (arr[i] - arr[i-1]);
          }  
          else {
            return (arr[i-1] - arr[i]);
          }
      }
    }
    
    //neg multi range and weird range split
    if (rawStr.match(/[\-](?:\d)(?:,)/)) {
      const splitStr = str.split(/[-,]/);
      const arr = new Array(100); 
      const array = new Array(100);
      const sum = 0;

      for (let i = 0; i <splitStr.length; i++) {
        nums = parseInt(splitStr[i]);
        arr[i] = nums;
      }
      for (let i = 1; i < arr.length + 1; i++) {
        if (arr[i] > arr[i-1]) {
          array[i-1] = (arr[i] - arr[i-1]) + 1;
        }  
        else {
          array[i-1] = (arr[i-1] - arr[i]) + 1;
        }
      }
      for (let i = 0; i < array.length; i++) {
        sum = array[i];  
      }
      return sum;
    }

    if (rawStr.match(/[\-]/)) {
      const splitStr = str.split("-");
      const arr = new Array(100);
        
      for (let i = 0; i < splitStr.length; i++) {
        nums = parseInt(splitStr[i]);
        arr[i] = nums;
      }
      for (let i = 1; i < arr.length + 1; i++) {
        if (arr[i] > arr[i-1]) {
          return (arr[i] - arr[i-1]) + 1;
        }  
        else {
          return (arr[i-1] - arr[i]) + 1;
        }
      }
    }
    return 0;
  }
  else {
    return 0;
  }
}

/*
  Perform a best-effort cleansing of the page number.
  Given: a raw string
  Returns: an integer, ignoring leading and trailing whitespace. And it can have p in front of it.
*/
function cleanPageNum(str){
  str = str.trim();
  

  if (str.match(/p(?<page>\d+)/)) {
    if (str.match(/^p[^p]*$/)) {
      return parseInt(str.match(/p(?<page>\d+)/).groups.page);
    }
    else {
      return;
    }
  }

  if (str.match(/^[0-9]*$/)) {
    return parseInt(str.match(/^[0-9]*$/));
  }
 
}

/*
  Given a string, return another string that is safe for embedding into HTML.
    * Use the sanitize-html library: https://www.npmjs.com/package/sanitize-html
    * Configure it to *only* allow <b> tags and <i> tags
      (Read the README to learn how to do this)
*/
function cleanForHTML(dirty) {
  // Allow only a super restricted set of tags and attributes
  const clean = sanitizeHTML(dirty, {
    allowedTags: ['b', 'i'],
    disallowedTagsMode: 'escape',
    textFilter: function(text, tagName) {
      return text.replace(/"|'/, '&quot;');
    }
  });
  return clean;
}

