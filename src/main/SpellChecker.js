// Copyright (c) 2015-2016 Yuya Ochiai
// Copyright (c) 2016-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
'use strict';

import EventEmitter from 'events';

import simpleSpellChecker from 'simple-spellchecker';
 
import path from 'path';
import fs from 'fs';
import { loadModule } from 'hunspell-asm';


/// Following approach for contractions is derived from electron-spellchecker.

// NB: This is to work around electron/electron#1005, where contractions
// are incorrectly marked as spelling errors. This lets people get away with
// incorrectly spelled contracted words, but it's the best we can do for now.
const contractions = [
  "ain't", "aren't", "can't", "could've", "couldn't", "couldn't've", "didn't", "doesn't", "don't", "hadn't",
  "hadn't've", "hasn't", "haven't", "he'd", "he'd've", "he'll", "he's", "how'd", "how'll", "how's", "I'd",
  "I'd've", "I'll", "I'm", "I've", "isn't", "it'd", "it'd've", "it'll", "it's", "let's", "ma'am", "mightn't",
  "mightn't've", "might've", "mustn't", "must've", "needn't", "not've", "o'clock", "shan't", "she'd", "she'd've",
  "she'll", "she's", "should've", "shouldn't", "shouldn't've", "that'll", "that's", "there'd", "there'd've",
  "there're", "there's", "they'd", "they'd've", "they'll", "they're", "they've", "wasn't", "we'd", "we'd've",
  "we'll", "we're", "we've", "weren't", "what'll", "what're", "what's", "what've", "when's", "where'd",
  "where's", "where've", "who'd", "who'll", "who're", "who's", "who've", "why'll", "why're", "why's", "won't",
  "would've", "wouldn't", "wouldn't've", "y'all", "y'all'd've", "you'd", "you'd've", "you'll", "you're", "you've",
];

const contractionMap = contractions.reduce((acc, word) => {
  acc[word.replace(/'.*/, '')] = true;
  return acc;
}, {});

/// End: derived from electron-spellchecker.

export default class SpellChecker extends EventEmitter {
  constructor(locale, dictDir, callback) {
    super();
    this.hunspell = null;
    this.locale = locale;
      console.log("looking for dicts in directory:", dictDir);
      try {
        
           
      var file1 = dictDir+"/"+locale+".dic";
      var file2 = dictDir+"/"+locale+".aff";
      if (!fs.existsSync(file1) || !fs.existsSync(file2)) {
        console.log('nie istnieje ' + file1 + ' lub ' + file2 + ' zmieniam na pl_PL zamiast ' + locale);
        locale = "pl_PL";
        file1 = dictDir + "/" + locale + ".dic";
        file2 = dictDir + "/" + locale + ".aff";
      }
      loadModule().then(factory=>{var virt = factory.mountDirectory(dictDir);
        console.log("teraz czas na fabryke ", factory,virt);
       var hunspell = factory.create(virt+"/"+locale+".aff",virt+"/"+ locale+".dic");
       this.hunspell = hunspell;
          console.log("czy to poprawny wyraz ", hunspell.spell("woda"));   
          })
            .then(value => {
      this.emit('ready');
        if (callback) {
          callback(null, this);
        }
      })
        .catch(ex=>console.log("error loading dictionary", ex));
      
    } catch (exception) {
      console.log("error loading dictionary", exception);
    }

  }

  isReady() {
    return  this.hunspell !== null;
  }

  spellCheck(word) {
    if (word.toLowerCase() === 'mattermost') {
      return true;
    }
    if (isFinite(word)) { // Numerals are not included in the dictionary
      return true;
    }
    if (this.locale.match(/^en-?/) && contractionMap[word]) {
      return true;
    }
    return this.hunspell.spell(word);
  }

  getSuggestions(word, maxSuggestions) {
    return this.hunspell.suggest(word);
//    const suggestions = this.hunspell.suggest(word);
//
//    const firstCharWord = word.charAt(0);
//    let i;
//    for (i = 0; i < suggestions.length; i++) {
//      if (suggestions[i].charAt(0).toUpperCase() === firstCharWord.toUpperCase()) {
//        suggestions[i] = firstCharWord + suggestions[i].slice(1);
//      }
//    }
//
//    const uniqueSuggestions = suggestions.reduce((a, b) => {
//      if (a.indexOf(b) < 0) {
//        a.push(b);
//      }
//      return a;
//    }, []);
//
//    return uniqueSuggestions;
  }
}

SpellChecker.getSpellCheckerLocale = (electronLocale) => {
  if (electronLocale.match(/^en-?/)) {
    return 'en-US';
  }
  if (electronLocale.match(/^fr-?/)) {
    return 'fr-FR';
  }
  if (electronLocale.match(/^de-?/)) {
    return 'de-DE';
  }
  if (electronLocale.match(/^es-?/)) {
    return 'es-ES';
  }
  if (electronLocale.match(/^nl-?/)) {
    return 'nl-NL';
  }
  if (electronLocale.match(/^pt-?/)) {
    return 'pt-BR';
  }
  return 'en-US';
};
SpellChecker.getAvailDicts = (dictDir) => {
  console.log("getAvailDicts looking for dicts in directory:", dictDir);
  return fs.readdirSync(dictDir)
    .filter((name) => name.endsWith(".dic"))
    .filter((name) => {
      const localeSymbol = path.parse(name)['name'];
      console.log("checking for "
        , dictDir + "/" + localeSymbol + ".aff");
      return fs.existsSync(dictDir + "/" + localeSymbol + ".aff");
    })
    .map((name) => {
        console.log("found dictionary "+name);
        const localeSymbol = path.parse(name)['name'];
        if (localeSymbol in localeNames) {
            return {language: localeNames[localeSymbol], locale: localeSymbol};
        } else {
            return {language: "Other (" + localeSymbol + ") ", locale: localeSymbol};
        }
    });
};
