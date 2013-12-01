/*!
 * jsPOS
 *
 * Copyright 2010, Percy Wegmann
 * Licensed under the LGPLv3 license
 * http://www.opensource.org/licenses/lgpl-3.0.html
 */

module.exports = POSTagger;
function POSTagger(){
    this.lexicon = require('./lexicon');
}

/**
 * Indicates whether or not this string starts with the specified string.
 * @param {Object} string
 */
function startsWith($this, string){
    if (!string)
        return false;
    return $this.indexOf(string) == 0;
}

/**
 * Indicates whether or not this string ends with the specified string.
 * @param {Object} string
 */
function endsWith($this, string){
    if (!string || string.length > $this.length) 
        return false;
    return $this.indexOf(string) == $this.length - string.length;
}

POSTagger.prototype.wordInLexicon = function(word){
    var ss = this.lexicon[word];
    if (ss != null) 
        return true;
    // 1/22/2002 mod (from Lisp code): if not in hash, try lower case:
    if (!ss) 
        ss = this.lexicon[word.toLowerCase()];
    if (ss) 
        return true;
    return false;
}

POSTagger.prototype.tag = function(words){
    var ret = new Array(words.length);
    for (var i = 0, size = words.length; i < size; i++) {
        var ss = this.lexicon[words[i]];
        // 1/22/2002 mod (from Lisp code): if not in hash, try lower case:
        if (!ss) 
            ss = this.lexicon[words[i].toLowerCase()];
        if (!ss && words[i].length == 1) 
            ret[i] = words[i] + "^";
        if (!ss) 
            ret[i] = "NN";
        else 
            ret[i] = ss[0];
    }
	
	/**
     * Apply transformational rules
     **/
    for (var i = 0; i < words.length; i++) {
        var word = ret[i];
        //EXCEPTIONS
        if (i > 0 && words[i] === "'s" && i<words.length-1) {
            if (/^VBG$/.test(ret[i+1])) ret[i] = 'VBZ';//'s + VBG -> is
            else ret[i] = 'POS';//'s + NN -> POS
        }
        else if (i > 0 && words[i].toLowerCase() == "like" && /^(PRP)$/.test(ret[i-1])) {//like:VB/IN
            ret[i] = "VB";
        }
        // rule: A word starting with a capital letter in the middle of the sentence is a NNP
        else if (i > 0 && /^[A-Z]/.test(words[i]) ) {
            ret[i] = "NNP";
        }
        else {
            // rule: {DT | JJ}, {VBD | VBP} --> DT|JJ, NN
            if (i > 0 && (ret[i - 1] == "DT" || startsWith(ret[i - 1],"JJ"))) {
                if (word == "VBD" ||
                word == "VBP" ||
                word == "VB") {
                    ret[i] = "NN";
                }
            }
            // rule: convert a noun to a number or url (CD|URL) if "." appears in the word
            if (startsWith(word, "N")) {
    			if (words[i].indexOf(".") > -1) {
                  // url if there are two contiguous alpha characters or more after the point
                  if (/\.[a-zA-Z]{2}/.test(words[i]))
                    ret[i] = "URL";
                  else if (/[0-9]*\.[0-9]+/.test(words[i]))
                    ret[i] = "CD";
                  else
                    ret[i] = "NN";
                }
    			// Attempt to convert into a number
                if (parseFloat(words[i]))
                    ret[i] = "CD";
            }
            // rule: convert a noun to a past participle if words[i] ends with "ed" and doesn't begin with a capital case
            if (startsWith(ret[i], "N") && endsWith(words[i], "ed") && /^[a-z]/.test(words[i])) 
                ret[i] = "VBN";
            // rule: convert a noun to a plural noun if words[i] ends with "ses"
            if (startsWith(ret[i], "NN") && endsWith(words[i], "ses")) 
                ret[i] = "NNS";
            // rule: convert any type to adverb if it ends in "ly" and more than 3 letters (!fly);
            if (endsWith(words[i], "ly") && words[i].length > 3) 
                ret[i] = "RB";
            // rule: convert a common noun (NN or NNS) to a adjective if it ends with "al"
            if (startsWith(ret[i], "NN") && endsWith(word, "al")) 
                ret[i] = i, "JJ";
            // rule: convert a noun to a verb if the preceding work is "would"
            if (i > 0 && startsWith(ret[i], "NN") && words[i - 1].toLowerCase() == "would")
                ret[i] = "VB";
            // rule: convert a noun to a verb if the preceding work is a PRP or NN
            if (i > 0 && startsWith(ret[i], "NN") && (ret[i-1] == "PRP" || startsWith(ret[i-1], "NN")))
                ret[i] = "VB";
            // rule: if a word has been categorized as a common noun and it ends with "s",
            //         then set its type to plural common noun (NNS)
            if (ret[i] == "NN" && endsWith(words[i], "s") && /[^ous]$/.test(words[i].toLowerCase())) 
                ret[i] = "NNS";
            // rule: convert a common noun to a present participle verb (i.e., a gerund)
            /*if (startsWith(ret[i], "NN") && endsWith(words[i], "ing"))
                ret[i] = "VBG";*/
        }
    }
	var result = new Array();
	for (i in words) {
		result[i] = [words[i], ret[i]];
	}
    return result;
}

POSTagger.prototype.prettyPrint = function(taggedWords) {
	for (i in taggedWords) {
        print(taggedWords[i][0] + "(" + taggedWords[i][1] + ")");
    }
}

//print(new POSTagger().tag(["i", "went", "to", "the", "store", "to", "buy", "5.2", "gallons", "of", "milk"]));
